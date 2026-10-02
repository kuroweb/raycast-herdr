import { parseAgentList } from "./agent";
import { parseTabs } from "./layout";
import { agentGrouping, AgentGrouping } from "./preferences";
import { fetchSnapshot, Snapshot } from "./snapshot";
import { groupByStatus, PanelOrder, presentation, sortAgentsBySpaces } from "./status";
import { Agent } from "./types";
import { parseSpaces } from "./workspace";

/** 一覧の見出しと、その下に並ぶagent。見出しの意味はグルーピング方法で変わる。 */
export type AgentGroup = { key: string; title: string; subtitle: string; agents: Agent[] };

/**
 * agent一覧を見出し付きのグループで取得する。
 * グルーピングはRaycastのGrouping設定で決める。
 */
export async function listAgentGroups(): Promise<AgentGroup[]> {
  // 見出しと並びにworkspace/tabの表示順が必要なので、agent listではなくsnapshotから作る。
  return parseAgentGroups(await fetchSnapshot(), agentGrouping());
}

export function parseAgentGroups(snapshot: Snapshot, grouping: AgentGrouping): AgentGroup[] {
  const agents = parseAgentList(snapshot);
  return grouping === "status" ? statusGroups(agents) : spaceGroups(snapshot, agents);
}

/** workspaceを見出しにする。空のworkspaceは見出しだけが残るので出さない。 */
function spaceGroups(snapshot: Snapshot, agents: Agent[]): AgentGroup[] {
  const ordered = sortAgentsBySpaces(agents, panelOrder(snapshot));
  const spaces = parseSpaces(snapshot);
  const groups = spaces.map((space) => ({
    key: space.id,
    title: space.label,
    agents: ordered.filter((agent) => agent.workspaceId === space.id),
  }));
  // snapshotに無いworkspaceのagentも落とさない。取得タイミングのずれで起こりうる。
  const known = new Set(spaces.map((space) => space.id));
  const orphans = ordered.filter((agent) => !known.has(agent.workspaceId));
  return [...groups, { key: "unknown-workspace", title: "その他", agents: orphans }]
    .filter((group) => group.agents.length > 0)
    .map((group) => ({ ...group, subtitle: `${group.agents.length}` }));
}

/** 状態を見出しにする。要対応のものが上に来る。 */
function statusGroups(agents: Agent[]): AgentGroup[] {
  return groupByStatus(agents).map(({ status, agents: grouped }) => ({
    key: status,
    title: presentation(status).label,
    subtitle: `${grouped.length}`,
    agents: grouped,
  }));
}

/** snapshot上のworkspace/tabを、Herdrの表示番号順のIDリストにする。 */
export function panelOrder(snapshot: Snapshot): PanelOrder {
  const spaces = parseSpaces(snapshot);
  return {
    workspaces: spaces.map((space) => space.id),
    tabs: spaces.flatMap((space) => parseTabs(snapshot, space.id).map((tab) => tab.id)),
  };
}
