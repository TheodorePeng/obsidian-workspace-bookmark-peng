import type {
  BrowserId,
  WindowRecipe,
  WindowAdapter,
  OpenMode,
  MonitorRole,
} from "./contracts";
import {
  App,
  ButtonComponent,
  Menu,
  Modal,
  Notice,
  Setting,
  TFile,
  setIcon,
} from "obsidian";
import { candidateToRecipe, frameToLayout } from "./capture-recipe";
import {
  isRestorableBrowserUrl,
  reconcileCaptureSnapshot,
  type CaptureCandidate,
  type CaptureSnapshot,
} from "./capture";
import type { CaptureDiff, CaptureOperation } from "./merge";
import { validateLayout, type Diagnostic } from "./model";
import type { DuplicateRecipeGroup } from "./recipe-identity";

export class TextPromptModal extends Modal {
  private value = "";

  constructor(
    app: App,
    private readonly title: string,
    private readonly placeholder: string,
    private readonly onSubmit: (value: string) => void | Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    prepareModal(this, "compact");
    this.titleEl.setText(this.title);
    createModalIntro(
      this.contentEl,
      "新建工作区",
      "为当前任务创建一份可捕获、可编辑、可恢复的 Workspace Markdown。",
      "folder-plus",
    );
    const form = this.contentEl.createDiv({ cls: "workspace-bookmark-form-card" });
    new Setting(form).setName("Workspace 名称").setDesc("稍后仍可在 Markdown 中修改。").addText((input) => {
      input.setPlaceholder(this.placeholder).onChange((value) => (this.value = value.trim()));
      input.inputEl.focus();
      input.inputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter") void this.submit();
      });
    });
    const footer = createModalFooter(this.contentEl);
    new Setting(footer).addButton((button) =>
      button.setButtonText("取消").onClick(() => this.close()),
    ).addButton((button) =>
      button.setButtonText("创建").setCta().onClick(() => void this.submit()),
    );
  }

  private async submit(): Promise<void> {
    if (!this.value) {
      new Notice("名称不能为空。");
      return;
    }
    await this.onSubmit(this.value);
    this.close();
  }
}

export class DiagnosticsModal extends Modal {
  constructor(
    app: App,
    private readonly title: string,
    private readonly diagnostics: Diagnostic[],
  ) {
    super(app);
  }

