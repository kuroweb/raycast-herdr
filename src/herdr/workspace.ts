import { homedir } from "node:os";
import { runJson } from "./cli";
import { fetchSnapshot, Snapshot } from "./snapshot";
import { parseWorkspacePanes, Pane } from "./layout";
import { AGENT_STATUSES, AgentStatus } from "./types";

export type Space = {
  id: string;
  /** TUIの表示番号。操作者はこの番号でworkspaceを覚えているので並び順の基準にする。 */
  number: number;
  label: string;
  /** workspace配下のagentを集約した状態。 */
  status: AgentStatus;
  tabCount: number;
  paneCount: number;
  focused: boolean;
  /** 配下paneから導出した代表ディレクトリ。workspace自体はcwdを持たない。 */
  cwd?: string;
  agentCount: number;
};

type RawWorkspace = {
  workspace_id?: unknown;
  number?: unknown;
  label?: unknown;
  agent_status?: unknown;
  tab_count?: unknown;
  pane_count?: unknown;
  focused?: unknown;
};

type RawPane = {
  workspace_id?: unknown;
  cwd?: unknown;
  foreground_cwd?: unknown;
  agent?: unknown;
};

/**
 * workspace一覧を取得する。workspace listではなくsnapshotを使うのは、
 * workspaceがcwdを持たず、代表ディレクトリを配下paneから導くのに1回で済ませたいため。
 */
export async function listSpaces(): Promise<Space[]> {
  return parseSpaces(await fetchSnapshot());
}

/** workspaceを見出し、配下paneを行にした一覧。階層を降りずに全paneを見渡すための形。 */
export type SpaceSection = { space: Space; panes: Pane[] };

export async function listSpaceSections(): Promise<SpaceSection[]> {
  return parseSpaceSections(await fetchSnapshot());
}

export function parseSpaceSections(snapshot: Snapshot): SpaceSection[] {
  return parseSpaces(snapshot).map((space) => ({ space, panes: parseWorkspacePanes(snapshot, space.id) }));
}

export function parseSpaces(snapshot: Snapshot): Space[] {
  const panes = Array.isArray(snapshot.panes) ? snapshot.panes.filter(isRecord<RawPane>) : [];
  const workspaces = Array.isArray(snapshot.workspaces) ? snapshot.workspaces.filter(isRecord<RawWorkspace>) : [];

  return workspaces
    .map((raw) => toSpace(raw, panes))
    .filter((space): space is Space => space !== undefined)
    .sort((a, b) => a.number - b.number);
}

function toSpace(raw: RawWorkspace, panes: RawPane[]): Space | undefined {
  const id = asString(raw.workspace_id);
  if (!id) {
    return undefined;
  }
  const own = panes.filter((pane) => asString(pane.workspace_id) === id);
  return {
    id,
    number: asNumber(raw.number) ?? 0,
    label: asString(raw.label) ?? id,
    status: toStatus(raw.agent_status),
    tabCount: asNumber(raw.tab_count) ?? 0,
    paneCount: asNumber(raw.pane_count) ?? 0,
    focused: raw.focused === true,
    cwd: representativeCwd(own),
    agentCount: own.filter((pane) => asString(pane.agent) !== undefined).length,
  };
}

/** paneが複数あるときは最も多いディレクトリを代表にする。同数なら先頭のpaneに従う。 */
function representativeCwd(panes: RawPane[]): string | undefined {
  const counts = new Map<string, number>();
  for (const pane of panes) {
    const cwd = asString(pane.foreground_cwd) ?? asString(pane.cwd);
    if (cwd) {
      counts.set(cwd, (counts.get(cwd) ?? 0) + 1);
    }
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [cwd, count] of counts) {
    if (count > bestCount) {
      best = cwd;
      bestCount = count;
    }
  }
  return best;
}

/** 入力された ~ 始まりのパスを絶対パスに開く。手入力を受け付けるため。 */
export function expandPath(input: string, home = homedir()): string {
  const trimmed = input.trim();
  if (trimmed === "~") {
    return home;
  }
  return trimmed.startsWith("~/") ? `${home}${trimmed.slice(1)}` : trimmed;
}

/** ホーム配下は ~ に畳む。一覧の幅を食わずにどのプロジェクトか分かるようにするため。 */
export function shortenPath(path: string, home = homedir()): string {
  return path === home ? "~" : path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
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

export async function focusSpace(id: string): Promise<void> {
  await runJson(["workspace", "focus", id]);
}

export async function createSpace(options: { cwd?: string; label?: string }): Promise<void> {
  const args = ["workspace", "create", "--focus"];
  if (options.cwd) {
    args.push("--cwd", options.cwd);
  }
  if (options.label) {
    args.push("--label", options.label);
  }
  await runJson(args);
}

export async function renameSpace(id: string, label: string): Promise<void> {
  await runJson(["workspace", "rename", id, label]);
}

export async function closeSpace(id: string): Promise<void> {
  await runJson(["workspace", "close", id]);
}
