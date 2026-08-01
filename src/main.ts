import type {
  BrowserId,
  EnsureAppItem,
  BrowserSnapshotReport,
  BrowserWindowSnapshot,
  NativeWindowSnapshot,
  WindowRecipe,
  WorkspaceDocument,
} from "./contracts";
import {
  MarkdownView,
  Notice,
  Plugin,
  TFile,
  normalizePath,
  setIcon,
  type CliData,
} from "obsidian";
import { createWorkspaceId } from "./ids";
import {
  ConfirmSchemesModal,
  CaptureModal,
  CaptureDiffModal,
  DiagnosticsModal,
  DuplicateRepairModal,
  MigrationPreviewModal,
  RestoreBlockedModal,
  RestoreResultsModal,
  SystemDiagnosticsModal,
  TextPromptModal,
  WindowEditorModal,
  WorkspaceBrowserModal,
  type RestoreBlockedIssue,
  type RestoreResultItem,
  type SystemDiagnosticsReport,
  type WorkspaceSearchItem,
} from "./modals";
import { candidateToRecipe } from "./capture-recipe";
import {
  applyCaptureOperations,
  buildCaptureDiffs,
  captureTargetMatches,
  targetSectionsChanged,
  type CaptureOperation,
} from "./merge";
import {
  browserMatchCandidates,
  captureSourceNotices,
  isRestorableBrowserUrl,
  uniqueBrowserMatch,
  type CaptureCandidate,
  type CaptureSnapshot,
} from "./capture";
import {
  canAutoInitializeWorkspaceSource,
  createWorkspaceTemplate,
  formatWorkspaceMarkdown,
  initializeWorkspaceMarkdown,
  migrateWorkspaceMarkdownToLatest,
  parseWorkspaceMarkdown,
  removeWindowSections,
  replaceWindowSection,
  type ParsedWorkspace,
  type WindowSection,
} from "./model";
import { NativeClient } from "./native";
import {
  deduplicateFocusExistingRecipes,
  findDuplicateFocusExistingGroups,
} from "./recipe-identity";
import { partitionRestoreReadiness } from "./restore";
import { updateRecentWorkspaces } from "./recent";
import { isPathInManagedFolder, isStableId } from "./scope";
import {
  DEFAULT_SETTINGS,
  WorkspaceBookmarkSettingTab,
  normalizeManagedFolder,
  type WorkspaceBookmarkSettings,
} from "./settings";

export default class WorkspaceBookmarkPlugin extends Plugin {
  settings: WorkspaceBookmarkSettings = DEFAULT_SETTINGS;
  private native!: NativeClient;
  private readonly decoratedViews = new WeakMap<MarkdownView, HTMLElement[]>();
  private statusBarItem: HTMLElement | null = null;
  private activeOperation: string | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.native = new NativeClient(this.settings.workspacectlPath);
    this.addSettingTab(new WorkspaceBookmarkSettingTab(this.app, this));
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass("workspace-bookmark-status");
    this.statusBarItem.setAttribute("aria-label", "打开 Workspace Bookmark 系统诊断");
    this.statusBarItem.addEventListener("click", () => void this.showSystemDiagnostics());
    this.renderRuntimeStatus("checking", "正在检查");

