import { isStableId } from "./scope";

export interface WorkspaceLaunchTarget {
  vaultName: string;
  workspaceId: string;
  filePath: string;
}

export async function openWorkspaceForViewingAndRestore<T>(
  openWorkspaceNote: () => Promise<void>,
  restoreWorkspace: () => Promise<T>,
): Promise<T> {
  await openWorkspaceNote();
  return restoreWorkspace();
}

export type WorkspaceLaunchParseResult =
  | { ok: true; workspaceId: string; vaultName: string }
  | {
    ok: false;
    code:
      | "missing-id"
      | "invalid-id"
      | "invalid-vault"
      | "vault-mismatch";
    message: string;
  };

export function buildWorkspaceLaunchUri(target: WorkspaceLaunchTarget): string {
  validateTarget(target);
  const vaultName = encodeURIComponent(target.vaultName);
  return `obsidian://workspace-bookmark-open?vault=${vaultName}&targetVault=${vaultName}&id=${encodeURIComponent(target.workspaceId)}`;
}

export function parseWorkspaceLaunchParams(
  params: Record<string, unknown>,
  currentVaultName: string,
): WorkspaceLaunchParseResult {
  const id = typeof params.id === "string" ? params.id : "";
  if (!id) {
    return { ok: false, code: "missing-id", message: "启动链接缺少 Workspace ID。" };
  }
  if (!isStableId(id, "ws_")) {
    return {
      ok: false,
      code: "invalid-id",
      message: "Workspace ID 必须使用 ws_<ULID> 格式。",
    };
  }

  const explicitVaultName = typeof params.targetVault === "string"
    ? params.targetVault
    : typeof params.vault === "string"
      ? params.vault
      : null;
  const vaultName = explicitVaultName ?? currentVaultName;
  if (!vaultName || containsControlCharacters(vaultName)) {
    return { ok: false, code: "invalid-vault", message: "目标 Vault 名称无效。" };
  }
  if (vaultName !== currentVaultName) {
    return {
      ok: false,
      code: "vault-mismatch",
      message: `此链接属于 Vault“${vaultName}”，当前 Vault 为“${currentVaultName}”。请使用可靠冷启动命令。`,
    };
  }

  return { ok: true, workspaceId: id, vaultName };
}

export function parseLegacyWorkspaceLaunchParams(
  params: Record<string, unknown>,
  currentVaultName: string,
): WorkspaceLaunchParseResult {
  const id = typeof params.id === "string" ? params.id : "";
  if (!id) {
    return { ok: false, code: "missing-id", message: "旧版启动链接缺少 Workspace ID。" };
  }
  if (!isStableId(id, "ws_")) {
    return {
      ok: false,
      code: "invalid-id",
      message: "Workspace ID 必须使用 ws_<ULID> 格式。",
    };
  }
  const requestedVault = typeof params.vault === "string" ? params.vault : "";
  if (requestedVault && requestedVault !== currentVaultName) {
    return {
      ok: false,
      code: "vault-mismatch",
      message: `此旧链接属于 Vault“${requestedVault}”，当前 Vault 为“${currentVaultName}”。请重新复制新版链接。`,
    };
  }
  return { ok: true, workspaceId: id, vaultName: currentVaultName };
}

export function buildColdStartCommand(target: WorkspaceLaunchTarget): string {
  validateTarget(target);
  const vaultArgument = shellQuote(target.vaultName);
  const idArgument = shellQuote(target.workspaceId);
  const noteUri = `obsidian://open?vault=${encodeURIComponent(target.vaultName)}&file=${encodeURIComponent(target.filePath)}`;

  return [
    "(",
    'workspace_bookmark_cli="$(command -v obsidian 2>/dev/null || true)"',
    'if [ -z "$workspace_bookmark_cli" ] && [ -x "/Applications/Obsidian.app/Contents/MacOS/obsidian" ]; then',
    '  workspace_bookmark_cli="/Applications/Obsidian.app/Contents/MacOS/obsidian"',
    "fi",
    'if [ -z "$workspace_bookmark_cli" ]; then',
    '  echo "Workspace Bookmark: 找不到 Obsidian CLI。" >&2',
    "  exit 1",
    "fi",
    `/usr/bin/open ${shellQuote(noteUri)}`,
    "workspace_bookmark_ready=0",
    "workspace_bookmark_attempt=0",
    'while [ "$workspace_bookmark_attempt" -lt 60 ]; do',
    `  if "$workspace_bookmark_cli" vault=${vaultArgument} help workspace-bookmark:open >/dev/null 2>&1; then`,
    "    workspace_bookmark_ready=1",
    "    break",
    "  fi",
    "  workspace_bookmark_attempt=$((workspace_bookmark_attempt + 1))",
    "  /bin/sleep 0.25",
    "done",
    'if [ "$workspace_bookmark_ready" -ne 1 ]; then',
    '  echo "Workspace Bookmark: Obsidian 或插件未在 15 秒内就绪。" >&2',
    "  exit 1",
    "fi",
    `"$workspace_bookmark_cli" vault=${vaultArgument} workspace-bookmark:open id=${idArgument}`,
    ")",
  ].join("\n");
}

function validateTarget(target: WorkspaceLaunchTarget): void {
  if (!isStableId(target.workspaceId, "ws_")) {
    throw new Error("workspaceId 必须使用 ws_<ULID> 格式。");
  }
  if (!target.vaultName.trim() || containsControlCharacters(target.vaultName)) {
    throw new Error("vaultName 不能为空或包含换行/NUL。");
  }
  if (
    !target.filePath.endsWith(".md")
    || target.filePath.startsWith("/")
    || target.filePath.includes("\\")
    || target.filePath.split("/").some((segment) => segment === "..")
    || containsControlCharacters(target.filePath)
  ) {
    throw new Error("filePath 必须是 Vault 内部的 Markdown 路径。");
  }
}

function containsControlCharacters(value: string): boolean {
  return /[\0\r\n]/.test(value);
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}
