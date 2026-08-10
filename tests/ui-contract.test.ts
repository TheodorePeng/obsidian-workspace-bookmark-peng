import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../styles.css", import.meta.url)),
  "utf8",
);
const modals = readFileSync(
  fileURLToPath(new URL("../src/modals.ts", import.meta.url)),
  "utf8",
);
const main = readFileSync(
  fileURLToPath(new URL("../src/main.ts", import.meta.url)),
  "utf8",
);

describe("Obsidian modal shell", () => {
  it("uses a bounded shell with an independently scrollable body", () => {
    expect(css).toMatch(/\.workspace-bookmark-modal\s*\{[\s\S]*max-height:\s*88dvh/);
    expect(css).toMatch(
      /\.workspace-bookmark-modal-content\s*\{[\s\S]*overflow:\s*hidden/,
    );
    expect(css).toMatch(
      /\.workspace-bookmark-modal-body\s*\{[\s\S]*overflow-y:\s*auto/,
    );
    expect(css).toMatch(
      /\.workspace-bookmark-modal-body\s*\{[\s\S]*overscroll-behavior:\s*contain/,
    );
  });

  it("keeps the footer outside the scrolling body instead of overlaying content", () => {
    const footer =
      /\.workspace-bookmark-modal-footer\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? "";
    expect(footer).toContain("flex: 0 0 auto");
    expect(footer).not.toContain("position: sticky");
    expect(css).not.toContain("bottom: -24px");
    expect(modals).toContain('className = "workspace-bookmark-modal-body"');
  });
});

describe("Progressive disclosure contract", () => {
  it("exposes stable Workspace launch links from commands, views, and the library", () => {
    expect(main).toContain('id: "copy-current-workspace-launch-url"');
    expect(main).toContain('id: "copy-current-workspace-cold-start-command"');
    expect(main).toContain("this.launchableWorkspaceCommand(checking");
    expect(main).toContain('this.registerObsidianProtocolHandler("workspace-bookmark-open"');
    expect(main).toContain('this.registerObsidianProtocolHandler("workspace-bookmark-capture"');
    expect(main).toContain('this.registerObsidianProtocolHandler("workspace-bookmark-open-current"');
    expect(main).toContain('view.addAction("link-2", "Copy Workspace launch URL"');
    expect(modals).toContain('setTooltip("复制启动链接")');
    expect(modals).toContain("export class CopyableTextModal");
  });

  it("uses compact checkbox rows, browser-only icon modes, and collapsible browser tabs", () => {
    expect(modals).toContain('cls: "workspace-bookmark-window-row"');
    expect(modals).toContain('cls: "workspace-bookmark-capture-select"');
    expect(modals).toContain('cls: "workspace-bookmark-window-open-modes"');
    expect(modals).toContain('icon: "square-plus"');
    expect(modals).toContain('icon: "panels-top-left"');
    expect(modals).toContain('icon: "scan-search"');
    expect(modals).toContain('function supportsBrowserOpenMode');
    expect(modals).toContain('cls: "workspace-bookmark-capture-tabs"');
    expect(modals).not.toContain('cls: "workspace-bookmark-capture-choice"');
    expect(modals).not.toContain('const writeLabel = candidate.targetId ? "更新" : "新增"');
    expect(modals).toContain('text: "仅启动应用"');
    expect(modals).toContain('text: "添加恢复 URL"');
    expect(css).toContain(".workspace-bookmark-capture-select");
    expect(css).toContain(".workspace-bookmark-open-mode-icon");
    expect(css).not.toContain(".workspace-bookmark-capture-choice");
    expect(css).not.toContain(".workspace-bookmark-window-card");
    expect(main).toContain('openMode: browser ? "focus-existing" : undefined');
    expect(main).toContain("candidate.openMode = target.openMode");
  });

  it("offers explicit live refresh and actionable blocked restore states", () => {
    expect(modals).toContain('.setIcon("refresh-cw")');
    expect(modals).toContain('workspace-bookmark-capture-source-icon');
    expect(modals).toContain("reconcileCaptureSnapshot");
    expect(modals).toContain("export class RestoreBlockedModal");
    expect(modals).toContain('.setButtonText("重新检测")');
    expect(modals).toContain('.setButtonText("系统诊断")');
    expect(modals).toContain('.setButtonText("复制详情")');
    expect(modals).not.toContain("继续处理安全项目");
  });

  it("integrates Advanced URI capture and explicit Workspace reference repair", () => {
    expect(main).toContain('this.app.vault.on("rename"');
    expect(main).toContain('id: "repair-current-workspace-references"');
    expect(main).toContain("ensureFrontmatterUuid");
    expect(main).toContain("buildObsidianCaptureUri");
    expect(main).toContain('parsed.hostname === "adv-uri"');
    expect(modals).toContain("export class WorkspaceRepairPreviewModal");
    expect(modals).toContain("确认修复");
    expect(modals).toContain("路径型引用，重命名后可能需要修复");
  });

  it("moves machine-facing editor fields under advanced settings", () => {
    expect(modals).toContain('cls: "workspace-bookmark-advanced-settings"');
    expect(modals).toContain('advanced.createEl("summary", { text: "高级设置" })');
    expect(modals).toContain('cls: "workspace-bookmark-layout-presets"');
  });

  it("keeps long lists usable at narrow widths", () => {
    expect(css).toMatch(
      /\.workspace-bookmark-capture-toolbar\s*\{[\s\S]*position:\s*sticky[\s\S]*top:\s*0/,
    );
    expect(css).toMatch(/@media \(max-width:\s*560px\)/);
    expect(css).toMatch(
      /\.workspace-bookmark-window-title\s*\{[\s\S]*text-overflow:\s*ellipsis/,
    );
  });

  it("avoids the previous nested-card visual language", () => {
    expect(css).not.toContain("radial-gradient");
    expect(css).not.toContain(".workspace-bookmark-workspace-card");
    expect(css).not.toContain(".workspace-bookmark-layout-preview-card");
  });
});
