import { describe, expect, it } from "vitest";
import { attentionCount, dominantStatus, groupByStatus, sortAgents } from "../src/herdr/status";
import { Agent, AgentStatus } from "../src/herdr/types";

function agent(status: AgentStatus, title: string): Agent {
  return {
    kind: "claude",
    status,
    paneId: `p:${title}`,
    tabId: "t1",
    workspaceId: "w1",
    cwd: "/tmp",
    title,
    focused: false,
  };
}

describe("sortAgents", () => {
  it("要対応(blocked→done)を先頭に、同順位はタイトル順にする", () => {
    const sorted = sortAgents([
      agent("idle", "idle-a"),
      agent("working", "working-a"),
      agent("done", "done-b"),
      agent("done", "done-a"),
      agent("unknown", "unknown-a"),
      agent("blocked", "blocked-a"),
    ]);

    expect(sorted.map((item) => item.title)).toEqual([
      "blocked-a",
      "done-a",
      "done-b",
      "working-a",
      "idle-a",
      "unknown-a",
    ]);
  });

  it("入力配列を破壊しない", () => {
    const input = [agent("idle", "b"), agent("blocked", "a")];
    sortAgents(input);
    expect(input.map((item) => item.title)).toEqual(["b", "a"]);
  });
});

describe("attentionCount", () => {
  it("blockedとdoneだけを数える", () => {
    expect(attentionCount([agent("blocked", "a"), agent("done", "b"), agent("working", "c"), agent("idle", "d")])).toBe(
      2,
    );
  });
});

describe("dominantStatus", () => {
  it("最優先のstatusを返す", () => {
    expect(dominantStatus([agent("idle", "a"), agent("working", "b")])).toBe("working");
  });

  it("agentが無ければundefined", () => {
    expect(dominantStatus([])).toBeUndefined();
  });
});

describe("groupByStatus", () => {
  it("status順のセクションにまとめる", () => {
    const groups = groupByStatus([agent("idle", "a"), agent("done", "b"), agent("idle", "c")]);
    expect(groups.map(({ status, agents }) => [status, agents.length])).toEqual([
      ["done", 1],
      ["idle", 2],
    ]);
  });
});
