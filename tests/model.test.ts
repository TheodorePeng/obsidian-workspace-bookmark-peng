import { describe, expect, it } from "vitest";
import type { WindowRecipe } from "../src/contracts";
import {
  canAutoInitializeWorkspaceSource,
  createWorkspaceTemplate,
  formatWorkspaceMarkdown,
  initializeWorkspaceMarkdown,
  migrateWorkspaceMarkdownToLatest,
  parseWorkspaceMarkdown,
  removeWindowSections,
  renderWindowSection,
  replaceWindowSection,
  validateLayout,
} from "../src/model";

const recipe: WindowRecipe = {
  id: "win_01JZX8A9ABCDEFGHJKMNPQRSTV",
  name: "AI 研究浏览器",
  adapter: "browser",
  appName: "Google Chrome",
  bundleId: "com.google.Chrome",
  browserId: "chrome",
  titleHint: "ChatGPT",
  openMode: "focus-existing",
  monitor: "external-primary",
  space: "current",
  layout: "right 0.4",
  restoreMode: "open-content",
  contents: [
    {
      order: 1,
      title: "ChatGPT",
      url: "https://chatgpt.com/c/example",
      active: true,
      pinned: false,
    },
  ],
};

function validMarkdown(): string {
  return `${createWorkspaceTemplate("ws_01JZX8A9ABCDEFGHJKMNPQRSTV", "考研英语")}自定义正文必须保留。\n\n${renderWindowSection(recipe)}\n## 备注\n\n也必须保留。\n`;
}