  onOpen(): void {
    prepareModal(this, "standard");
    this.titleEl.setText(this.title);
    const errors = this.diagnostics.filter((item) => item.severity === "error").length;
    const warnings = this.diagnostics.length - errors;
    createModalIntro(
      this.contentEl,
      errors > 0 ? "需要修正" : warnings > 0 ? "可以执行，但建议检查" : "状态正常",
      errors > 0
        ? `发现 ${errors} 个错误。修正前不会执行或覆盖原文。`
        : warnings > 0
          ? `没有阻断错误，另有 ${warnings} 条提醒。`
          : "格式、字段和 URL 均通过检查。",
      errors > 0 ? "circle-alert" : warnings > 0 ? "triangle-alert" : "circle-check",
      errors > 0 ? "danger" : warnings > 0 ? "warning" : "success",
    );
    const container = this.contentEl.createDiv({ cls: "workspace-bookmark-diagnostics" });
    if (this.diagnostics.length === 0) {
      createEmptyState(container, "sparkles", "无需处理", "当前 Workspace 已通过全部校验。");
      return;
    }
    for (const diagnostic of this.diagnostics) {
      const location = [
        diagnostic.line ? `第 ${diagnostic.line} 行` : "",
        diagnostic.windowName ? `Window：${diagnostic.windowName}` : "",
        diagnostic.field ? `字段：${diagnostic.field}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      const item = container.createDiv({ cls: "workspace-bookmark-diagnostic-row" });
      item.addClass(
        diagnostic.severity === "error"
          ? "is-error"
          : "is-warning",
      );
      const icon = item.createDiv({ cls: "workspace-bookmark-diagnostic-icon" });
      setIcon(icon, diagnostic.severity === "error" ? "circle-x" : "triangle-alert");
      const body = item.createDiv({ cls: "workspace-bookmark-diagnostic-body" });
      const heading = body.createDiv({ cls: "workspace-bookmark-diagnostic-heading" });
      heading.createEl("strong", { text: diagnostic.message });
      heading.createSpan({ text: diagnostic.code, cls: "workspace-bookmark-code" });
      if (location) body.createEl("small", { text: location });
    }
  }
}

export interface RestoreBlockedIssue {
  windowId?: string;
  windowName?: string;
  message: string;
}

export class RestoreBlockedModal extends Modal {
  constructor(
    app: App,
    private readonly workspaceName: string,
    private readonly issues: RestoreBlockedIssue[],
    private readonly actions: {
      onRetry?: () => void | Promise<void>;
      onDiagnostics?: () => void | Promise<void>;
      onEditWindow?: (windowId: string) => void | Promise<void>;
    } = {},
  ) {
    super(app);
  }

  onOpen(): void {
    prepareModal(this, "standard");
    this.titleEl.setText(`无法恢复 · ${this.workspaceName}`);
    createModalIntro(
      this.contentEl,
      "当前没有可安全执行的内容",
      "没有启动任何写入型恢复操作。请修复连接或编辑对应 Window 后重新检测。",
      "circle-off",
      "danger",
    );
    const list = this.contentEl.createDiv({ cls: "workspace-bookmark-issue-list" });
    for (const issue of this.issues) {
      const row = list.createDiv({ cls: "workspace-bookmark-issue-row" });
      const icon = row.createDiv({ cls: "workspace-bookmark-issue-icon" });
      setIcon(icon, "alert-circle");
      const copy = row.createDiv();
      if (issue.windowName) copy.createEl("strong", { text: issue.windowName });
      copy.createEl("p", { text: issue.message });
      if (issue.windowId && this.actions.onEditWindow) {
        new ButtonComponent(row)
          .setButtonText("编辑")
          .setIcon("pencil")
          .onClick(async () => {
            this.close();
            await this.actions.onEditWindow?.(issue.windowId!);
          });
      }
    }
    const footer = createModalFooter(this.contentEl);
    const buttons = new Setting(footer);
    if (this.actions.onDiagnostics) {
      buttons.addButton((button) =>
        button.setButtonText("系统诊断").setIcon("stethoscope").onClick(async () => {
          this.close();
          await this.actions.onDiagnostics?.();
        }),
      );
    }
    buttons.addButton((button) =>
      button.setButtonText("复制详情").setIcon("copy").onClick(async () => {
        await navigator.clipboard.writeText(
          this.issues.map((issue) =>
            `${issue.windowName ? `${issue.windowName}：` : ""}${issue.message}`,
          ).join("\n"),
        );
        new Notice("已复制恢复阻断详情。");
      }),
    );
    if (this.actions.onRetry) {
      buttons.addButton((button) =>
        button.setButtonText("重新检测").setIcon("refresh-cw").setCta().onClick(async () => {
          this.close();
          await this.actions.onRetry?.();
        }),
      );
    }
  }
}

export type RestoreResultStatus = "success" | "skipped" | "failed" | "degraded";

export interface RestoreResultItem {
  status: RestoreResultStatus;
  label: string;
  detail?: string;
  windowId?: string;
}

export class RestoreResultsModal extends Modal {
  constructor(
    app: App,
    private readonly workspaceName: string,
    private readonly items: RestoreResultItem[],
    private readonly actions: {
      onDiagnostics?: () => void | Promise<void>;
      onEditWindow?: (windowId: string) => void | Promise<void>;
    } = {},
  ) {
    super(app);
  }

  onOpen(): void {
    prepareModal(this, "standard");
    this.titleEl.setText(`恢复结果 · ${this.workspaceName}`);
    const success = this.items.filter((item) => item.status === "success").length;
    const failed = this.items.filter((item) => item.status === "failed").length;
    createModalIntro(
      this.contentEl,
      failed > 0 ? "部分项目需要处理" : "恢复流程已完成",
      failed > 0
        ? `${success} 项成功，${failed} 项失败。下方保留了每一步的结果。`
        : `${success} 项操作成功完成。`,
      failed > 0 ? "list-checks" : "party-popper",
      failed > 0 ? "warning" : "success",
    );
    const metrics = this.contentEl.createDiv({ cls: "workspace-bookmark-metrics" });
    const order: RestoreResultStatus[] = ["failed", "degraded", "skipped", "success"];
    const labels: Record<RestoreResultStatus, string> = {
      success: "成功",
      skipped: "跳过",
      failed: "失败",
      degraded: "降级",
    };
    const icons: Record<RestoreResultStatus, string> = {
      success: "circle-check",
      skipped: "circle-minus",
      failed: "circle-x",
      degraded: "triangle-alert",
    };
    for (const status of order) {
      const count = this.items.filter((item) => item.status === status).length;
      const metric = metrics.createDiv({ cls: `workspace-bookmark-metric is-${status}` });
      metric.createSpan({ text: String(count), cls: "workspace-bookmark-metric-value" });
      metric.createSpan({ text: labels[status], cls: "workspace-bookmark-metric-label" });
    }
    const groups = this.contentEl.createDiv({ cls: "workspace-bookmark-result-groups" });
    for (const status of order) {
      const matches = this.items.filter((item) => item.status === status);
      if (matches.length === 0) continue;
      const section = groups.createDiv({ cls: `workspace-bookmark-result-section is-${status}` });
      const heading = section.createDiv({ cls: "workspace-bookmark-section-heading" });
      const headingIcon = heading.createSpan();
      setIcon(headingIcon, icons[status]);
      heading.createEl("h3", { text: `${labels[status]}（${matches.length}）` });
      const list = section.createDiv({ cls: "workspace-bookmark-result-list" });
      for (const item of matches) {
        const row = list.createDiv({ cls: "workspace-bookmark-result-row" });
        const copy = row.createDiv({ cls: "workspace-bookmark-result-copy" });
        copy.createEl("strong", { text: item.label });
        if (item.detail) copy.createEl("small", { text: item.detail });
        if (
          item.windowId
          && this.actions.onEditWindow
          && item.status !== "success"
        ) {
          new ButtonComponent(row)
            .setButtonText("编辑")
            .setIcon("pencil")
            .onClick(async () => {
              this.close();
              await this.actions.onEditWindow?.(item.windowId!);
            });
        }
      }
    }
    if (this.items.length === 0) {
      createEmptyState(groups, "inbox", "没有可执行的 Window", "请先检查 Workspace 内容。");
    }
    const footer = createModalFooter(this.contentEl);
    const buttons = new Setting(footer);
    if (this.actions.onDiagnostics) {
      buttons.addButton((button) =>
        button.setButtonText("系统诊断").setIcon("stethoscope").onClick(async () => {
          this.close();
          await this.actions.onDiagnostics?.();
        }),
      );
    }
    buttons.addButton((button) =>
      button.setButtonText("复制结果").setIcon("copy").onClick(async () => {
        await navigator.clipboard.writeText(JSON.stringify({
          workspace: this.workspaceName,
          items: this.items,
        }, null, 2));
        new Notice("已复制恢复结果。");
      }),
    );
  }
}

export interface SystemDiagnosticItem {
  label: string;
  ok: boolean;
  value: string;
  help?: string;
}

export interface SystemDiagnosticsReport {
  pluginVersion: string;
  managedFolder: string;
  workspacectlPath: string;
  items: SystemDiagnosticItem[];
}

export class SystemDiagnosticsModal extends Modal {
  constructor(
    app: App,
    private readonly report: SystemDiagnosticsReport,
    private readonly onRetry?: () => void | Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    prepareModal(this, "standard");
    this.titleEl.setText("Workspace Bookmark 系统诊断");
    const passed = this.report.items.filter((item) => item.ok).length;
    const healthy = passed === this.report.items.length;
    createModalIntro(
      this.contentEl,
      healthy ? "所有组件均可用" : "运行环境需要处理",
      `插件 ${this.report.pluginVersion} · ${passed}/${this.report.items.length} 项通过 · 受管目录 ${this.report.managedFolder}`,
      healthy ? "badge-check" : "stethoscope",
      healthy ? "success" : "warning",
    );
    const grid = this.contentEl.createDiv({ cls: "workspace-bookmark-health-grid" });
    for (const item of this.report.items) {
      const row = grid.createDiv({
        cls: `workspace-bookmark-health-row ${item.ok ? "is-ok" : "is-blocked"}`,
      });
      const icon = row.createDiv({ cls: "workspace-bookmark-health-icon" });
      setIcon(icon, item.ok ? "check" : "x");
      const copy = row.createDiv({ cls: "workspace-bookmark-health-copy" });
      copy.createEl("strong", { text: item.label });
      copy.createEl("p", { text: item.value });
      if (item.help && !item.ok) copy.createEl("small", { text: item.help });
    }
    const footer = createModalFooter(this.contentEl);
    new Setting(footer)
      .setName("脱敏诊断报告")
      .setDesc("不包含标签页 URL、标题或 Workspace 正文。")
      .addButton((button) => {
        if (!this.onRetry) return;
        button.setButtonText("重新检测").onClick(async () => {
          this.close();
          await this.onRetry?.();
        });
      })
      .addButton((button) =>
        button.setButtonText("复制").onClick(async () => {
          await navigator.clipboard.writeText(JSON.stringify(this.report, null, 2));
          new Notice("已复制脱敏诊断报告。");
        }),
      );
  }
}

export class ConfirmSchemesModal extends Modal {
  constructor(
    app: App,
    private readonly schemes: string[],
    private readonly onConfirm: () => void | Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    prepareModal(this, "compact");
    this.titleEl.setText("信任 URL Scheme");
    createModalIntro(
      this.contentEl,
      "仅信任你认识的应用",
      "第三方 URL Scheme 可以唤起本机应用。Workspace Bookmark 不会执行 Shell 命令。",
      "shield-question",
      "warning",
    );
    const schemes = this.contentEl.createDiv({ cls: "workspace-bookmark-scheme-list" });
    for (const scheme of this.schemes) {
      schemes.createSpan({ text: `${scheme}://`, cls: "workspace-bookmark-chip is-accent" });
    }
    const row = new Setting(createModalFooter(this.contentEl));
    row.addButton((button) => button.setButtonText("取消").onClick(() => this.close()));
    row.addButton((button) =>
      button
        .setButtonText("信任并继续")
        .setCta()
        .onClick(async () => {
          await this.onConfirm();
          this.close();
        }),
    );
  }
}

export interface WorkspaceSearchItem {
  file: TFile;
  id: string;
  name: string;
  tags: string[];
  apps: string[];
  monitors: string[];
  windowCount: number;
  contentCount: number;
  lastOpenedAt?: string;
  searchable: string;
}

export class WorkspaceBrowserModal extends Modal {
  constructor(
    app: App,
    private readonly items: WorkspaceSearchItem[],
    private readonly onOpenWorkspace: (item: WorkspaceSearchItem) => void | Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    prepareModal(this, "wide");
    this.titleEl.setText("Workspace Library");
    createModalIntro(
      this.contentEl,
      `${this.items.length} 个 Workspace`,
      "按名称、标签、App 或页面标题查找。",
      "library-big",
    );
    const toolbar = this.contentEl.createDiv({ cls: "workspace-bookmark-library-toolbar" });
    const searchShell = toolbar.createDiv({ cls: "workspace-bookmark-search-shell" });
    const searchIcon = searchShell.createSpan();
    setIcon(searchIcon, "search");
    const searchInput = searchShell.createEl("input", {
      type: "search",
      placeholder: "搜索 Workspace、标签、App 或 URL 标题…",
    });
    const count = toolbar.createSpan({ cls: "workspace-bookmark-result-count" });
    const results = this.contentEl.createDiv({ cls: "workspace-bookmark-library-results" });
    const renderItems = (container: HTMLElement, items: WorkspaceSearchItem[]) => {
      for (const item of items) {
        const row = container.createDiv({ cls: "workspace-bookmark-workspace-row" });
        const lead = row.createDiv({ cls: "workspace-bookmark-workspace-row-lead" });
        const glyph = lead.createDiv({ cls: "workspace-bookmark-workspace-glyph" });
        setIcon(glyph, appIconFor(item.apps));
        const title = lead.createDiv();
        title.createEl("h3", { text: item.name });
        const metadata = [
          ...item.apps.slice(0, 2).map(appLabel),
          `${item.windowCount} 个窗口`,
          `${item.contentCount} 个页面`,
          item.lastOpenedAt ? relativeTime(item.lastOpenedAt) : "",
        ].filter(Boolean);
        title.createEl("small", { text: metadata.join(" · ") });
        if (item.tags.length > 0) {
          title.createDiv({
            text: item.tags.slice(0, 3).map((tag) => `#${tag}`).join("  "),
            cls: "workspace-bookmark-workspace-tags",
          });
        }
        const actions = row.createDiv({ cls: "workspace-bookmark-row-actions" });
        new ButtonComponent(actions)
          .setButtonText("笔记")
          .setIcon("file-text")
          .onClick(async () => {
            await this.app.workspace.getLeaf(false).openFile(item.file);
            this.close();
          });
        new ButtonComponent(actions)
          .setButtonText("运行")
          .setIcon("play")
          .setCta()
          .onClick(async () => {
            await this.onOpenWorkspace(item);
            this.close();
          });
      }
    };
    const render = (query: string) => {
      results.empty();
      const normalized = query.trim().toLowerCase();
      const filtered = this.items.filter((item) => item.searchable.includes(normalized));
      count.setText(`${filtered.length} 个结果`);
      if (!normalized) {
        const recent = filtered
          .filter((item) => item.lastOpenedAt)
          .sort((left, right) =>
            (right.lastOpenedAt ?? "").localeCompare(left.lastOpenedAt ?? ""),
          )
          .slice(0, 5);
        if (recent.length > 0) {
          const recentSection = createLibrarySection(results, "最近使用", "history");
          renderItems(recentSection, recent);
        }
        const allSection = createLibrarySection(results, "全部 Workspace", "layers-3");
        renderItems(allSection, filtered);
      } else {
        const searchSection = createLibrarySection(results, "搜索结果", "list-filter");
        renderItems(searchSection, filtered);
      }
      if (filtered.length === 0) {
        createEmptyState(
          results,
          "search-x",
          "没有匹配的 Workspace",
          "尝试搜索标签、App 名称或网页标题。",
        );
      }
    };
    searchInput.addEventListener("input", () => render(searchInput.value));
    window.setTimeout(() => searchInput.focus(), 0);
    render("");
  }
}

export class CaptureModal extends Modal {
  private summaryEl: HTMLElement | null = null;
  private sourceNoticesEl: HTMLElement | null = null;
  private candidatesEl: HTMLElement | null = null;
  private refreshButton: ButtonComponent | null = null;
  private refreshing = false;
  private readonly candidateRows = new Map<CaptureCandidate, HTMLElement>();

