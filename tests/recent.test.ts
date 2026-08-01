import { describe, expect, it } from "vitest";
import { updateRecentWorkspaces } from "../src/recent";

describe("recent workspace settings", () => {
  it("moves a successful workspace to the front without duplicate content", () => {
    const updated = updateRecentWorkspaces(
      [
        { workspaceId: "ws_old", lastOpenedAt: "2026-01-01T00:00:00.000Z" },
        { workspaceId: "ws_keep", lastOpenedAt: "2026-01-02T00:00:00.000Z" },
      ],
      "ws_old",
      "2026-07-29T00:00:00.000Z",
    );
    expect(updated).toEqual([
      { workspaceId: "ws_old", lastOpenedAt: "2026-07-29T00:00:00.000Z" },
      { workspaceId: "ws_keep", lastOpenedAt: "2026-01-02T00:00:00.000Z" },
    ]);
    expect(JSON.stringify(updated)).not.toContain("http");
    expect(JSON.stringify(updated)).not.toContain("contents");
  });

  it("caps retained history", () => {
    const current = Array.from({ length: 25 }, (_, index) => ({
      workspaceId: `ws_${index}`,
      lastOpenedAt: String(index),
    }));
    expect(updateRecentWorkspaces(current, "ws_new", "now")).toHaveLength(20);
  });
});
