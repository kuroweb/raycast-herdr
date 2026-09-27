import { runJson, runText } from "./cli";
import { request } from "./socket";
import { focusAgent } from "./agent";
import { readLines } from "./preferences";
import { fetchSnapshot, Snapshot } from "./snapshot";
import { AGENT_STATUSES, AgentStatus } from "./types";

export type Tab = {
  id: string;
  workspaceId: string;
  /** TUIの表示番号。tabはこの番号で切り替えるので並び順の基準にする。 */
  number: number;
  label: string;
  status: AgentStatus;
  paneCount: number;
  focused: boolean;
};

export type Pane = {
  id: string;
  tabId: string;
  workspaceId: string;
  /** rename で付けた表示名。未設定なら undefined。 */
  label?: string;
  /** ANSI装飾と状態記号を除いたターミナルタイトル。 */
  title: string;
  /** 所属tabの表示名。flat表示でどのtabのpaneかを示すために持つ。 */
  tabLabel?: string;
  cwd: string;
  /** agentが居るpaneのみ。agent commands の可否を分ける。 */
  agent?: string;
  status: AgentStatus;
  focused: boolean;
};

type RawTab = {
  tab_id?: unknown;
  workspace_id?: unknown;
  number?: unknown;
  label?: unknown;
  agent_status?: unknown;
  pane_count?: unknown;
  focused?: unknown;
};

type RawPane = {
  pane_id?: unknown;
  tab_id?: unknown;
  workspace_id?: unknown;
  label?: unknown;
  terminal_title?: unknown;
  terminal_title_stripped?: unknown;
  cwd?: unknown;
  foreground_cwd?: unknown;
  agent?: unknown;
  agent_status?: unknown;
  focused?: unknown;
};

export async function listTabs(workspaceId: string): Promise<Tab[]> {
  return parseTabs(await fetchSnapshot(), workspaceId);
}

export async function listPanes(tabId: string): Promise<Pane[]> {
  return parsePanes(await fetchSnapshot(), tabId);
}

export function parseTabs(source: Snapshot, workspaceId: string): Tab[] {
  const tabs = Array.isArray((source as { tabs?: unknown }).tabs)
    ? ((source as { tabs: unknown[] }).tabs.filter(isRecord<RawTab>) as RawTab[])
    : [];
  return tabs
    .filter((raw) => asString(raw.workspace_id) === workspaceId)
    .map(toTab)
    .filter((tab): tab is Tab => tab !== undefined)
    .sort((a, b) => a.number - b.number);
}

/** workspace配下の全paneを、tabの番号順・pane ID順に並べて返す。 */
export function parseWorkspacePanes(source: Snapshot, workspaceId: string): Pane[] {
  return parseTabs(source, workspaceId).flatMap((tab) =>
    parsePanes(source, tab.id).map((pane) => ({ ...pane, tabLabel: tab.label })),
  );
}