  constructor(
    app: App,
    private candidates: CaptureCandidate[],
    private readonly existing: WindowRecipe[],
    private readonly onSubmit: (operations: CaptureOperation[]) => void | Promise<void>,
    private readonly options: {
      scannedAt?: string;
      sourceNotices?: CaptureSnapshot["sourceNotices"];
      onRefresh?: () => Promise<CaptureSnapshot>;
      onDiagnostics?: () => void | Promise<void>;
      onReviewDuplicates?: () => void | Promise<void>;
    } = {},
  ) {
    super(app);
  }

  onOpen(): void {
    prepareModal(this, "wide");
    this.titleEl.setText("收录当前 Workspace");
    const toolbar = this.contentEl.createDiv({ cls: "workspace-bookmark-capture-toolbar" });
    this.summaryEl = toolbar.createDiv({ cls: "workspace-bookmark-capture-summary" });
    const quickActions = toolbar.createDiv({ cls: "workspace-bookmark-quick-actions" });
    this.sourceNoticesEl = quickActions.createDiv({
      cls: "workspace-bookmark-capture-bridge-icons",
    });
    if (this.options.onRefresh) {
      this.refreshButton = new ButtonComponent(quickActions)
        .setIcon("refresh-cw")
        .setTooltip("刷新当前可见窗口")
        .onClick(() => void this.refreshCandidates());
    }
    this.updateScannedAt(this.options.scannedAt);
    new ButtonComponent(quickActions)
      .setIcon("check-check")
      .setTooltip("全部收录")
      .onClick(() => this.setAllCandidates(true));
    new ButtonComponent(quickActions)
      .setIcon("circle-off")
      .setTooltip("全部忽略")
      .onClick(() => this.setAllCandidates(false));
    this.candidatesEl = this.contentEl.createDiv({
      cls: "workspace-bookmark-capture-candidates",
    });
    this.renderSourceNotices(this.options.sourceNotices ?? []);
    this.renderCandidates();
    this.updateCaptureSummary();
    const footer = createModalFooter(this.contentEl, "sticky");
    footer.createEl("small", { text: "写入前会显示差异，不会删除未选内容。" });
    new Setting(footer).addButton((button) =>
      button.setButtonText("取消").onClick(() => this.close()),
    ).addButton((button) =>
      button
        .setButtonText("预览并写入")
        .setIcon("arrow-right")
        .setCta()
        .onClick(async () => {
          const duplicate = this.candidates.find(
            (candidate) =>
              candidate.selected
              && (candidate.duplicateTargetIds?.length ?? 0) > 1,
          );
          if (duplicate) {
            this.revealCaptureIssue(duplicate, "存在多个重复的已有 Window，请先检查重复项。");
            return;
          }
          const firstInvalid = this.candidates.find(
            (candidate) =>
              candidate.selected
              && candidate.action !== "ignore"
              && candidateToRecipe(candidate) == null,
          );
          if (firstInvalid) {
            this.revealCaptureIssue(firstInvalid, "请先添加恢复内容，或切换为“仅启动应用”。");
            return;
          }
          const operations = this.candidates.flatMap((candidate): CaptureOperation[] => {
            if (!candidate.selected || candidate.action === "ignore") return [];
            const recipe = candidateToRecipe(candidate);
            if (!recipe) return [];
            if (candidate.action === "update" && candidate.targetId) {
              return [
                {
                  action: "update",
                  targetId: candidate.targetId,
                  recipe: { ...recipe, id: candidate.targetId },
                },
              ];
            }
            return [{ action: "add", recipe }];
          });
          if (operations.length === 0) {
            const ambiguous = this.candidates.find(
              (candidate) => candidate.browserAlternatives?.length && !candidate.browser,
            );
            if (ambiguous) {
              this.revealCaptureIssue(ambiguous, "请先解决浏览器窗口匹配歧义。");
              return;
            }
            new Notice("请至少选择一个要收录的窗口。");
            return;
          }
          await this.onSubmit(operations);
          this.close();
        }),
    );
  }

  private renderCandidates(): void {
    if (!this.candidatesEl) return;
    this.candidatesEl.empty();
    this.candidateRows.clear();
    if (this.candidates.length === 0) {
      const empty = createEmptyState(
        this.candidatesEl,
        "scan-search",
        "当前没有可收录窗口",
        "只显示当前 Space 中实际可见的普通窗口。",
      );
      const actions = empty.createDiv({ cls: "workspace-bookmark-empty-actions" });
      if (this.options.onRefresh) {
        new ButtonComponent(actions)
          .setButtonText("重新扫描")
          .setIcon("refresh-cw")
          .onClick(() => void this.refreshCandidates());
      }
      if (this.options.onDiagnostics) {
        new ButtonComponent(actions)
          .setButtonText("系统诊断")
          .setIcon("stethoscope")
          .onClick(() => void this.options.onDiagnostics?.());
      }
      return;
    }
    const groups = new Map<string, CaptureCandidate[]>();
    for (const candidate of this.candidates) {
      const group = groups.get(candidate.native.monitor) ?? [];
      group.push(candidate);
      groups.set(candidate.native.monitor, group);
    }
    for (const [monitor, candidates] of groups) {
      const group = this.candidatesEl.createDiv({ cls: "workspace-bookmark-capture-group" });
      const groupHeading = group.createDiv({ cls: "workspace-bookmark-group-heading" });
      const headingCopy = groupHeading.createDiv();
      headingCopy.createEl("h3", { text: monitorLabel(monitor) });
      headingCopy.createEl("small", { text: `${candidates.length} 个可见窗口` });
      const apps = new Map<string, CaptureCandidate[]>();
      for (const candidate of candidates) {
        const groupName =
          candidate.browser?.browserName
          ?? candidate.browserNameHint
          ?? candidate.native.appName;
        const appGroup = apps.get(groupName) ?? [];
        appGroup.push(candidate);
        apps.set(groupName, appGroup);
      }
      for (const [appName, appCandidates] of apps) {
        const appGroup = group.createDiv({ cls: "workspace-bookmark-app-group" });
        const appHeading = appGroup.createDiv({ cls: "workspace-bookmark-app-heading" });
        appHeading.createEl("h4", { text: appName });
        const tabCount = appCandidates.reduce(
          (total, candidate) => total + (candidate.browser?.tabs.length ?? 0),
          0,
        );
        const browserConnection = appCandidates.find((candidate) => candidate.browserIdHint);
        appHeading.createSpan({
          text: browserConnection
            ? browserConnection.browserConnected
              ? `${appCandidates.length} 个窗口 · ${tabCount} 个标签页`
              : `${appCandidates.length} 个窗口 · 桥接离线`
            : `${appCandidates.length} 个窗口`,
          cls: `workspace-bookmark-count-badge${
            browserConnection && !browserConnection.browserConnected ? " is-warning" : ""
          }`,
        });
        for (const candidate of appCandidates) this.renderCandidate(appGroup, candidate);
      }
    }
  }

