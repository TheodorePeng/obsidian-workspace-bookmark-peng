import { describe, expect, it } from "vitest";
import type {
  BrowserWindowSnapshot,
  NativeWindowSnapshot,
} from "../src/contracts";
import {
  browserMatchCandidates,
  browserOwnsNativeWindow,
  uniqueBrowserMatch,
} from "../src/capture";
import { candidateToRecipe } from "../src/capture-recipe";

const nativeWindow: NativeWindowSnapshot = {
  windowId: 1,
  pid: 10,
  appName: "Google Chrome",
  bundleId: "com.google.Chrome",
  title: "ChatGPT",
  monitor: "main",
  frame: { x: 10, y: 20, width: 800, height: 600 },
  normalizedFrame: { x: 0, y: 0, width: 0.5, height: 1 },
};

const browserWindow = (
  id: number,
  x: number,
  y: number,
): BrowserWindowSnapshot => ({
  browserId: "chrome",
  browserName: "Google Chrome",
  browserBundleId: "com.google.Chrome",
  id,
  focused: id === 1,
  incognito: false,
  frame: { x, y, width: 800, height: 600 },
  tabs: [],
});

describe("native/browser window matching", () => {
  it("matches one clear geometry candidate", () => {
    expect(
      uniqueBrowserMatch(nativeWindow, [
        browserWindow(1, 12, 18),
        browserWindow(2, 900, 20),
      ])?.id,
    ).toBe(1);
  });

  it("returns no match when candidates are ambiguous", () => {
    expect(
      uniqueBrowserMatch(nativeWindow, [
        browserWindow(1, 12, 20),
        browserWindow(2, 14, 20),
      ]),
    ).toBeUndefined();
    expect(
      browserMatchCandidates(nativeWindow, [
        browserWindow(1, 12, 20),
        browserWindow(2, 14, 20),
      ]),
    ).toHaveLength(2);
  });

  it("never matches Chrome and Tabbit across browser boundaries", () => {
    const tabbit = {
      ...browserWindow(3, 10, 20),
      browserId: "tabbit" as const,
      browserName: "Tabbit",
      browserBundleId: "com.tabbit-ai.Tabbit",
    };
    const appModeNative = {
      ...nativeWindow,
      appName: "Tabbit",
      bundleId: "com.tabbit-ai.Tabbit.app.example",
    };
    expect(browserOwnsNativeWindow(tabbit, appModeNative)).toBe(true);
    expect(browserOwnsNativeWindow(browserWindow(1, 10, 20), appModeNative)).toBe(false);
    expect(browserMatchCandidates(appModeNative, [browserWindow(1, 10, 20), tabbit])).toEqual([
      tabbit,
    ]);
  });
});

describe("capture recovery modes", () => {
  it("creates a launch-only recipe for an ordinary app without a URL", () => {
    const recipe = candidateToRecipe({
      native: {
        ...nativeWindow,
        appName: "Music",
        bundleId: "com.apple.Music",
        title: "Music",
      },
      selected: true,
      selectedTabs: new Set(),
      manualUrl: "",
      restoreMode: "launch-only",
      action: "add",
    });
    expect(recipe).toMatchObject({
      adapter: "manual",
      restoreMode: "launch-only",
      contents: [],
      bundleId: "com.apple.Music",
    });
  });
});
