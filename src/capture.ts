import type {
  BrowserId,
  BrowserSourceStatus,
  BrowserTabSnapshot,
  BrowserWindowSnapshot,
  NativeWindowSnapshot,
  OpenMode,
  RestoreMode,
} from "./contracts";

export interface CaptureCandidate {
  native: NativeWindowSnapshot;
  browser?: BrowserWindowSnapshot;
  browserAlternatives?: BrowserWindowSnapshot[];
  browserIdHint?: BrowserId;
  browserNameHint?: string;
  browserConnected?: boolean;
  obsidianUrl?: string;
  selected: boolean;
  selectedTabs: Set<number>;
  manualUrl: string;
  restoreMode?: RestoreMode;
  /** Temporary Capture-only preference; persisted when a browser recipe is written. */
  openMode?: OpenMode;
  action: "add" | "update" | "ignore";
  targetId?: string;
  duplicateTargetIds?: string[];
  tabsExpanded?: boolean;
}

export interface CaptureSourceNotice {
  browserId: BrowserId;
  browserName: string;
  tone: "neutral" | "warning";
  message: string;
}

export interface CaptureSnapshot {
  candidates: CaptureCandidate[];
  sourceNotices: CaptureSourceNotice[];
  scannedAt: string;
}

export interface CaptureRefreshStats {
  added: number;
  removed: number;
  preserved: number;
}

export interface ReconciledCaptureSnapshot extends CaptureSnapshot {
  stats: CaptureRefreshStats;
}

export function reconcileCaptureSnapshot(
  previous: CaptureCandidate[],
  next: CaptureSnapshot,
): ReconciledCaptureSnapshot {
  const previousByKey = new Map(previous.map((candidate) => [
    captureCandidateKey(candidate),
    candidate,
  ]));
  let preserved = 0;
  const candidates = next.candidates.map((candidate) => {
    const prior = previousByKey.get(captureCandidateKey(candidate));
    if (!prior) return candidate;
    previousByKey.delete(captureCandidateKey(candidate));
    preserved += 1;
    const selectedTabs = reconcileSelectedTabs(prior, candidate);
    return {
      ...candidate,
      selected: prior.selected,
      selectedTabs,
      manualUrl: prior.manualUrl,
      restoreMode: prior.restoreMode ?? candidate.restoreMode,
      openMode: prior.openMode ?? candidate.openMode,
      action: prior.action,
      targetId: prior.targetId,
      duplicateTargetIds: prior.duplicateTargetIds ?? candidate.duplicateTargetIds,
      tabsExpanded: prior.tabsExpanded,
    };
  });
  return {
    ...next,
    candidates,
    stats: {
      added: candidates.length - preserved,
      removed: previousByKey.size,
      preserved,
    },
  };
}

export function captureSourceNotices(
  sources: BrowserSourceStatus[],
  candidates: CaptureCandidate[],
): CaptureSourceNotice[] {
  const notices: CaptureSourceNotice[] = [];
  for (const source of sources) {
    const visible = candidates.filter(
      (candidate) => candidate.browser?.browserId === source.browserId,
    ).length;
    if (!source.connected) {
      notices.push({
        browserId: source.browserId,
        browserName: source.browserName,
        tone: "warning",
        message: `${source.browserName} 桥接离线；当前只显示原生窗口，无法读取页面。`,
      });
    } else if (source.windows.length > 0 && visible === 0) {
      notices.push({
        browserId: source.browserId,
        browserName: source.browserName,
        tone: "neutral",
        message: `${source.browserName} 桥接在线，但当前 Space 没有可见窗口；隐藏、已关闭或其他 Space 的窗口不会参与收录。`,
      });
    }
  }
  return notices;
}

export function captureCandidateKey(candidate: CaptureCandidate): string {
  if (candidate.browser) {
    return `browser:${candidate.browser.browserId}:${candidate.browser.id}`;
  }
  return `native:${candidate.native.pid}:${candidate.native.windowId}`;
}

export function uniqueBrowserMatch(
  nativeWindow: NativeWindowSnapshot,
  browserWindows: BrowserWindowSnapshot[],
): BrowserWindowSnapshot | undefined {
  const candidates = browserMatchCandidates(nativeWindow, browserWindows);
  if (candidates.length !== 1) return undefined;
  return candidates[0];
}

export function browserMatchCandidates(
  nativeWindow: NativeWindowSnapshot,
  browserWindows: BrowserWindowSnapshot[],
): BrowserWindowSnapshot[] {
  const scored = browserWindows
    .filter((window) => browserOwnsNativeWindow(window, nativeWindow))
    .map((window) => ({
      window,
      score:
        Math.abs(window.frame.x - nativeWindow.frame.x) +
        Math.abs(window.frame.y - nativeWindow.frame.y) +
        Math.abs(window.frame.width - nativeWindow.frame.width) +
        Math.abs(window.frame.height - nativeWindow.frame.height) +
        titlePenalty(nativeWindow.title, window),
    }))
    .sort((left, right) => left.score - right.score);
  const best = scored[0];
  if (!best || best.score > 160) return [];
  const nearBest = scored.filter((candidate) => candidate.score - best.score < 20);
  return nearBest.map((candidate) => candidate.window);
}

export function browserOwnsNativeWindow(
  browser: BrowserWindowSnapshot,
  nativeWindow: NativeWindowSnapshot,
): boolean {
  if (browser.browserId === "chrome") {
    return nativeWindow.bundleId === "com.google.Chrome";
  }
  return nativeWindow.bundleId === "com.tabbit-ai.Tabbit"
    || nativeWindow.bundleId.startsWith("com.tabbit-ai.Tabbit.app.");
}

function titlePenalty(nativeTitle: string, browser: BrowserWindowSnapshot): number {
  if (!nativeTitle) return 0;
  const activeTitle = browser.tabs.find((tab) => tab.active)?.title ?? "";
  if (!activeTitle) return 0;
  const left = nativeTitle.toLowerCase();
  const right = activeTitle.toLowerCase();
  return left.includes(right) || right.includes(left) ? 0 : 80;
}

function reconcileSelectedTabs(
  previous: CaptureCandidate,
  next: CaptureCandidate,
): Set<number> {
  if (!previous.browser || !next.browser) return new Set(next.selectedTabs);
  const selectedKeys = new Set(
    previous.browser.tabs
      .filter((tab) => previous.selectedTabs.has(tab.index))
      .map(tabIdentity),
  );
  return new Set(
    next.browser.tabs
      .filter((tab) => selectedKeys.has(tabIdentity(tab)))
      .map((tab) => tab.index),
  );
}

function tabIdentity(tab: BrowserTabSnapshot): string {
  return tab.id != null ? `id:${tab.id}` : `url:${tab.url}`;
}

export function isRestorableBrowserUrl(url: string): boolean {
  try {
    return ["http:", "https:", "file:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}
