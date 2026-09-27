import { Color, Icon } from "@raycast/api";
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

/** workspace / tab / pane を形で区別する。状態は同じアイコンの色で表す。 */
export const ENTITY_ICON = {
  workspace: Icon.AppWindowGrid2x2,
  tab: Icon.AppWindowList,
  pane: Icon.AppWindow,
} as const;

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
