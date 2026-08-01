import { describe, expect, it } from "vitest";
import type { WindowRecipe } from "../src/contracts";
import { partitionRestoreReadiness } from "../src/restore";

function browserRecipe(
  id: string,
  browserId: "chrome" | "tabbit",
): WindowRecipe {
  return {
    id,
    name: browserId,
    adapter: "browser",
    appName: browserId === "chrome" ? "Google Chrome" : "Tabbit",
    bundleId: browserId === "chrome" ? "com.google.Chrome" : "com.tabbit-ai.Tabbit",
    browserId,
    titleHint: browserId,
    openMode: "focus-existing",
    monitor: "main",
    space: "current",
    layout: "full",
    contents: [{
      order: 1,
      title: browserId,
      url: `https://${browserId}.example`,
      active: true,
      pinned: false,
    }],
  };
}

describe("restore readiness", () => {
  it("never substitutes an online Tabbit bridge for an offline Chrome recipe", () => {
    const chrome = browserRecipe("chrome", "chrome");
    const tabbit = browserRecipe("tabbit", "tabbit");
    const result = partitionRestoreReadiness(
      [chrome, tabbit],
      [
        { id: "chrome", ok: true, message: "Ready." },
        { id: "tabbit", ok: true, message: "Ready." },
      ],
      [
        { browserId: "chrome", connected: false },
        { browserId: "tabbit", connected: true },
      ],
    );
    expect(result.runnable).toEqual([tabbit]);
    expect(result.issues[0]?.message).toContain("指定使用 Google Chrome");
    expect(result.issues[0]?.message).toContain("Tabbit 在线也不会替代 Google Chrome");
  });

  it("skips an invalid native plan while retaining other ready recipes", () => {
    const chrome = browserRecipe("chrome", "chrome");
    const tabbit = browserRecipe("tabbit", "tabbit");
    const result = partitionRestoreReadiness(
      [chrome, tabbit],
      [
        { id: "chrome", ok: false, message: "Target display is unavailable." },
        { id: "tabbit", ok: true, message: "Ready." },
      ],
      [
        { browserId: "chrome", connected: true },
        { browserId: "tabbit", connected: true },
      ],
    );
    expect(result.runnable).toEqual([tabbit]);
    expect(result.issues[0]?.message).toBe("Target display is unavailable.");
  });

  it("allows a launch-only browser recipe when its bridge is offline", () => {
    const chrome = browserRecipe("chrome", "chrome");
    chrome.restoreMode = "launch-only";
    chrome.contents = [];
    const result = partitionRestoreReadiness(
      [chrome],
      [{ id: "chrome", ok: true, message: "Ready." }],
      [{ browserId: "chrome", connected: false }],
    );
    expect(result.runnable).toEqual([chrome]);
    expect(result.issues).toEqual([]);
  });
});
