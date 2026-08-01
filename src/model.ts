import type {
  BrowserId,
  MonitorRole,
  OpenMode,
  RestoreMode,
  WindowAdapter,
  WindowRecipe,
  WorkspaceContent,
  WorkspaceDocument,
} from "./contracts";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { findDuplicateFocusExistingGroups } from "./recipe-identity";

export interface Diagnostic {
  severity: "error" | "warning";
  code: string;
  message: string;
  line?: number;
  windowName?: string;
  field?: string;
}

export interface ParsedWorkspace {
  workspace: WorkspaceDocument | null;
  diagnostics: Diagnostic[];
  managed: boolean;
  sections: WindowSection[];
  frontmatter: Record<string, unknown> | null;
}

export interface WindowSection {
  start: number;
  end: number;
  headingLine: number;
  endLine: number;
  name: string;
  appName: string;
  schemaVersion: 1 | 2 | 3 | 4;
  recipe: WindowRecipe | null;
}

export interface ValidationOptions {
  trustedSchemes?: Iterable<string>;
}

export interface MigrationResult {
  ok: boolean;
  source: string;
  diagnostics: Diagnostic[];
  headingChanges: Array<{ from: string; to: string }>;
}

interface MarkdownTable {
  start: number;
  end: number;
  header: string[];
  rows: string[][];
}

const ADAPTERS = new Set<WindowAdapter>(["browser", "obsidian", "manual"]);
const BROWSERS = new Set<BrowserId>(["chrome", "tabbit"]);
const MODES = new Set<OpenMode>([
  "new-window",
  "reuse-window",
  "focus-existing",
  "app-default",
]);
const RESTORE_MODES = new Set<RestoreMode>(["open-content", "launch-only"]);
const MONITORS = new Set<MonitorRole>([
  "current",
  "main",
  "built-in",
  "external-primary",
]);
const ADAPTER_MODES: Record<WindowAdapter, Set<OpenMode>> = {
  browser: new Set(["new-window", "reuse-window", "focus-existing"]),
  obsidian: new Set(["reuse-window", "focus-existing", "app-default"]),
  manual: new Set(["app-default"]),
};
const DEFAULT_SCHEMES = new Set(["http", "https", "obsidian", "file"]);

const APP_BY_LEGACY = {
  chrome: {
    adapter: "browser",
    appName: "Google Chrome",
    browserId: "chrome",
    bundleId: "com.google.Chrome",
  },
  obsidian: {
    adapter: "obsidian",
    appName: "Obsidian",
    bundleId: "md.obsidian",
  },
  manual: {
    adapter: "manual",
    appName: "其他 App",
    bundleId: "",
  },
} as const;

const OPEN_MODE_LABELS: Record<OpenMode, string> = {
  "new-window": "始终新建窗口",
  "reuse-window": "优先复用窗口",
  "focus-existing": "聚焦已有页面",
  "app-default": "交给应用处理",
};
const OPEN_MODE_VALUES = reverseMap(OPEN_MODE_LABELS);
const RESTORE_MODE_LABELS: Record<RestoreMode, string> = {
  "open-content": "恢复页面或文档",
  "launch-only": "仅启动应用",
};
const RESTORE_MODE_VALUES = reverseMap(RESTORE_MODE_LABELS);
const MONITOR_LABELS: Record<MonitorRole, string> = {
  current: "当前屏幕",
  main: "主屏幕",
  "built-in": "Mac 内置屏幕",
  "external-primary": "主要外接屏幕",
};
const MONITOR_VALUES = reverseMap(MONITOR_LABELS);

