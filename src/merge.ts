import type { WindowRecipe } from "./contracts";
import {
  replaceWindowSection,
  type ParsedWorkspace,
  type WindowSection,
} from "./model";
import { captureRecipeKey } from "./recipe-identity";

export type CaptureOperation =
  | { action: "add"; recipe: WindowRecipe }
  | { action: "update"; recipe: WindowRecipe; targetId: string };

export interface CaptureDiff {
  action: "add" | "update";
  windowName: string;
  changes: string[];
}

export function suggestCaptureTarget(
  captured: WindowRecipe,
  existing: WindowRecipe[],
): WindowRecipe | null {
  const matches = captureTargetMatches(captured, existing);
  return matches.length === 1 ? matches[0] ?? null : null;
}

export function captureTargetMatches(
  captured: WindowRecipe,
  existing: WindowRecipe[],
): WindowRecipe[] {
  const key = captureRecipeKey(captured);
  return existing.filter((candidate) => captureRecipeKey(candidate) === key);
}

export function buildCaptureDiffs(
  operations: CaptureOperation[],
  existing: WindowRecipe[],
): CaptureDiff[] {
  const byId = new Map(existing.map((recipe) => [recipe.id, recipe]));
  return operations.map((operation) => {
    if (operation.action === "add") {
      return {
        action: "add",
        windowName: operation.recipe.name,
        changes: [
          `新增 ${operation.recipe.contents.length} 项 Contents`,
          `${operation.recipe.monitor} · ${operation.recipe.layout}`,
        ],
      };
    }
    const previous = byId.get(operation.targetId);
    return {
      action: "update",
      windowName: previous?.name ?? operation.recipe.name,
      changes: previous
        ? describeRecipeChanges(previous, operation.recipe)
        : ["目标 Window 已不存在，保存时将停止。"],
    };
  });
}

export function applyCaptureOperations(
  source: string,
  parsed: ParsedWorkspace,
  operations: CaptureOperation[],
): string {
  const usedHeadings = new Set(
    (parsed.workspace?.windows ?? []).map((recipe) => headingKey(recipe)),
  );
  const prepared = operations.map((operation) => {
    if (operation.action === "update") {
      const previous = parsed.workspace?.windows.find(
        (recipe) => recipe.id === operation.targetId,
      );
      if (previous) usedHeadings.delete(headingKey(previous));
    }
    const recipe = structuredClone(operation.recipe);
    const originalName = recipe.name;
    let suffix = 2;
    while (usedHeadings.has(headingKey(recipe))) {
      recipe.name = `${originalName}（${suffix}）`;
      suffix += 1;
    }
    usedHeadings.add(headingKey(recipe));
    return { ...operation, recipe } as CaptureOperation;
  });
  const updateById = new Map(
    prepared
      .filter(
        (operation): operation is Extract<CaptureOperation, { action: "update" }> =>
          operation.action === "update",
      )
      .map((operation) => [
        operation.targetId,
        { ...operation.recipe, id: operation.targetId },
      ]),
  );
  const sections = parsed.sections
    .filter(
      (section): section is WindowSection & { recipe: WindowRecipe } =>
        section.recipe != null && updateById.has(section.recipe.id),
    )
    .sort((left, right) => right.start - left.start);
  if (sections.length !== updateById.size) {
    throw new Error("一个或多个待更新 Window 已不存在。");
  }

  let result = source;
  for (const section of sections) {
    result = replaceWindowSection(
      result,
      section,
      updateById.get(section.recipe.id)!,
    );
  }
  for (const operation of prepared) {
    if (operation.action === "add") {
      result = replaceWindowSection(result, null, operation.recipe);
    }
  }
  return result;
}

function headingKey(recipe: WindowRecipe): string {
  return `${recipe.appName}\u0000${recipe.name}`;
}

export function targetSectionsChanged(
  originalSource: string,
  original: ParsedWorkspace,
  currentSource: string,
  current: ParsedWorkspace,
  targetIds: Iterable<string>,
): boolean {
  for (const id of targetIds) {
    const before = sectionForId(original, id);
    const after = sectionForId(current, id);
    if (!before || !after) return true;
    if (
      sectionText(originalSource, before)
      !== sectionText(currentSource, after)
    ) {
      return true;
    }
  }
  return false;
}

function describeRecipeChanges(
  previous: WindowRecipe,
  next: WindowRecipe,
): string[] {
  const changes: string[] = [];
  const fields: Array<[string, string, string]> = [
    ["名称", previous.name, next.name],
    ["App", previous.appName, next.appName],
    ["适配器", previous.adapter, next.adapter],
    ["Bundle ID", previous.bundleId, next.bundleId],
    ["Title hint", previous.titleHint, next.titleHint],
    ["Open mode", previous.openMode, next.openMode],
    ["Monitor", previous.monitor, next.monitor],
    ["Layout", previous.layout, next.layout],
  ];
  for (const [label, before, after] of fields) {
    if (before !== after) changes.push(`${label}：${before} → ${after}`);
  }

  const previousUrls = previous.contents.map((item) => item.url);
  const nextUrls = next.contents.map((item) => item.url);
  for (const url of nextUrls.filter((url) => !previousUrls.includes(url))) {
    changes.push(`新增 URL：${url}`);
  }
  for (const url of previousUrls.filter((url) => !nextUrls.includes(url))) {
    changes.push(`移除 URL：${url}`);
  }
  if (
    arraysEqual([...previousUrls].sort(), [...nextUrls].sort())
    && !arraysEqual(previousUrls, nextUrls)
  ) {
    changes.push("Contents 顺序已变化");
  }
  const previousActive = previous.contents.find((item) => item.active)?.url ?? "";
  const nextActive = next.contents.find((item) => item.active)?.url ?? "";
  if (previousActive !== nextActive) {
    changes.push(`激活项：${previousActive || "无"} → ${nextActive || "无"}`);
  }
  const previousPinned = previous.contents.filter((item) => item.pinned).map((item) => item.url).sort();
  const nextPinned = next.contents.filter((item) => item.pinned).map((item) => item.url).sort();
  if (!arraysEqual(previousPinned, nextPinned)) changes.push("固定状态已变化");
  return changes.length > 0 ? changes : ["没有检测到变化"];
}

function sectionForId(
  parsed: ParsedWorkspace,
  id: string,
): WindowSection | undefined {
  return parsed.sections.find((section) => section.recipe?.id === id);
}

function sectionText(source: string, section: WindowSection): string {
  const normalized = source.replace(/\r\n/g, "\n");
  return normalized.slice(section.start, section.end);
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}