describe("workspace markdown", () => {
  it("ignores files without type: workspace", () => {
    const parsed = parseWorkspaceMarkdown("# ordinary note");
    expect(parsed.managed).toBe(false);
    expect(parsed.workspace).toBeNull();
  });

  it("parses a canonical workspace", () => {
    const parsed = parseWorkspaceMarkdown(validMarkdown());
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.workspace?.windows[0]).toEqual(recipe);
    expect(parsed.workspace?.schemaVersion).toBe(4);
  });

  it("rejects numeric spaces in V4", () => {
    const parsed = parseWorkspaceMarkdown(validMarkdown().replace("| Space | 当前 |", "| Space | 2 |"));
    expect(parsed.diagnostics.some((item) => item.code === "SPACE_UNSUPPORTED")).toBe(true);
  });

  it("rejects unknown URL schemes until trusted", () => {
    const source = validMarkdown().replace("https://chatgpt.com/c/example", "notion://page/example");
    expect(parseWorkspaceMarkdown(source).diagnostics.some((item) => item.code === "UNTRUSTED_SCHEME")).toBe(true);
    expect(parseWorkspaceMarkdown(source, { trustedSchemes: ["notion"] }).diagnostics).toEqual([]);
  });

  it("formats only Window regions", () => {
    const source = validMarkdown()
      .replace("schema_version: 4", "schema_version: 4\ncustom_property: keep-me")
      .replace("| 布局 | right 0.4 |", "| 布局|right 0.4|")
      .replace("### 打开内容", "这里是用户备注，必须保留。\n\n### 打开内容");
    const parsed = parseWorkspaceMarkdown(source);
    const formatted = formatWorkspaceMarkdown(source, parsed);
    expect(formatted).toContain("custom_property: keep-me");
    expect(formatted).toContain("自定义正文必须保留。");
    expect(formatted).toContain("## 备注\n\n也必须保留。");
    expect(formatted).toContain("| 布局 | right 0.4 |");
    expect(formatted).toContain("这里是用户备注，必须保留。");
  });

  it("can append a new managed Window section", () => {
    const source = createWorkspaceTemplate("ws_01JZX8A9ABCDEFGHJKMNPQRSTV", "测试");
    expect(source).not.toContain("\n# 测试\n");
    expect(replaceWindowSection(source, null, recipe)).toContain("## Google Chrome · AI 研究浏览器");
  });

  it("renders V4 with editable settings, readonly details, and URL last", () => {
    const rendered = renderWindowSection(recipe);
    expect(rendered).toContain("## Google Chrome · AI 研究浏览器");
    expect(rendered).toContain("### 可编辑设置");
    expect(rendered).toContain("| 恢复方式 | 恢复页面或文档 |");
    expect(rendered).toContain("### 只读信息");
    expect(rendered.indexOf("| 打开方式 | 聚焦已有页面 |")).toBeLessThan(
      rendered.indexOf("| 应用 | Google Chrome |"),
    );
    expect(rendered).toContain("相同 URL 直接切换");
    expect(rendered).toContain("优先复用窗口（新开页面）");
    expect(rendered).toContain("| 顺序 | 页面标题 | 激活 | 固定 | URL |");
    expect(rendered).not.toContain("## Window ·");
  });

  it("parses legacy V1 without rewriting it", () => {
    const legacy = `---
type: workspace
workspace_id: ws_01JZX8A9ABCDEFGHJKMNPQRSTV
name: 旧工作区
schema_version: 1
---

## Window · 旧 Chrome

| 字段 | 值 |
|---|---|
| \`id\` | win_01JZX8A9ABCDEFGHJKMNPQRSTV |
| \`app\` | chrome |
| \`bundle_id\` | com.google.Chrome |
| \`title_hint\` | ChatGPT |
| \`open_mode\` | focus-existing |
| \`monitor\` | main |
| \`space\` | current |
| \`layout\` | right 0.4 |

### Contents

| 顺序 | 标题 | URL | 激活 | 固定 |
|---:|---|---|---|---|
| 1 | ChatGPT | \`https://chatgpt.com/\` | 是 | 否 |
`;
    const parsed = parseWorkspaceMarkdown(legacy);
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.workspace?.schemaVersion).toBe(1);
    expect(parsed.workspace?.windows[0]).toMatchObject({
      adapter: "browser",
      appName: "Google Chrome",
      browserId: "chrome",
    });
    expect(formatWorkspaceMarkdown(legacy, parsed)).toBe(legacy);
  });

  it("migrates V1 atomically to V4 while preserving prose and custom frontmatter", () => {
    const legacy = `---
type: workspace
workspace_id: ws_01JZX8A9ABCDEFGHJKMNPQRSTV
name: 旧工作区
schema_version: 1
custom_property: keep-me
---

# 旧工作区

## Window · 旧 Chrome

| 字段 | 值 |
|---|---|
| \`id\` | win_01JZX8A9ABCDEFGHJKMNPQRSTV |
| \`app\` | chrome |
| \`bundle_id\` | com.google.Chrome |
| \`title_hint\` | ChatGPT |
| \`open_mode\` | focus-existing |
| \`monitor\` | main |
| \`space\` | current |
| \`layout\` | right 0.4 |

这是用户备注。

### Contents

| 顺序 | 标题 | URL | 激活 | 固定 |
|---:|---|---|---|---|
| 1 | ChatGPT | \`https://chatgpt.com/\` | 是 | 否 |
`;
    const migrated = migrateWorkspaceMarkdownToLatest(legacy);
    expect(migrated.ok).toBe(true);
    expect(migrated.source).toContain("schema_version: 4");
    expect(migrated.source).toContain("custom_property: keep-me");
    expect(migrated.source).toContain("这是用户备注。");
    expect(migrated.source).toContain("## Google Chrome · 旧 Chrome");
    expect(migrated.source).toContain("### 可编辑设置");
    expect(migrated.source).toContain("### 只读信息");
  });

  it("round-trips escaped table pipes in titles, hints, and URLs", () => {
    const withPipe = structuredClone(recipe);
    withPipe.name = "A | B";
    withPipe.titleHint = "A | B";
    withPipe.contents[0]!.title = "A | B";
    withPipe.contents[0]!.url = "https://example.com/?value=A|B";
    const source = `${createWorkspaceTemplate("ws_01JZX8A9ABCDEFGHJKMNPQRSTV", "测试")}${renderWindowSection(withPipe)}`;
    const parsed = parseWorkspaceMarkdown(source);
    expect(parsed.diagnostics).toEqual([]);
    expect(source).toContain("## Google Chrome · A - B");
    expect(parsed.workspace?.windows[0]?.titleHint).toBe("A | B");
    expect(parsed.workspace?.windows[0]?.contents[0]?.title).toBe("A | B");
    expect(parsed.workspace?.windows[0]?.contents[0]?.url).toBe("https://example.com/?value=A|B");
  });

  it("accepts Obsidian-aligned one-dash separators without consuming readonly metadata", () => {
    const source = validMarkdown().replace(
      "|---:|---|:---:|:---:|---|",
      "| --: | ---------- | :-: | :-: | ------ |",
    );
    const parsed = parseWorkspaceMarkdown(source);
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.workspace?.windows[0]).toEqual(recipe);
  });

  it("reports a malformed contents table without cascading readonly-field errors", () => {
    const source = validMarkdown().replace(
      "|---:|---|:---:|:---:|---|",
      "| invalid | invalid | invalid | invalid | invalid |",
    );
    const parsed = parseWorkspaceMarkdown(source);
    expect(parsed.diagnostics).toEqual([
      expect.objectContaining({ code: "CONTENTS_TABLE_INVALID" }),
    ]);
    expect(parsed.diagnostics).not.toContainEqual(expect.objectContaining({
      code: "MISSING_FIELD",
    }));
  });

  it("selects managed tables by semantic headers rather than the first pipe table", () => {
    const source = validMarkdown().replace(
      "### 打开内容\n\n| 顺序 | 页面标题 | 激活 | 固定 | URL |",
      "### 打开内容\n\n| 备注 | 值 |\n|---|---|\n| 用户 | 正文 |\n\n| 顺序 | 页面标题 | 激活 | 固定 | URL |",
    );
    const parsed = parseWorkspaceMarkdown(source);
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.workspace?.windows[0]).toEqual(recipe);
  });

  it("repairs V2 tables broken by unescaped pipes", () => {
    const broken = `---
type: workspace
workspace_id: ws_01JZX8A9ABCDEFGHJKMNPQRSTV
name: Broken
schema_version: 2
tags: []
---

# Broken

## Tabbit · YouTube notes | All | Notion

### 窗口设置

| 属性 | 设置 |
|---|---|
| 应用 | Tabbit |
| 打开方式 | 聚焦已有页面 |
| 屏幕 | Mac 内置屏幕 |
| 布局 | full |
| Space | 当前 |
| 标题匹配 | YouTube notes | All | Notion |
| 适配器 | browser |
| Browser ID | tabbit |
| Bundle ID | \`com.tabbit-ai.Tabbit\` |
| ID | \`win_01JZX8A9ABCDEFGHJKMNPQRSTV\` |

### 打开内容

| 顺序 | 页面标题 | 激活 | 固定 | URL |
|---:|---|:---:|:---:|---|
| 1 | YouTube notes | All | Notion | 是 | 否 | \`https://example.com/?value=A|B\` |
`;
    const parsed = parseWorkspaceMarkdown(broken);
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.workspace?.windows[0]?.titleHint).toBe("YouTube notes | All | Notion");
    expect(parsed.workspace?.windows[0]?.contents[0]?.title).toBe("YouTube notes | All | Notion");
    const migrated = migrateWorkspaceMarkdownToLatest(broken);
    expect(migrated.source).toContain("## Tabbit · YouTube notes - All - Notion");
    expect(migrated.source).toContain("| 标题匹配 | YouTube notes \\| All \\| Notion |");
  });

  it("initializes blank or heading-only workspace notes", () => {
    expect(canAutoInitializeWorkspaceSource("")).toBe(true);
    expect(canAutoInitializeWorkspaceSource("# Draft")).toBe(true);
    expect(canAutoInitializeWorkspaceSource("# Draft\n\nBody")).toBe(false);
    const initialized = initializeWorkspaceMarkdown("# Draft", "ws_01JZX8A9ABCDEFGHJKMNPQRSTV", "Fallback");
    expect(initialized).toContain("schema_version: 4");
    expect(initialized).toContain("name: Draft");
    expect(initialized).not.toContain("\n# Draft\n");
    expect(parseWorkspaceMarkdown(initialized).diagnostics).toEqual([]);
  });

  it("handles CRLF files without corrupting section offsets", () => {
    const source = validMarkdown().replaceAll("\n", "\r\n");
    const parsed = parseWorkspaceMarkdown(source);
    const changed = structuredClone(recipe);
    changed.layout = "left 0.6";
    const updated = replaceWindowSection(source, parsed.sections[0]!, changed);
    expect(updated).toContain("| 布局 | left 0.6 |");
    expect(updated).toContain("## 备注\r\n\r\n也必须保留。");
    expect(updated.replaceAll("\r\n", "")).not.toContain("\n");
  });

  it("keeps CRLF while formatting managed regions", () => {
    const source = validMarkdown()
      .replace("| 布局 | right 0.4 |", "| 布局|right 0.4|")
      .replaceAll("\n", "\r\n");
    const formatted = formatWorkspaceMarkdown(
      source,
      parseWorkspaceMarkdown(source),
    );
    expect(formatted).toContain("| 布局 | right 0.4 |");
    expect(formatted.replaceAll("\r\n", "")).not.toContain("\n");
  });

  it("renders and parses a V4 launch-only Window with an empty contents table", () => {
    const launchOnly = structuredClone(recipe);
    launchOnly.id = "win_01JZX8A9ABCDEFGHJKMNPQRSTW";
    launchOnly.name = "音乐";
    launchOnly.adapter = "manual";
    launchOnly.appName = "Music";
    launchOnly.bundleId = "com.apple.Music";
    delete launchOnly.browserId;
    launchOnly.titleHint = "Music";
    launchOnly.openMode = "app-default";
    launchOnly.restoreMode = "launch-only";
    launchOnly.contents = [];
    const source = `${createWorkspaceTemplate("ws_01JZX8A9ABCDEFGHJKMNPQRSTV", "测试")}${renderWindowSection(launchOnly)}`;
    expect(source).toContain("### 打开内容");
    expect(source).toContain("| 顺序 | 页面标题 | 激活 | 固定 | URL |\n|---:|---|:---:|:---:|---|\n\n### 只读信息");
    const parsed = parseWorkspaceMarkdown(source);
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.workspace?.windows[0]).toEqual(launchOnly);
  });

  it("treats V1–V3 Windows without a restore mode as open-content", () => {
    const parsed = parseWorkspaceMarkdown(validMarkdown().replace("schema_version: 4", "schema_version: 3"));
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.workspace?.windows[0]?.restoreMode).toBe("open-content");
  });

  it("warns about exact focus-existing duplicates and removes only confirmed sections", () => {
    const duplicate = structuredClone(recipe);
    duplicate.id = "win_01JZX8A9ABCDEFGHJKMNPQRSTW";
    duplicate.name = "AI 研究浏览器副本";
    const source = [
      createWorkspaceTemplate("ws_01JZX8A9ABCDEFGHJKMNPQRSTV", "测试"),
      "用户正文必须保留。\n\n",
      renderWindowSection(recipe),
      renderWindowSection(duplicate),
      "## 备注\n\n继续保留。\n",
    ].join("");
    const parsed = parseWorkspaceMarkdown(source);
    expect(parsed.diagnostics).toContainEqual(expect.objectContaining({
      severity: "warning",
      code: "DUPLICATE_WINDOW_RECIPE",
      windowName: "AI 研究浏览器副本",
    }));
    const repaired = removeWindowSections(source, parsed, [duplicate.id]);
    expect(repaired).toContain("用户正文必须保留。");
    expect(repaired).toContain("## 备注\n\n继续保留。");
    expect(repaired).toContain(`| ID | \`${recipe.id}\` |`);
    expect(repaired).not.toContain(`| ID | \`${duplicate.id}\` |`);
  });
});

describe("layout grammar", () => {
  it.each(["left 0.5", "right 0.4", "top 0.5", "bottom 1", "center 0.8 0.7", "frame 0 0 0.8 0.8", "full", "keep"])(
    "accepts %s",
    (value) => expect(validateLayout(value)).toBeNull(),
  );

  it.each(["left 0", "right 1.1", "center 0.5", "frame 0.5 0.5 0.6 0.6", "unknown"])(
    "rejects %s",
    (value) => expect(validateLayout(value)).not.toBeNull(),
  );
});