export function parseWorkspaceMarkdown(
  source: string,
  options: ValidationOptions = {},
): ParsedWorkspace {
  const diagnostics: Diagnostic[] = [];
  const lines = normalize(source).split("\n");
  const frontmatterResult = parseFrontmatter(lines);
  diagnostics.push(...frontmatterResult.diagnostics);
  const frontmatter = frontmatterResult.value;
  const managed = frontmatter?.type === "workspace";
  const schemaNumber = Number(frontmatter?.schema_version);
  const sectionVersion: 1 | 2 | 3 | 4 = schemaNumber === 1
    ? 1
    : schemaNumber === 2
      ? 2
      : schemaNumber === 3
        ? 3
        : 4;
  const sections = findWindowSections(lines, sectionVersion);
  if (!managed) {
    return { workspace: null, diagnostics, managed: false, sections, frontmatter };
  }

  const id = stringValue(frontmatter.workspace_id);
  const name = stringValue(frontmatter.name);
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map(String)
    : frontmatter.tags == null
      ? []
      : [String(frontmatter.tags)];
  if (!/^ws_[0-9A-HJKMNP-TV-Z]{26}$/.test(id)) {
    diagnostics.push(error("WORKSPACE_ID", "workspace_id 必须是 ws_<ULID>。", 1, undefined, "workspace_id"));
  }
  if (!name.trim()) {
    diagnostics.push(error("WORKSPACE_NAME", "name 不能为空。", 1, undefined, "name"));
  }
  if (schemaNumber !== 1 && schemaNumber !== 2 && schemaNumber !== 3 && schemaNumber !== 4) {
    diagnostics.push(error("SCHEMA_VERSION", "schema_version 必须为 1、2、3 或 4。", 1, undefined, "schema_version"));
  }
  if (new Set(tags).size !== tags.length) {
    diagnostics.push(error("TAGS_DUPLICATE", "tags 不得重复。", 1, undefined, "tags"));
  }

  const parsedWindows: WindowRecipe[] = [];
  const seenWindowIds = new Set<string>();
  for (const section of sections) {
    const parsed = parseWindowSection(lines, section, options);
    section.recipe = parsed.recipe;
    diagnostics.push(...parsed.diagnostics);
    if (!parsed.recipe) continue;
    if (seenWindowIds.has(parsed.recipe.id)) {
      diagnostics.push(error(
        "DUPLICATE_WINDOW_ID",
        `Window ID 重复：${parsed.recipe.id}`,
        section.headingLine + 1,
        section.name,
        "id",
      ));
    }
    seenWindowIds.add(parsed.recipe.id);
    parsedWindows.push(parsed.recipe);
  }
  for (const group of findDuplicateFocusExistingGroups(parsedWindows)) {
    for (const duplicate of group.duplicates) {
      const section = sections.find((candidate) => candidate.recipe?.id === duplicate.id);
      diagnostics.push(warning(
        "DUPLICATE_WINDOW_RECIPE",
        `与“${group.keep.name}”的恢复内容和布局完全相同；运行时只会执行第一份。`,
        section ? section.headingLine + 1 : undefined,
        duplicate.name,
      ));
    }
  }

  return {
    workspace: {
      id,
      name,
      schemaVersion: sectionVersion,
      tags,
      windows: parsedWindows,
    },
    diagnostics,
    managed,
    sections,
    frontmatter,
  };
}

export function validateLayout(layout: string): string | null {
  const tokens = layout.trim().split(/\s+/);
  const kind = tokens[0];
  if (kind === "full" || kind === "keep") {
    return tokens.length === 1 ? null : `${kind} 不接受额外参数。`;
  }
  const expected: Record<string, number> = {
    left: 1,
    right: 1,
    top: 1,
    bottom: 1,
    center: 2,
    frame: 4,
  };
  const count = kind ? expected[kind] : undefined;
  if (count == null) return "layout 必须是 left/right/top/bottom/center/frame/full/keep。";
  if (tokens.length !== count + 1) return `${kind} 需要 ${count} 个比例参数。`;
  for (const [index, value] of tokens.slice(1).entries()) {
    const number = Number(value);
    const zeroAllowed = kind === "frame" && index < 2;
    if (!Number.isFinite(number) || (zeroAllowed ? number < 0 : number <= 0) || number > 1) {
      return zeroAllowed
        ? `偏移量 ${value} 必须在 0～1 范围内。`
        : `比例 ${value} 必须大于 0 且不超过 1。`;
    }
  }
  if (kind === "frame") {
    const [x, y, width, height] = tokens.slice(1).map(Number);
    if ((x ?? 0) + (width ?? 0) > 1 || (y ?? 0) + (height ?? 0) > 1) {
      return "frame 的 x + width 与 y + height 均不得超过 1。";
    }
  }
  return null;
}

export function formatWorkspaceMarkdown(source: string, parsed: ParsedWorkspace): string {
  if (
    !parsed.managed
    || !parsed.workspace
    || parsed.workspace.schemaVersion !== 4
    || parsed.diagnostics.some((item) => item.severity === "error")
  ) return source;
  return rewriteSections(source, parsed.sections, false);
}

export function replaceWindowSection(
  source: string,
  section: WindowSection | null,
  recipe: WindowRecipe,
): string {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const normalized = normalize(source);
  if (!section) {
    const separator = normalized.endsWith("\n\n") ? "" : normalized.endsWith("\n") ? "\n" : "\n\n";
    return restoreEol(`${normalized}${separator}${renderWindowSection(recipe)}`, eol);
  }
  const current = normalized.slice(section.start, section.end);
  const rendered = renderWindowSectionPreserving(current, recipe, section.schemaVersion);
  return restoreEol(
    normalized.slice(0, section.start) + rendered + normalized.slice(section.end),
    eol,
  );
}

export function removeWindowSections(
  source: string,
  parsed: ParsedWorkspace,
  windowIds: Iterable<string>,
): string {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const ids = new Set(windowIds);
  let result = normalize(source);
  const sections = parsed.sections
    .filter((section) => section.recipe && ids.has(section.recipe.id))
    .sort((left, right) => right.start - left.start);
  for (const section of sections) {
    result = result.slice(0, section.start) + result.slice(section.end);
  }
  return restoreEol(result.replace(/\n{3,}$/g, "\n\n"), eol);
}

