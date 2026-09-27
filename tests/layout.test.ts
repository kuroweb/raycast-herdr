import { describe, expect, it } from "vitest";
import { directionsTo, parseLayout, parsePanes, parseProcessName, parseTabs } from "../src/herdr/layout";

const snapshot = {
  tabs: [
    { tab_id: "wE:t2", workspace_id: "wE", number: 2, label: "build", agent_status: "idle", pane_count: 1, focused: false },
    { tab_id: "wE:t1", workspace_id: "wE", number: 1, label: "1", agent_status: "working", pane_count: 2, focused: true },
    { tab_id: "wC:t1", workspace_id: "wC", number: 1, label: "1", agent_status: "idle", pane_count: 1, focused: false },
  ],
  panes: [
    {
      pane_id: "wE:p10",
      tab_id: "wE:t1",
      workspace_id: "wE",
      cwd: "/repo",
      terminal_title: "◐ 実装中",
      terminal_title_stripped: "実装中",
      agent: "claude",
      agent_status: "working",
      focused: true,
    },
    { pane_id: "wE:p2", tab_id: "wE:t1", workspace_id: "wE", cwd: "/repo", terminal_title_stripped: "zsh" },
    { pane_id: "wE:p3", tab_id: "wE:t2", workspace_id: "wE", cwd: "/repo" },
  ],
};

describe("parseTabs", () => {
  it("指定workspaceのtabだけを番号順に返す", () => {
    expect(parseTabs(snapshot, "wE").map((tab) => tab.id)).toEqual(["wE:t1", "wE:t2"]);
  });

  it("tab_idが無い要素は除外する", () => {
    expect(parseTabs({ tabs: [{ workspace_id: "wE", number: 1 }] }, "wE")).toEqual([]);
  });
});

describe("parsePanes", () => {
  it("指定tabのpaneだけをpane ID順に返す", () => {
    // p10 が p2 より後ろに来るよう、数値を考慮して並べる。
    expect(parsePanes(snapshot, "wE:t1").map((pane) => pane.id)).toEqual(["wE:p2", "wE:p10"]);
  });

  it("agentが居ないpaneはagentをundefinedにする", () => {
    const [plain] = parsePanes(snapshot, "wE:t1");
    expect(plain.agent).toBeUndefined();
    expect(plain.status).toBe("unknown");
  });

  it("ターミナルタイトルが無ければtitleを持たない", () => {
    const [pane] = parsePanes({ panes: [{ pane_id: "w1:p1", tab_id: "w1:t1" }] }, "w1:t1");
    expect(pane.title).toBeUndefined();
  });

  it("agentのpaneは種別と状態を持つ", () => {
    const [, withAgent] = parsePanes(snapshot, "wE:t1");
    expect(withAgent.agent).toBe("claude");
    expect(withAgent.status).toBe("working");
    expect(withAgent.title).toBe("実装中");
  });

  it("panesが無いsnapshotでも落ちない", () => {
    expect(parsePanes({}, "wE:t1")).toEqual([]);
  });
});

describe("directionsTo", () => {
  const from = { x: 0, y: 0, width: 100, height: 50 };

  it("横方向の差が大きければ左右を優先する", () => {
    expect(directionsTo(from, { x: 200, y: 10, width: 100, height: 50 })).toEqual(["right", "down"]);
  });

  it("縦方向の差が大きければ上下を優先する", () => {
    expect(directionsTo(from, { x: 10, y: 200, width: 100, height: 50 })).toEqual(["down", "right"]);
  });

  it("真横に並ぶなら1方向だけ返す", () => {
    expect(directionsTo(from, { x: 100, y: 0, width: 100, height: 50 })).toEqual(["right"]);
  });

  it("左上へ戻る場合も向きを返す", () => {
    const target = { x: 0, y: 0, width: 100, height: 50 };
    expect(directionsTo({ x: 200, y: 100, width: 100, height: 50 }, target)).toEqual(["left", "up"]);
  });
});

describe("parseLayout", () => {
  it("focused_pane_idとpaneのrectを取り出す", () => {
    expect(
      parseLayout({
        focused_pane_id: "wC:p1",
        panes: [
          { focused: true, pane_id: "wC:p1", rect: { x: 0, y: 0, width: 99, height: 49 } },
          { focused: false, pane_id: "wC:p2", rect: { x: 0, y: 49, width: 99, height: 21 } },
        ],
      }),
    ).toEqual({
      focusedPaneId: "wC:p1",
      panes: [
        { paneId: "wC:p1", rect: { x: 0, y: 0, width: 99, height: 49 } },
        { paneId: "wC:p2", rect: { x: 0, y: 49, width: 99, height: 21 } },
      ],
    });
  });

  it("rectが欠けたpaneは除外する", () => {
    expect(parseLayout({ panes: [{ pane_id: "w1:p1" }] })).toEqual({ focusedPaneId: undefined, panes: [] });
  });

  it("layoutがnullでも落ちない", () => {
    expect(parseLayout(null)).toEqual({ panes: [] });
  });
});

describe("parseProcessName", () => {
  it("前面プロセスの名前を返す", () => {
    expect(parseProcessName({ foreground_processes: [{ name: "zsh", argv0: "zsh" }] })).toBe("zsh");
  });

  it("nameが無ければargv0の先頭のハイフンを落として使う", () => {
    expect(parseProcessName({ foreground_processes: [{ argv0: "-zsh" }] })).toBe("zsh");
  });

  it("プロセスが無ければundefined", () => {
    expect(parseProcessName({ foreground_processes: [] })).toBeUndefined();
  });

  it("想定外の形でも落ちない", () => {
    expect(parseProcessName(null)).toBeUndefined();
  });
});
