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
  // ロゴが手元のアプリから取れるもの
  claude: { source: "agent-claude.png" },
  codex: { source: "agent-codex.png" },
  cursor: { source: "agent-cursor.png" },
  // 以降は herdr agent start --kind が受け付ける種別。形が重ならないように割り当てる。
  agy: Icon.Anchor,
  amp: Icon.Bolt,
  cline: Icon.CodeBlock,
  copilot: Icon.Airplane,
  devin: Icon.Hammer,
  droid: Icon.Cog,
  gemini: Icon.Stars,
  grok: Icon.Wand,
  hermes: Icon.Envelope,
  kilo: Icon.Gauge,
  kimi: Icon.Moon,
  kiro: Icon.Leaf,
  letta: Icon.Bookmark,
  maki: Icon.CircleFilled,
  mastracode: Icon.Book,
  muse: Icon.Brush,
  omp: Icon.Box,
  opencode: Icon.Terminal,
  pi: Icon.Calculator,
  qodercli: Icon.Code,
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