export function renderWindowSection(recipe: WindowRecipe): string {
  const restoreMode = recipe.restoreMode ?? "open-content";
  const editableFields: Array<[string, string, string]> = [
    ["恢复方式", RESTORE_MODE_LABELS[restoreMode], "恢复页面或文档 / 仅启动应用"],
    ["打开方式", OPEN_MODE_LABELS[recipe.openMode], openModeHint(recipe.adapter)],
    ["屏幕", MONITOR_LABELS[recipe.monitor], "当前屏幕 / 主屏幕 / Mac 内置屏幕 / 主要外接屏幕"],
    ["布局", recipe.layout, "full / keep / left 0.5 / right 0.4 / center 0.8 0.7 / frame 0 0 1 1"],
    ["Space", recipe.space === "current" ? "当前" : recipe.space, "当前版本仅支持当前"],
    ["标题匹配", recipe.titleHint, "任意窗口标题片段，用于匹配窗口"],
  ];
  const readonlyFields: Array<[string, string]> = [
    ["应用", recipe.appName],
    ["适配器", recipe.adapter],
    ...(recipe.browserId ? [["Browser ID", recipe.browserId] as [string, string]] : []),
    ["Bundle ID", `\`${escapeCode(recipe.bundleId)}\``],
    ["ID", `\`${escapeCode(recipe.id)}\``],
  ];
  const contentRows = [...recipe.contents]
    .sort((left, right) => left.order - right.order)
    .map((item) =>
      `| ${item.order} | ${escapeCell(item.title)} | ${item.active ? "是" : "否"} | ${item.pinned ? "是" : "否"} | \`${escapeCode(item.url)}\` |`,
    )
    .join("\n");
  const contentSection = restoreMode === "open-content"
    ? [
      "",
      "### 打开内容",
      "",
      "| 顺序 | 页面标题 | 激活 | 固定 | URL |",
      "|---:|---|:---:|:---:|---|",
      contentRows,
    ]
    : [];
  return [
    `## ${safeHeading(recipe.appName)} · ${safeHeading(recipe.name)}`,
    "",
    "### 可编辑设置",
    "",
    "| 设置项 | 当前值 | 填写提示 |",
    "|---|---|---|",
    ...editableFields.map(([key, value, hint]) =>
      `| ${escapeCell(key)} | ${escapeCell(value)} | ${escapeCell(hint)} |`,
    ),
    ...contentSection,
    "",
    "### 只读信息",
    "",
    "<details>",
    "<summary>用于恢复和排错，通常不要修改</summary>",
    "",
    "| 项 | 值 |",
    "|---|---|",
    ...readonlyFields.map(([key, value]) => `| ${escapeCell(key)} | ${value} |`),
    "",
    "</details>",
    "",
  ].join("\n");
}

function openModeHint(adapter: WindowAdapter): string {
  if (adapter === "browser") {
    return "聚焦已有页面（相同 URL 直接切换）/ 优先复用窗口（新开页面）/ 始终新建窗口";
  }
  if (adapter === "obsidian") return "聚焦已有页面 / 优先复用窗口 / 交给应用处理";
  return "交给应用处理";
}

export function createWorkspaceTemplate(id: string, name: string): string {
  const frontmatter = stringifyYaml({
    type: "workspace",
    workspace_id: id,
    name,
    schema_version: 4,
    tags: [],
  }).trimEnd();
  return `---\n${frontmatter}\n---\n\n此文档由 Workspace Bookmark 管理。你可以通过插件 Capture 当前窗口，也可以手动编辑每个 APP 区域中的“可编辑设置”和“打开内容”。\n\n`;
}

export function canAutoInitializeWorkspaceSource(source: string): boolean {
  const trimmed = normalize(source).trim();
  return trimmed === "" || /^#\s+.+$/.test(trimmed);
}

export function initializeWorkspaceMarkdown(
  source: string,
  id: string,
  name: string,
): string {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const normalized = normalize(source);
  if (canAutoInitializeWorkspaceSource(normalized)) {
    return restoreEol(createWorkspaceTemplate(id, headingName(normalized) ?? name), eol);
  }

  const lines = normalized.split("\n");
  const frontmatterResult = parseFrontmatter(lines);
  let frontmatter: Record<string, unknown> = {};
  let body = normalized.trimStart();
  if (frontmatterResult.value) {
    frontmatter = { ...frontmatterResult.value };
    const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
    body = lines.slice(end + 1).join("\n").trimStart();
  }
  const initialized = {
    ...frontmatter,
    type: "workspace",
    workspace_id: id,
    name: stringValue(frontmatter.name) || headingName(body) || name,
    schema_version: 4,
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
  };
  const renderedFrontmatter = stringifyYaml(initialized).trimEnd();
  const bodyText = body.trim()
    ? body.trimEnd()
    : "此文档由 Workspace Bookmark 管理。你可以通过插件 Capture 当前窗口，也可以手动编辑每个 APP 区域中的“可编辑设置”和“打开内容”。";
  return restoreEol(`---\n${renderedFrontmatter}\n---\n\n${bodyText}\n`, eol);
}

