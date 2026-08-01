import { describe, expect, it } from "vitest";
import type { WindowRecipe } from "../src/contracts";
import {
  applyCaptureOperations,
  buildCaptureDiffs,
  suggestCaptureTarget,
  targetSectionsChanged,
} from "../src/merge";
import {
  createWorkspaceTemplate,
  parseWorkspaceMarkdown,
  renderWindowSection,
} from "../src/model";

const original: WindowRecipe = {
  id: "win_01JZX8A9ABCDEFGHJKMNPQRSTV",
  name: "Browser",
  adapter: "browser",
  appName: "Google Chrome",
  bundleId: "com.google.Chrome",
  browserId: "chrome",
  titleHint: "Example",
  openMode: "focus-existing",
  monitor: "main",
  space: "current",
  layout: "right 0.5",
  contents: [
    {
      order: 1,
      title: "Example",
      url: "https://example.com/?one",
      active: true,
      pinned: false,
    },
  ],
};

const second: WindowRecipe = {
  ...structuredClone(original),
  id: "win_01JZX8A9ABCDEFGHJKMNPQRSTW",
  name: "Second",
  titleHint: "Second",
  contents: [
    {
      order: 1,
      title: "Second",
      url: "https://example.org/?two",
      active: true,
      pinned: false,
    },
  ],
};

function source(): string {
  return [
    createWorkspaceTemplate("ws_01JZX8A9ABCDEFGHJKMNPQRSTV", "Test"),
    "User prose.\n\n",
    renderWindowSection(original),
    renderWindowSection(second),
  ].join("");
}

describe("capture merge", () => {
  it("suggests only one exact semantic match", () => {
    expect(suggestCaptureTarget(structuredClone(original), [original, second])?.id).toBe(original.id);
    expect(suggestCaptureTarget(structuredClone(original), [original, structuredClone(original)])).toBeNull();
    const sameActiveDifferentContents = structuredClone(original);
    sameActiveDifferentContents.contents.push({
      order: 2,
      title: "Extra",
      url: "https://example.net/extra",
      active: false,
      pinned: false,
    });
    expect(suggestCaptureTarget(sameActiveDifferentContents, [original])).toBeNull();
  });

  it("updates one Window, retains its ID, and never removes unselected Windows", () => {
    const markdown = source();
    const parsed = parseWorkspaceMarkdown(markdown);
    const captured = structuredClone(original);
    captured.id = "win_01JZX8A9ABCDEFGHJKMNPQRSTX";
    captured.layout = "left 0.6";
    captured.contents.push({
      order: 2,
      title: "Added",
      url: "https://example.net/?three",
      active: false,
      pinned: true,
    });
    const updated = applyCaptureOperations(markdown, parsed, [
      { action: "update", targetId: original.id, recipe: captured },
    ]);
    const reparsed = parseWorkspaceMarkdown(updated);
    expect(reparsed.workspace?.windows).toHaveLength(2);
    expect(reparsed.workspace?.windows[0]?.id).toBe(original.id);
    expect(reparsed.workspace?.windows[0]?.layout).toBe("left 0.6");
    expect(reparsed.workspace?.windows[1]?.id).toBe(second.id);
    expect(updated).toContain("User prose.");
  });

  it("suffixes duplicate APP headings when adding a second same-named window", () => {
    const markdown = source();
    const duplicate = structuredClone(original);
    duplicate.id = "win_01JZX8A9ABCDEFGHJKMNPQRSTX";
    const updated = applyCaptureOperations(
      markdown,
      parseWorkspaceMarkdown(markdown),
      [{ action: "add", recipe: duplicate }],
    );
    expect(updated).toContain("## Google Chrome · Browser（2）");
    expect(parseWorkspaceMarkdown(updated).diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        code: "DUPLICATE_WINDOW_RECIPE",
      }),
    );
  });

  it("describes URL, layout, and pinned changes before writing", () => {
    const captured = structuredClone(original);
    captured.layout = "left 0.6";
    captured.contents[0]!.pinned = true;
    captured.contents.push({
      order: 2,
      title: "Added",
      url: "https://example.net/?three",
      active: false,
      pinned: false,
    });
    const [diff] = buildCaptureDiffs(
      [{ action: "update", targetId: original.id, recipe: captured }],
      [original],
    );
    expect(diff?.changes.some((item) => item.startsWith("Layout："))).toBe(true);
    expect(diff?.changes.some((item) => item.startsWith("新增 URL："))).toBe(true);
    expect(diff?.changes).toContain("固定状态已变化");
  });

  it("detects target edits but permits unrelated prose edits", () => {
    const markdown = source();
    const originalParsed = parseWorkspaceMarkdown(markdown);
    const proseChanged = markdown.replace("User prose.", "New prose.");
    expect(
      targetSectionsChanged(
        markdown,
        originalParsed,
        proseChanged,
        parseWorkspaceMarkdown(proseChanged),
        [original.id],
      ),
    ).toBe(false);

    const targetChanged = markdown.replace("| 布局 | right 0.5 |", "| 布局 | left 0.5 |");
    expect(
      targetSectionsChanged(
        markdown,
        originalParsed,
        targetChanged,
        parseWorkspaceMarkdown(targetChanged),
        [original.id],
      ),
    ).toBe(true);
  });
});
