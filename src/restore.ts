import type {
  BrowserId,
  RestorePlanItem,
  WindowRecipe,
} from "./contracts";

export interface RestoreReadinessIssue {
  windowId: string;
  windowName: string;
  message: string;
}

export interface RestoreReadiness {
  runnable: WindowRecipe[];
  issues: RestoreReadinessIssue[];
}

export function partitionRestoreReadiness(
  windows: WindowRecipe[],
  planItems: RestorePlanItem[],
  browserSources: Array<{ browserId: BrowserId; connected: boolean }>,
): RestoreReadiness {
  const planById = new Map(planItems.map((item) => [item.id, item]));
  const browserConnection = new Map(
    browserSources.map((source) => [source.browserId, source.connected]),
  );
  const runnable: WindowRecipe[] = [];
  const issues: RestoreReadinessIssue[] = [];
  for (const window of windows) {
    const planned = planById.get(window.id);
    if (!planned?.ok) {
      issues.push({
        windowId: window.id,
        windowName: window.name,
        message: planned?.message ?? "未获得预执行结果。",
      });
      continue;
    }
    if (
      window.adapter === "browser"
      && (window.restoreMode ?? "open-content") === "open-content"
      && (!window.browserId || browserConnection.get(window.browserId) !== true)
    ) {
      const alternatives = [...browserConnection.entries()]
        .filter(([browserId, connected]) =>
          connected && browserId !== window.browserId,
        )
        .map(([browserId]) => browserName(browserId));
      issues.push({
        windowId: window.id,
        windowName: window.name,
        message:
          `此 Window 指定使用 ${window.appName}，但其 Browser Bridge 未连接。`
          + (
            alternatives.length > 0
              ? ` ${alternatives.join("、")} 在线也不会替代 ${window.appName}。`
              : ""
          ),
      });
      continue;
    }
    runnable.push(window);
  }
  return { runnable, issues };
}

function browserName(browserId: BrowserId): string {
  return browserId === "tabbit" ? "Tabbit" : "Google Chrome";
}
