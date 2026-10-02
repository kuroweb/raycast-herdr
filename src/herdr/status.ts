import { Color, Icon, Image } from "@raycast/api";
import { Agent, AgentStatus } from "./types";

type StatusPresentation = {
  label: string;
  icon: Icon;
  color: Color;
  /** 小さいほど一覧で上に来る。要対応のものを先頭へ。 */
  weight: number;
  /** 通知が必要な状態（メニューバーのカウント対象）。 */
  needsAttention: boolean;
};

const PRESENTATION: Record<AgentStatus, StatusPresentation> = {
  blocked: { label: "Blocked", icon: Icon.ExclamationMark, color: Color.Red, weight: 0, needsAttention: true },
  done: { label: "Done", icon: Icon.CheckCircle, color: Color.Green, weight: 1, needsAttention: true },
  working: { label: "Working", icon: Icon.CircleProgress50, color: Color.Orange, weight: 2, needsAttention: false },
  idle: { label: "Idle", icon: Icon.Circle, color: Color.SecondaryText, weight: 3, needsAttention: false },
  unknown: { label: "Unknown", icon: Icon.QuestionMark, color: Color.SecondaryText, weight: 4, needsAttention: false },
};

/** workspace / tab / pane / agent を形で区別する。状態は同じアイコンの色で表す。 */
export const ENTITY_ICON = {
  workspace: Icon.AppWindowGrid2x2,
  tab: Icon.AppWindowList,
  pane: Icon.AppWindow,
  /** agentに対する操作。種別ごとの区別が要らない場面で使う。 */
  agent: Icon.MemoryChip,
  /** agentが動いていないpane。中身はシェルなので、そう見える形にする。 */
  shell: Icon.Terminal,
} as const;

/**
 * agent種別ごとのアイコン。
 * ロゴが手元にあるものはロゴを使い、無いものは種別が違えば形が違う、という区別に徹する。
 */
const AGENT_KIND_ICON: Record<string, Image.ImageLike> = {
  // ロゴは公式のHerdr拡張(raycast/extensions)のものに合わせる。
  amp: { source: "agents/amp.png" },
  claude: { source: "agents/claude.png" },
  cline: { source: { light: "agents/cline-light.png", dark: "agents/cline-dark.png" } },
  codex: { source: "agents/codex.png" },
  copilot: { source: { light: "agents/copilot-light.png", dark: "agents/copilot-dark.png" } },
  cursor: { source: { light: "agents/cursor-light.png", dark: "agents/cursor-dark.png" } },
  gemini: { source: "agents/gemini.png" },
  grok: { source: { light: "agents/grok-light.png", dark: "agents/grok-dark.png" } },
  hermes: { source: { light: "agents/hermes-light.png", dark: "agents/hermes-dark.png" } },
  kilo: { source: { light: "agents/kilo-light.png", dark: "agents/kilo-dark.png" } },
  kimi: { source: "agents/kimi.png" },
  mastracode: { source: { light: "agents/mastracode-light.png", dark: "agents/mastracode-dark.png" } },
  opencode: { source: { light: "agents/opencode-light.png", dark: "agents/opencode-dark.png" } },
  pi: { source: { light: "agents/pi-light.svg", dark: "agents/pi-dark.svg" } },
  qodercli: { source: "agents/qodercli.png" },
  // ロゴが無い種別は、形が重ならない組み込みアイコンで区別する。
  agy: Icon.Anchor,
  devin: Icon.Hammer,
  droid: Icon.Cog,
  kiro: Icon.Leaf,
  letta: Icon.Bookmark,
  maki: Icon.CircleFilled,
  muse: Icon.Brush,
  omp: Icon.Box,
  qwen: Icon.Globe,
};

/**
 * 状態の色は形の上に乗せる。ただしロゴは色を塗ると別物になるので、そのまま出す。
 * その場合の状態は右端のタグで読む。
 */
export function agentIcon(kind: string, color: Color): Image.ImageLike {
  const icon = AGENT_KIND_ICON[kind.toLowerCase()] ?? ENTITY_ICON.agent;
  return typeof icon === "object" ? icon : { source: icon, tintColor: color };
}

export function presentation(status: AgentStatus): StatusPresentation {
  return PRESENTATION[status];
}

/** 要対応(blocked→done)→working→idle→unknown、同順位内はタイトル順で安定させる。 */
export function sortAgents(agents: Agent[]): Agent[] {
  return [...agents].sort((a, b) => {
    const diff = presentation(a.status).weight - presentation(b.status).weight;
    return diff !== 0 ? diff : a.title.localeCompare(b.title);
  });
}

/** Space単位の並びに必要な表示順。workspace / tab のIDをHerdrの表示順どおりに並べたもの。 */
export type PanelOrder = { workspaces: string[]; tabs: string[] };

/**
 * workspace → tab → pane の表示順に並べる。
 * Herdrのサイドバーと同じ並びにして、TUIと一覧で位置が食い違わないようにする。
 */
export function sortAgentsBySpaces(agents: Agent[], order: PanelOrder): Agent[] {
  const workspaceRank = rankOf(order.workspaces);
  const tabRank = rankOf(order.tabs);
  return [...agents].sort((a, b) => {
    const byWorkspace = workspaceRank(a.workspaceId) - workspaceRank(b.workspaceId);
    if (byWorkspace !== 0) {
      return byWorkspace;
    }
    const byTab = tabRank(a.tabId) - tabRank(b.tabId);
    if (byTab !== 0) {
      return byTab;
    }
    // 同じtab内はpane ID順。分割した順に並ぶので、画面上の並びに近い。
    return a.paneId.localeCompare(b.paneId, undefined, { numeric: true });
  });
}

/** 表示順に無いIDは末尾へ。snapshot取得後にworkspaceが消えても落とさないため。 */
function rankOf(ids: string[]): (id: string) => number {
  const ranks = new Map(ids.map((id, index) => [id, index]));
  return (id) => ranks.get(id) ?? Number.MAX_SAFE_INTEGER;
}

export function attentionCount(agents: Agent[]): number {
  return agents.filter((agent) => presentation(agent.status).needsAttention).length;
}

/** メニューバーのアイコン色を決める最優先status。 */
export function dominantStatus(agents: Agent[]): AgentStatus | undefined {
  return sortAgents(agents)[0]?.status;
}

export function groupByStatus(agents: Agent[]): { status: AgentStatus; agents: Agent[] }[] {
  const groups = new Map<AgentStatus, Agent[]>();
  for (const agent of sortAgents(agents)) {
    const bucket = groups.get(agent.status);
    if (bucket) {
      bucket.push(agent);
    } else {
      groups.set(agent.status, [agent]);
    }
  }
  return [...groups].map(([status, grouped]) => ({ status, agents: grouped }));
}
