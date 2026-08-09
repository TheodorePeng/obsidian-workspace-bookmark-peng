import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { WindowRecipe } from "./contracts";
import {
  formatWorkspaceMarkdown,
  parseWorkspaceMarkdown,
  replaceWindowSection,
  type WindowSection,
} from "./model";

export interface ObsidianCaptureUriInput {
  vaultName: string;
  filePath: string;
  uid?: string;
}

export interface WorkspaceRepairContext extends ObsidianCaptureUriInput {
  trustedSchemes?: Iterable<string>;
}

export interface RenameUriContext {
  vaultName: string;
  oldPath: string;
  newPath: string;
  syncWorkspaceIdentity?: boolean;
  trustedSchemes?: Iterable<string>;
}

export interface WorkspaceSourceChange {
  kind: "workspace-name" | "window-name" | "title-hint" | "content-title" | "uri" | "format" | "uuid";
  from: string;
  to: string;
}

export interface WorkspaceSourceResult {
  source: string;
  changed: boolean;
  changes: WorkspaceSourceChange[];
}

export interface FrontmatterUuidResult {
  source: string;
  uid: string;
  changed: boolean;
}

export function ensureFrontmatterUuid(
  source: string,
  field: string,
  createUuid: () => string,
): FrontmatterUuidResult {
  const key = field.trim();
  if (!key) throw new Error("Advanced URI UUID property 不能为空。");
  const match = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(source);
  const frontmatter = match
    ? parseYaml(match[2] ?? "") as Record<string, unknown> | null
    : {};
  if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    throw new Error("无法读取笔记 frontmatter。");
  }
  const existing = frontmatter[key];
  if (typeof existing === "string" && existing.trim()) {
    return { source, uid: existing.trim(), changed: false };
  }
  const uid = createUuid();
  frontmatter[key] = uid;
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const body = stringifyYaml(frontmatter).trimEnd().replaceAll("\n", eol);
  const updated = match
    ? `${match[1]}${body}${match[3]}${source.slice(match[0].length)}`
    : `---${eol}${body}${eol}---${eol}${eol}${source}`;
  return { source: updated, uid, changed: true };
}

export function buildObsidianCaptureUri(input: ObsidianCaptureUriInput): string {
  const vault = encodeURIComponent(input.vaultName);
  if (input.uid) {
    return `obsidian://adv-uri?vault=${vault}&uid=${encodeURIComponent(input.uid)}`;
  }
  return `obsidian://open?vault=${vault}&file=${encodeURIComponent(input.filePath)}`;
}

export function planWorkspaceReferenceRepair(
  source: string,
  context: WorkspaceRepairContext,
): WorkspaceSourceResult {
  const parsed = parseWorkspaceMarkdown(source, { trustedSchemes: context.trustedSchemes });
  if (!parsed.workspace || parsed.diagnostics.some((item) => item.severity === "error")) {
    return unchanged(source);
  }
  const currentName = fileBasename(context.filePath);
  const currentDirectory = fileDirectory(context.filePath);
  const changes: WorkspaceSourceChange[] = [];
  let staleSelfName: string | null = null;
  const replacements = new Map<string, WindowRecipe>();

  for (const recipe of parsed.workspace.windows) {
    let changedRecipe = structuredClone(recipe);
    let recipeChanged = false;
    changedRecipe.contents = changedRecipe.contents.map((content) => {
      const target = parseObsidianUri(content.url);
      if (
        !target
        || target.kind !== "path"
        || target.vault !== context.vaultName
        || fileDirectory(target.filePath) !== currentDirectory
      ) return content;
      const oldName = fileBasename(target.filePath);
      const labels = [parsed.workspace!.name, recipe.name, recipe.titleHint, content.title];
      if (!labels.includes(oldName)) return content;
      staleSelfName ??= oldName;
      const nextUrl = buildObsidianCaptureUri({
        vaultName: context.vaultName,
        filePath: context.filePath,
        uid: context.uid,
      });
      if (nextUrl === content.url) return content;
      recipeChanged = true;
      changes.push({ kind: "uri", from: content.url, to: nextUrl });
      return { ...content, url: nextUrl };
    });
    if (recipeChanged) replacements.set(recipe.id, changedRecipe);
  }

  const syncOldName = staleSelfName && parsed.workspace.name === staleSelfName
    ? staleSelfName
    : null;
  if (syncOldName && syncOldName !== currentName) {
    changes.push({ kind: "workspace-name", from: syncOldName, to: currentName });
    for (const recipe of parsed.workspace.windows) {
      const next = replacements.get(recipe.id) ?? structuredClone(recipe);
      let changedRecipe = replacements.has(recipe.id);
      if (next.name === syncOldName) {
        changes.push({ kind: "window-name", from: syncOldName, to: currentName });
        next.name = currentName;
        changedRecipe = true;
      }
      if (next.titleHint === syncOldName) {
        changes.push({ kind: "title-hint", from: syncOldName, to: currentName });
        next.titleHint = currentName;
        changedRecipe = true;
      }
      next.contents = next.contents.map((content) => {
        if (content.title !== syncOldName) return content;
        changes.push({ kind: "content-title", from: syncOldName, to: currentName });
        changedRecipe = true;
        return { ...content, title: currentName };
      });
      if (changedRecipe) replacements.set(recipe.id, next);
    }
  }

  let updated = replaceRecipes(source, parsed.sections, replacements);
  if (syncOldName && syncOldName !== currentName) {
    updated = replaceFrontmatterName(updated, currentName);
  }
  const reparsed = parseWorkspaceMarkdown(updated, { trustedSchemes: context.trustedSchemes });
  if (!reparsed.workspace || reparsed.diagnostics.some((item) => item.severity === "error")) {
    return unchanged(source);
  }
  const formatted = formatWorkspaceMarkdown(updated, reparsed);
  if (formatted !== updated) changes.push({ kind: "format", from: "非规范表格", to: "规范表格" });
  return { source: formatted, changed: formatted !== source, changes };
}