  private renderCandidate(container: HTMLElement, candidate: CaptureCandidate): void {
    const row = container.createDiv({ cls: "workspace-bookmark-window-row" });
    this.candidateRows.set(candidate, row);
    row.toggleClass("is-selected", candidate.selected);
    const visibleAppName =
      candidate.browser?.browserName
      ?? candidate.browserNameHint
      ?? candidate.native.appName;
    const header = row.createDiv({ cls: "workspace-bookmark-window-row-header" });
    const canSelect = !(!candidate.browser && Boolean(candidate.browserAlternatives?.length))
      && (candidate.duplicateTargetIds?.length ?? 0) <= 1;
    const selectionInput = header.createEl("input", {
      cls: "workspace-bookmark-capture-select",
      attr: {
        type: "checkbox",
        "aria-label": `收录 ${visibleAppName}：${candidate.native.title || "无标题"}`,
      },
    });
    selectionInput.checked = candidate.selected;
    selectionInput.disabled = !canSelect;
    const identity = header.createDiv({ cls: "workspace-bookmark-window-identity" });
    const icon = identity.createSpan({ cls: "workspace-bookmark-window-icon" });
    setIcon(
      icon,
      candidate.browser || candidate.browserAlternatives?.length
        ? "globe-2"
        : candidate.obsidianUrl
          ? "notebook-tabs"
          : "app-window",
    );
    const copy = identity.createDiv();
    const primary = copy.createDiv({ cls: "workspace-bookmark-window-primary" });
    primary.createSpan({ text: visibleAppName, cls: "workspace-bookmark-window-app" });
    primary.createSpan({
      text: candidate.native.title || "无标题",
      cls: "workspace-bookmark-window-title",
    });
    copy.createDiv({
      text: `${monitorLabel(candidate.native.monitor)} · ${humanLayout(
        frameToLayout(candidate.native.normalizedFrame),
      )}`,
      cls: "workspace-bookmark-window-secondary",
    });

    const applySelection = (selected: boolean) => {
      candidate.selected = selected;
      candidate.action = selected ? candidate.targetId ? "update" : "add" : "ignore";
      this.renderCandidates();
      this.updateCaptureSummary();
    };
    selectionInput.addEventListener("change", () => applySelection(selectionInput.checked));

    const manualContainer = row.createDiv({ cls: "workspace-bookmark-manual-url" });
    if ((candidate.duplicateTargetIds?.length ?? 0) > 1) {
      const warning = row.createDiv({ cls: "workspace-bookmark-capture-inline-warning" });
      const warningIcon = warning.createSpan();
      setIcon(warningIcon, "copy-x");
      warning.createSpan({
        text: `检测到 ${candidate.duplicateTargetIds!.length} 个重复的已有 Window。`,
      });
      if (this.options.onReviewDuplicates) {
        new ButtonComponent(warning)
          .setButtonText("检查重复项")
          .onClick(async () => {
            this.close();
            await this.options.onReviewDuplicates?.();
          });
      }
    }
    identity.addEventListener("click", () => {
      if (canSelect) applySelection(!candidate.selected);
    });

    if (supportsBrowserOpenMode(candidate)) {
      const modes = header.createDiv({
        cls: "workspace-bookmark-window-open-modes",
        attr: { role: "group", "aria-label": "浏览器打开方式" },
      });
      const options: Array<{ value: OpenMode; icon: string; tooltip: string }> = [
        {
          value: "new-window",
          icon: "square-plus",
          tooltip: "始终新建窗口：每次都创建独立浏览器窗口。",
        },
        {
          value: "reuse-window",
          icon: "panels-top-left",
          tooltip: "优先复用窗口：在可用窗口中新开所选页面，相同页面可能重复。",
        },
        {
          value: "focus-existing",
          icon: "scan-search",
          tooltip: "聚焦已有页面：完整 URL 已打开时直接切换，否则复用窗口。",
        },
      ];
      for (const option of options) {
        const button = new ButtonComponent(modes)
          .setIcon(option.icon)
          .setTooltip(option.tooltip)
          .onClick(() => {
            candidate.openMode = option.value;
            this.renderCandidates();
          });
        button.buttonEl.addClass("workspace-bookmark-open-mode-icon");
        button.buttonEl.setAttribute("aria-pressed", String(candidate.openMode === option.value));
        button.buttonEl.setAttribute("aria-label", option.tooltip);
        button.buttonEl.toggleClass("is-active", candidate.openMode === option.value);
      }
    }

    const tabs = row.createEl("details", { cls: "workspace-bookmark-capture-tabs" });
    tabs.open = candidate.tabsExpanded ?? false;
    tabs.addEventListener("toggle", () => {
      candidate.tabsExpanded = tabs.open;
    });
    const renderTabs = () => {
      tabs.empty();
      if (!candidate.browser) return;
      const tabsHeading = tabs.createEl("summary", {
        cls: "workspace-bookmark-tabs-heading",
      });
      tabsHeading.createSpan({ text: "标签页" });
      const tabSummary = tabsHeading.createEl("small", {
        text: `${candidate.selectedTabs.size}/${candidate.browser.tabs.length}`,
      });
      const tabActions = tabsHeading.createDiv({ cls: "workspace-bookmark-tab-actions" });
      const selectTabs = (mode: "all" | "active") => {
        candidate.selectedTabs.clear();
        for (const tab of candidate.browser?.tabs ?? []) {
          if (
            isRestorableBrowserUrl(tab.url)
            && (mode === "all" || tab.active)
          ) {
            candidate.selectedTabs.add(tab.index);
          }
        }
        renderTabs();
        this.updateCaptureSummary();
      };
      new ButtonComponent(tabActions)
        .setButtonText("全部")
        .onClick((event) => {
          event.preventDefault();
          event.stopPropagation();
          selectTabs("all");
        });
      new ButtonComponent(tabActions)
        .setButtonText("仅当前")
        .onClick((event) => {
          event.preventDefault();
          event.stopPropagation();
          selectTabs("active");
        });
      for (const tab of candidate.browser.tabs) {
        const tabRow = new Setting(tabs)
          .setName(tab.title || tab.url)
          .setDesc(compactUrl(tab.url))
          .addToggle((toggle) =>
            toggle
              .setValue(candidate.selectedTabs.has(tab.index))
              .setDisabled(!isRestorableBrowserUrl(tab.url))
              .onChange((value) => {
                if (value) candidate.selectedTabs.add(tab.index);
                else candidate.selectedTabs.delete(tab.index);
                tabSummary.setText(
                  `${candidate.selectedTabs.size}/${candidate.browser?.tabs.length ?? 0}`,
                );
                this.updateCaptureSummary();
              }),
          );
        tabRow.settingEl.addClass("workspace-bookmark-tab-row");
        if (!isRestorableBrowserUrl(tab.url)) {
          tabRow.settingEl.addClass("is-disabled");
          tabRow.setDesc(
            `${compactUrl(tab.url)} · ${candidate.browser.browserName} 不允许恢复`,
          );
        }
      }
    };
    if (!candidate.browser && candidate.browserAlternatives?.length) {
      new Setting(row)
        .setName("浏览器匹配有歧义")
        .setDesc("请选择对应窗口，插件不会自动猜测。")
        .addDropdown((dropdown) => {
          dropdown.addOption("", "请选择…");
          for (const alternative of candidate.browserAlternatives ?? []) {
            const active = alternative.tabs.find((tab) => tab.active);
            dropdown.addOption(
              `${alternative.browserId}:${alternative.id}`,
              `${alternative.browserName} · ${active?.title || `窗口 ${alternative.id}`}`,
            );
          }
          dropdown.onChange((value) => {
            candidate.browser = candidate.browserAlternatives?.find(
              (alternative) => `${alternative.browserId}:${alternative.id}` === value,
            );
            candidate.selected = Boolean(candidate.browser);
            candidate.action = candidate.selected ? "add" : "ignore";
            candidate.targetId = undefined;
            candidate.restoreMode = "open-content";
            candidate.openMode = "focus-existing";
            candidate.selectedTabs = new Set(
              candidate.browser?.tabs
                .filter((tab) => isRestorableBrowserUrl(tab.url))
                .map((tab) => tab.index) ?? [],
            );
            this.renderCandidates();
            this.updateCaptureSummary();
          });
        });
    }
    renderTabs();
    if (!candidate.obsidianUrl && !candidate.browser && !candidate.browserAlternatives?.length) {
      const restoreControls = manualContainer.createDiv({
        cls: "workspace-bookmark-capture-restore-controls",
      });
      const launchOnly = restoreControls.createEl("button", {
        text: "仅启动应用",
        cls: "workspace-bookmark-capture-link",
        attr: { type: "button", "aria-pressed": String(candidate.restoreMode === "launch-only") },
      });
      const addUrl = restoreControls.createEl("button", {
        text: "添加恢复 URL",
        cls: "workspace-bookmark-capture-link",
        attr: { type: "button", "aria-pressed": String(candidate.restoreMode === "open-content") },
      });
      const input = manualContainer.createEl("input", {
        cls: "workspace-bookmark-capture-url-input",
        attr: { type: "url", placeholder: "scheme://..." },
      });
      input.value = candidate.manualUrl;
      const updateRestoreMode = (mode: "launch-only" | "open-content") => {
        candidate.restoreMode = mode;
        launchOnly.toggleClass("is-active", mode === "launch-only");
        addUrl.toggleClass("is-active", mode === "open-content");
        launchOnly.setAttribute("aria-pressed", String(mode === "launch-only"));
        addUrl.setAttribute("aria-pressed", String(mode === "open-content"));
        input.toggleClass("is-visible", mode === "open-content");
        this.updateCaptureSummary();
      };
      launchOnly.addEventListener("click", () => updateRestoreMode("launch-only"));
      addUrl.addEventListener("click", () => updateRestoreMode("open-content"));
      input.addEventListener("input", () => {
        candidate.manualUrl = input.value.trim();
        this.updateCaptureSummary();
      });
      updateRestoreMode(candidate.restoreMode ?? "launch-only");
    }
    manualContainer.toggleClass("is-visible", candidate.selected);
  }

