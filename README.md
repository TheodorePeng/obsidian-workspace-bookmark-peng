# Workspace Bookmark Peng

Workspace Bookmark Peng is an Obsidian desktop plugin for managing macOS workspace bookmarks as human-readable Markdown.

It lets you create, capture, validate, edit, and open Workspace Markdown notes from Obsidian. A Workspace note describes browser pages, Obsidian documents, manual URLs, monitor roles, and proportional window layouts.

> This repository publishes the Obsidian plugin for BRAT. Full workspace capture and restore also requires the local companion tools from the complete Workspace Bookmark system: `workspacectl`, the Chromium browser extension, and the Native Messaging host.

## What it does

- Manages only Markdown files in the configured Workspace folder.
- Creates Workspace Markdown with `type: workspace` frontmatter.
- Captures visible current-Space windows through the local companion tools.
- Writes readable Markdown sections such as `## Tabbit · Research`.
- Keeps editable settings separate from folded read-only recovery metadata.
- Opens or restores Workspace contents from the current Workspace note.
- Shows diagnostics when `workspacectl`, browser bridges, or Accessibility permission are unavailable.

## Install with BRAT

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Obsidian Community Plugins.
2. Enable BRAT.
3. In BRAT, choose the option to add a beta plugin.
4. Paste this repository URL:

   `https://github.com/TheodorePeng/obsidian-workspace-bookmark-peng`

5. Confirm the install, then enable **Workspace Bookmark Peng** in Obsidian.

BRAT installs the Obsidian plugin files from GitHub Releases: `main.js`, `manifest.json`, and `styles.css`.

## Companion requirements

BRAT does not install local macOS executables or browser extensions. For full capture and restore, this plugin expects:

- `workspacectl`, the local macOS command-line helper.
- Workspace Bookmark Browser Bridge installed in Google Chrome and/or Tabbit.
- Native Messaging host manifests for the browsers you want to capture.
- macOS Accessibility permission for `workspacectl`.

Without those components, the plugin still loads in Obsidian, but capture/restore commands will show diagnostics and repair instructions.

## Basic usage

1. Configure the managed Workspace folder in plugin settings.
2. Create or open a Markdown note with `type: workspace` frontmatter.
3. Use the Obsidian command palette:
   - `Workspace Bookmark: Capture current workspace`
   - `Workspace Bookmark: Open current workspace`
   - `Workspace Bookmark: Browse workspaces`
   - `Workspace Bookmark: Edit current Window`
   - `Workspace Bookmark: System diagnostics`

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

Release assets for BRAT are generated in the repository root:

- `main.js`
- `manifest.json`
- `styles.css`

`data.json` is local Obsidian plugin state and must not be committed.

---

# Workspace Bookmark Peng 中文说明

Workspace Bookmark Peng 是一个 Obsidian 桌面端插件，用于把 macOS 工作区收藏为可读、可编辑的 Markdown 文档。

它可以在 Obsidian 中创建、捕获、校验、编辑和打开 Workspace Markdown。一个 Workspace 文档可以描述浏览器页面、Obsidian 文档、手工 URL、屏幕角色和比例窗口布局。

> 这个仓库只负责通过 BRAT 发布 Obsidian 插件本体。完整的窗口捕获和恢复能力还需要完整 Workspace Bookmark 系统中的本地配套组件：`workspacectl`、Chromium 浏览器扩展和 Native Messaging Host。

## 主要功能

- 只管理插件设置中指定 Workspace 文件夹里的 Markdown。
- 自动创建带有 `type: workspace` frontmatter 的 Workspace 文档。
- 通过本地配套组件捕获当前 Space 中可见的窗口。
- 写入更适合人类阅读的 Markdown，例如 `## Tabbit · Research`。
- 将用户可编辑设置与折叠的只读恢复信息分开。
- 从当前 Workspace 文档打开或恢复对应内容。
- 当 `workspacectl`、浏览器桥接或辅助功能权限不可用时，显示诊断和修复提示。

## 通过 BRAT 安装

1. 在 Obsidian 社区插件中安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat)。
2. 启用 BRAT。
3. 在 BRAT 中选择添加 beta 插件。
4. 粘贴本仓库地址：

   `https://github.com/TheodorePeng/obsidian-workspace-bookmark-peng`

5. 确认安装，然后在 Obsidian 中启用 **Workspace Bookmark Peng**。

BRAT 会从 GitHub Releases 下载 Obsidian 插件文件：`main.js`、`manifest.json` 和 `styles.css`。

## 配套组件要求

BRAT 不会安装本地 macOS 可执行程序或浏览器扩展。若要完整使用捕获与恢复能力，还需要：

- `workspacectl` 本地 macOS 命令行 helper。
- 安装在 Google Chrome 和/或 Tabbit 中的 Workspace Bookmark Browser Bridge。
- 对应浏览器的 Native Messaging Host manifest。
- 为 `workspacectl` 授予 macOS 辅助功能权限。

如果缺少这些组件，插件仍然可以在 Obsidian 中加载，但捕获/恢复命令会显示诊断和修复步骤。

## 基本使用

1. 在插件设置中配置受管 Workspace 文件夹。
2. 创建或打开带有 `type: workspace` frontmatter 的 Markdown。
3. 使用 Obsidian 命令面板：
   - `Workspace Bookmark: Capture current workspace`
   - `Workspace Bookmark: Open current workspace`
   - `Workspace Bookmark: Browse workspaces`
   - `Workspace Bookmark: Edit current Window`
   - `Workspace Bookmark: System diagnostics`

## 开发

```bash
npm install
npm run typecheck
npm test
npm run build
```

用于 BRAT 的发布文件位于仓库根目录：

- `main.js`
- `manifest.json`
- `styles.css`

`data.json` 是 Obsidian 本地插件状态，不应提交到 Git。