export function rewriteObsidianUrisForRename(
  source: string,
  context: RenameUriContext,
): WorkspaceSourceResult {
  const parsed = parseWorkspaceMarkdown(source, { trustedSchemes: context.trustedSchemes });
  if (!parsed.workspace || parsed.diagnostics.some((item) => item.severity === "error")) {
    return unchanged(source);
  }
  const changes: WorkspaceSourceChange[] = [];
  const replacements = new Map<string, WindowRecipe>();
  for (const recipe of parsed.workspace.windows) {
    const next = structuredClone(recipe);
    next.contents = next.contents.map((content) => {
      const rewritten = rewriteObsidianUri(content.url, context);
      if (rewritten === content.url) return content;
      changes.push({ kind: "uri", from: content.url, to: rewritten });
      return { ...content, url: rewritten };
    });
    if (next.contents.some((content, index) => content.url !== recipe.contents[index]?.url)) {
      replacements.set(recipe.id, next);
    }
  }
  const oldName = fileBasename(context.oldPath);
  const newName = fileBasename(context.newPath);
  const syncIdentity = context.syncWorkspaceIdentity === true
    && parsed.workspace.name === oldName
    && oldName !== newName;
  if (syncIdentity) {
    changes.push({ kind: "workspace-name", from: oldName, to: newName });
    for (const recipe of parsed.workspace.windows) {
      const next = replacements.get(recipe.id) ?? structuredClone(recipe);
      let recipeChanged = replacements.has(recipe.id);
      if (next.name === oldName) {
        changes.push({ kind: "window-name", from: oldName, to: newName });
        next.name = newName;
        recipeChanged = true;
      }
      if (next.titleHint === oldName) {
        changes.push({ kind: "title-hint", from: oldName, to: newName });
        next.titleHint = newName;
        recipeChanged = true;
      }
      next.contents = next.contents.map((content) => {
        if (content.title !== oldName) return content;
        changes.push({ kind: "content-title", from: oldName, to: newName });
        recipeChanged = true;
        return { ...content, title: newName };
      });
      if (recipeChanged) replacements.set(recipe.id, next);
    }
  }
  let updated = replaceRecipes(source, parsed.sections, replacements);
  if (syncIdentity) updated = replaceFrontmatterName(updated, newName);
  return { source: updated, changed: updated !== source, changes };
}

function rewriteObsidianUri(url: string, context: RenameUriContext): string {
  const target = parseObsidianUri(url);
  if (!target || target.vault !== context.vaultName) return url;
  if (target.kind === "path" && target.filePath === context.oldPath) {
    return buildObsidianCaptureUri({
      vaultName: context.vaultName,
      filePath: context.newPath,
    });
  }
  if (target.kind === "advanced" && target.filePath === context.oldPath) {
    const parsed = new URL(url);
    if (target.uid) parsed.searchParams.delete("filepath");
    else parsed.searchParams.set("filepath", context.newPath);
    return parsed.toString();
  }
  return url;
}

function parseObsidianUri(url: string):
  | { kind: "path"; vault: string; filePath: string }
  | { kind: "advanced"; vault: string; uid: string; filePath?: string }
  | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "obsidian:") return null;
    const vault = parsed.searchParams.get("vault") ?? "";
    if (parsed.hostname === "open") {
      const filePath = parsed.searchParams.get("file");
      return filePath ? { kind: "path", vault, filePath } : null;
    }
    if (parsed.hostname === "adv-uri") {
      const uid = parsed.searchParams.get("uid") ?? "";
      const filePath = parsed.searchParams.get("filepath") ?? undefined;
      return uid || filePath ? { kind: "advanced", vault, uid, ...(filePath ? { filePath } : {}) } : null;
    }
  } catch {
    return null;
  }
  return null;
}

function replaceRecipes(
  source: string,
  sections: WindowSection[],
  replacements: Map<string, WindowRecipe>,
): string {
  let updated = source;
  const targets = sections
    .filter((section) => section.recipe && replacements.has(section.recipe.id))
    .sort((left, right) => right.start - left.start);
  for (const section of targets) {
    updated = replaceWindowSection(updated, section, replacements.get(section.recipe!.id)!);
  }
  return updated;
}

function replaceFrontmatterName(source: string, name: string): string {
  const match = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(source);
  if (!match) return source;
  const frontmatter = parseYaml(match[2] ?? "") as Record<string, unknown> | null;
  if (!frontmatter || typeof frontmatter !== "object") return source;
  frontmatter.name = name;
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const body = stringifyYaml(frontmatter).trimEnd().replaceAll("\n", eol);
  return `${match[1]}${body}${match[3]}${source.slice(match[0].length)}`;
}

function fileBasename(path: string): string {
  const name = path.split("/").at(-1) ?? path;
  return name.endsWith(".md") ? name.slice(0, -3) : name;
}

function fileDirectory(path: string): string {
  const index = path.lastIndexOf("/");
  return index < 0 ? "" : path.slice(0, index);
}

function unchanged(source: string): WorkspaceSourceResult {
  return { source, changed: false, changes: [] };
}
