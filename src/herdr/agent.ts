import { runJson, runText, runVoid } from "./cli";
import { AGENT_STATUSES, Agent, AgentStatus } from "./types";

type RawAgent = {
  agent?: unknown;
  agent_status?: unknown;
  agent_name?: unknown;
  name?: unknown;
  pane_id?: unknown;
  tab_id?: unknown;
  workspace_id?: unknown;
  cwd?: unknown;
  foreground_cwd?: unknown;
  terminal_title?: unknown;
  terminal_title_stripped?: unknown;
  focused?: unknown;
};

export async function listAgents(): Promise<Agent[]> {
  const result = await runJson<{ agents?: unknown }>(["agent", "list"]);
  return parseAgentList(result);
}

/** agent list の result を Agent[] に正規化する。CLIの型揺れをUIに漏らさないための境界。 */
export function parseAgentList(result: { agents?: unknown }): Agent[] {
  if (!Array.isArray(result.agents)) {
    return [];
  }
  return result.agents
    .filter(isRecord)
    .map((raw) => toAgent(raw))
    .filter((agent): agent is Agent => agent !== undefined);
}

/** 一覧やナビゲーションの見出し。agent が報告するターミナルタイトル（正規化済み）。 */
export function agentTitle(agent: Agent): string {
  return agent.title;
}

function toAgent(raw: RawAgent): Agent | undefined {
  const paneId = asString(raw.pane_id);
  if (!paneId) {
    // pane_id は agent commands の target なので、無いものは操作できず表示しない。
    return undefined;
  }
  const cwd = asString(raw.foreground_cwd) ?? asString(raw.cwd) ?? "";
  const title = asString(raw.terminal_title_stripped) ?? asString(raw.terminal_title) ?? paneId;
  return {
    kind: asString(raw.agent) ?? "unknown",
    status: toStatus(raw.agent_status),
    paneId,
    tabId: asString(raw.tab_id) ?? "",
    workspaceId: asString(raw.workspace_id) ?? "",
    name: asString(raw.agent_name) ?? asString(raw.name),
    cwd,
    title: title.trim().length > 0 ? title.trim() : paneId,
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

function isRecord(value: unknown): value is RawAgent {
  return typeof value === "object" && value !== null;
}

export async function focusAgent(target: string): Promise<void> {
  await runJson(["agent", "focus", target]);
}

export async function promptAgent(target: string, text: string): Promise<void> {
  // --wait を付けない: Raycast側でagentの応答完了まで待つとUIが固まる。
  await runJson(["agent", "prompt", target, text]);
}

export async function renameAgent(target: string, name: string): Promise<void> {
  await runJson(["agent", "rename", target, name]);
}

export async function clearAgentName(target: string): Promise<void> {
  await runJson(["agent", "rename", target, "--clear"]);
}

/** 承認や質問への応答。キー名は herdr の語彙（esc, enter, up, down, 数字 など）。 */
export async function sendAgentKeys(target: string, keys: string[]): Promise<void> {
  await runVoid(["agent", "send-keys", target, ...keys]);
}

/**
 * Herdrが「応答待ち」と判定した画面を読む。
 * 通常の出力より狭い範囲で、承認や選択肢の部分だけが返る。
 */
export async function readAgentDetection(target: string): Promise<string> {
  return runText(["agent", "read", target, "--source", "detection", "--format", "text"]);
}

export type ServerState = "running" | "stopped";

/** herdr status のテキスト出力からサーバ稼働を判定する。 */
export async function serverState(): Promise<ServerState> {
  const output = await runText(["status", "server"]);
  return parseServerState(output);
}

export function parseServerState(output: string): ServerState {
  return /^\s*status:\s*running\s*$/m.test(output) ? "running" : "stopped";
}
