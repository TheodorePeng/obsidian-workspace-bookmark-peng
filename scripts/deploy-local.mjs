import { access, copyFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";

const pluginId = "workspace-bookmark-peng";
const defaultVault = "/Users/peng/Documents/GitHub-Peng/Obsidian AI Coding";
const vault = argumentValue("--vault") ?? process.env.OBSIDIAN_VAULT_PATH ?? defaultVault;
const root = path.resolve(import.meta.dirname, "..");
const sourceFiles = ["main.js", "manifest.json", "styles.css"];
const target = path.join(vault, ".obsidian", "plugins", pluginId);

for (const file of sourceFiles) {
  await access(path.join(root, file), constants.R_OK).catch(() => {
    throw new Error(`缺少构建文件 ${file}；请先运行 npm run build。`);
  });
}
await mkdir(target, { recursive: true });
for (const file of sourceFiles) {
  await copyFile(path.join(root, file), path.join(target, file));
}

console.log(`已部署 Workspace Bookmark 到 ${target}`);
console.log("已保留该目录原有的 data.json。请在 Obsidian 中重新加载插件。");

function argumentValue(name) {
  const direct = process.argv.find((value) => value.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