export function migrateWorkspaceMarkdownToLatest(
  source: string,
  options: ValidationOptions = {},
): MigrationResult {
  const parsed = parseWorkspaceMarkdown(source, options);
  const errors = parsed.diagnostics.filter((item) => item.severity === "error");
  if (!parsed.managed || !parsed.workspace || errors.length > 0) {
    return { ok: false, source, diagnostics: parsed.diagnostics, headingChanges: [] };
  }
  if (parsed.workspace.schemaVersion === 4) {
    return { ok: true, source, diagnostics: [], headingChanges: [] };
  }
  const usedHeadings = new Set<string>();
  const migratedSections = parsed.sections.map((section) => {
    if (!section.recipe) return section;
    const recipe = structuredClone(section.recipe);
    recipe.name = uniqueHeadingName(recipe.appName, recipe.name, usedHeadings);
    usedHeadings.add(`${recipe.appName}\u0000${recipe.name}`);
    return { ...section, recipe };
  });
  const headingChanges = migratedSections.flatMap((section) => {
    if (!section.recipe) return [];
    return [{
      from: `Window · ${section.name}`,
      to: `${section.recipe.appName} · ${section.recipe.name}`,
    }];
  });
  let migrated = rewriteSections(source, migratedSections, true);
  migrated = migrated.replace(
    /(^---\r?\n[\s\S]*?^schema_version:\s*)(1|2|3)(\s*$[\s\S]*?^---\s*$)/m,
    (_match, prefix: string, _version: string, suffix: string) => `${prefix}4${suffix}`,
  );
  const verified = parseWorkspaceMarkdown(migrated, options);
  if (verified.diagnostics.some((item) => item.severity === "error")) {
    return { ok: false, source, diagnostics: verified.diagnostics, headingChanges: [] };
  }
  return { ok: true, source: migrated, diagnostics: [], headingChanges };
}

function uniqueHeadingName(
  appName: string,
  requestedName: string,
  used: Set<string>,
): string {
  if (!used.has(`${appName}\u0000${requestedName}`)) return requestedName;
  let suffix = 2;
  while (used.has(`${appName}\u0000${requestedName}（${suffix}）`)) suffix += 1;
  return `${requestedName}（${suffix}）`;
}

function rewriteSections(
  source: string,
  sections: WindowSection[],
  migrating: boolean,
): string {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  let result = normalize(source);
  for (const section of [...sections].reverse()) {
    if (!section.recipe) continue;
    const current = result.slice(section.start, section.end);
    const rendered = renderWindowSectionPreserving(
      current,
      section.recipe,
      migrating ? section.schemaVersion : 4,
    );
    result = result.slice(0, section.start) + rendered + result.slice(section.end);
  }
  return restoreEol(result, eol);
}