    this.addRibbonIcon("bookmark-plus", "Capture current workspace", () => {
      void this.captureCurrentWorkspace();
    });
    this.addRibbonIcon("library", "Browse workspaces", () => {
      void this.browseWorkspaces();
    });
    this.registerCommands();
    this.registerExternalEntrypoints();
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.decorateActiveView()),
    );
    this.registerEvent(this.app.workspace.on("layout-change", () => this.decorateActiveView()));
    this.registerEvent(this.app.vault.on("create", (file) => {
      if (file instanceof TFile) void this.maybeInitializeCreatedWorkspace(file);
    }));
    this.app.workspace.onLayoutReady(() => {
      this.decorateActiveView();
      void this.refreshRuntimeStatus();
    });
    this.registerInterval(
      window.setInterval(() => void this.refreshRuntimeStatus(), 60_000),
    );
  }

  async loadSettings(): Promise<void> {
    const stored = (await this.loadData()) as Partial<WorkspaceBookmarkSettings> | null;
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(stored ?? {}),
      managedFolder: normalizeManagedFolder(stored?.managedFolder ?? DEFAULT_SETTINGS.managedFolder),
      trustedSchemes: [...new Set(stored?.trustedSchemes ?? [])],
      recentWorkspaces: Array.isArray(stored?.recentWorkspaces)
        ? stored.recentWorkspaces.filter(
            (item) =>
              typeof item?.workspaceId === "string"
              && typeof item?.lastOpenedAt === "string",
          )
        : [],
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.native = new NativeClient(this.settings.workspacectlPath);
  }

  private registerCommands(): void {
    this.addCommand({
      id: "create-workspace",
      name: "Create workspace",
      callback: () => this.createWorkspace(),
    });
    this.addCommand({
      id: "initialize-current-note-as-workspace",
      name: "Initialize current note as workspace",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const available = file instanceof TFile
          && file.extension === "md"
          && isPathInManagedFolder(file.path, normalizeManagedFolder(this.settings.managedFolder));
        if (!checking && available) void this.initializeWorkspaceFile(file);
        return available;
      },
    });
    this.addCommand({
      id: "capture-current-workspace",
      name: "Capture current workspace",
      checkCallback: (checking) => this.managedCommand(checking, () => this.captureCurrentWorkspace()),
    });
    this.addCommand({
      id: "open-current-workspace",
      name: "Open current workspace",
      checkCallback: (checking) =>
        this.managedCommand(checking, async () => {
          await this.openCurrentWorkspace();
        }),
    });
    this.addCommand({
      id: "open-current-window",
      name: "Open current Window",
      editorCheckCallback: (checking, editor, context) => {
        const file = context.file;
        const available = file instanceof TFile && this.isManagedWorkspace(file);
        if (!checking && available) void this.openWindowAtLine(file, editor.getCursor().line);
        return available;
      },
    });
    this.addCommand({
      id: "edit-current-window",
      name: "Edit current Window",
      editorCheckCallback: (checking, editor, context) => {
        const file = context.file;
        const available = file instanceof TFile && this.isManagedWorkspace(file);
        if (!checking && available) void this.editWindowAtLine(file, editor.getCursor().line);
        return available;
      },
    });
    this.addCommand({
      id: "validate-format-current-workspace",
      name: "Validate/Format current workspace",
      checkCallback: (checking) => this.managedCommand(checking, () => this.validateAndFormatCurrent()),
    });
    this.addCommand({
      id: "migrate-current-workspace-to-v4",
      name: "Migrate current workspace to V4",
      checkCallback: (checking) =>
        this.managedCommand(checking, () => this.migrateCurrentWorkspaceToV4()),
    });
    this.addCommand({
      id: "review-duplicate-windows",
      name: "Review duplicate Windows",
      checkCallback: (checking) =>
        this.managedCommand(checking, () => this.reviewDuplicateWindows()),
    });
    this.addCommand({
      id: "browse-workspaces",
      name: "Browse workspaces",
      callback: () => this.browseWorkspaces(),
    });
    this.addCommand({
      id: "system-diagnostics",
      name: "System diagnostics",
      callback: () => {
        void this.showSystemDiagnostics();
      },
    });
  }

  private registerExternalEntrypoints(): void {
    this.registerObsidianProtocolHandler("workspace-bookmark", async (params) => {
      const action = params.action;
      if (action === "capture") {
        await this.captureCurrentWorkspace();
      } else if (action === "open-current") {
        await this.openCurrentWorkspace();
      } else if (action === "open" && isStableId(params.id, "ws_")) {
        await this.openWorkspaceById(params.id);
      } else {
        new Notice("Workspace Bookmark：无效或不完整的 URI 参数。");
      }
    });

    this.registerCliHandler(
      "workspace-bookmark:open",
      "Open a Workspace Bookmark by stable workspace ID.",
      {
        id: {
          value: "<ws_id>",
          description: "Stable ws_<ULID> identifier.",
          required: true,
        },
      },
      async (params: CliData) => {
        const id = String(params.id ?? "");
        if (!isStableId(id, "ws_")) return "Invalid workspace ID.";
        return (await this.openWorkspaceById(id)) ? `Opened ${id}.` : `Workspace ${id} was not opened.`;
      },
    );
    this.registerCliHandler(
      "workspace-bookmark:capture",
      "Capture visible windows into the active managed Workspace.",
      null,
      async () => {
        await this.captureCurrentWorkspace();
        return "Capture dialog opened.";
      },
    );
    this.registerCliHandler(
      "workspace-bookmark:validate",
      "Validate the active managed Workspace.",
      null,
      async () => this.validateCurrentForCli(),
    );
  }

  private managedCommand(checking: boolean, callback: () => void | Promise<void>): boolean {
    const file = this.app.workspace.getActiveFile();
    const available = file instanceof TFile && this.isManagedWorkspace(file);
    if (!checking && available) void callback();
    return available;
  }

  private decorateActiveView(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;
    let actions = this.decoratedViews.get(view);
    if (!actions) {
      actions = [
        view.addAction("play", "Open current Workspace", () => {
          if (this.isManagedWorkspace(view.file)) void this.openCurrentWorkspace();
        }),
        view.addAction("scan-search", "Capture current Workspace", () => {
          if (this.isManagedWorkspace(view.file)) void this.captureCurrentWorkspace();
        }),
      ];
      this.decoratedViews.set(view, actions);
    }
    const visible = this.isManagedWorkspace(view.file);
    for (const action of actions) action.style.display = visible ? "" : "none";
  }

  private createWorkspace(): void {
    new TextPromptModal(this.app, "Create workspace", "例如：考研英语", async (name) => {
      const folder = normalizePath(this.settings.managedFolder.replace(/\/$/, ""));
      await this.ensureFolder(folder);
      const fileName = sanitizeFileName(name);
      let path = normalizePath(`${folder}/${fileName}.md`);
      let suffix = 2;
      while (await this.app.vault.adapter.exists(path)) {
        path = normalizePath(`${folder}/${fileName} ${suffix}.md`);
        suffix += 1;
      }
      const file = await this.app.vault.create(path, createWorkspaceTemplate(createWorkspaceId(), name));
      await this.app.workspace.getLeaf(false).openFile(file);
    }).open();
  }

  private async maybeInitializeCreatedWorkspace(file: TFile): Promise<void> {
    if (
      file.extension !== "md"
      || !isPathInManagedFolder(file.path, normalizeManagedFolder(this.settings.managedFolder))
    ) return;
    await wait(120);
    const source = await this.app.vault.read(file);
    if (!canAutoInitializeWorkspaceSource(source)) {
      if (!this.parse(source).managed) {
        new Notice("Workspace Bookmark：新文件已有正文，未自动改写；可运行 Initialize current note as workspace。", 6_000);
      }
      return;
    }
    await this.initializeWorkspaceFile(file, true);
  }

  private async initializeWorkspaceFile(file: TFile, automatic = false): Promise<void> {
    if (
      file.extension !== "md"
      || !isPathInManagedFolder(file.path, normalizeManagedFolder(this.settings.managedFolder))
    ) {
      new Notice("当前文档不在 Workspace Bookmark 受管目录中。");
      return;
    }
    const source = await this.app.vault.read(file);
    const parsed = this.parse(source);
    if (parsed.managed) {
      if (!automatic) new Notice("当前文档已经是 Workspace。");
      return;
    }
    const next = initializeWorkspaceMarkdown(source, createWorkspaceId(), file.basename);
    if (next === source) return;
    await this.app.vault.modify(file, next);
    new Notice(automatic ? "已自动初始化 Workspace 文档。" : "已初始化当前 Workspace 文档。");
  }

  private async captureCurrentWorkspace(): Promise<void> {
    const file = this.getActiveManagedFile();
    if (!file) return;
    let source = await this.app.vault.read(file);
    let parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed)) return;
    if (parsed.workspace && parsed.workspace.schemaVersion < 4) {
      const migrated = await this.migrateWorkspaceWithConfirmation(file, source);
      if (!migrated) return;
      source = migrated;
      parsed = this.parse(source);
    }

    const existing = parsed.workspace?.windows ?? [];
    const snapshot = await this.runOperation(
      "正在扫描窗口",
      () => this.scanCaptureSnapshot(file, existing),
    );
    if (!snapshot) return;
    new CaptureModal(this.app, snapshot.candidates, existing, async (operations) => {
      const diffs = buildCaptureDiffs(operations, existing);
      new CaptureDiffModal(this.app, diffs, async () => {
        await this.commitCapture(file, source, parsed, operations);
      }).open();
    }, {
      scannedAt: snapshot.scannedAt,
      sourceNotices: snapshot.sourceNotices,
      onRefresh: () => this.scanCaptureSnapshot(file, existing),
      onDiagnostics: () => this.showSystemDiagnostics(),
      onReviewDuplicates: () => this.reviewDuplicateWindows(file),
    }).open();
  }

  private async scanCaptureSnapshot(
    file: TFile,
    existing: WindowRecipe[],
  ): Promise<CaptureSnapshot> {
    const [nativeResult, browserResult] = await Promise.all([
      this.native.scan(),
      this.native.browserSnapshot(),
    ]);
    if (!nativeResult.ok || !nativeResult.value) {
      throw new Error(nativeResult.error?.message ?? "无法扫描 macOS 窗口。");
    }
    const browserReport: BrowserSnapshotReport =
      browserResult.ok && browserResult.value
        ? browserResult.value
        : { sources: [] };
    const browserWindows = browserReport.sources.flatMap((source) => source.windows);
    const candidates = this.buildCaptureCandidates(
      nativeResult.value,
      browserWindows,
      browserReport,
      file,
      existing,
    );
    const sourceNotices = captureSourceNotices(browserReport.sources, candidates);
    if (!browserResult.ok && sourceNotices.length === 0) {
      sourceNotices.push({
        browserId: "chrome",
        browserName: "浏览器",
        tone: "warning",
        message: browserResult.error?.message ?? "浏览器桥接状态暂时不可用。",
      });
    }
    return {
      candidates,
      sourceNotices,
      scannedAt: new Date().toISOString(),
    };
  }

  private buildCaptureCandidates(
    nativeWindows: NativeWindowSnapshot[],
    browserWindows: BrowserWindowSnapshot[],
    browserReport: BrowserSnapshotReport,
    activeFile: TFile,
    existing: WindowRecipe[],
  ): CaptureCandidate[] {
    const obsidianUrl = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(activeFile.path)}`;
    const obsidianWindows = nativeWindows.filter((window) => window.bundleId === "md.obsidian");
    const activeObsidianWindow =
      obsidianWindows.find((window) =>
        window.title.toLowerCase().includes(activeFile.basename.toLowerCase()),
      ) ?? obsidianWindows[0];
    return nativeWindows.map((nativeWindow) => {
      const browserDescriptor = browserDescriptorForBundle(nativeWindow.bundleId);
      const browserSource = browserDescriptor
        ? browserReport.sources.find((source) => source.browserId === browserDescriptor.id)
        : undefined;
      const browserCandidates = browserDescriptor
        ? browserMatchCandidates(nativeWindow, browserWindows)
        : [];
      const browser = uniqueBrowserMatch(nativeWindow, browserWindows);
      const isActiveObsidian = nativeWindow.windowId === activeObsidianWindow?.windowId;
      const capturedTitle =
        browser?.tabs.find((tab) => tab.active)?.title ||
        (isActiveObsidian ? activeFile.basename : nativeWindow.title);
      const candidate: CaptureCandidate = {
        native: { ...nativeWindow, title: capturedTitle },
        browser,
        browserAlternatives: browserCandidates.length > 1 ? browserCandidates : undefined,
        browserIdHint: browserDescriptor?.id,
        browserNameHint: browserDescriptor?.name,
        browserConnected: browserSource?.connected ?? false,
        obsidianUrl: isActiveObsidian ? obsidianUrl : undefined,
        selected: Boolean(browser || isActiveObsidian),
        selectedTabs: new Set(
          browser?.tabs
            .filter((tab) => isRestorableBrowserUrl(tab.url))
            .map((tab) => tab.index) ?? [],
        ),
        manualUrl: "",
        restoreMode: browser || isActiveObsidian ? "open-content" : "launch-only",
        openMode: browser ? "focus-existing" : undefined,
        action: browser || isActiveObsidian ? "add" : "ignore",
      };
      const captured = candidateToRecipe(candidate);
      const targets = captured ? captureTargetMatches(captured, existing) : [];
      const target = targets.length === 1 ? targets[0] : null;
      if (target) {
        candidate.action = "update";
        candidate.targetId = target.id;
        if (candidate.browser) candidate.openMode = target.openMode;
      } else if (targets.length > 1) {
        candidate.selected = false;
        candidate.action = "ignore";
        candidate.duplicateTargetIds = targets.map((item) => item.id);
      }
      return candidate;
    });
  }

  private async commitCapture(
    file: TFile,
    originalSource: string,
    originalParsed: ParsedWorkspace,
    operations: CaptureOperation[],
  ): Promise<void> {
    let failure = "";
    let changed = false;
    const updateIds = operations.flatMap((operation) =>
      operation.action === "update" ? [operation.targetId] : [],
    );
    await this.app.vault.process(file, (currentSource) => {
      const currentParsed = this.parse(currentSource);
      if (
        !currentParsed.managed
        || !currentParsed.workspace
        || currentParsed.diagnostics.some((item) => item.severity === "error")
      ) {
        failure = "当前 Workspace 在 Modal 打开后变为无效文档，未写入任何内容。";
        return currentSource;
      }
      if (
        targetSectionsChanged(
          originalSource,
          originalParsed,
          currentSource,
          currentParsed,
          updateIds,
        )
      ) {
        failure = "待更新 Window 已在 Modal 打开期间发生变化，请重新执行 Capture。";
        return currentSource;
      }
      try {
        const updated = applyCaptureOperations(
          currentSource,
          currentParsed,
          operations,
        );
        changed = updated !== currentSource;
        return updated;
      } catch (cause) {
        failure = messageOf(cause);
        return currentSource;
      }
    });
    if (failure) {
      new Notice(`Workspace Bookmark：${failure}`, 8_000);
      return;
    }
    new Notice(changed ? `已安全写入 ${operations.length} 个 Window。` : "没有需要写入的变化。");
  }

  private async migrateCurrentWorkspaceToV4(): Promise<void> {
    const file = this.getActiveManagedFile();
    if (!file) return;
    const source = await this.app.vault.read(file);
    const parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed)) return;
    if (parsed.workspace?.schemaVersion === 4) {
      new Notice("当前 Workspace 已经是 V4。");
      return;
    }
    await this.migrateWorkspaceWithConfirmation(file, source);
  }

  private async migrateWorkspaceWithConfirmation(
    file: TFile,
    source: string,
  ): Promise<string | null> {
    const migration = migrateWorkspaceMarkdownToLatest(source, {
      trustedSchemes: this.settings.trustedSchemes,
    });
    if (!migration.ok) {
      new DiagnosticsModal(this.app, `无法迁移：${file.path}`, migration.diagnostics).open();
      return null;
    }
    if (migration.source === source) return source;
    const confirmed = await new Promise<boolean>((resolve) => {
      new MigrationPreviewModal(this.app, migration.headingChanges, resolve).open();
    });
    if (!confirmed) return null;

    let changed = false;
    await this.app.vault.process(file, (current) => {
      if (current !== source) return current;
      changed = true;
      return migration.source;
    });
    if (!changed) {
      new Notice("Workspace 在迁移确认期间发生变化，未写入。");
      return null;
    }
    const externalReferences = await this.updateManagedHeadingLinks(
      file,
      migration.headingChanges,
    );
    new Notice(
      `已迁移到 Workspace Markdown V4${
        externalReferences > 0
          ? `；另发现 ${externalReferences} 个受管目录外引用，未自动修改`
          : ""
      }。`,
      8_000,
    );
    return migration.source;
  }

  private async reviewDuplicateWindows(explicitFile?: TFile): Promise<void> {
    const file = explicitFile ?? this.getActiveManagedFile();
    if (!file) return;
    const source = await this.app.vault.read(file);
    const parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed) || !parsed.workspace) return;
    const groups = findDuplicateFocusExistingGroups(parsed.workspace.windows);
    if (groups.length === 0) {
      new Notice("当前 Workspace 没有可安全合并的重复 Window。");
      return;
    }
    new DuplicateRepairModal(this.app, groups, async (removeIds) => {
      let failure = "";
      let removed = 0;
      await this.app.vault.process(file, (currentSource) => {
        if (currentSource !== source) {
          failure = "Workspace 在确认期间发生变化，请重新检查重复项。";
          return currentSource;
        }
        const currentParsed = this.parse(currentSource);
        const currentIds = new Set(
          currentParsed.workspace?.windows.map((recipe) => recipe.id) ?? [],
        );
        const validIds = removeIds.filter((id) => currentIds.has(id));
        if (validIds.length !== removeIds.length) {
          failure = "一个或多个重复 Window 已不存在。";
          return currentSource;
        }
        const updated = removeWindowSections(currentSource, currentParsed, validIds);
        const verified = this.parse(updated);
        if (verified.diagnostics.some((item) => item.severity === "error")) {
          failure = "移除后文档未通过校验，已保留原文。";
          return currentSource;
        }
        removed = validIds.length;
        return updated;
      });
      if (failure) {
        new Notice(`Workspace Bookmark：${failure}`, 8_000);
      } else {
        new Notice(`已移除 ${removed} 个重复 Window；第一份及普通正文均已保留。`);
      }
    }).open();
  }

  private async updateManagedHeadingLinks(
    target: TFile,
    changes: Array<{ from: string; to: string }>,
  ): Promise<number> {
    const pathWithoutExtension = target.path.replace(/\.md$/i, "");
    let externalReferences = 0;
    for (const file of this.app.vault.getMarkdownFiles()) {
      if (file.path === target.path) continue;
      const source = await this.app.vault.cachedRead(file);
      let updated = source;
      for (const change of changes) {
        const needles = [
          `${pathWithoutExtension}#${change.from}`,
          `${target.basename}#${change.from}`,
        ];
        for (const needle of needles) {
          const occurrences = updated.split(needle).length - 1;
          if (occurrences === 0) continue;
          if (isPathInManagedFolder(file.path, this.settings.managedFolder)) {
            updated = updated.replaceAll(needle, needle.replace(change.from, change.to));
          } else {
            externalReferences += occurrences;
          }
        }
      }
      if (updated !== source) await this.app.vault.modify(file, updated);
    }
    return externalReferences;
  }

  private async openCurrentWorkspace(): Promise<boolean> {
    const file = this.getActiveManagedFile();
    if (!file) return false;
    return this.openWorkspaceFile(file);
  }

  private async openWorkspaceById(id: string): Promise<boolean> {
    const item = (await this.collectWorkspaceItems()).find((candidate) => candidate.id === id);
    if (!item) {
      new Notice(`未找到 Workspace：${id}`);
      return false;
    }
    return this.openWorkspaceFile(item.file);
  }

  private async openWorkspaceFile(file: TFile): Promise<boolean> {
    const source = await this.app.vault.read(file);
    let parsed = this.parse(source);
    const untrusted = extractUntrustedSchemes(parsed);
    const otherErrors = parsed.diagnostics.filter(
      (item) => item.severity === "error" && item.code !== "UNTRUSTED_SCHEME",
    );
    if (untrusted.length > 0 && otherErrors.length === 0) {
      new ConfirmSchemesModal(this.app, untrusted, async () => {
        this.settings.trustedSchemes = [...new Set([...this.settings.trustedSchemes, ...untrusted])];
        await this.saveSettings();
        await this.openWorkspaceFile(file);
      }).open();
      return false;
    }
    if (!this.ensureExecutable(file, parsed) || !parsed.workspace) return false;
    const summary = await this.runOperation(
      `正在恢复 · ${parsed.workspace.name}`,
      () => this.restoreWorkspace(parsed.workspace!, file),
    );
    if (!summary) return false;
    if (summary.successCount > 0) {
      await this.recordRecentWorkspace(parsed.workspace.id);
    }
    return summary.successCount > 0;
  }

  private async restoreWorkspace(
    workspace: WorkspaceDocument,
    sourceFile?: TFile,
  ): Promise<{ successCount: number; items: RestoreResultItem[] }> {
    const deduplicated = deduplicateFocusExistingRecipes(workspace.windows);
    const items: RestoreResultItem[] = deduplicated.duplicates.map(({ recipe, kept }) => ({
      status: "skipped",
      label: `${recipe.appName} · ${recipe.name}`,
      detail: `与“${kept.name}”完全重复，本次只执行第一份。`,
      windowId: recipe.id,
    }));
    let supportedWindows = deduplicated.runnable;
    const launchOnlyWindows = supportedWindows.filter(
      (window) => (window.restoreMode ?? "open-content") === "launch-only",
    );
    if (launchOnlyWindows.length > 0) {
      const doctor = await this.native.doctor();
      if (!doctor.ok || !doctor.value?.capabilities?.includes("launch-only")) {
        for (const window of launchOnlyWindows) {
          items.push({
            status: "skipped",
            label: `${window.appName} · ${window.name}`,
            detail: "当前 workspacectl 不支持“仅启动应用”；请更新原生控制器后重试。",
            windowId: window.id,
          });
        }
        supportedWindows = supportedWindows.filter(
          (window) => (window.restoreMode ?? "open-content") !== "launch-only",
        );
      }
    }
    if (supportedWindows.length === 0) {
      const issues: RestoreBlockedIssue[] = [{
        message: "当前原生控制器不支持此 Workspace 所需的“仅启动应用”能力。",
      }];
      new RestoreBlockedModal(this.app, workspace.name, issues, {
        onRetry: sourceFile ? async () => {
          await this.openWorkspaceFile(sourceFile);
        } : undefined,
        onDiagnostics: () => this.showSystemDiagnostics(),
        onEditWindow: sourceFile
          ? (windowId) => this.editWindowById(sourceFile, windowId)
          : undefined,
      }).open();
      return { successCount: 0, items };
    }
    const planResult = await this.native.plan({ windows: supportedWindows });
    if (!planResult.ok || !planResult.value) {
      const failedItems: RestoreResultItem[] = [
        ...items,
        {
          status: "failed",
          label: "恢复预检查",
          detail: planResult.error?.message ?? "workspacectl 未返回有效计划。",
        },
      ];
      new RestoreResultsModal(this.app, workspace.name, failedItems, {
        onDiagnostics: () => this.showSystemDiagnostics(),
      }).open();
      return { successCount: 0, items: failedItems };
    }

    const ensureResult = await this.native.ensureApps({ windows: supportedWindows });
    const appBlockedBundles = new Set<string>();
    const readyAppBundles = new Set<string>();
    if (!ensureResult.ok || !ensureResult.value) {
      items.push({
        status: "degraded",
        label: "App 启动",
        detail: ensureResult.error?.message ?? "无法确认目标 App 是否已启动。",
      });
    } else {
      for (const item of ensureResult.value.items) {
        items.push(restoreItemForEnsuredApp(item));
        if (!item.ok) appBlockedBundles.add(item.bundleId);
        if (item.ok) readyAppBundles.add(item.bundleId);
      }
    }

    const appReadyWindows = supportedWindows.filter(
      (window) => !appBlockedBundles.has(window.bundleId),
    );
    const browserStatus = await this.browserStatusAfterEnsure(appReadyWindows);
    const readiness = partitionRestoreReadiness(
      appReadyWindows,
      planResult.value.items,
      browserStatus
        ? browserStatus.sources
        : planResult.value.browserSources.map((source) => ({
            ...source,
            connected: false,
          })),
    );
    const runnable = readiness.runnable;
    const issues: RestoreBlockedIssue[] = [...readiness.issues];
    for (const issue of readiness.issues) {
      const recipe = supportedWindows.find(
        (window) => window.id === issue.windowId,
      );
      items.push({
        status: "skipped",
        label: recipe
          ? `${recipe.appName} · ${recipe.name}`
          : issue.windowName,
        detail: issue.message,
        windowId: issue.windowId,
      });
    }

    if (
      !planResult.value.accessibilityTrusted
      && runnable.some((window) => window.layout !== "keep")
    ) {
      issues.push({
        message: "Accessibility 未授权；内容仍可打开，但所有布局操作都会跳过。",
      });
    }
    if (runnable.length === 0) {
      if (issues.length === 0) {
        issues.push({ message: "Workspace 中没有可执行的 Window。" });
      }
      new RestoreBlockedModal(this.app, workspace.name, issues, {
        onRetry: sourceFile
          ? async () => {
              await this.openWorkspaceFile(sourceFile);
            }
          : undefined,
        onDiagnostics: () => this.showSystemDiagnostics(),
        onEditWindow: sourceFile
          ? (windowId) => this.editWindowById(sourceFile, windowId)
          : undefined,
      }).open();
      return { successCount: 0, items };
    }
    if (!planResult.value.accessibilityTrusted && runnable.some((window) => window.layout !== "keep")) {
      items.push({
        status: "degraded",
        label: "窗口布局",
        detail: "Accessibility 未授权；内容会打开，但布局操作将跳过。",
      });
    }

    const contentWindows = runnable.filter(
      (window) => (window.restoreMode ?? "open-content") === "open-content",
    );
    const obsidianWindows = contentWindows.filter((window) => window.adapter === "obsidian");
    const browserWindows = contentWindows.filter((window) => window.adapter === "browser");
    const matchHints: Record<
      string,
      { approximateFrame?: { x: number; y: number; width: number; height: number }; title?: string }
    > = {};
    let successCount = runnable.filter(
      (window) => (window.restoreMode ?? "open-content") === "launch-only"
        && readyAppBundles.has(window.bundleId),
    ).length;

    for (const recipe of obsidianWindows) {
      for (const [index, content] of [...recipe.contents].sort((a, b) => a.order - b.order).entries()) {
        try {
          await this.openObsidianUrl(content.url, recipe.openMode, index > 0);
          successCount += 1;
          items.push({ status: "success", label: `Obsidian · ${content.title}` });
        } catch (cause) {
          items.push({
            status: "failed",
            label: `Obsidian · ${content.title}`,
            detail: messageOf(cause),
            windowId: recipe.id,
          });
        }
      }
    }

    if (browserWindows.length > 0) {
      const result = await this.native.browserRestore({ windows: browserWindows });
      if (!result.ok) {
        items.push({
          status: "failed",
          label: "浏览器",
          detail: result.error?.message ?? "未知错误",
        });
      } else {
        for (const receipt of result.value ?? []) {
          const recipe = browserWindows.find((window) => window.id === receipt.recipeId);
          const label = recipe?.name ?? receipt.recipeId;
          const browserLabel = recipe?.appName ?? receipt.browserId ?? "浏览器";
          if (receipt.ok) {
            successCount += 1;
            items.push({
              status: "success",
              label: `${browserLabel} · ${label}`,
              detail: receipt.action,
            });
          } else if (receipt.errors.length === 0) {
            items.push({
              status: "skipped",
              label: `${browserLabel} · ${label}`,
              windowId: recipe?.id,
            });
          }
          if (receipt.frame || receipt.activeTitle) {
            matchHints[receipt.recipeId] = {
              ...(receipt.frame ? { approximateFrame: receipt.frame } : {}),
              ...(receipt.activeTitle ? { title: receipt.activeTitle } : {}),
            };
          }
          for (const skipped of receipt.skipped) {
            items.push({
              status: "skipped",
              label: `${browserLabel} · ${label}`,
              detail: `${skipped.url} — ${skipped.reason}`,
              windowId: recipe?.id,
            });
          }
          for (const error of receipt.errors) {
            items.push({
              status: "failed",
              label: `${browserLabel} · ${label}`,
              detail: `${error.url ? `${error.url} — ` : ""}${error.message}`,
              windowId: recipe?.id,
            });
          }
        }
      }
    }

    const arrange = await this.native.arrange({
      windows: runnable,
      matchHints,
    });
    if (!arrange.ok) {
      items.push({
        status: "degraded",
        label: "窗口布局",
        detail: arrange.error?.message ?? "未知错误",
      });
    } else {
      for (const arranged of arrange.value ?? []) {
        const recipe = runnable.find((window) => window.id === arranged.id);
        if (!arranged.ok) {
          const isLaunchOnly = (recipe?.restoreMode ?? "open-content") === "launch-only";
          items.push({
            status: "degraded",
            label: `布局 · ${recipe?.name ?? arranged.id}`,
            detail: isLaunchOnly && arranged.message === "No unambiguous matching window appeared."
              ? "应用已启动，但未找到可安全调整布局的匹配窗口。"
              : arranged.message,
            windowId: recipe?.id,
          });
        } else if (recipe?.adapter === "manual") {
          successCount += 1;
          items.push({
            status: "success",
            label: `Manual · ${recipe.name}`,
            detail: arranged.message,
          });
        }
      }
    }
    new RestoreResultsModal(this.app, workspace.name, items, {
      onDiagnostics: () => this.showSystemDiagnostics(),
      onEditWindow: sourceFile
        ? (windowId) => this.editWindowById(sourceFile, windowId)
        : undefined,
    }).open();
    const failed = items.filter((item) => item.status === "failed").length;
    const degraded = items.filter((item) => item.status === "degraded").length;
    new Notice(
      `Workspace Bookmark：成功 ${successCount}，失败 ${failed}，降级 ${degraded}。`,
      8_000,
    );
    return { successCount, items };
  }

  private async browserStatusAfterEnsure(
    windows: WindowRecipe[],
  ): Promise<BrowserSnapshotReport | null> {
    const needed = new Set(
      windows
        .filter(
          (window) => window.adapter === "browser"
            && (window.restoreMode ?? "open-content") === "open-content"
            && window.browserId,
        )
        .map((window) => window.browserId as BrowserId),
    );
    if (needed.size === 0) return null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (attempt > 0) await wait(1_000);
      const result = await this.native.browserStatus();
      if (!result.ok || !result.value) continue;
      const connected = new Set(
        result.value.sources
          .filter((source) => source.connected)
          .map((source) => source.browserId),
      );
      if ([...needed].every((browserId) => connected.has(browserId))) {
        return result.value;
      }
      if (attempt === 3) return result.value;
    }
    return null;
  }

  private async openObsidianUrl(
    url: string,
    openMode: WindowRecipe["openMode"],
    newTab: boolean,
  ): Promise<void> {
    const parsed = new URL(url);
    if (parsed.protocol !== "obsidian:" || parsed.hostname !== "open") {
      throw new Error("仅支持 obsidian://open URI。");
    }
    if (openMode === "app-default") {
      window.open(url);
      return;
    }
    const vault = parsed.searchParams.get("vault");
    const path = parsed.searchParams.get("file");
    if (vault === this.app.vault.getName() && path) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) {
        if (openMode === "focus-existing") {
          const existing = this.app.workspace
            .getLeavesOfType("markdown")
            .find((leaf) => (leaf.view as MarkdownView).file?.path === file.path);
          if (existing) {
            this.app.workspace.setActiveLeaf(existing, { focus: true });
            return;
          }
        }
        await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(file);
        return;
      }
    }
    window.open(url);
  }

  private async openWindowAtLine(file: TFile, line: number): Promise<void> {
    const source = await this.app.vault.read(file);
    const parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed)) return;
    const section = sectionAtLine(parsed, line);
    if (!section?.recipe) {
      new DiagnosticsModal(this.app, file.path, parsed.diagnostics).open();
      return;
    }
    await this.runOperation(`正在打开 · ${section.name}`, () =>
      this.restoreWorkspace({
        id: parsed.workspace?.id ?? createWorkspaceId(),
        name: section.name,
        schemaVersion: parsed.workspace?.schemaVersion ?? 4,
        tags: [],
        windows: [section.recipe!],
      }, file),
    );
  }

  private async editWindowAtLine(file: TFile, line: number): Promise<void> {
    const source = await this.app.vault.read(file);
    const parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed)) return;
    const section = sectionAtLine(parsed, line);
    if (!section?.recipe) {
      new DiagnosticsModal(this.app, file.path, parsed.diagnostics).open();
      return;
    }
    await this.editWindowById(file, section.recipe.id);
  }

  private async editWindowById(file: TFile, windowId: string): Promise<void> {
    let source = await this.app.vault.read(file);
    let parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed)) return;
    if (parsed.workspace && parsed.workspace.schemaVersion < 4) {
      const migrated = await this.migrateWorkspaceWithConfirmation(file, source);
      if (!migrated) return;
      source = migrated;
      parsed = this.parse(source);
    }
    const section = parsed.sections.find((candidate) => candidate.recipe?.id === windowId);
    if (!section?.recipe) {
      new Notice(`未找到 Window：${windowId}`);
      return;
    }
    new WindowEditorModal(this.app, section.recipe, async (recipe) => {
      let failure = "";
      let changed = false;
      await this.app.vault.process(file, (currentSource) => {
        const currentParsed = this.parse(currentSource);
        if (
          !currentParsed.workspace
          || currentParsed.diagnostics.some((item) => item.severity === "error")
        ) {
          failure = "Workspace 已变为无效文档，未保存编辑。";
          return currentSource;
        }
        if (
          targetSectionsChanged(
            source,
            parsed,
            currentSource,
            currentParsed,
            [windowId],
          )
        ) {
          failure = "该 Window 已在编辑期间发生变化，请重新打开编辑表单。";
          return currentSource;
        }
        const currentSection = currentParsed.sections.find(
          (candidate) => candidate.recipe?.id === windowId,
        );
        if (!currentSection) {
          failure = "目标 Window 已不存在。";
          return currentSource;
        }
        const updated = replaceWindowSection(currentSource, currentSection, recipe);
        changed = updated !== currentSource;
        return updated;
      });
      if (failure) {
        new Notice(`Workspace Bookmark：${failure}`, 8_000);
      } else {
        new Notice(changed ? `已更新 Window：${recipe.name}` : "Window 没有变化。");
      }
    }).open();
  }

  private async validateAndFormatCurrent(): Promise<void> {
    const file = this.getActiveManagedFile();
    if (!file) return;
    const source = await this.app.vault.read(file);
    const parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed)) return;
    if (parsed.workspace && parsed.workspace.schemaVersion < 4) {
      await this.migrateWorkspaceWithConfirmation(file, source);
      return;
    }
    let diagnostics = parsed.diagnostics;
    await this.app.vault.process(file, (currentSource) => {
      const currentParsed = this.parse(currentSource);
      diagnostics = currentParsed.diagnostics;
      if (diagnostics.some((item) => item.severity === "error")) return currentSource;
      return formatWorkspaceMarkdown(currentSource, currentParsed);
    });
    new DiagnosticsModal(this.app, `校验：${file.path}`, diagnostics).open();
  }

  private async validateCurrentForCli(): Promise<string> {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile) || !this.isManagedWorkspace(file)) {
      return "Active file is not a managed Workspace.";
    }
    const parsed = this.parse(await this.app.vault.read(file));
    const errors = parsed.diagnostics.filter((item) => item.severity === "error");
    return errors.length === 0
      ? `${file.path}: valid`
      : `${file.path}: ${errors.length} error(s)\n${errors.map((item) => `${item.code}: ${item.message}`).join("\n")}`;
  }

  private async browseWorkspaces(): Promise<void> {
    const items = await this.collectWorkspaceItems();
    new WorkspaceBrowserModal(this.app, items, async (item) => {
      await this.openWorkspaceFile(item.file);
    }).open();
  }

  async showSystemDiagnostics(): Promise<void> {
    const [doctor, browser] = await Promise.all([
      this.native.doctor(),
      this.native.browserSnapshot(),
    ]);
    const activeFile = this.app.workspace.getActiveFile();
    const managed = activeFile instanceof TFile && this.isManagedWorkspace(activeFile);
    const parsed = managed
      ? this.parse(await this.app.vault.cachedRead(activeFile))
      : null;
    const browserSources = browser.value?.sources ?? doctor.value?.browserSources ?? [];
    const report: SystemDiagnosticsReport = {
      pluginVersion: this.manifest.version,
      managedFolder: this.settings.managedFolder,
      workspacectlPath: this.settings.workspacectlPath,
      items: [
        {
          label: "workspacectl",
          ok: doctor.ok,
          value: doctor.ok ? "可执行并返回结构化结果。" : doctor.error?.code ?? "不可执行",
          help: doctor.error?.message ?? "检查设置中的绝对路径，然后重新构建原生组件。",
        },
        {
          label: "Accessibility",
          ok: doctor.value?.accessibilityTrusted === true,
          value: doctor.value?.accessibilityTrusted ? "已授权" : "未授权",
          help: "打开 系统设置 → 隐私与安全性 → 辅助功能，为 workspacectl 授权。",
        },
        ...browserSources.flatMap((source) => {
          const doctorSource = doctor.value?.browserSources.find(
            (candidate) => candidate.browserId === source.browserId,
          );
          const windows = "windows" in source ? source.windows : [];
          const tabCount = windows.reduce(
            (total, browserWindow) => total + browserWindow.tabs.length,
            0,
          );
          return [
            {
              label: `${source.browserName} Native Host`,
              ok: doctorSource?.installed === true,
              value: doctorSource?.installed ? "已安装" : "未安装",
              help: `运行 npm run install:browser-host -- --browser=${source.browserId} --extension-id=<扩展 ID>。`,
            },
            {
              label: `${source.browserName} Browser Bridge`,
              ok: source.connected === true,
              value: source.connected
                ? `${windows.length} 个普通窗口，${tabCount} 个标签页`
                : source.error?.code ?? "未连接",
              help: source.error?.message
                ?? `保持 ${source.browserName} 运行，并重新加载 Workspace Bookmark 扩展。`,
            },
          ];
        }),
        {
          label: "当前文档作用域",
          ok: managed,
          value: managed
            ? activeFile.path
            : "当前文档不在受管目录中，或缺少 type: workspace。",
        },
        {
          label: "当前 Workspace Schema",
          ok: parsed != null
            && !parsed.diagnostics.some((item) => item.severity === "error"),
          value: parsed
            ? `${parsed.diagnostics.filter((item) => item.severity === "error").length} 个错误，${parsed.workspace?.windows.length ?? 0} 个 Window`
            : "未检查非受管文档",
        },
      ],
    };
    new SystemDiagnosticsModal(this.app, report, () => this.showSystemDiagnostics()).open();
    await this.refreshRuntimeStatus(doctor);
  }

  private async collectWorkspaceItems(): Promise<WorkspaceSearchItem[]> {
    const items: WorkspaceSearchItem[] = [];
    const recentById = new Map(
      this.settings.recentWorkspaces.map((item) => [
        item.workspaceId,
        item.lastOpenedAt,
      ]),
    );
    for (const file of this.app.vault.getMarkdownFiles()) {
      if (!this.isManagedWorkspace(file)) continue;
      const parsed = this.parse(await this.app.vault.cachedRead(file));
      if (!parsed.workspace) continue;
      const apps = [...new Set(parsed.workspace.windows.map((window) => window.appName))];
      const monitors = [...new Set(parsed.workspace.windows.map((window) => window.monitor))];
      const urlTitles = parsed.workspace.windows.flatMap((window) =>
        window.contents.map((content) => `${content.title} ${content.url}`),
      );
      items.push({
        file,
        id: parsed.workspace.id,
        name: parsed.workspace.name,
        tags: parsed.workspace.tags,
        apps,
        monitors,
        windowCount: parsed.workspace.windows.length,
        contentCount: parsed.workspace.windows.reduce(
          (total, window) => total + window.contents.length,
          0,
        ),
        lastOpenedAt: recentById.get(parsed.workspace.id),
        searchable: [
          parsed.workspace.name,
          ...parsed.workspace.tags,
          ...apps,
          ...urlTitles,
        ]
          .join(" ")
          .toLowerCase(),
      });
    }
    return items.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  }

  private async recordRecentWorkspace(workspaceId: string): Promise<void> {
    this.settings.recentWorkspaces = updateRecentWorkspaces(
      this.settings.recentWorkspaces,
      workspaceId,
      new Date().toISOString(),
    );
    await this.saveSettings();
  }

  private async ensureFolder(folder: string): Promise<void> {
    const segments = normalizePath(folder).split("/").filter(Boolean);
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      if (!(await this.app.vault.adapter.exists(current))) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  private parse(source: string): ParsedWorkspace {
    return parseWorkspaceMarkdown(source, { trustedSchemes: this.settings.trustedSchemes });
  }

  private ensureExecutable(file: TFile, parsed: ParsedWorkspace): boolean {
    if (!parsed.managed || !parsed.workspace) {
      new Notice(`${file.path} 不是可执行 Workspace。`);
      return false;
    }
    if (parsed.diagnostics.some((item) => item.severity === "error")) {
      new DiagnosticsModal(this.app, `无法执行：${file.path}`, parsed.diagnostics).open();
      return false;
    }
    return true;
  }

  private getActiveManagedFile(): TFile | null {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile) || !this.isManagedWorkspace(file)) {
      new Notice("当前文档不在受管目录中，或缺少 type: workspace。");
      return null;
    }
    return file;
  }

  private isManagedWorkspace(file: TFile | null): file is TFile {
    if (!(file instanceof TFile) || file.extension !== "md") return false;
    const folder = normalizeManagedFolder(this.settings.managedFolder);
    if (!isPathInManagedFolder(file.path, folder)) return false;
    return this.app.metadataCache.getFileCache(file)?.frontmatter?.type === "workspace";
  }

  private async runOperation<T>(
    label: string,
    task: () => Promise<T>,
  ): Promise<T | null> {
    if (this.activeOperation) {
      new Notice(`Workspace Bookmark 正在执行“${this.activeOperation}”，请稍候。`);
      return null;
    }
    this.activeOperation = label;
    this.renderRuntimeStatus("busy", label);
    try {
      return await task();
    } catch (cause) {
      new Notice(`Workspace Bookmark：${messageOf(cause)}`, 8_000);
      return null;
    } finally {
      this.activeOperation = null;
      void this.refreshRuntimeStatus();
    }
  }

  private async refreshRuntimeStatus(
    existingDoctor?: Awaited<ReturnType<NativeClient["doctor"]>>,
  ): Promise<void> {
    if (this.activeOperation) return;
    const doctor = existingDoctor ?? await this.native.doctor();
    if (!doctor.ok || !doctor.value) {
      this.renderRuntimeStatus("error", "控制器不可用");
      return;
    }
    const offlineBrowsers = doctor.value.browserSources
      .filter((source) => !source.connected)
      .map((source) => source.browserName);
    if (!doctor.value.accessibilityTrusted || offlineBrowsers.length > 0) {
      const missing = [
        !doctor.value.accessibilityTrusted ? "辅助功能" : "",
        ...offlineBrowsers,
      ].filter(Boolean).join(" / ");
      this.renderRuntimeStatus("warning", `${missing} 待处理`);
      return;
    }
    this.renderRuntimeStatus("ready", "已就绪");
  }

  private renderRuntimeStatus(
    state: "checking" | "busy" | "ready" | "warning" | "error",
    label: string,
  ): void {
    if (!this.statusBarItem) return;
    this.statusBarItem.empty();
    this.statusBarItem.className = `status-bar-item workspace-bookmark-status is-${state}`;
    const icon = this.statusBarItem.createSpan();
    const icons = {
      checking: "loader-circle",
      busy: "loader-circle",
      ready: "circle-check",
      warning: "triangle-alert",
      error: "circle-x",
    } as const;
    setIcon(icon, icons[state]);
    this.statusBarItem.createSpan({ text: `Workspace · ${label}` });
  }
}

