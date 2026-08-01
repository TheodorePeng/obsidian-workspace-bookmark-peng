export interface RecentWorkspace {
  workspaceId: string;
  lastOpenedAt: string;
}

export function updateRecentWorkspaces(
  current: RecentWorkspace[],
  workspaceId: string,
  lastOpenedAt: string,
  limit = 20,
): RecentWorkspace[] {
  return [
    { workspaceId, lastOpenedAt },
    ...current.filter((item) => item.workspaceId !== workspaceId),
  ].slice(0, limit);
}