  private async refreshCandidates(): Promise<void> {
    if (this.refreshing || !this.options.onRefresh) return;
    this.refreshing = true;
    this.refreshButton?.setDisabled(true);
    this.refreshButton?.setIcon("loader-circle");
    try {
      const next = await this.options.onRefresh();
      const reconciled = reconcileCaptureSnapshot(this.candidates, next);
      this.candidates = reconciled.candidates;
      this.options.sourceNotices = reconciled.sourceNotices;
      this.options.scannedAt = reconciled.scannedAt;
      this.renderSourceNotices(reconciled.sourceNotices);
      this.renderCandidates();
      this.updateScannedAt(reconciled.scannedAt);
      this.updateCaptureSummary();
      const parts = [
        reconciled.stats.added > 0 ? `新增 ${reconciled.stats.added}` : "",
        reconciled.stats.removed > 0
          ? `移除 ${reconciled.stats.removed} 个当前不可见窗口`
          : "",
        `保留选择 ${reconciled.stats.preserved}`,
      ].filter(Boolean);
      new Notice(`Workspace Bookmark：${parts.join(" · ")}`);
    } catch (cause) {
      new Notice(`刷新失败，已保留当前选择：${messageFromUnknown(cause)}`, 8_000);
    } finally {
      this.refreshing = false;
      this.refreshButton?.setDisabled(false);
      this.refreshButton?.setIcon("refresh-cw");
    }
  }

  private renderSourceNotices(notices: CaptureSnapshot["sourceNotices"]): void {
    if (!this.sourceNoticesEl) return;
    this.sourceNoticesEl.empty();
    for (const notice of notices) {
      const row = this.sourceNoticesEl.createEl("button", {
        cls: `clickable-icon workspace-bookmark-capture-source-icon is-${notice.tone}`,
        attr: { type: "button", "aria-label": notice.message },
      });
      row.title = notice.message;
      setIcon(row, notice.tone === "warning" ? "wifi-off" : "circle-alert");
      row.addEventListener("click", () => void this.options.onDiagnostics?.());
    }
  }

  private updateScannedAt(value?: string): void {
    if (!this.refreshButton) return;
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    this.refreshButton.setTooltip(
      `刷新当前可见窗口（上次扫描 ${date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}）`,
    );
  }

  private setAllCandidates(selected: boolean): void {
    for (const candidate of this.candidates) {
      const canSelect = !(!candidate.browser && Boolean(candidate.browserAlternatives?.length))
        && (candidate.duplicateTargetIds?.length ?? 0) <= 1;
      candidate.selected = selected && canSelect;
      candidate.action = candidate.selected
        ? candidate.targetId
          ? "update"
          : "add"
        : "ignore";
    }
    this.renderCandidates();
    this.updateCaptureSummary();
  }

  private revealCaptureIssue(candidate: CaptureCandidate, message: string): void {
    const row = this.candidateRows.get(candidate);
    row?.addClass("is-error");
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => row?.removeClass("is-error"), 2_500);
    new Notice(message);
  }

  private updateCaptureSummary(): void {
    if (!this.summaryEl) return;
    const selected = this.candidates.filter(
      (candidate) => candidate.selected && candidate.action !== "ignore",
    );
    const selectedTabs = selected.reduce(
      (total, candidate) => total + candidate.selectedTabs.size,
      0,
    );
    const launchOnly = selected.filter((candidate) => candidate.restoreMode === "launch-only").length;
    this.summaryEl.setText(`已选 ${selected.length} · ${selectedTabs} 个页面${launchOnly ? ` · ${launchOnly} 个仅启动` : ""}`);
  }
}

function supportsBrowserOpenMode(candidate: CaptureCandidate): boolean {
  return candidate.selected
    && candidate.restoreMode === "open-content"
    && Boolean(candidate.browser?.tabs.some((tab) => isRestorableBrowserUrl(tab.url)));
}

export class CaptureDiffModal extends Modal {
  constructor(
    app: App,
    private readonly diffs: CaptureDiff[],
    private readonly onConfirm: () => void | Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    prepareModal(this, "standard");
    this.titleEl.setText("确认收录变更");
    createModalIntro(
      this.contentEl,
      "写入前最后确认",
      "只会新增或更新下列 Window；未列出的 Window 与普通正文不会删除。",
      "file-diff",
    );
    const list = this.contentEl.createDiv({ cls: "workspace-bookmark-diff-list" });
    for (const diff of this.diffs) {
      const row = list.createDiv({ cls: "workspace-bookmark-diff-row" });
      const heading = row.createDiv({ cls: "workspace-bookmark-diff-heading" });
      heading.createSpan({
        text: diff.action === "add" ? "新增" : "更新",
        cls: `workspace-bookmark-chip ${diff.action === "add" ? "is-success" : "is-accent"}`,
      });
      heading.createEl("h3", { text: diff.windowName });
      const changes = row.createEl("ul");
      for (const change of diff.changes) changes.createEl("li", { text: change });
    }
    const actions = new Setting(createModalFooter(this.contentEl));
    actions.addButton((button) =>
      button.setButtonText("取消").onClick(() => this.close()),
    );
    actions.addButton((button) =>
      button
        .setButtonText("确认写入")
        .setCta()
        .onClick(async () => {
          await this.onConfirm();
          this.close();
        }),
    );
  }
}

export class MigrationPreviewModal extends Modal {
  private settled = false;
  constructor(
    app: App,
    private readonly headingChanges: Array<{ from: string; to: string }>,
    private readonly onDecision: (confirmed: boolean) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    prepareModal(this, "standard");
    this.titleEl.setText("升级 Workspace Markdown");
    createModalIntro(
      this.contentEl,
      "需要先迁移到 V4",
      "Capture 只会向 V4 文档写入。迁移会保留 APP 标题、可编辑设置、折叠只读信息、普通正文与自定义 frontmatter。",
      "file-up",
      "warning",
    );
    const list = this.contentEl.createDiv({ cls: "workspace-bookmark-diff-list" });
    for (const change of this.headingChanges) {
      const row = list.createDiv({ cls: "workspace-bookmark-diff-row" });
      row.createEl("strong", { text: change.from });
      row.createEl("p", { text: `→ ${change.to}` });
    }
    const footer = createModalFooter(this.contentEl, "sticky");
    new Setting(footer)
      .addButton((button) =>
        button.setButtonText("取消").onClick(() => {
          this.settled = true;
          this.onDecision(false);
          this.close();
        }),
      )
      .addButton((button) =>
        button.setButtonText("确认迁移").setCta().onClick(() => {
          this.settled = true;
          this.onDecision(true);
          this.close();
        }),
      );
  }

  onClose(): void {
    if (!this.settled) this.onDecision(false);
  }
}

export class DuplicateRepairModal extends Modal {
  constructor(
    app: App,
    private readonly groups: DuplicateRecipeGroup[],
    private readonly onDecision: (removeIds: string[]) => void | Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    prepareModal(this, "standard");
    this.titleEl.setText("检查重复 Window");
    const duplicateCount = this.groups.reduce(
      (total, group) => total + group.duplicates.length,
      0,
    );
    createModalIntro(
      this.contentEl,
      `发现 ${duplicateCount} 个重复项`,
      "仅处理打开方式为“聚焦已有页面”、内容和布局完全相同的 Window。第一份会保留。",
      "copy-x",
      "warning",
    );
    const list = this.contentEl.createDiv({ cls: "workspace-bookmark-diff-list" });
    for (const group of this.groups) {
      const row = list.createDiv({ cls: "workspace-bookmark-diff-row" });
      row.createEl("strong", { text: `保留：${group.keep.appName} · ${group.keep.name}` });
      row.createEl("p", {
        text: `移除：${group.duplicates.map((item) => item.name).join("、")}`,
      });
      row.createEl("small", {
        text: `${group.keep.contents.length} 个页面 · ${group.keep.monitor} · ${group.keep.layout}`,
      });
    }
    const footer = createModalFooter(this.contentEl);
    new Setting(footer)
      .addButton((button) =>
        button.setButtonText("取消").onClick(() => {
          this.close();
        }),
      )
      .addButton((button) =>
        button.setButtonText(`移除 ${duplicateCount} 个重复项`).setCta().onClick(async () => {
          await this.onDecision(
            this.groups.flatMap((group) => group.duplicates.map((item) => item.id)),
          );
          this.close();
        }),
      );
  }
}

export class WindowEditorModal extends Modal {
  private draft: WindowRecipe;
  private contentsContainer!: HTMLElement;
  private errorEl!: HTMLElement;
  private previewWindowEl: HTMLElement | null = null;
  private previewIconEl: HTMLElement | null = null;
  private previewNameEl: HTMLElement | null = null;
  private saveButton: ButtonComponent | null = null;

  constructor(
    app: App,
    recipe: WindowRecipe,
    private readonly onSave: (recipe: WindowRecipe) => void | Promise<void>,
  ) {
    super(app);
    this.draft = structuredClone(recipe);
  }

