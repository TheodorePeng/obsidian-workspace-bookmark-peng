export const PROTOCOL_VERSION = 3 as const;

export type WindowAdapter = "browser" | "obsidian" | "manual";
export type BrowserId = "chrome" | "tabbit";
export type OpenMode =
  | "new-window"
  | "reuse-window"
  | "focus-existing"
  | "app-default";
export type RestoreMode = "open-content" | "launch-only";
export type MonitorRole =
  | "current"
  | "main"
  | "built-in"
  | "external-primary";

export interface WorkspaceContent {
  order: number;
  title: string;
  url: string;
  active: boolean;
  pinned?: boolean;
}

export interface WindowRecipe {
  id: string;
  name: string;
  adapter: WindowAdapter;
  appName: string;
  bundleId: string;
  browserId?: BrowserId;
  titleHint: string;
  openMode: OpenMode;
  monitor: MonitorRole;
  space: string;
  layout: string;
  /** Missing in V1–V3 documents; those recipes restore their content. */
  restoreMode?: RestoreMode;
  contents: WorkspaceContent[];
}

export interface WorkspaceDocument {
  id: string;
  name: string;
  schemaVersion: 1 | 2 | 3 | 4;
  tags: string[];
  windows: WindowRecipe[];
}

export interface EnsureAppsRequest {
  windows: WindowRecipe[];
}

export type EnsureAppStatus =
  | "already-running"
  | "launched"
  | "not-found"
  | "launch-failed";

export interface EnsureAppItem {
  id: string;
  appName: string;
  bundleId: string;
  ok: boolean;
  status: EnsureAppStatus;
  message: string;
}

export interface EnsureAppsReport {
  items: EnsureAppItem[];
}

export interface NativeFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NativeWindowSnapshot {
  windowId: number;
  pid: number;
  appName: string;
  bundleId: string;
  title: string;
  monitor: MonitorRole;
  frame: NativeFrame;
  normalizedFrame: NativeFrame;
}

export interface BrowserTabSnapshot {
  id?: number;
  index: number;
  title: string;
  url: string;
  active: boolean;
  pinned: boolean;
}

export interface BrowserWindowSnapshot {
  browserId: BrowserId;
  browserName: string;
  browserBundleId: string;
  id: number;
  focused: boolean;
  incognito: boolean;
  frame: NativeFrame;
  tabs: BrowserTabSnapshot[];
}

export type BrowserWindowSnapshotBase = Omit<
  BrowserWindowSnapshot,
  "browserId" | "browserName" | "browserBundleId"
>;

export interface BrowserSourceStatus {
  browserId: BrowserId;
  browserName: string;
  browserBundleId: string;
  connected: boolean;
  installed?: boolean;
  windows: BrowserWindowSnapshot[];
  error?: ProtocolError;
}

export interface BrowserSnapshotReport {
  sources: BrowserSourceStatus[];
}

export interface WindowMatchHint {
  approximateFrame?: NativeFrame;
  title?: string;
}

export interface ArrangeRequest {
  windows: WindowRecipe[];
  matchHints?: Record<string, WindowMatchHint>;
}

export interface RestorePlanItem {
  id: string;
  ok: boolean;
  displayFrame?: NativeFrame;
  targetFrame?: NativeFrame;
  message: string;
}

export interface RestorePlanReport {
  accessibilityTrusted: boolean;
  browserSources: Array<{
    browserId: BrowserId;
    connected: boolean;
  }>;
  items: RestorePlanItem[];
}

export type BrowserRestoreAction =
  | "created"
  | "reused"
  | "focused-existing"
  | "skipped";

export interface BrowserRestoreReceipt {
  recipeId: string;
  browserId?: BrowserId;
  action: BrowserRestoreAction;
  ok: boolean;
  browserWindowId?: number;
  frame?: NativeFrame;
  activeTitle?: string;
  skipped: Array<{ url: string; reason: string }>;
  errors: Array<{ url?: string; message: string }>;
}

export interface ProtocolEnvelope<T = unknown> {
  protocolVersion: typeof PROTOCOL_VERSION;
  requestId: string;
  type: string;
  payload: T;
}

export interface ProtocolError {
  code: string;
  message: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
}

export interface ProtocolResponse<T = unknown> {
  protocolVersion: typeof PROTOCOL_VERSION;
  requestId: string;
  ok: boolean;
  payload?: T;
  error?: ProtocolError;
}

export function createRequest<T>(
  type: string,
  payload: T,
  requestId = crypto.randomUUID(),
): ProtocolEnvelope<T> {
  return {
    protocolVersion: PROTOCOL_VERSION,
    requestId,
    type,
    payload,
  };
}

export function isProtocolEnvelope(value: unknown): value is ProtocolEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<ProtocolEnvelope>;
  return (
    candidate.protocolVersion === PROTOCOL_VERSION &&
    typeof candidate.requestId === "string" &&
    candidate.requestId.length > 0 &&
    typeof candidate.type === "string" &&
    candidate.type.length > 0 &&
    "payload" in candidate
  );
}
