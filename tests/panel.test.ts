import { describe, expect, it } from "vitest";
import { panelOrder, parseAgentGroups } from "../src/herdr/panel";

const snapshot = {
  workspaces: [
    { workspace_id: "wB", number: 2, label: "b", agent_status: "idle", tab_count: 1, pane_count: 1 },
    { workspace_id: "wA", number: 1, label: "a", agent_status: "blocked", tab_count: 2, pane_count: 2 },
  ],
  tabs: [
    { tab_id: "wA:t2", workspace_id: "wA", number: 2, label: "second" },
    { tab_id: "wA:t1", workspace_id: "wA", number: 1, label: "first" },
    { tab_id: "wB:t1", workspace_id: "wB", number: 1, label: "only" },
  ],
  panes: [],
  agents: [
    {
      agent: "claude",
      agent_status: "idle",
      pane_id: "wB:p1",
      tab_id: "wB:t1",
      workspace_id: "wB",
      terminal_title_stripped: "b-1",
    },
    {
      agent: "claude",
      agent_status: "blocked",
      pane_id: "wA:p2",
      tab_id: "wA:t2",
      workspace_id: "wA",
      terminal_title_stripped: "a-2",
    },
    {
      agent: "claude",
      agent_status: "working",
      pane_id: "wA:p10",
      tab_id: "wA:t1",
      workspace_id: "wA",
      terminal_title_stripped: "a-1-10",
    },
    {
      agent: "claude",
      agent_status: "done",
      pane_id: "wA:p1",
      tab_id: "wA:t1",
      workspace_id: "wA",
      terminal_title_stripped: "a-1-1",
    },
  ],
};

describe("panelOrder", () => {
  it("workspaceとtabを表示番号順に並べる", () => {
    expect(panelOrder(snapshot)).toEqual({
      workspaces: ["wA", "wB"],
      tabs: ["wA:t1", "wA:t2", "wB:t1"],
    });
  });
});

describe("parseAgentGroups", () => {
  it("spaceはworkspaceを見出しにし、配下をtab→pane順に並べる", () => {
    expect(
      parseAgentGroups(snapshot, "space").map((group) => [group.title, group.agents.map((a) => a.paneId)]),
    ).toEqual([
      ["a", ["wA:p1", "wA:p10", "wA:p2"]],
      ["b", ["wB:p1"]],
    ]);
  });

  it("agentが居ないworkspaceは見出しを出さない", () => {
    const empty = { ...snapshot, agents: [snapshot.agents[0]] };
    expect(parseAgentGroups(empty, "space").map((group) => group.title)).toEqual(["b"]);
  });

  it("snapshotに無いworkspaceのagentもその他に残す", () => {
    const stray = { ...snapshot, agents: [{ ...snapshot.agents[0], workspace_id: "wGone", tab_id: "wGone:t1" }] };
    expect(parseAgentGroups(stray, "space").map((group) => group.title)).toEqual(["その他"]);
  });

  it("statusは状態を見出しにし、要対応を先頭にする", () => {
    expect(parseAgentGroups(snapshot, "status").map((group) => [group.title, group.agents.length])).toEqual([
      ["Blocked", 1],
      ["Done", 1],
      ["Working", 1],
      ["Idle", 1],
    ]);
  });

  it("件数を見出しの副題に出す", () => {
    expect(parseAgentGroups(snapshot, "space")[0].subtitle).toBe("3");
  });
});