export function parsePanes(source: Snapshot, tabId: string): Pane[] {
  const panes = Array.isArray(source.panes) ? (source.panes.filter(isRecord<RawPane>) as RawPane[]) : [];
  return panes
    .filter((raw) => asString(raw.tab_id) === tabId)
    .map(toPane)
    .filter((pane): pane is Pane => pane !== undefined)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

function toTab(raw: RawTab): Tab | undefined {
  const id = asString(raw.tab_id);
  if (!id) {
    return undefined;
  }
  return {
    id,
    workspaceId: asString(raw.workspace_id) ?? "",
    number: asNumber(raw.number) ?? 0,
    label: asString(raw.label) ?? id,
    status: toStatus(raw.agent_status),
    paneCount: asNumber(raw.pane_count) ?? 0,
    focused: raw.focused === true,
  };
}

function toPane(raw: RawPane): Pane | undefined {
  const id = asString(raw.pane_id);
  if (!id) {
    return undefined;
  }
  const title = asString(raw.terminal_title_stripped) ?? asString(raw.terminal_title) ?? id;
  return {
    id,
    tabId: asString(raw.tab_id) ?? "",
    workspaceId: asString(raw.workspace_id) ?? "",
    label: asString(raw.label),
    title: title.trim().length > 0 ? title.trim() : id,
    cwd: asString(raw.foreground_cwd) ?? asString(raw.cwd) ?? "",
    agent: asString(raw.agent),
    status: toStatus(raw.agent_status),
    focused: raw.focused === true,
  };
}

function toStatus(value: unknown): AgentStatus {
  const candidate = asString(value);
  return AGENT_STATUSES.find((status) => status === candidate) ?? "unknown";
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isRecord<T>(value: unknown): value is T {
  return typeof value === "object" && value !== null;
}

export async function focusTab(tabId: string): Promise<void> {
  await runJson(["tab", "focus", tabId]);
}

export async function createTab(options: { workspaceId: string; cwd?: string; label?: string }): Promise<void> {
  const args = ["tab", "create", "--workspace", options.workspaceId, "--focus"];
  if (options.cwd) {
    args.push("--cwd", options.cwd);
  }
  if (options.label) {
    args.push("--label", options.label);
  }
  await runJson(args);
}

export async function renameTab(tabId: string, label: string): Promise<void> {
  await runJson(["tab", "rename", tabId, label]);
}

export async function closeTab(tabId: string): Promise<void> {
  await runJson(["tab", "close", tabId]);
}

export type Rect = { x: number; y: number; width: number; height: number };

export type Direction = "left" | "right" | "up" | "down";

type LayoutPane = { paneId: string; rect: Rect };

type Layout = { focusedPaneId?: string; panes: LayoutPane[] };

/** 隣接移動を何回まで試すか。分割は高々数段なので、これを超えたら諦める。 */
const MAX_FOCUS_STEPS = 8;

/**
 * paneへフォーカスする。
 * workspace と tab を辿ってから pane を指す。pane は CLI に ID 指定のフォーカスが無いため、
 * ソケットAPIの pane.focus を直接呼ぶ。届かない場合だけ、従来の隣接移動へ落とす。
 */
export async function focusPane(pane: Pane): Promise<void> {
  await focusPaneTarget(pane);
}

/** agent一覧からも同じ経路でフォーカスできるよう、必要な識別子だけを受ける。 */
export type PaneTarget = { id: string; tabId: string; workspaceId: string; agent?: string };

export async function focusPaneTarget(target: PaneTarget): Promise<void> {
  await runJson(["workspace", "focus", target.workspaceId]);
  await focusTab(target.tabId);
  try {
    await request("pane.focus", { pane_id: target.id });
  } catch {
    if (target.agent) {
      await focusAgent(target.id);
      return;
    }
    await stepFocusTo(target.id);
  }
}

async function stepFocusTo(target: string): Promise<void> {
  let previous: string | undefined;
  for (let step = 0; step < MAX_FOCUS_STEPS; step++) {
    const layout = await paneLayout(target);
    if (layout.focusedPaneId === target) {
      return;
    }
    const current = layout.panes.find((item) => item.paneId === layout.focusedPaneId);
    const goal = layout.panes.find((item) => item.paneId === target);
    if (!current || !goal) {
      return;
    }
    // 前回と同じpaneに留まっているなら、その向きには動けないので次の候補を使う。
    const stuck = previous === current.paneId;
    const direction = directionsTo(current.rect, goal.rect)[stuck ? 1 : 0];
    if (!direction) {
      return;
    }
    previous = current.paneId;
    await runJson(["pane", "focus", "--direction", direction, "--pane", current.paneId]);
  }
}

/** from から to へ向かう方向を、差が大きい軸を優先して並べる。 */
export function directionsTo(from: Rect, to: Rect): Direction[] {
  const dx = centerOf(to).x - centerOf(from).x;
  const dy = centerOf(to).y - centerOf(from).y;
  const horizontal: Direction | undefined = dx === 0 ? undefined : dx > 0 ? "right" : "left";
  const vertical: Direction | undefined = dy === 0 ? undefined : dy > 0 ? "down" : "up";
  const ordered = Math.abs(dx) >= Math.abs(dy) ? [horizontal, vertical] : [vertical, horizontal];
  return ordered.filter((direction): direction is Direction => direction !== undefined);
}

function centerOf(rect: Rect): { x: number; y: number } {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

async function paneLayout(paneId: string): Promise<Layout> {
  const result = await runJson<{ layout?: unknown }>(["pane", "layout", "--pane", paneId]);
  return parseLayout(result.layout);
}

export function parseLayout(source: unknown): Layout {
  if (typeof source !== "object" || source === null) {
    return { panes: [] };
  }
  const raw = source as { focused_pane_id?: unknown; panes?: unknown };
  const panes = Array.isArray(raw.panes) ? raw.panes : [];
  return {
    focusedPaneId: asString(raw.focused_pane_id),
    panes: panes.map((item) => toLayoutPane(item)).filter((item): item is LayoutPane => item !== undefined),
  };
}

function toLayoutPane(source: unknown): LayoutPane | undefined {
  if (typeof source !== "object" || source === null) {
    return undefined;
  }
  const raw = source as { pane_id?: unknown; rect?: unknown };
  const paneId = asString(raw.pane_id);
  const rect = toRect(raw.rect);
  return paneId && rect ? { paneId, rect } : undefined;
}

function toRect(source: unknown): Rect | undefined {
  if (typeof source !== "object" || source === null) {
    return undefined;
  }
  const raw = source as { x?: unknown; y?: unknown; width?: unknown; height?: unknown };
  const x = asNumber(raw.x);
  const y = asNumber(raw.y);
  const width = asNumber(raw.width);
  const height = asNumber(raw.height);
  return x === undefined || y === undefined || width === undefined || height === undefined
    ? undefined
    : { x, y, width, height };
}

export async function renamePane(paneId: string, label: string): Promise<void> {
  await runJson(["pane", "rename", paneId, label]);
}

export async function clearPaneLabel(paneId: string): Promise<void> {
  await runJson(["pane", "rename", paneId, "--clear"]);
}

export async function closePane(paneId: string): Promise<void> {
  await runJson(["pane", "close", paneId]);
}

export async function splitPane(paneId: string, direction: "right" | "down"): Promise<void> {
  await runJson(["pane", "split", "--pane", paneId, "--direction", direction, "--focus"]);
}

export async function toggleZoom(paneId: string): Promise<void> {
  await runJson(["pane", "zoom", "--pane", paneId, "--toggle"]);
}

export async function readPaneOutput(paneId: string): Promise<string> {
  return runText(["pane", "read", paneId, "--source", "recent", "--lines", String(readLines()), "--format", "text"]);
}
