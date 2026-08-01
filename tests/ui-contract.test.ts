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
  it("uses compact rows, direct capture choices, and collapsible browser tabs", () => {
    expect(modals).toContain('cls: "workspace-bookmark-window-row"');
    expect(modals).toContain('cls: "workspace-bookmark-capture-tabs"');
    expect(modals).toContain('text: "忽略"');
    expect(modals).toContain('const writeLabel = candidate.targetId ? "更新" : "新增"');
    expect(modals).toContain('text: "仅启动应用"');
    expect(modals).toContain('text: "添加恢复 URL"');
    expect(css).not.toContain(".workspace-bookmark-window-card");
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
