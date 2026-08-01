import { describe, expect, it } from "vitest";
import type {
  BrowserWindowSnapshot,
  NativeWindowSnapshot,
} from "../src/contracts";
import {
  captureSourceNotices,
  reconcileCaptureSnapshot,
  type CaptureCandidate,
} from "../src/capture";

function native(windowId: number, bundleId = "com.google.Chrome"): NativeWindowSnapshot {
  return {
    windowId,
    pid: 10,
    appName: "Google Chrome",
    bundleId,
    title: `Window ${windowId}`,
    monitor: "main",
    frame: { x: 0, y: 0, width: 800, height: 600 },
    normalizedFrame: { x: 0, y: 0, width: 1, height: 1 },
  };
}

function browser(
  id: number,
  tabs = [
    { id: 100, index: 0, title: "A", url: "https://a.example", active: true, pinned: false },
    { id: 101, index: 1, title: "B", url: "https://b.example", active: false, pinned: false },
  ],
): BrowserWindowSnapshot {
  return {
    browserId: "chrome",
    browserName: "Google Chrome",
    browserBundleId: "com.google.Chrome",
    id,
    focused: true,
    incognito: false,
    frame: { x: 0, y: 0, width: 800, height: 600 },
    tabs,
  };
}

function candidate(windowId: number, browserWindow = browser(windowId)): CaptureCandidate {
  return {
    native: native(windowId),
    browser: browserWindow,
    selected: true,
    selectedTabs: new Set([1]),
    manualUrl: "",
    action: "add",
    tabsExpanded: true,
  };
}

describe("capture refresh reconciliation", () => {
  it("adds and removes live windows while preserving surviving selections", () => {
    const previous = candidate(1);
    previous.manualUrl = "custom://value";
    previous.action = "update";
    previous.targetId = "win_existing";
    const refreshedSurvivor = candidate(1, browser(1, [
      { id: 101, index: 0, title: "B", url: "https://b.example", active: true, pinned: false },
      { id: 100, index: 1, title: "A", url: "https://a.example", active: false, pinned: false },
    ]));
    const result = reconcileCaptureSnapshot([previous, candidate(2)], {
      candidates: [refreshedSurvivor, candidate(3)],
      sourceNotices: [],
      scannedAt: "2026-07-31T12:00:00.000Z",
    });

    expect(result.stats).toEqual({ added: 1, removed: 1, preserved: 1 });
    expect(result.candidates[0]).toMatchObject({
      selected: true,
      manualUrl: "custom://value",
      action: "update",
      targetId: "win_existing",
      tabsExpanded: true,
    });
    expect([...result.candidates[0]!.selectedTabs]).toEqual([0]);
  });

  it("explains an online browser with no native window in the current Space", () => {
    const notices = captureSourceNotices([
      {
        browserId: "tabbit",
        browserName: "Tabbit",
        browserBundleId: "com.tabbit-ai.Tabbit",
        connected: true,
        windows: [{
          ...browser(2),
          browserId: "tabbit",
          browserName: "Tabbit",
          browserBundleId: "com.tabbit-ai.Tabbit",
        }],
      },
    ], []);
    expect(notices[0]?.message).toContain("当前 Space 没有可见窗口");
  });
});
