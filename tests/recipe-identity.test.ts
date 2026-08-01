import { describe, expect, it } from "vitest";
import type { WindowRecipe } from "../src/contracts";
import {
  captureRecipeKey,
  deduplicateFocusExistingRecipes,
  findDuplicateFocusExistingGroups,
} from "../src/recipe-identity";

function recipe(id: string, openMode: WindowRecipe["openMode"] = "focus-existing"): WindowRecipe {
  return {
    id,
    name: id,
    adapter: "browser",
    appName: "Google Chrome",
    bundleId: "com.google.Chrome",
    browserId: "chrome",
    titleHint: "Example",
    openMode,
    monitor: "main",
    space: "current",
    layout: "full",
    contents: [
      {
        order: 1,
        title: "Example",
        url: "https://example.com",
        active: true,
        pinned: false,
      },
    ],
  };
}

describe("focus-existing duplicate safety", () => {
  it("keeps the first exact recipe and skips later copies at runtime", () => {
    const first = recipe("win_first");
    const second = recipe("win_second");
    const result = deduplicateFocusExistingRecipes([first, second]);
    expect(result.runnable).toEqual([first]);
    expect(result.duplicates).toEqual([{ recipe: second, kept: first }]);
    expect(findDuplicateFocusExistingGroups([first, second])[0]?.duplicates).toEqual([second]);
  });

  it("does not collapse new-window recipes", () => {
    const first = recipe("win_first", "new-window");
    const second = recipe("win_second", "new-window");
    expect(deduplicateFocusExistingRecipes([first, second]).runnable).toEqual([
      first,
      second,
    ]);
  });

  it("keeps browser identities separate", () => {
    const chrome = recipe("win_chrome");
    const tabbit = {
      ...recipe("win_tabbit"),
      appName: "Tabbit",
      bundleId: "com.tabbit-ai.Tabbit",
      browserId: "tabbit" as const,
    };
    expect(findDuplicateFocusExistingGroups([chrome, tabbit])).toEqual([]);
  });

  it("matches launch-only recipes by app, title, and placement instead of an empty URL list", () => {
    const music = recipe("win_music");
    music.adapter = "manual";
    music.appName = "Music";
    music.bundleId = "com.apple.Music";
    delete music.browserId;
    music.titleHint = "Music";
    music.openMode = "app-default";
    music.restoreMode = "launch-only";
    music.contents = [];
    const elsewhere = structuredClone(music);
    elsewhere.id = "win_music_other";
    elsewhere.layout = "right 0.4";
    expect(captureRecipeKey(music)).not.toBe(captureRecipeKey(elsewhere));
  });
});