  onOpen(): void {
    prepareModal(this, "wide");
    this.titleEl.setText(`编辑 · ${this.draft.name}`);
    createModalIntro(
      this.contentEl,
      `${this.draft.appName} 窗口`,
      "只显示日常需要的设置；匹配字段和原始语法位于高级设置。",
      appIconFor([this.draft.appName, this.draft.adapter]),
    );
    this.errorEl = this.contentEl.createDiv({ cls: "workspace-bookmark-inline-error" });
    const form = this.contentEl.createDiv({ cls: "workspace-bookmark-editor-form" });
    const general = createFormSection(
      form,
      "基本信息",
      "名称与打开方式",
      "sliders-horizontal",
    );
    this.addTextSetting(
      general,
      "名称",
      "显示在 Workspace 中的名称。",
      this.draft.name,
      (value) => (this.draft.name = value),
    );
    let updateContentsVisibility: (() => void) | null = null;
    new Setting(general)
      .setName("恢复方式")
      .setDesc("仅启动应用时不需要 URL 或标签页。")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("open-content", "恢复页面或文档")
          .addOption("launch-only", "仅启动应用")
          .setValue(this.draft.restoreMode ?? "open-content")
          .onChange((value) => {
            this.draft.restoreMode = value as "open-content" | "launch-only";
            if (this.draft.restoreMode === "launch-only") {
              this.draft.contents = [];
            } else if (this.draft.contents.length === 0) {
              this.draft.contents = [{
                order: 1,
                title: "",
                url: "https://",
                active: true,
                pinned: false,
              }];
            }
            updateContentsVisibility?.();
            this.renderContents();
            this.updateError();
          });
      });
    let modeDropdown: import("obsidian").DropdownComponent | null = null;
    new Setting(general)
      .setName("打开方式")
      .setDesc("优先聚焦、复用或创建窗口。")
      .addDropdown((dropdown) => {
        modeDropdown = dropdown;
        configureModeDropdown(dropdown, this.draft);
        dropdown.onChange((value) => {
          this.draft.openMode = value as OpenMode;
          this.updateError();
        });
      });
    if (this.draft.adapter === "browser") {
      new Setting(general)
        .setName("目标浏览器")
        .setDesc("Workspace 会严格使用这里指定的浏览器，不会跨浏览器替代。")
        .addDropdown((dropdown) =>
          dropdown
            .addOption("chrome", "Google Chrome")
            .addOption("tabbit", "Tabbit")
            .setValue(this.draft.browserId ?? "chrome")
            .onChange((value) => {
              this.applyBrowserIdentity(value as BrowserId);
              this.updateError();
            }),
        );
    }

    const placement = createFormSection(
      form,
      "窗口位置",
      "使用屏幕比例，不依赖分辨率",
      "panel-top",
    );
    this.addDropdown<MonitorRole>(
      placement,
      "目标屏幕",
      this.draft.monitor,
      {
        current: "当前屏幕",
        main: "系统主屏幕",
        "built-in": "Mac 内置屏幕",
        "external-primary": "主要外接屏",
      },
      (value) => {
        this.draft.monitor = value;
        this.updateLayoutPreview();
      },
    );
    this.addLayoutSettings(placement);

    const preview = placement.createDiv({ cls: "workspace-bookmark-layout-preview" });
    const previewHeading = preview.createDiv({ cls: "workspace-bookmark-preview-heading" });
    previewHeading.createEl("span", { text: "布局预览" });
    previewHeading.createEl("small", { text: monitorLabel(this.draft.monitor) });
    const screen = preview.createDiv({ cls: "workspace-bookmark-preview-screen" });
    this.previewWindowEl = screen.createDiv({ cls: "workspace-bookmark-preview-window" });
    const previewLabel = this.previewWindowEl.createDiv();
    this.previewIconEl = previewLabel.createSpan();
    setIcon(this.previewIconEl, appIconFor([this.draft.appName, this.draft.adapter]));
    this.previewNameEl = previewLabel.createSpan({ text: this.draft.name || "Window" });
    this.updateLayoutPreview();

    const contentsSection = createFormSection(
      form,
      "窗口内容",
      "点击页面可编辑标题和完整 URL",
      "list-ordered",
      "workspace-bookmark-contents-section",
    );
    new Setting(contentsSection)
      .setName(`${this.draft.contents.length} 个页面`)
      .setDesc("当前页面和固定状态显示在列表右侧。")
      .addButton((button) =>
        button.setButtonText("新增").setIcon("plus").onClick(() => {
          this.draft.contents.push({
            order: this.draft.contents.length + 1,
            title: "",
            url: "https://",
            active: this.draft.contents.length === 0,
            pinned: false,
          });
          this.renderContents();
          this.updateError();
        }),
      );
    this.contentsContainer = contentsSection.createDiv({
      cls: "workspace-bookmark-contents-list",
    });
    updateContentsVisibility = () => {
      contentsSection.toggleClass("is-hidden", this.draft.restoreMode === "launch-only");
    };
    updateContentsVisibility();
    this.renderContents();

    const advanced = form.createEl("details", {
      cls: "workspace-bookmark-advanced-settings",
    });
    advanced.createEl("summary", { text: "高级设置" });
    const advancedBody = advanced.createDiv({
      cls: "workspace-bookmark-advanced-settings-body",
    });
    const renderAdvanced = () => {
      advancedBody.empty();
      new Setting(advancedBody)
        .setName("适配器")
        .setDesc("决定使用哪种恢复方式。")
        .addDropdown((dropdown) => {
          dropdown
            .addOption("browser", "浏览器")
            .addOption("obsidian", "Obsidian")
            .addOption("manual", "其他 App / 手动 URL")
            .setValue(this.draft.adapter)
            .onChange((value) => {
              this.draft.adapter = value as WindowAdapter;
              if (this.draft.adapter === "browser" && !this.draft.browserId) {
                this.draft.browserId = "chrome";
              } else if (this.draft.adapter !== "browser") {
                delete this.draft.browserId;
              }
              if (!modesForAdapter(this.draft.adapter).includes(this.draft.openMode)) {
                this.draft.openMode = modesForAdapter(this.draft.adapter)[0]!;
              }
              if (modeDropdown) configureModeDropdown(modeDropdown, this.draft);
              renderAdvanced();
              this.updateError();
            });
        });
      this.addTextSetting(
        advancedBody,
        "应用名称",
        "用于 Markdown 标题。",
        this.draft.appName,
        (value) => (this.draft.appName = value),
      );
      this.addTextSetting(
        advancedBody,
        "Bundle ID",
        "用于匹配系统 App。",
        this.draft.bundleId,
        (value) => (this.draft.bundleId = value),
      );
      this.addTextSetting(
        advancedBody,
        "标题匹配",
        "同一 App 存在多个窗口时使用。",
        this.draft.titleHint,
        (value) => (this.draft.titleHint = value),
      );
      new Setting(advancedBody)
        .setName("Space")
        .setDesc("当前版本只操作当前可见 Space。")
        .addDropdown((dropdown) =>
          dropdown.addOption("current", "当前 Space").setValue("current").setDisabled(true),
        );
      new Setting(advancedBody)
        .setName("原始布局")
        .setDesc("支持 left 0.5、center 0.8 0.7 或 frame x y w h。")
        .addText((input) =>
          input.setValue(this.draft.layout).onChange((value) => {
            this.draft.layout = value.trim();
            this.updateError();
            this.updateLayoutPreview();
          }),
        );
      new Setting(advancedBody)
        .setName("Window ID")
        .setDesc(this.draft.id);
    };
    renderAdvanced();
    advanced.addEventListener("toggle", () => {
      if (advanced.open) renderAdvanced();
    });

    const footer = createModalFooter(this.contentEl, "sticky");
    footer.createEl("small", { text: "只重写当前 APP 区域。" });
    new Setting(footer)
      .addButton((button) => button.setButtonText("取消").onClick(() => this.close()))
      .addButton((button) => {
        this.saveButton = button;
        button
        .setButtonText("保存")
        .setIcon("save")
        .setCta()
        .onClick(async () => {
          const message = validateDraft(this.draft);
          this.errorEl.setText(message ?? "");
          if (message) return;
          this.draft.contents.forEach((item, index) => (item.order = index + 1));
          await this.onSave(this.draft);
          this.close();
        });
      });
    this.updateError();
  }

  private renderContents(): void {
    if (!this.contentsContainer) return;
    this.contentsContainer.empty();
    for (const [index, item] of this.draft.contents.entries()) {
      const details = this.contentsContainer.createEl("details", {
        cls: "workspace-bookmark-content-item",
      });
      if (!item.title || !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(item.url)) details.open = true;
      const summary = details.createEl("summary", {
        cls: "workspace-bookmark-content-summary",
      });
      summary.createSpan({
        text: String(index + 1),
        cls: "workspace-bookmark-content-order",
      });
      const copy = summary.createDiv({ cls: "workspace-bookmark-content-copy" });
      const titleLabel = copy.createEl("strong", { text: item.title || "未命名页面" });
      const urlLabel = copy.createEl("small", { text: compactUrl(item.url) });
      const states = summary.createDiv({ cls: "workspace-bookmark-content-states" });
      if (item.active) {
        const active = states.createSpan({ attr: { "aria-label": "当前页面" } });
        active.title = "当前页面";
        setIcon(active, "circle-dot");
      }
      if (item.pinned) {
        const pinned = states.createSpan({ attr: { "aria-label": "固定页面" } });
        pinned.title = "固定页面";
        setIcon(pinned, "pin");
      }
      const more = summary.createEl("button", {
        cls: "clickable-icon workspace-bookmark-icon-action",
        attr: { "aria-label": `编辑 ${item.title || "页面"} 的操作`, type: "button" },
      });
      more.title = "页面操作";
      setIcon(more, "more-horizontal");
      more.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const menu = new Menu();
        menu.addItem((entry) =>
          entry
            .setTitle("设为当前页面")
            .setIcon("circle-dot")
            .setDisabled(item.active)
            .onClick(() => {
              this.draft.contents.forEach(
                (candidate) => (candidate.active = candidate === item),
              );
              this.renderContents();
              this.updateError();
            }),
        );
        menu.addItem((entry) =>
          entry
            .setTitle(item.pinned ? "取消固定" : "固定页面")
            .setIcon("pin")
            .onClick(() => {
              item.pinned = !item.pinned;
              this.renderContents();
            }),
        );
        menu.addSeparator();
        menu.addItem((entry) =>
          entry
            .setTitle("上移")
            .setIcon("arrow-up")
            .setDisabled(index === 0)
            .onClick(() => this.moveContent(index, index - 1)),
        );
        menu.addItem((entry) =>
          entry
            .setTitle("下移")
            .setIcon("arrow-down")
            .setDisabled(index === this.draft.contents.length - 1)
            .onClick(() => this.moveContent(index, index + 1)),
        );
        menu.addSeparator();
        menu.addItem((entry) =>
          entry
            .setTitle("删除")
            .setIcon("trash-2")
            .onClick(() => {
              this.draft.contents.splice(index, 1);
              this.renderContents();
              this.updateError();
            }),
        );
        menu.showAtMouseEvent(event);
      });

      const editor = details.createDiv({ cls: "workspace-bookmark-content-editor" });
      new Setting(editor).setName("标题").addText((input) =>
        input.setValue(item.title).onChange((value) => {
          item.title = value;
          titleLabel.setText(value || "未命名页面");
        }),
      );
      new Setting(editor).setName("URL").addText((input) =>
        input.setValue(item.url).onChange((value) => {
          item.url = value.trim();
          urlLabel.setText(compactUrl(item.url));
          this.updateError();
        }),
      );
    }
  }

  private addTextSetting(
    container: HTMLElement,
    name: string,
    description: string,
    value: string,
    onChange: (value: string) => void,
  ): void {
    new Setting(container).setName(name).setDesc(description).addText((input) =>
      input.setValue(value).onChange((next) => {
        onChange(next.trim());
        this.updateError();
      }),
    );
  }

  private addDropdown<T extends string>(
    container: HTMLElement,
    name: string,
    value: T,
    options: Record<T, string>,
    onChange: (value: T) => void,
  ): void {
    new Setting(container).setName(name).addDropdown((dropdown) => {
      for (const key of Object.keys(options) as T[]) dropdown.addOption(key, options[key]);
      dropdown.setValue(value).onChange((next) => {
        onChange(next as T);
        this.updateError();
      });
    });
  }

  private addLayoutSettings(container: HTMLElement): void {
    const supported = [
      "left",
      "right",
      "top",
      "bottom",
      "center",
      "frame",
      "full",
      "keep",
    ] as const;
    const original = this.draft.layout.trim().split(/\s+/);
    let kind = supported.includes(original[0] as (typeof supported)[number])
      ? (original[0] as (typeof supported)[number])
      : "full";
    let values = original.slice(1).map(Number);
    const defaults: Record<(typeof supported)[number], number[]> = {
      left: [0.5],
      right: [0.5],
      top: [0.5],
      bottom: [0.5],
      center: [0.8, 0.8],
      frame: [0, 0, 0.8, 0.8],
      full: [],
      keep: [],
    };
    const count: Record<(typeof supported)[number], number> = {
      left: 1,
      right: 1,
      top: 1,
      bottom: 1,
      center: 2,
      frame: 4,
      full: 0,
      keep: 0,
    };
    const editor = container.createDiv({ cls: "workspace-bookmark-layout-editor" });
    const presets = editor.createDiv({ cls: "workspace-bookmark-layout-presets" });
    const valuesEl = editor.createDiv({ cls: "workspace-bookmark-layout-values" });
    const more = editor.createEl("details", {
      cls: "workspace-bookmark-layout-more",
    });
    more.createEl("summary", { text: "更多布局" });
    const moreButtons = more.createDiv({
      cls: "workspace-bookmark-layout-presets",
    });
    const buttons = new Map<string, HTMLButtonElement>();
    const updateDraft = () => {
      this.draft.layout = [kind, ...values.slice(0, count[kind])].join(" ");
      this.updateError();
      this.updateLayoutPreview();
    };
    const selectKind = (next: typeof kind) => {
      kind = next;
      values = [...defaults[kind]];
      if (["top", "bottom", "frame", "keep"].includes(kind)) more.open = true;
      renderValues();
    };
    const addPreset = (
      target: HTMLElement,
      value: typeof kind,
      label: string,
    ) => {
      const button = target.createEl("button", {
        text: label,
        cls: "workspace-bookmark-layout-preset",
        attr: { type: "button" },
      });
      button.addEventListener("click", () => selectKind(value));
      buttons.set(value, button);
    };
    addPreset(presets, "left", "左侧");
    addPreset(presets, "right", "右侧");
    addPreset(presets, "full", "全屏");
    addPreset(presets, "center", "居中");
    addPreset(moreButtons, "top", "顶部");
    addPreset(moreButtons, "bottom", "底部");
    addPreset(moreButtons, "keep", "保持");
    addPreset(moreButtons, "frame", "自定义");

    const renderValues = () => {
      valuesEl.empty();
      const desired = count[kind];
      if (values.length !== desired || values.some((value) => !Number.isFinite(value))) {
        values = [...defaults[kind]];
      }
      for (const [value, button] of buttons) {
        button.toggleClass("is-active", value === kind);
        button.setAttribute("aria-pressed", String(value === kind));
      }
      const labels =
        kind === "center"
          ? ["宽度", "高度"]
          : kind === "frame"
            ? ["X", "Y", "宽度", "高度"]
            : ["比例"];
      for (let index = 0; index < desired; index += 1) {
        const field = valuesEl.createDiv({
          cls: "workspace-bookmark-layout-value",
        });
        field.createEl("label", { text: labels[index] ?? `数值 ${index + 1}` });
        if (kind !== "frame") {
          const range = field.createEl("input", { type: "range" });
          range.min = "0.1";
          range.max = "1";
          range.step = "0.05";
          range.value = String(values[index] ?? defaults[kind][index] ?? 0.5);
          const number = field.createEl("input", { type: "number" });
          number.min = "0.1";
          number.max = "1";
          number.step = "0.05";
          number.value = range.value;
          const sync = (next: string) => {
            values[index] = Number(next);
            range.value = next;
            number.value = next;
            updateDraft();
          };
          range.addEventListener("input", () => sync(range.value));
          number.addEventListener("input", () => sync(number.value));
        } else {
          const number = field.createEl("input", { type: "number" });
          number.min = index < 2 ? "0" : "0.01";
          number.max = "1";
          number.step = "0.05";
          number.value = String(values[index] ?? defaults[kind][index] ?? 0.5);
          number.addEventListener("input", () => {
            values[index] = Number(number.value);
            updateDraft();
          });
        }
      }
      if (desired === 0) {
        valuesEl.createEl("small", {
          text: kind === "keep" ? "保留窗口当前位置。" : "填满屏幕可用区域。",
        });
      }
      updateDraft();
    };
    if (["top", "bottom", "frame", "keep"].includes(kind)) more.open = true;
    renderValues();
  }

  private moveContent(from: number, to: number): void {
    if (to < 0 || to >= this.draft.contents.length) return;
    const [item] = this.draft.contents.splice(from, 1);
    if (item) this.draft.contents.splice(to, 0, item);
    this.renderContents();
  }

  private updateError(): void {
    if (!this.errorEl) return;
    const error = validateDraft(this.draft);
    this.errorEl.setText(error ?? "");
    this.errorEl.toggleClass("is-visible", Boolean(error));
    this.saveButton?.setDisabled(Boolean(error));
    if (this.previewIconEl) {
      this.previewIconEl.empty();
      setIcon(this.previewIconEl, appIconFor([this.draft.appName, this.draft.adapter]));
    }
    this.previewNameEl?.setText(this.draft.name || "Window");
  }

  private updateLayoutPreview(): void {
    if (!this.previewWindowEl) return;
    const frame = layoutPreviewFrame(this.draft.layout);
    this.previewWindowEl.style.left = `${frame.x * 100}%`;
    this.previewWindowEl.style.top = `${frame.y * 100}%`;
    this.previewWindowEl.style.width = `${frame.width * 100}%`;
    this.previewWindowEl.style.height = `${frame.height * 100}%`;
    this.previewWindowEl.toggleClass("is-keep", this.draft.layout === "keep");
    const heading = this.previewWindowEl.closest(".workspace-bookmark-layout-preview")
      ?.querySelector(".workspace-bookmark-preview-heading small");
    if (heading) heading.textContent = monitorLabel(this.draft.monitor);
  }

  private applyBrowserIdentity(browserId: BrowserId): void {
    this.draft.browserId = browserId;
    if (browserId === "chrome") {
      this.draft.appName = "Google Chrome";
      this.draft.bundleId = "com.google.Chrome";
    } else {
      this.draft.appName = "Tabbit";
      this.draft.bundleId = "com.tabbit-ai.Tabbit";
    }
    this.updateError();
  }
}

