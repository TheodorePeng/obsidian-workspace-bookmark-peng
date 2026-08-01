export function isPathInManagedFolder(path: string, managedFolder: string): boolean {
  const folder = `${managedFolder.trim().replace(/^\/+|\/+$/g, "")}/`;
  return path.endsWith(".md") && path.startsWith(folder);
}

export function isStableId(value: unknown, prefix: "ws_" | "win_"): value is string {
  return (
    typeof value === "string" &&
    new RegExp(`^${prefix}[0-9A-HJKMNP-TV-Z]{26}$`).test(value)
  );
}
