import { describe, expect, it } from "vitest";
import { agentTitle, parseAgentList, parsePaneLabels, parseServerState } from "../src/herdr/agent";

describe("parseAgentList", () => {
  it("agent list の応答を正規化する", () => {
    const agents = parseAgentList({
      agents: [
        {
          agent: "claude",
          agent_status: "working",
          cwd: "/Users/u/project",
          foreground_cwd: "/Users/u/project/sub",
          focused: false,
          pane_id: "wE:p1",
          tab_id: "wE:t1",
          workspace_id: "wE",
          terminal_title: "◐ 実装中",
          terminal_title_stripped: "実装中",
        },
      ],
    });

    expect(agents).toEqual([
      {
        kind: "claude",
        status: "working",
        paneId: "wE:p1",
        tabId: "wE:t1",
        workspaceId: "wE",
        name: undefined,
        label: undefined,
        cwd: "/Users/u/project/sub",
        title: "実装中",
        focused: false,
      },
    ]);
  });

  it("未知のstatusはunknownに落とす", () => {
    const [agent] = parseAgentList({ agents: [{ pane_id: "w1:p1", agent_status: "restarting" }] });
    expect(agent.status).toBe("unknown");
  });

  it("pane_idを持たないagentは操作できないので除外する", () => {
    expect(parseAgentList({ agents: [{ agent: "claude" }] })).toEqual([]);
  });

  it("タイトルが無ければpane_idで代替する", () => {
    const [agent] = parseAgentList({ agents: [{ pane_id: "w1:p2", terminal_title_stripped: "   " }] });
    expect(agent.title).toBe("w1:p2");
  });

  it("agentsが無い応答は空配列にする", () => {
    expect(parseAgentList({})).toEqual([]);
  });
});

describe("parseServerState", () => {
  it("statusがrunningならrunning", () => {
    expect(parseServerState("status: running\nversion: 0.9.1\n")).toBe("running");
  });

  it("それ以外はstopped", () => {
    expect(parseServerState("status: stopped\n")).toBe("stopped");
  });
});

describe("parsePaneLabels", () => {
  it("pane list から pane_id → label を取る", () => {
    const labels = parsePaneLabels([
      { pane_id: "wE:p1", label: " 実装 " },
      { pane_id: "wE:p2" },
      { label: "pane_idなし" },
      "not a pane",
    ]);

    expect([...labels]).toEqual([["wE:p1", "実装"]]);
  });

  it("panesが配列でなければ空にする", () => {
    expect(parsePaneLabels(undefined).size).toBe(0);
  });
});

describe("parseAgentList with labels", () => {
  it("paneのラベルをagentに載せる", () => {
    const [agent] = parseAgentList(
      { agents: [{ pane_id: "wE:p1", terminal_title_stripped: "実装中" }] },
      new Map([["wE:p1", "レビュー担当"]]),
    );

    expect(agent.label).toBe("レビュー担当");
    expect(agent.title).toBe("実装中");
  });
});

describe("agentTitle", () => {
  it("ラベルがあればラベルを出す", () => {
    const [agent] = parseAgentList(
      { agents: [{ pane_id: "wE:p1", terminal_title_stripped: "実装中" }] },
      new Map([["wE:p1", "レビュー担当"]]),
    );
    expect(agentTitle(agent)).toBe("レビュー担当");
  });

  it("ラベルが無ければターミナルタイトルを出す", () => {
    const [agent] = parseAgentList({ agents: [{ pane_id: "wE:p1", terminal_title_stripped: "実装中" }] });
    expect(agentTitle(agent)).toBe("実装中");
  });
});