function restoreItemForEnsuredApp(item: EnsureAppItem): RestoreResultItem {
  const labels: Record<string, string> = {
    "already-running": "已在运行",
    launched: "已启动",
    "not-found": "未找到 App",
    "launch-failed": "启动失败",
  };
  return {
    status: item.ok ? "success" : "skipped",
    label: `App · ${item.appName}`,
    detail: labels[item.status] ?? item.message,
    windowId: item.id,
  };
}

function sectionAtLine(parsed: ParsedWorkspace, line: number): WindowSection | null {
  return parsed.sections.find((section) => line >= section.headingLine && line < section.endLine) ?? null;
}

function extractUntrustedSchemes(parsed: ParsedWorkspace): string[] {
  const schemes = parsed.diagnostics
    .filter((item) => item.code === "UNTRUSTED_SCHEME")
    .map((item) => /“([^”]+)”/.exec(item.message)?.[1] ?? "")
    .filter(Boolean);
  return [...new Set(schemes)];
}

function sanitizeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim() || "Untitled Workspace";
}

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function browserDescriptorForBundle(
  bundleId: string,
): { id: BrowserId; name: string } | null {
  if (bundleId === "com.google.Chrome") {
    return { id: "chrome", name: "Google Chrome" };
  }
  if (
    bundleId === "com.tabbit-ai.Tabbit"
    || bundleId.startsWith("com.tabbit-ai.Tabbit.app.")
  ) {
    return { id: "tabbit", name: "Tabbit" };
  }
  return null;
}
