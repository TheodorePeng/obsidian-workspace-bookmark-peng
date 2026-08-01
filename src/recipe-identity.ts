import type { WindowRecipe } from "./contracts";

export interface DuplicateRecipeGroup {
  key: string;
  keep: WindowRecipe;
  duplicates: WindowRecipe[];
}

export interface DeduplicatedRecipes {
  runnable: WindowRecipe[];
  duplicates: Array<{ recipe: WindowRecipe; kept: WindowRecipe }>;
}

export function captureRecipeKey(recipe: WindowRecipe): string {
  const owner = recipe.adapter === "browser"
    ? recipe.browserId ?? recipe.bundleId
    : recipe.bundleId;
  if ((recipe.restoreMode ?? "open-content") === "launch-only") {
    return [
      recipe.adapter,
      owner,
      "launch-only",
      recipe.titleHint.trim().toLocaleLowerCase(),
      recipe.monitor,
      recipe.space,
      recipe.layout,
    ].join("\u0000");
  }
  return [
    recipe.adapter,
    owner,
    normalizedUrls(recipe).join("\u0001"),
  ].join("\u0000");
}

export function duplicateFocusExistingKey(recipe: WindowRecipe): string | null {
  if (recipe.openMode !== "focus-existing") return null;
  return [
    captureRecipeKey(recipe),
    recipe.monitor,
    recipe.space,
    recipe.layout,
  ].join("\u0000");
}

export function findDuplicateFocusExistingGroups(
  recipes: WindowRecipe[],
): DuplicateRecipeGroup[] {
  const byKey = new Map<string, WindowRecipe[]>();
  for (const recipe of recipes) {
    const key = duplicateFocusExistingKey(recipe);
    if (!key) continue;
    const group = byKey.get(key) ?? [];
    group.push(recipe);
    byKey.set(key, group);
  }
  return [...byKey.entries()].flatMap(([key, recipes]) =>
    recipes.length > 1
      ? [{ key, keep: recipes[0]!, duplicates: recipes.slice(1) }]
      : [],
  );
}

export function deduplicateFocusExistingRecipes(
  recipes: WindowRecipe[],
): DeduplicatedRecipes {
  const firstByKey = new Map<string, WindowRecipe>();
  const runnable: WindowRecipe[] = [];
  const duplicates: DeduplicatedRecipes["duplicates"] = [];
  for (const recipe of recipes) {
    const key = duplicateFocusExistingKey(recipe);
    const kept = key ? firstByKey.get(key) : undefined;
    if (key && kept) {
      duplicates.push({ recipe, kept });
      continue;
    }
    if (key) firstByKey.set(key, recipe);
    runnable.push(recipe);
  }
  return { runnable, duplicates };
}

function normalizedUrls(recipe: WindowRecipe): string[] {
  return recipe.contents.map((item) => item.url.trim()).sort();
}