function renderWindowSectionPreserving(
  sectionSource: string,
  recipe: WindowRecipe,
  sourceVersion: 1 | 2 | 3 | 4,
): string {
  const lines = normalize(sectionSource).split("\n");
  const bounds = managedBounds(lines, sourceVersion);
  if (!bounds) return renderWindowSection(recipe);
  const prefix = lines.slice(1, bounds.settingsHeading).join("\n").trim();
  const nextManagedHeading = bounds.contentsHeading >= 0
    ? bounds.contentsHeading
    : bounds.readonlyHeading >= 0
      ? bounds.readonlyHeading
      : bounds.managedEnd;
  const between = lines.slice(bounds.settingsTable.end, nextManagedHeading).join("\n").trim();
  const tail = lines.slice(bounds.managedEnd).join("\n").trim();
  const rendered = renderWindowSection(recipe).trimEnd().split("\n");
  const settingsHeading = rendered.findIndex((line) => line === "### 可编辑设置");
  const contentsHeading = rendered.findIndex((line) => line === "### 打开内容");
  const readonlyHeading = rendered.findIndex((line) => line === "### 只读信息");
  const output = [...rendered];
  const firstManagedHeading = contentsHeading >= 0 ? contentsHeading : readonlyHeading;
  if (between && firstManagedHeading >= 0) output.splice(firstManagedHeading, 0, "", between, "");
  if (prefix) output.splice(settingsHeading, 0, "", prefix, "");
  if (tail) output.push("", tail);
  return `${output.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

function managedBounds(
  lines: string[],
  version: 1 | 2 | 3 | 4,
): {
  settingsHeading: number;
  settingsTable: MarkdownTable;
  contentsHeading: number;
  contentsTable: MarkdownTable | null;
  readonlyHeading: number;
  readonlyTable: MarkdownTable | null;
  managedEnd: number;
} | null {
  const contentsPattern = version === 1
    ? /^###\s+Contents\s*$/i
    : /^###\s+打开内容\s*$/;
  const settingsHeading = version === 1
    ? 1
    : findLine(
        lines,
        1,
        lines.length,
        version >= 3 ? /^###\s+可编辑设置\s*$/ : /^###\s+窗口设置\s*$/,
      );
  const contentsHeading = findLine(lines, 1, lines.length, contentsPattern);
  const settingsTable = findTable(lines, settingsHeading, contentsHeading < 0 ? lines.length : contentsHeading);
  const contentsTable = contentsHeading < 0
    ? null
    : findTable(lines, contentsHeading + 1, lines.length);
  if (!settingsTable || (version < 4 && (contentsHeading < 0 || !contentsTable))) return null;
  const readonlyStart = contentsTable?.end ?? settingsTable.end;
  const readonlyHeading = version >= 3
    ? findLine(lines, readonlyStart, lines.length, /^###\s+只读信息\s*$/)
    : -1;
  const readonlyTable = readonlyHeading < 0
    ? null
    : findTable(lines, readonlyHeading + 1, lines.length);
  const detailsEnd = readonlyHeading < 0
    ? -1
    : findLine(lines, readonlyHeading + 1, lines.length, /^<\/details>\s*$/);
  return {
    settingsHeading,
    settingsTable,
    contentsHeading,
    contentsTable,
    readonlyHeading,
    readonlyTable,
    managedEnd: detailsEnd >= 0 ? detailsEnd + 1 : readonlyTable?.end ?? contentsTable?.end ?? settingsTable.end,
  };
}

function parseWindowSection(
  lines: string[],
  section: WindowSection,
  options: ValidationOptions,
): { recipe: WindowRecipe | null; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const bounds = managedBounds(
    lines.slice(section.headingLine, section.endLine),
    section.schemaVersion,
  );
  if (!bounds) {
    return {
      recipe: null,
      diagnostics: [error(
        "WINDOW_TABLES",
        section.schemaVersion === 1
          ? "Window 缺少字段表或 Contents 表。"
          : "窗口缺少“窗口设置”或“打开内容”表格。",
        section.headingLine + 1,
        section.name,
      )],
    };
  }
  const fields = new Map<string, string>();
  for (const row of bounds.settingsTable.rows) {
    const key = stripCode(row[0] ?? "").trim();
    if (key && row.length >= 2) fields.set(key, settingValue(row, section.schemaVersion));
  }
  for (const row of bounds.readonlyTable?.rows ?? []) {
    const key = stripCode(row[0] ?? "").trim();
    if (key && row.length >= 2) fields.set(key, stripCode(row.slice(1).join(" | ")).trim());
  }

  const legacyApp = fields.get("app") as keyof typeof APP_BY_LEGACY | undefined;
  const legacyDefaults = legacyApp ? APP_BY_LEGACY[legacyApp] : undefined;
  const adapter = (
    section.schemaVersion === 1 ? legacyDefaults?.adapter : fields.get("适配器")
  ) as WindowAdapter;
  const browserId = (
    section.schemaVersion === 1
      ? legacyDefaults && "browserId" in legacyDefaults
        ? legacyDefaults.browserId
        : undefined
      : fields.get("Browser ID")
  ) as BrowserId | undefined;
  const appName = section.schemaVersion === 1
    ? legacyDefaults?.appName ?? section.appName
    : fields.get("应用") ?? section.appName;
  const bundleId = section.schemaVersion === 1
    ? fields.get("bundle_id") ?? legacyDefaults?.bundleId ?? ""
    : fields.get("Bundle ID") ?? "";
  const id = section.schemaVersion === 1 ? fields.get("id") ?? "" : fields.get("ID") ?? "";
  const titleHint = section.schemaVersion === 1
    ? fields.get("title_hint") ?? ""
    : fields.get("标题匹配") ?? "";
  const openModeRaw = section.schemaVersion === 1
    ? fields.get("open_mode") ?? ""
    : fields.get("打开方式") ?? "";
  const monitorRaw = section.schemaVersion === 1
    ? fields.get("monitor") ?? ""
    : fields.get("屏幕") ?? "";
  const spaceRaw = section.schemaVersion === 1
    ? fields.get("space") ?? ""
    : fields.get("Space") ?? "";
  const layout = section.schemaVersion === 1
    ? fields.get("layout") ?? ""
    : fields.get("布局") ?? "";
  const restoreModeRaw = section.schemaVersion === 4
    ? fields.get("恢复方式") ?? ""
    : "open-content";
  const openMode = (OPEN_MODE_VALUES[openModeRaw] ?? openModeRaw) as OpenMode;
  const restoreMode = (RESTORE_MODE_VALUES[restoreModeRaw] ?? restoreModeRaw) as RestoreMode;
  const monitor = (MONITOR_VALUES[monitorRaw] ?? monitorRaw) as MonitorRole;
  const space = spaceRaw === "当前" ? "current" : spaceRaw;

  const requiredValues: Array<[string, string | undefined]> = [
    ["ID", id],
    ["应用", appName],
    ["适配器", adapter],
    ["Bundle ID", bundleId],
    ["标题匹配", titleHint],
    ["打开方式", openMode],
    ["屏幕", monitor],
    ["Space", space],
    ["布局", layout],
    ...(section.schemaVersion === 4 ? [["恢复方式", restoreMode] as [string, string]] : []),
  ];
  for (const [field, value] of requiredValues) {
    if (!value) diagnostics.push(error("MISSING_FIELD", `缺少字段 ${field}。`, section.headingLine + 1, section.name, field));
  }
  if (!/^win_[0-9A-HJKMNP-TV-Z]{26}$/.test(id)) {
    diagnostics.push(error("WINDOW_ID", "ID 必须是 win_<ULID>。", section.headingLine + 1, section.name, "ID"));
  }
  if (!ADAPTERS.has(adapter)) {
    diagnostics.push(error("ADAPTER_ENUM", `不支持的适配器：${adapter || "（空）"}`, section.headingLine + 1, section.name, "适配器"));
  }
  if (adapter === "browser" && (!browserId || !BROWSERS.has(browserId))) {
    diagnostics.push(error("BROWSER_ID", `不支持的 Browser ID：${browserId || "（空）"}`, section.headingLine + 1, section.name, "Browser ID"));
  }
  if (!MODES.has(openMode)) {
    diagnostics.push(error("OPEN_MODE_ENUM", `不支持的打开方式：${openMode || "（空）"}`, section.headingLine + 1, section.name, "打开方式"));
  } else if (ADAPTERS.has(adapter) && !ADAPTER_MODES[adapter].has(openMode)) {
    diagnostics.push(error("OPEN_MODE_APP", `${adapter} 不支持 ${openMode}。`, section.headingLine + 1, section.name, "打开方式"));
  }
  if (!RESTORE_MODES.has(restoreMode)) {
    diagnostics.push(error("RESTORE_MODE_ENUM", `不支持的恢复方式：${restoreMode || "（空）"}`, section.headingLine + 1, section.name, "恢复方式"));
  }
  if (!MONITORS.has(monitor)) {
    diagnostics.push(error("MONITOR_ENUM", `不支持的屏幕：${monitor || "（空）"}`, section.headingLine + 1, section.name, "屏幕"));
  }
  if (space !== "current") {
    diagnostics.push(error(
      "SPACE_UNSUPPORTED",
      /^\d+$/.test(space) ? `Space ${space} 可解析，但当前版本只允许 current。` : "Space 必须为当前。",
      section.headingLine + 1,
      section.name,
      "Space",
    ));
  }
  const layoutError = validateLayout(layout);
  if (layoutError) diagnostics.push(error("LAYOUT_INVALID", layoutError, section.headingLine + 1, section.name, "布局"));

  const contents: WorkspaceContent[] = [];
  for (const row of bounds.contentsTable?.rows ?? []) {
    if (row.length < 5) continue;
    if (section.schemaVersion === 1) {
      const content = legacyContentValue(row);
      contents.push({
        order: content.order,
        title: content.title,
        url: content.url,
        active: content.active,
        pinned: content.pinned,
      });
    } else {
      const content = modernContentValue(row);
      contents.push({
        order: content.order,
        title: content.title,
        active: content.active,
        pinned: content.pinned,
        url: content.url,
      });
    }
  }
  validateContents(contents, restoreMode, diagnostics, section, options);
  if (diagnostics.some((item) => item.severity === "error")) return { recipe: null, diagnostics };
  return {
    recipe: {
      id,
      name: section.name,
      adapter,
      appName,
      bundleId,
      ...(browserId ? { browserId } : {}),
      titleHint,
      openMode,
      monitor,
      space,
      layout,
      restoreMode,
      contents,
    },
    diagnostics,
  };
}

function validateContents(
  contents: WorkspaceContent[],
  restoreMode: RestoreMode,
  diagnostics: Diagnostic[],
  section: WindowSection,
  options: ValidationOptions,
): void {
  if (restoreMode === "launch-only") {
    if (contents.length > 0) {
      diagnostics.push(error("LAUNCH_ONLY_CONTENTS", "仅启动应用时不能包含“打开内容”。", section.headingLine + 1, section.name, "恢复方式"));
    }
    return;
  }
  if (contents.length === 0) {
    diagnostics.push(error("CONTENTS_EMPTY", "打开内容至少需要一行。", section.headingLine + 1, section.name));
    return;
  }
  const seenOrders = new Set<number>();
  let activeCount = 0;
  const trusted = new Set([
    ...DEFAULT_SCHEMES,
    ...(options.trustedSchemes ?? []),
  ].map((item) => item.toLowerCase()));
  for (const content of contents) {
    if (!Number.isInteger(content.order) || content.order < 1) {
      diagnostics.push(error("CONTENT_ORDER", "顺序必须是大于 0 的整数。", section.headingLine + 1, section.name, "顺序"));
    } else if (seenOrders.has(content.order)) {
      diagnostics.push(error("CONTENT_ORDER_DUPLICATE", `顺序 ${content.order} 重复。`, section.headingLine + 1, section.name, "顺序"));
    }
    seenOrders.add(content.order);
    if (content.active) activeCount += 1;
    const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):/.exec(content.url)?.[1]?.toLowerCase();
    if (!scheme) {
      diagnostics.push(error("URL_SCHEME", `URL 缺少 Scheme：${content.url}`, section.headingLine + 1, section.name, "URL"));
    } else if (!trusted.has(scheme)) {
      diagnostics.push(error("UNTRUSTED_SCHEME", `URL Scheme “${scheme}”尚未加入可信列表。`, section.headingLine + 1, section.name, "URL"));
    }
  }
  if (activeCount > 1) {
    diagnostics.push(error("CONTENT_ACTIVE", "打开内容最多只能有一项激活。", section.headingLine + 1, section.name, "激活"));
  }
}

function parseFrontmatter(lines: string[]): {
  value: Record<string, unknown> | null;
  diagnostics: Diagnostic[];
} {
  if (lines[0]?.trim() !== "---") return { value: null, diagnostics: [] };
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end < 0) {
    return { value: null, diagnostics: [error("FRONTMATTER_UNCLOSED", "YAML frontmatter 缺少结束的 ---。", 1)] };
  }
  try {
    const value = parseYaml(lines.slice(1, end).join("\n"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { value: null, diagnostics: [error("FRONTMATTER_TYPE", "YAML frontmatter 必须是对象。", 1)] };
    }
    return { value: value as Record<string, unknown>, diagnostics: [] };
  } catch (cause) {
    return { value: null, diagnostics: [error("FRONTMATTER_PARSE", `无法解析 YAML frontmatter：${messageOf(cause)}`, 1)] };
  }
}

function findWindowSections(lines: string[], schemaVersion: 1 | 2 | 3 | 4): WindowSection[] {
  const sections: WindowSection[] = [];
  const offsets = lineOffsets(lines);
  for (let index = 0; index < lines.length; index += 1) {
    const legacy = /^##\s+Window\s*·\s*(.+?)\s*$/.exec(lines[index] ?? "");
    const modern = /^##\s+(.+?)\s*·\s*(.+?)\s*$/.exec(lines[index] ?? "");
    if (!legacy && !modern) continue;
    let endLine = lines.length;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (/^##\s+/.test(lines[cursor] ?? "")) {
        endLine = cursor;
        break;
      }
    }
    const version = legacy ? 1 : schemaVersion >= 3 ? schemaVersion : 2;
    if (
      version !== 1
      && findLine(lines, index + 1, endLine, /^###\s+(窗口设置|可编辑设置)\s*$/) < 0
    ) continue;
    sections.push({
      start: offsets[index] ?? 0,
      end: offsets[endLine] ?? lines.join("\n").length,
      headingLine: index,
      endLine,
      name: (legacy?.[1] ?? modern?.[2] ?? "").trim(),
      appName: (legacy ? "" : modern?.[1] ?? "").trim(),
      schemaVersion: version,
      recipe: null,
    });
  }
  if (schemaVersion >= 1 && schemaVersion <= 4) return sections;
  return sections;
}

function settingValue(row: string[], version: 1 | 2 | 3 | 4): string {
  if (version >= 3 && row.length > 3) {
    return stripCode(row.slice(1, -1).join(" | ")).trim();
  }
  if (version >= 3) return stripCode(row[1] ?? "").trim();
  return stripCode(row.slice(1).join(" | ")).trim();
}

function legacyContentValue(row: string[]): {
  order: number;
  title: string;
  url: string;
  active: boolean;
  pinned: boolean;
} {
  const urlIndex = row.findIndex((cell, index) =>
    index > 1
    && index < row.length - 2
    && /^[A-Za-z][A-Za-z0-9+.-]*:/.test(stripCode(cell).trim()),
  );
  if (urlIndex >= 0) {
    return {
      order: Number(stripCode(row[0] ?? "")),
      title: stripCode(row.slice(1, urlIndex).join(" | ")),
      url: stripCode(row.slice(urlIndex, -2).join("|")),
      active: parseBoolean(row[row.length - 2] ?? ""),
      pinned: parseBoolean(row[row.length - 1] ?? ""),
    };
  }
  return {
    order: Number(stripCode(row[0] ?? "")),
    title: stripCode(row.slice(1, -3).join(" | ")),
    url: stripCode(row[row.length - 3] ?? ""),
    active: parseBoolean(row[row.length - 2] ?? ""),
    pinned: parseBoolean(row[row.length - 1] ?? ""),
  };
}

function modernContentValue(row: string[]): {
  order: number;
  title: string;
  active: boolean;
  pinned: boolean;
  url: string;
} {
  for (let index = 2; index < row.length - 2; index += 1) {
    if (
      isBooleanCell(row[index] ?? "")
      && isBooleanCell(row[index + 1] ?? "")
      && /^[A-Za-z][A-Za-z0-9+.-]*:/.test(stripCode(row.slice(index + 2).join("|")).trim())
    ) {
      return {
        order: Number(stripCode(row[0] ?? "")),
        title: stripCode(row.slice(1, index).join(" | ")),
        active: parseBoolean(row[index] ?? ""),
        pinned: parseBoolean(row[index + 1] ?? ""),
        url: stripCode(row.slice(index + 2).join("|")),
      };
    }
  }
  return {
    order: Number(stripCode(row[0] ?? "")),
    title: stripCode(row.slice(1, -3).join(" | ")),
    active: parseBoolean(row[row.length - 3] ?? ""),
    pinned: parseBoolean(row[row.length - 2] ?? ""),
    url: stripCode(row[row.length - 1] ?? ""),
  };
}

function isBooleanCell(value: string): boolean {
  return ["是", "否", "true", "false", "yes", "no", "1", "0"].includes(
    stripCode(value).trim().toLowerCase(),
  );
}

function findTable(lines: string[], start: number, end: number): MarkdownTable | null {
  for (let index = Math.max(0, start); index + 1 < end; index += 1) {
    const header = splitTableRow(lines[index] ?? "");
    const separator = splitTableRow(lines[index + 1] ?? "");
    if (!header || !separator || !separator.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))) continue;
    const rows: string[][] = [];
    let cursor = index + 2;
    for (; cursor < end; cursor += 1) {
      const row = splitTableRow(lines[cursor] ?? "");
      if (!row) break;
      rows.push(row);
    }
    return { start: index, end: cursor, header, rows };
  }
  return null;
}

function splitTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  const cells: string[] = [];
  let current = "";
  let escaped = false;
  for (const character of trimmed.slice(1, -1)) {
    if (escaped) {
      current += character === "|" ? "|" : `\\${character}`;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (escaped) current += "\\";
  cells.push(current.trim());
  return cells;
}

function reverseMap<T extends string>(values: Record<T, string>): Record<string, T> {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [value, key])) as Record<string, T>;
}

function parseBoolean(value: string): boolean {
  return ["是", "true", "yes", "1"].includes(stripCode(value).trim().toLowerCase());
}

function stripCode(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith("`") && trimmed.endsWith("`")
    ? trimmed.slice(1, -1).replace(/\\`/g, "`")
    : trimmed;
}

