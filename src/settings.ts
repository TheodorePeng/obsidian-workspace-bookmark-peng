import { App, PluginSettingTab, Setting, setIcon } from "obsidian";
import type WorkspaceBookmarkPlugin from "./main";
import type { RecentWorkspace } from "./recent";

export interface WorkspaceBookmarkSettings {
  managedFolder: string;
  workspacectlPath: string;
  trustedSchemes: string[];
  recentWorkspaces: RecentWorkspace[];
}

export const DEFAULT_SETTINGS: WorkspaceBookmarkSettings = {
  managedFolder: "Workspace/",
  workspacectlPath: "workspacectl",
  trustedSchemes: [],
  recentWorkspaces: [],
};

export function normalizeManagedFolder(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/g, "");
  return normalized ? `${normalized}/` : "Workspace/";
}

export class WorkspaceBookmarkSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly owner: WorkspaceBookmarkPlugin) {
    super(app, owner);
  }

  display(): void {
    this.containerEl.empty();
    this.containerEl.addClass("workspace-bookmark-settings");
    const hero = this.containerEl.createDiv({ cls: "workspace-bookmark-settings-hero" });
    const heroIcon = hero.createDiv();
    setIcon(heroIcon, "bookmark-check");
    const heroCopy = hero.createDiv();
    heroCopy.createEl("h2", { text: "Workspace Bookmark" });
    heroCopy.createEl("p", {
      text: "用 Markdown 保存窗口内容，用本机控制器恢复布局。所有数据只保留在本地。",
    });

    const basics = createSettingsSection(
      this.containerEl,
      "Workspace 数据",
      "控制哪些 Markdown 属于可执行 Workspace",
    );
    new Setting(basics)
      .setName("Workspace 文件夹")
      .setDesc("仅该目录及子目录中 type: workspace 的 Markdown 可执行。")
      .addText((text) =>
        text
          .setPlaceholder("Workspace/")
          .setValue(this.owner.settings.managedFolder)
          .onChange(async (value) => {
            this.owner.settings.managedFolder = normalizeManagedFolder(value);
            await this.owner.saveSettings();
          }),
      );

    const runtime = createSettingsSection(
      this.containerEl,
      "本机运行环境",
      "原生控制器负责扫描、匹配和排列 macOS 窗口",
    );
    new Setting(runtime)
      .setName("workspacectl 路径")
      .setDesc("可执行文件名或绝对路径。不会通过 Shell 执行。")
      .addText((text) =>
        text.setValue(this.owner.settings.workspacectlPath).onChange(async (value) => {
          this.owner.settings.workspacectlPath = value.trim() || "workspacectl";
          await this.owner.saveSettings();
        }),
      );

    new Setting(runtime)
      .setName("可信 URL Scheme")
      .setDesc("逗号分隔。http、https、obsidian 与 file 已内置，无需填写。")
      .addText((text) =>
        text
          .setPlaceholder("notion, vscode")
          .setValue(this.owner.settings.trustedSchemes.join(", "))
          .onChange(async (value) => {
            this.owner.settings.trustedSchemes = [
              ...new Set(
                value
                  .split(",")
                  .map((item) => item.trim().toLowerCase())
                  .filter(Boolean),
              ),
            ];
            await this.owner.saveSettings();
          }),
      );

    const diagnostics = createSettingsSection(
      this.containerEl,
      "诊断与修复",
      "如果捕获或恢复没有反应，请先运行这里的诊断",
    );
    const checklist = diagnostics.createDiv({ cls: "workspace-bookmark-settings-checklist" });
    for (const [icon, text] of [
      ["terminal", "workspacectl 已构建，且上方路径正确"],
      ["accessibility", "macOS 已向 workspacectl 授予辅助功能权限"],
      ["chrome", "Chrome 扩展已加载，并显示绿色连接徽标"],
    ] as const) {
      const row = checklist.createDiv();
      const glyph = row.createSpan();
      setIcon(glyph, icon);
      row.createSpan({ text });
    }
    new Setting(diagnostics)
      .setName("系统诊断")
      .setDesc("检查原生控制器、辅助功能、Browser Host 和当前 Workspace。")
      .addButton((button) =>
        button.setButtonText("运行诊断").onClick(() => {
          void this.owner.showSystemDiagnostics();
        }),
      );
  }
}

function createSettingsSection(
  container: HTMLElement,
  title: string,
  description: string,
): HTMLElement {
  const section = container.createDiv({ cls: "workspace-bookmark-settings-section" });
  section.createEl("h3", { text: title });
  section.createEl("p", { text: description });
  return section;
}
