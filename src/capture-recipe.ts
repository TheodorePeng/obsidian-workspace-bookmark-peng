import type {
  BrowserId,
  BrowserTabSnapshot,
  NativeWindowSnapshot,
  WindowAdapter,
  WindowRecipe,
} from "./contracts";
import type { CaptureCandidate } from "./capture";
import { createWindowId } from "./ids";

/** Converts a capture row into the portable recipe stored in Markdown. */
export function candidateToRecipe(candidate: CaptureCandidate): WindowRecipe | null {
  const restoreMode = candidate.restoreMode
    ?? (candidate.browser || candidate.obsidianUrl || candidate.manualUrl ? "open-content" : "launch-only");
  let adapter: WindowAdapter = "manual";
  let appName = candidate.native.appName;
  let bundleId = candidate.native.bundleId;
  let browserId: BrowserId | undefined;
  let contents: WindowRecipe["contents"] = [];
  if (candidate.browser || candidate.browserIdHint) {
    adapter = "browser";
    appName = candidate.browser?.browserName ?? candidate.browserNameHint ?? appName;
    bundleId = candidate.browser?.browserBundleId ?? bundleId;
    browserId = candidate.browser?.browserId ?? candidate.browserIdHint;
    contents = (candidate.browser?.tabs ?? [])
      .filter((tab) => candidate.selectedTabs.has(tab.index))
      .map(tabToContent);
  } else if (candidate.obsidianUrl) {
    adapter = "obsidian";
    appName = "Obsidian";
    bundleId = "md.obsidian";
    contents = [{
      order: 1,
      title: candidate.native.title,
      url: candidate.obsidianUrl,
      active: true,
      pinned: false,
    }];
  } else if (candidate.manualUrl) {
    contents = [{
      order: 1,
      title: candidate.native.title,
      url: candidate.manualUrl,
      active: true,
      pinned: false,
    }];
  }
  if (restoreMode === "open-content" && contents.length === 0) return null;
  if (contents.length > 0 && !contents.some((item) => item.active)) contents[0]!.active = true;
  const contentTitle =
    contents.find((item) => item.active)?.title || contents[0]?.title || candidate.native.title;
  return {
    id: createWindowId(),
    name: contentTitle || candidate.native.appName,
    adapter,
    appName,
    bundleId,
    ...(browserId ? { browserId } : {}),
    titleHint: contentTitle || candidate.native.appName,
    openMode: adapter === "browser" && restoreMode === "open-content"
      ? candidate.openMode ?? "focus-existing"
      : adapter === "manual"
        ? "app-default"
        : "focus-existing",
    monitor: candidate.native.monitor,
    space: "current",
    layout: frameToLayout(candidate.native.normalizedFrame),
    restoreMode,
    contents,
  };
}

export function frameToLayout(frame: NativeWindowSnapshot["normalizedFrame"]): string {
  const epsilon = 0.035;
  const close = (left: number, right: number) => Math.abs(left - right) <= epsilon;
  if (close(frame.x, 0) && close(frame.y, 0) && close(frame.width, 1) && close(frame.height, 1)) {
    return "full";
  }
  if (close(frame.x, 0) && close(frame.y, 0) && close(frame.height, 1)) {
    return `left ${round(frame.width)}`;
  }
  if (close(frame.x + frame.width, 1) && close(frame.y, 0) && close(frame.height, 1)) {
    return `right ${round(frame.width)}`;
  }
  if (close(frame.x, 0) && close(frame.y, 0) && close(frame.width, 1)) {
    return `top ${round(frame.height)}`;
  }
  if (close(frame.x, 0) && close(frame.y + frame.height, 1) && close(frame.width, 1)) {
    return `bottom ${round(frame.height)}`;
  }
  return `frame ${round(frame.x)} ${round(frame.y)} ${round(frame.width)} ${round(frame.height)}`;
}

function tabToContent(tab: BrowserTabSnapshot): WindowRecipe["contents"][number] {
  return {
    order: tab.index + 1,
    title: tab.title,
    url: tab.url,
    active: tab.active,
    pinned: tab.pinned,
  };
}

function round(value: number): string {
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000)).toString();
}
