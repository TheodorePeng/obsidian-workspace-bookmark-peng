import { describe, expect, it } from "vitest";
import type { WindowRecipe } from "../src/contracts";
import { createWorkspaceTemplate, parseWorkspaceMarkdown, renderWindowSection } from "../src/model";
import {
  buildObsidianCaptureUri,
  ensureFrontmatterUuid,
  planWorkspaceReferenceRepair,
  rewriteObsidianUrisForRename,
} from "../src/workspace-repair";

const selfRecipe: WindowRecipe = {
  id: "win_01JZX8A9ABCDEFGHJKMNPQRSTV",
  name: "Untitled 2",
  adapter: "obsidian",
  appName: "Obsidian",
  bundleId: "md.obsidian",
  titleHint: "Untitled 2",
  openMode: "focus-existing",
  monitor: "main",
  space: "current",
  layout: "full",
  restoreMode: "open-content",
  contents: [{
    order: 1,
    title: "Untitled 2",
    url: "obsidian://open?vault=My%20Obsidian&file=Workspace%2FUntitled%202.md",
    active: true,
    pinned: false,
  }],
};

function sourceWithSelfReference(name = "Untitled 2"): string {
  return [
    createWorkspaceTemplate("ws_01JZX8A9ABCDEFGHJKMNPQRSTV", name),
    "用户备注必须保留。\n\n",
    renderWindowSection(selfRecipe),
  ].join("");
}

describe("Obsidian URI and Workspace repair", () => {
  it("builds a stable Advanced URI when a UUID is available", () => {
    expect(buildObsidianCaptureUri({
      vaultName: "My Obsidian",
      filePath: "Workspace/阅读理解 单词精读.md",
      uid: "c67cc757-39b1-4b51-9258-4d60ec22852e",
    })).toBe(
      "obsidian://adv-uri?vault=My%20Obsidian&uid=c67cc757-39b1-4b51-9258-4d60ec22852e",
    );
  });

  it("falls back to a path URI when no UUID is available", () => {
    expect(buildObsidianCaptureUri({
      vaultName: "My Obsidian",
      filePath: "Workspace/阅读理解 单词精读.md",
    })).toBe(
      "obsidian://open?vault=My%20Obsidian&file=Workspace%2F%E9%98%85%E8%AF%BB%E7%90%86%E8%A7%A3%20%E5%8D%95%E8%AF%8D%E7%B2%BE%E8%AF%BB.md",
    );
  });

  it("adds a missing Advanced URI UUID without overwriting frontmatter or body", () => {
    const source = `---\ntags:\n  - study\ncustom: keep\n---\n\nBody\n`;
    const result = ensureFrontmatterUuid(source, "id", () => "stable-uuid");
    expect(result.uid).toBe("stable-uuid");
    expect(result.changed).toBe(true);
    expect(result.source).toContain("id: stable-uuid");
    expect(result.source).toContain("custom: keep");
    expect(result.source).toContain("\nBody\n");
  });

  it("reuses an existing Advanced URI UUID without rewriting the note", () => {
    const source = `---\nid: existing-uuid\ncustom: keep\n---\n\nBody\n`;
    const result = ensureFrontmatterUuid(source, "id", () => "replacement");
    expect(result).toEqual({ source, uid: "existing-uuid", changed: false });
  });

  it("repairs an exact stale self-reference and conditionally syncs old filename labels", () => {
    const result = planWorkspaceReferenceRepair(sourceWithSelfReference(), {
      filePath: "Workspace/阅读理解 单词精读.md",
      vaultName: "My Obsidian",
      uid: "c67cc757-39b1-4b51-9258-4d60ec22852e",
    });
    expect(result.changed).toBe(true);
    expect(result.source).toContain("name: 阅读理解 单词精读");
    expect(result.source).toContain("## Obsidian · 阅读理解 单词精读");
    expect(result.source).toContain("| 标题匹配 | 阅读理解 单词精读 |");
    expect(result.source).toContain("| 1 | 阅读理解 单词精读 | 是 | 否 | `obsidian://adv-uri?vault=My%20Obsidian&uid=c67cc757-39b1-4b51-9258-4d60ec22852e` |");
    expect(result.source).toContain("用户备注必须保留。");
    expect(parseWorkspaceMarkdown(result.source).diagnostics).toEqual([]);
  });

  it("preserves a custom Workspace name while repairing an exact old path", () => {
    const result = planWorkspaceReferenceRepair(sourceWithSelfReference("英语精读"), {
      filePath: "Workspace/阅读理解 单词精读.md",
      vaultName: "My Obsidian",
    });
    expect(result.source).toContain("name: 英语精读");
    expect(result.source).toContain("## Obsidian · Untitled 2");
    expect(result.source).toContain("file=Workspace%2F%E9%98%85%E8%AF%BB%E7%90%86%E8%A7%A3%20%E5%8D%95%E8%AF%8D%E7%B2%BE%E8%AF%BB.md");
  });

  it("rewrites only exact renamed-note URI targets", () => {
    const source = sourceWithSelfReference().replace(
      "用户备注必须保留。",
      "不要修改文本中的 Workspace/Untitled 2.md。",
    );
    const result = rewriteObsidianUrisForRename(source, {
      vaultName: "My Obsidian",
      oldPath: "Workspace/Untitled 2.md",
      newPath: "Workspace/阅读理解 单词精读.md",
    });
    expect(result.changed).toBe(true);
    expect(result.source).toContain("不要修改文本中的 Workspace/Untitled 2.md。");
    expect(result.source).toContain("file=Workspace%2F%E9%98%85%E8%AF%BB%E7%90%86%E8%A7%A3%20%E5%8D%95%E8%AF%8D%E7%B2%BE%E8%AF%BB.md");
  });

  it("conditionally syncs a renamed Workspace identity when it still equals the old filename", () => {
    const source = sourceWithSelfReference().replace(
      "obsidian://open?vault=My%20Obsidian&file=Workspace%2FUntitled%202.md",
      "obsidian://adv-uri?vault=My%20Obsidian&uid=stable-uuid",
    );
    const result = rewriteObsidianUrisForRename(source, {
      vaultName: "My Obsidian",
      oldPath: "Workspace/Untitled 2.md",
      newPath: "Workspace/阅读理解 单词精读.md",
      syncWorkspaceIdentity: true,
    });
    expect(result.source).toContain("name: 阅读理解 单词精读");
    expect(result.source).toContain("## Obsidian · 阅读理解 单词精读");
    expect(result.source).toContain("| 标题匹配 | 阅读理解 单词精读 |");
    expect(result.source).toContain("uid=stable-uuid");
  });
});
