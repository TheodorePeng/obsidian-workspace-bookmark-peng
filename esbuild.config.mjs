import esbuild from "esbuild";
import process from "node:process";
import builtins from "builtin-modules";

const production = process.argv[2] === "production";
const context = await esbuild.context({
  banner: { js: "/* Workspace Bookmark */" },
  bundle: true,
  entryPoints: ["src/main.ts"],
  external: ["obsidian", "electron", ...builtins],
  format: "cjs",
  logLevel: "info",
  outfile: "main.js",
  platform: "node",
  sourcemap: production ? false : "inline",
  target: "es2022",
  treeShaking: true,
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
