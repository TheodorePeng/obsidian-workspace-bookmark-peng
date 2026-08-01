import { describe, expect, it } from "vitest";
import { isPathInManagedFolder, isStableId } from "../src/scope";

describe("managed folder scope", () => {
  it("accepts Markdown in the folder and descendants", () => {
    expect(isPathInManagedFolder("Workspace/Test.md", "Workspace/")).toBe(true);
    expect(isPathInManagedFolder("Workspace/Study/Test.md", "Workspace")).toBe(true);
  });

  it("rejects lookalike and unrelated paths", () => {
    expect(isPathInManagedFolder("Workspace2/Test.md", "Workspace/")).toBe(false);
    expect(isPathInManagedFolder("Notes/Test.md", "Workspace/")).toBe(false);
    expect(isPathInManagedFolder("Workspace/Test.canvas", "Workspace/")).toBe(false);
  });
});

describe("external input IDs", () => {
  it("accepts stable IDs only", () => {
    expect(isStableId("ws_01JZX8A9000000000000000000", "ws_")).toBe(true);
    expect(isStableId("ws_01JZX8A9;open /tmp/payload", "ws_")).toBe(false);
    expect(isStableId("../Workspace/Test", "ws_")).toBe(false);
  });
});