function escapeCell(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function escapeCode(value: string): string {
  return escapeCell(value).replaceAll("`", "\\`");
}

function safeHeading(value: string): string {
  return value.replace(/[|\r\n]+/g, " - ").replace(/\s+/g, " ").trim();
}

function headingName(source: string): string | null {
  const match = /^#\s+(.+?)\s*$/m.exec(normalize(source).trim());
  return match?.[1]?.trim() || null;
}

function normalize(source: string): string {
  return source.replace(/\r\n/g, "\n");
}

function restoreEol(source: string, eol: string): string {
  return eol === "\r\n" ? source.replace(/\n/g, "\r\n") : source;
}

function lineOffsets(lines: string[]): number[] {
  const offsets: number[] = [];
  let offset = 0;
  for (const line of lines) {
    offsets.push(offset);
    offset += line.length + 1;
  }
  offsets.push(Math.max(0, offset - 1));
  return offsets;
}

function findLine(lines: string[], start: number, end: number, pattern: RegExp): number {
  for (let index = start; index < end; index += 1) {
    if (pattern.test(lines[index] ?? "")) return index;
  }
  return -1;
}

function stringValue(value: unknown): string {
  return value == null ? "" : String(value);
}

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

function error(
  code: string,
  message: string,
  line?: number,
  windowName?: string,
  field?: string,
): Diagnostic {
  return { severity: "error", code, message, line, windowName, field };
}

function warning(
  code: string,
  message: string,
  line?: number,
  windowName?: string,
  field?: string,
): Diagnostic {
  return { severity: "warning", code, message, line, windowName, field };
}