function validateDraft(recipe: WindowRecipe): string | null {
  if (!recipe.name.trim()) return "Window 名称不能为空。";
  if (!recipe.bundleId.trim()) return "Bundle ID 不能为空。";
  if (!recipe.titleHint.trim()) return "Title hint 不能为空。";
  if (!recipe.appName.trim()) return "应用名称不能为空。";
  if (recipe.adapter === "browser" && !recipe.browserId) return "浏览器 Window 必须选择 Browser ID。";
  if (!modesForAdapter(recipe.adapter).includes(recipe.openMode)) {
    return `${recipe.adapter} 不支持 ${recipe.openMode}。`;
  }
  const layoutError = validateLayout(recipe.layout);
  if (layoutError) return layoutError;
  const restoreMode = recipe.restoreMode ?? "open-content";
  if (restoreMode === "launch-only") {
    return recipe.contents.length === 0 ? null : "仅启动应用时不能包含打开内容。";
  }
  if (recipe.contents.length === 0) return "Contents 至少需要一项。";
  if (recipe.contents.filter((item) => item.active).length > 1) return "最多只能有一项激活。";
  if (recipe.contents.some((item) => !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(item.url))) {
    return "每个 URL 都必须包含 Scheme。";
  }
  return null;
}

function modesForAdapter(adapter: WindowAdapter): OpenMode[] {
  const modes: Record<WindowAdapter, OpenMode[]> = {
    browser: ["new-window", "reuse-window", "focus-existing"],
    obsidian: ["reuse-window", "focus-existing", "app-default"],
    manual: ["app-default"],
  };
  return modes[adapter];
}

