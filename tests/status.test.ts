import { describe, expect, it } from "vitest";
import { agentIcon, attentionCount, dominantStatus, ENTITY_ICON, groupByStatus, sortAgents } from "../src/herdr/status";
import { Color } from "@raycast/api";
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

describe("agentIcon", () => {
  it("種別ごとに違うアイコンを返す", () => {
    expect(agentIcon("codex", Color.Orange)).not.toEqual(agentIcon("gemini", Color.Orange));
  });

  it("ロゴを持つ種別は色を塗らずそのまま返す", () => {
    expect(agentIcon("claude", Color.Orange)).toEqual({ source: "agents/claude.png" });
  });

  it("明暗のロゴがある種別はテーマごとに切り替える", () => {
    expect(agentIcon("cursor", Color.Orange)).toEqual({
      source: { light: "agents/cursor-light.png", dark: "agents/cursor-dark.png" },
    });
  });

  it("大文字小文字を無視する", () => {
    expect(agentIcon("Codex", Color.Orange)).toEqual(agentIcon("codex", Color.Orange));
  });

  it("未知の種別は共通のagentアイコンに状態色を乗せる", () => {
    expect(agentIcon("unknown-agent", Color.Orange)).toEqual({
      source: ENTITY_ICON.agent,
      tintColor: Color.Orange,
    });
  });
});

describe("agentIcon の網羅", () => {
  // herdr agent start --kind が受け付ける種別。全部にアイコンを割り当てておく。
  const kinds = [
    "pi", "claude", "codex", "gemini", "cursor", "devin", "agy", "cline", "omp", "mastracode",
    "opencode", "copilot", "kimi", "kiro", "droid", "amp", "grok", "hermes", "kilo", "qodercli",
    "qwen", "letta", "maki", "muse",
  ];

  it("既知の種別はすべて共通アイコン以外に解決する", () => {
    const fallback = kinds.filter((kind) => {
      const icon = agentIcon(kind, Color.Orange);
      return typeof icon === "object" && "source" in icon && icon.source === ENTITY_ICON.agent;
    });
    expect(fallback).toEqual([]);
  });

  it("同じアイコンを2つの種別に使わない", () => {
    const sources = kinds.map((kind) => JSON.stringify(agentIcon(kind, Color.Orange)));
    expect(new Set(sources).size).toBe(kinds.length);
  });
});
