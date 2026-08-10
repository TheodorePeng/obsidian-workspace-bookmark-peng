import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import {
  buildColdStartCommand,
  buildWorkspaceLaunchUri,
  openWorkspaceForViewingAndRestore,
  parseLegacyWorkspaceLaunchParams,
  parseWorkspaceLaunchParams,
  type WorkspaceLaunchTarget,
} from "../src/external-launch";

const target: WorkspaceLaunchTarget = {
  vaultName: "My Obsidian & 学习",
  workspaceId: "ws_01KZDMW8P0GEPA0TDWTJCT61S2",
  filePath: "Workspace/阅读理解 单词精读.md",
};

describe("Workspace launch URI", () => {
  it("opens the Workspace Markdown for viewing before restoring its windows", async () => {
    const events: string[] = [];

    const result = await openWorkspaceForViewingAndRestore(
      async () => { events.push("open-note"); },
      async () => { events.push("restore-windows"); return true; },
    );

    expect(events).toEqual(["open-note", "restore-windows"]);
    expect(result).toBe(true);
  });

  it("encodes the target Vault and stable Workspace ID without using a file path", () => {
    expect(buildWorkspaceLaunchUri(target)).toBe(
      "obsidian://workspace-bookmark-open?vault=My%20Obsidian%20%26%20%E5%AD%A6%E4%B9%A0&targetVault=My%20Obsidian%20%26%20%E5%AD%A6%E4%B9%A0&id=ws_01KZDMW8P0GEPA0TDWTJCT61S2",
    );
  });

  it("accepts the parameters Obsidian actually delivers after consuming vault for routing", () => {
    expect(parseWorkspaceLaunchParams({
      action: "workspace-bookmark-open",
      id: "ws_01KZDMW8P0GEPA0TDWTJCT61S2",
    }, "My Obsidian")).toEqual({
      ok: true,
      workspaceId: "ws_01KZDMW8P0GEPA0TDWTJCT61S2",
      vaultName: "My Obsidian",
    });
  });

  it("accepts the real Workspace ID only in the intended Vault", () => {
    expect(parseWorkspaceLaunchParams({
      action: "workspace-bookmark-open",
      vault: "My Obsidian",
      id: "ws_01KZDMW8P0GEPA0TDWTJCT61S2",
    }, "My Obsidian")).toEqual({
      ok: true,
      workspaceId: "ws_01KZDMW8P0GEPA0TDWTJCT61S2",
      vaultName: "My Obsidian",
    });
  });

  it.each([
    [{ vault: "My Obsidian" }, "missing-id"],
    [{ vault: "My Obsidian", id: "../Workspace/Test" }, "invalid-id"],
    [{ targetVault: "Another Vault", id: "ws_01KZDMW8P0GEPA0TDWTJCT61S2" }, "vault-mismatch"],
    [{ targetVault: "Bad\nVault", id: "ws_01KZDMW8P0GEPA0TDWTJCT61S2" }, "invalid-vault"],
  ] as const)("rejects unsafe or incomplete parameters: %j", (params, code) => {
    expect(parseWorkspaceLaunchParams(params, "My Obsidian")).toMatchObject({
      ok: false,
      code,
    });
  });

  it("accepts a valid ID from the previously published URI shape", () => {
    expect(parseLegacyWorkspaceLaunchParams({
      action: "workspace-bookmark",
      id: "ws_01KZDMW8P0GEPA0TDWTJCT61S2",
    }, "My Obsidian")).toEqual({
      ok: true,
      workspaceId: "ws_01KZDMW8P0GEPA0TDWTJCT61S2",
      vaultName: "My Obsidian",
    });
  });

  it("does not let a legacy URL bypass an explicit Vault mismatch", () => {
    expect(parseLegacyWorkspaceLaunchParams({
      id: "ws_01KZDMW8P0GEPA0TDWTJCT61S2",
      vault: "Another Vault",
    }, "My Obsidian")).toMatchObject({
      ok: false,
      code: "vault-mismatch",
    });
  });
});

describe("reliable cold-start command", () => {
  it("opens the exact note, polls a read-only help command, and restores once", () => {
    const command = buildColdStartCommand(target);

    expect(command).toContain(
      "/usr/bin/open 'obsidian://open?vault=My%20Obsidian%20%26%20%E5%AD%A6%E4%B9%A0&file=Workspace%2F%E9%98%85%E8%AF%BB%E7%90%86%E8%A7%A3%20%E5%8D%95%E8%AF%8D%E7%B2%BE%E8%AF%BB.md'",
    );
    expect(command).toContain("while [ \"$workspace_bookmark_attempt\" -lt 60 ]; do");
    expect(command).not.toContain("{1..60}");
    expect(command).toContain("help workspace-bookmark:open");
    expect(command).toContain("/bin/sleep 0.25");
    expect(command).toContain("workspace-bookmark:open id='ws_01KZDMW8P0GEPA0TDWTJCT61S2'");
    expect(command.match(/workspace-bookmark:open id=/g)).toHaveLength(1);
    expect(command).not.toContain("eval ");
  });

  it("quotes apostrophes in Vault arguments instead of creating shell syntax", () => {
    const command = buildColdStartCommand({
      ...target,
      vaultName: "Peng's Vault",
    });

    expect(command).toContain("vault='Peng'\\''s Vault'");
  });

  it("emits syntax accepted by the system POSIX shell", () => {
    expect(() => execFileSync("/bin/sh", ["-n"], {
      input: buildColdStartCommand(target),
      stdio: ["pipe", "pipe", "pipe"],
    })).not.toThrow();
  });

  it.each([
    [{ ...target, workspaceId: "ws_bad" }, "workspaceId"],
    [{ ...target, vaultName: "Bad\nVault" }, "vaultName"],
    [{ ...target, filePath: "../Secrets.md" }, "filePath"],
    [{ ...target, filePath: "/Users/peng/Secrets.md" }, "filePath"],
  ] as const)("rejects invalid launch targets", (invalid, field) => {
    expect(() => buildColdStartCommand(invalid)).toThrow(field);
  });
});