function configureModeDropdown(
  dropdown: import("obsidian").DropdownComponent,
  recipe: WindowRecipe,
): void {
  dropdown.selectEl.empty();
  const labels: Record<OpenMode, string> = {
    "new-window": "始终新建窗口",
    "reuse-window": "优先复用窗口",
    "focus-existing": "优先聚焦已有内容",
    "app-default": "交给 App 决定",
  };
  for (const mode of modesForAdapter(recipe.adapter)) dropdown.addOption(mode, labels[mode]);
  dropdown.setValue(recipe.openMode);
}

type ModalSize = "compact" | "standard" | "wide";
type AccentTone = "neutral" | "success" | "warning" | "danger";

function prepareModal(modal: Modal, size: ModalSize): void {
  modal.modalEl.addClass("workspace-bookmark-modal");
  modal.modalEl.addClass(`workspace-bookmark-modal-${size}`);
  modal.contentEl.addClass("workspace-bookmark-modal-content");
}

function createModalIntro(
  container: HTMLElement,
  eyebrow: string,
  description: string,
  iconName: string,
  tone: AccentTone = "neutral",
): HTMLElement {
  const intro = container.createDiv({
    cls: `workspace-bookmark-modal-intro is-${tone}`,
  });
  const icon = intro.createDiv({ cls: "workspace-bookmark-modal-intro-icon" });
  setIcon(icon, iconName);
  const copy = intro.createDiv({ cls: "workspace-bookmark-modal-intro-copy" });
  copy.createEl("strong", { text: eyebrow });
  copy.createEl("p", { text: description });
  return intro;
}

function createModalFooter(
  container: HTMLElement,
  _variant?: "sticky",
): HTMLElement {
  let body = container.querySelector<HTMLElement>(
    ":scope > .workspace-bookmark-modal-body",
  );
  if (!body) {
    body = document.createElement("div");
    body.className = "workspace-bookmark-modal-body";
    const existing = Array.from(container.children);
    container.appendChild(body);
    for (const child of existing) body.appendChild(child);
  }
  const footer = container.createDiv({ cls: "workspace-bookmark-modal-footer" });
  return footer;
}

function createEmptyState(
  container: HTMLElement,
  iconName: string,
  title: string,
  description: string,
): HTMLElement {
  const empty = container.createDiv({ cls: "workspace-bookmark-empty-state" });
  const icon = empty.createDiv();
  setIcon(icon, iconName);
  empty.createEl("strong", { text: title });
  empty.createEl("p", { text: description });
  return empty;
}

function messageFromUnknown(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

function createLibrarySection(
  container: HTMLElement,
  title: string,
  iconName: string,
): HTMLElement {
  const section = container.createDiv({ cls: "workspace-bookmark-library-section" });
  const heading = section.createDiv({ cls: "workspace-bookmark-section-heading" });
  const icon = heading.createSpan();
  setIcon(icon, iconName);
  heading.createEl("h3", { text: title });
  return section.createDiv({ cls: "workspace-bookmark-workspace-list" });
}

function createFormSection(
  container: HTMLElement,
  title: string,
  description: string,
  iconName: string,
  extraClass?: string,
): HTMLElement {
  const section = container.createDiv({
    cls: `workspace-bookmark-form-section${extraClass ? ` ${extraClass}` : ""}`,
  });
  const heading = section.createDiv({ cls: "workspace-bookmark-form-section-heading" });
  const icon = heading.createSpan();
  setIcon(icon, iconName);
  const copy = heading.createDiv();
  copy.createEl("h3", { text: title });
  copy.createEl("small", { text: description });
  return section;
}

function appIconFor(apps: readonly string[]): string {
  if (apps.some((app) => /chrome|tabbit|browser/i.test(app))) return "globe-2";
  if (apps.some((app) => /obsidian/i.test(app))) return "notebook-tabs";
  return "app-window";
}

function appLabel(app: string): string {
  const labels: Record<string, string> = {
    browser: "浏览器",
    chrome: "Google Chrome",
    tabbit: "Tabbit",
    obsidian: "Obsidian",
    manual: "其他 App",
  };
  return labels[app] ?? app;
}

function monitorLabel(monitor: string): string {
  const labels: Record<string, string> = {
    current: "当前屏幕",
    main: "系统主屏幕",
    "built-in": "Mac 内置屏幕",
    "external-primary": "主要外接屏",
  };
  return labels[monitor] ?? monitor;
}

function humanLayout(layout: string): string {
  const [kind = "full", ...values] = layout.split(/\s+/);
  const labels: Record<string, string> = {
    left: "左侧",
    right: "右侧",
    top: "上侧",
    bottom: "下侧",
    center: "居中",
    frame: "自定义",
    full: "填满",
    keep: "保持位置",
  };
  return [labels[kind] ?? kind, ...values].join(" ");
}

function compactUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.hostname.replace(/^www\./, "");
    }
    return `${url.protocol.replace(/:$/, "")}://`;
  } catch {
    const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):/.exec(value)?.[1];
    return scheme ? `${scheme}://` : value || "缺少 URL";
  }
}

function relativeTime(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "未知";
  const delta = Date.now() - timestamp;
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(timestamp).toLocaleDateString("zh-CN");
}

function layoutPreviewFrame(layout: string): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const [kind, ...tokens] = layout.trim().split(/\s+/);
  const values = tokens.map(Number);
  switch (kind) {
    case "left":
      return { x: 0, y: 0, width: values[0] ?? 0.5, height: 1 };
    case "right": {
      const width = values[0] ?? 0.5;
      return { x: 1 - width, y: 0, width, height: 1 };
    }
    case "top":
      return { x: 0, y: 0, width: 1, height: values[0] ?? 0.5 };
    case "bottom": {
      const height = values[0] ?? 0.5;
      return { x: 0, y: 1 - height, width: 1, height };
    }
    case "center": {
      const width = values[0] ?? 0.8;
      const height = values[1] ?? 0.8;
      return {
        x: (1 - width) / 2,
        y: (1 - height) / 2,
        width,
        height,
      };
    }
    case "frame":
      return {
        x: values[0] ?? 0,
        y: values[1] ?? 0,
        width: values[2] ?? 0.8,
        height: values[3] ?? 0.8,
      };
    case "keep":
      return { x: 0.15, y: 0.16, width: 0.7, height: 0.68 };
    default:
      return { x: 0, y: 0, width: 1, height: 1 };
  }
}
