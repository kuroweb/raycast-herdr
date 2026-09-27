import { describe, expect, it } from "vitest";
import { parseGitFile, parseHead } from "../src/herdr/git";

describe("parseHead", () => {
  it("ブランチ名を取り出す", () => {
    expect(parseHead("ref: refs/heads/master\n")).toBe("master");
  });

  it("スラッシュを含むブランチ名も取れる", () => {
    expect(parseHead("ref: refs/heads/feat/spaces-ui\n")).toBe("feat/spaces-ui");
  });

  it("detached HEAD は短縮したコミットIDにする", () => {
    expect(parseHead("cc31ada9f1b2c3d4e5f60718293a4b5c6d7e8f90\n")).toBe("cc31ada");
  });

  it("空なら undefined", () => {
    expect(parseHead("  \n")).toBeUndefined();
  });

  it("想定外の内容は undefined", () => {
    expect(parseHead("ref: refs/tags/v1.0.0")).toBeUndefined();
  });
});

describe("parseGitFile", () => {
  it("worktree の gitdir を絶対パスで返す", () => {
    expect(parseGitFile("gitdir: /repo/.git/worktrees/feature\n", "/work")).toBe("/repo/.git/worktrees/feature");
  });

  it("相対パスは .git のある場所から解決する", () => {
    expect(parseGitFile("gitdir: ../.git/worktrees/feature\n", "/repo/work")).toBe("/repo/.git/worktrees/feature");
  });

  it("gitdir 行が無ければ undefined", () => {
    expect(parseGitFile("something else", "/work")).toBeUndefined();
  });
});
