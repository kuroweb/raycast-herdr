import { describe, expect, it } from "vitest";
import { expandPath, parseSpaceSections, parseSpaces, shortenPath } from "../src/herdr/workspace";

const snapshot = {
  workspaces: [
    { workspace_id: "wE", number: 2, label: "raycast-herdr", agent_status: "working", tab_count: 1, pane_count: 2, focused: true },
    { workspace_id: "wC", number: 1, label: "ai-manifest", agent_status: "idle", tab_count: 1, pane_count: 1, focused: false },
  ],
  panes: [
    { workspace_id: "wE", cwd: "/repo/a", foreground_cwd: "/repo/a", agent: "claude" },
    { workspace_id: "wE", cwd: "/repo/a", foreground_cwd: "/repo/b" },
    { workspace_id: "wC", cwd: "/repo/c", agent: "claude" },
  ],
};

describe("parseSpaces", () => {
  it("番号順に並べる", () => {
    expect(parseSpaces(snapshot).map((space) => space.id)).toEqual(["wC", "wE"]);
  });

  it("配下paneから代表ディレクトリとagent数を導出する", () => {
    const [, wE] = parseSpaces(snapshot);
    expect(wE.cwd).toBe("/repo/a");
    expect(wE.agentCount).toBe(1);
    expect(wE.paneCount).toBe(2);
  });

  it("paneが無いworkspaceはcwdを持たない", () => {
    const [space] = parseSpaces({ workspaces: [{ workspace_id: "w1", number: 1 }], panes: [] });
    expect(space.cwd).toBeUndefined();
    expect(space.label).toBe("w1");
    expect(space.status).toBe("unknown");
  });

  it("workspace_idが無い要素は除外する", () => {
    expect(parseSpaces({ workspaces: [{ number: 1 }] })).toEqual([]);
  });

  it("snapshotが空でも落ちない", () => {
    expect(parseSpaces({})).toEqual([]);
  });
});

describe("shortenPath", () => {
  it("ホーム配下を ~ に畳む", () => {
    expect(shortenPath("/Users/u/environment/app", "/Users/u")).toBe("~/environment/app");
  });

  it("ホームそのものは ~ にする", () => {
    expect(shortenPath("/Users/u", "/Users/u")).toBe("~");
  });

  it("ホーム外はそのまま返す", () => {
    expect(shortenPath("/opt/work", "/Users/u")).toBe("/opt/work");
  });

  it("前方一致しただけのパスは畳まない", () => {
    expect(shortenPath("/Users/user2/app", "/Users/u")).toBe("/Users/user2/app");
  });
});

describe("expandPath", () => {
  it("~/ をホームに開く", () => {
    expect(expandPath("~/environment/app", "/Users/u")).toBe("/Users/u/environment/app");
  });

  it("~ 単体はホームにする", () => {
    expect(expandPath("~", "/Users/u")).toBe("/Users/u");
  });

  it("前後の空白を落とす", () => {
    expect(expandPath("  /opt/work  ", "/Users/u")).toBe("/opt/work");
  });

  it("~で始まるだけのパスは開かない", () => {
    expect(expandPath("~workspace/app", "/Users/u")).toBe("~workspace/app");
  });
});

describe("parseSpaceSections", () => {
  const source = {
    workspaces: [
      { workspace_id: "wE", number: 1, label: "app", agent_status: "working", pane_count: 2 },
      { workspace_id: "wC", number: 2, label: "docs", agent_status: "idle", pane_count: 1 },
    ],
    tabs: [
      { tab_id: "wE:t2", workspace_id: "wE", number: 2, label: "build" },
      { tab_id: "wE:t1", workspace_id: "wE", number: 1, label: "1" },
      { tab_id: "wC:t1", workspace_id: "wC", number: 1, label: "1" },
    ],
    panes: [
      { pane_id: "wE:p1", tab_id: "wE:t1", workspace_id: "wE", cwd: "/repo", agent: "claude", agent_status: "working" },
      { pane_id: "wE:p2", tab_id: "wE:t2", workspace_id: "wE", cwd: "/repo" },
      { pane_id: "wC:p1", tab_id: "wC:t1", workspace_id: "wC", cwd: "/docs" },
    ],
  };

  it("workspaceごとに配下paneをまとめる", () => {
    const sections = parseSpaceSections(source);
    expect(sections.map(({ space, panes }) => [space.id, panes.map((pane) => pane.id)])).toEqual([
      ["wE", ["wE:p1", "wE:p2"]],
      ["wC", ["wC:p1"]],
    ]);
  });

  it("paneに所属tabのラベルを持たせる", () => {
    const [app] = parseSpaceSections(source);
    expect(app.panes.map((pane) => pane.tabLabel)).toEqual(["1", "build"]);
  });
});
