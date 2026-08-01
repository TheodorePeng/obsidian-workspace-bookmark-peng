import { execFile } from "node:child_process";
import type {
  ArrangeRequest,
  BrowserId,
  BrowserRestoreReceipt,
  BrowserSnapshotReport,
  EnsureAppsReport,
  NativeWindowSnapshot,
  RestorePlanReport,
  WindowRecipe,
} from "./contracts";

export interface CommandResult<T> {
  ok: boolean;
  value?: T;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
    details?: Record<string, unknown>;
  };
}

export interface DoctorReport {
  accessibilityTrusted: boolean;
  browserSources: Array<{
    browserId: BrowserId;
    browserName: string;
    installed: boolean;
    connected: boolean;
    windowCount: number;
    tabCount: number;
    error?: {
      code: string;
      message: string;
      recoverable: boolean;
    };
  }>;
  platform: string;
  capabilities?: string[];
}

export interface ArrangementItem {
  id: string;
  ok: boolean;
  message: string;
}

export interface BrowserRestoreRequest {
  windows: WindowRecipe[];
}

export class NativeClient {
  constructor(private readonly executable: string) {}

  doctor(): Promise<CommandResult<DoctorReport>> {
    return this.json(["doctor", "--json"]);
  }

  scan(): Promise<CommandResult<NativeWindowSnapshot[]>> {
    return this.json(["scan", "--onscreen-only", "--json"]);
  }

  plan(request: ArrangeRequest): Promise<CommandResult<RestorePlanReport>> {
    return this.json(["plan", "--stdin"], request);
  }

  browserStatus(): Promise<CommandResult<BrowserSnapshotReport>> {
    return this.retryableJson(["browser", "status", "--json"]);
  }

  browserSnapshot(): Promise<CommandResult<BrowserSnapshotReport>> {
    return this.retryableJson(["browser", "snapshot", "--json"]);
  }

  browserRestore(request: BrowserRestoreRequest): Promise<CommandResult<BrowserRestoreReceipt[]>> {
    // Restore is not retried automatically: a lost response must never create
    // duplicate tabs or windows.
    return this.json(["browser", "restore", "--stdin"], request);
  }

  arrange(request: ArrangeRequest): Promise<CommandResult<ArrangementItem[]>> {
    return this.json(["arrange", "--stdin"], request);
  }

  ensureApps(request: ArrangeRequest): Promise<CommandResult<EnsureAppsReport>> {
    return this.json(["ensure-apps", "--stdin"], request);
  }

  private json<T>(args: string[], stdin?: unknown): Promise<CommandResult<T>> {
    return new Promise((resolve) => {
      const child = execFile(
        this.executable,
        args,
        {
          encoding: "utf8",
          maxBuffer: 4 * 1024 * 1024,
          timeout: 30_000,
        },
        (processError, stdout, stderr) => {
          const text = stdout.trim();
          if (text) {
            try {
              resolve(localizeCommandResult(JSON.parse(text) as CommandResult<T>));
              return;
            } catch {
              // Fall through to a structured local error.
            }
          }
          const code = processError ? "NATIVE_COMMAND_FAILED" : "NATIVE_INVALID_RESPONSE";
          resolve({
            ok: false,
            error: {
              code,
              message: friendlyNativeError(
                code,
                stderr.trim() || processError?.message || "",
                this.executable,
              ),
              recoverable: true,
              details: { args, executable: this.executable },
            },
          });
        },
      );
      if (stdin !== undefined) {
        child.stdin?.end(JSON.stringify(stdin));
      }
    });
  }

  private async retryableJson<T>(
    args: string[],
    stdin?: unknown,
  ): Promise<CommandResult<T>> {
    const delays = [0, 450, 1_200];
    let result: CommandResult<T> | undefined;
    for (const delay of delays) {
      if (delay > 0) await wait(delay);
      result = await this.json<T>(args, stdin);
      if (result.ok || !isTransientBridgeError(result.error?.code)) return result;
    }
    return result ?? {
      ok: false,
      error: {
        code: "BRIDGE_UNAVAILABLE",
        message: bridgeUnavailableMessage(),
        recoverable: true,
      },
    };
  }
}

function isTransientBridgeError(code: string | undefined): boolean {
  return code === "BRIDGE_UNAVAILABLE"
    || code === "BRIDGE_TIMEOUT"
    || code === "NATIVE_COMMAND_FAILED";
}

function friendlyNativeError(code: string, raw: string, executable: string): string {
  if (/ENOENT|No such file or directory/i.test(raw)) {
    return `找不到 workspacectl（${executable}）。请在插件设置中选择编译后的绝对路径。`;
  }
  if (/EACCES|permission denied/i.test(raw)) {
    return `无法执行 workspacectl（${executable}）。请检查文件权限。`;
  }
  if (/timed out|ETIMEDOUT/i.test(raw)) {
    return "原生控制器响应超时。请运行系统诊断后重试。";
  }
  if (code === "NATIVE_INVALID_RESPONSE") {
    return "workspacectl 返回了无法解析的数据。请重新构建原生组件并检查版本。";
  }
  return raw || "workspacectl 未能正常运行。";
}

function bridgeUnavailableMessage(): string {
  return "浏览器桥接未连接。请保持目标浏览器运行，重新加载 Workspace Bookmark 扩展，然后重试。";
}

function localizeCommandResult<T>(result: CommandResult<T>): CommandResult<T> {
  if (result.ok || !result.error) return result;
  const localized: Partial<Record<string, string>> = {
    BRIDGE_UNAVAILABLE: bridgeUnavailableMessage(),
    BRIDGE_TIMEOUT: "浏览器桥接响应超时。请确认目标浏览器正在运行并重新加载扩展。",
    BRIDGE_FAILED: "浏览器桥接操作失败。请打开系统诊断查看各浏览器连接状态。",
    PROTOCOL_VERSION_MISMATCH: "浏览器扩展与本地组件的协议版本不一致。请重新构建并重新加载浏览器扩展。",
    BRIDGE_REQUEST_INVALID: "浏览器桥接收到了无效请求。请重新构建所有组件后重试。",
  };
  const message = localized[result.error.code];
  if (!message) return result;
  return {
    ...result,
    error: {
      ...result.error,
      message,
      details: {
        ...result.error.details,
        nativeMessage: result.error.message,
      },
    },
  };
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
