import { Application, getPreferenceValues } from "@raycast/api";

export type HerdrPreferences = {
  herdrPath?: string;
  terminalApp?: Application;
  agentGrouping?: AgentGrouping;
};

/** agent一覧の見出しの付け方。 */
export type AgentGrouping = "space" | "status";

/** 既定はSpace単位。Herdrのサイドバーと同じ見え方にする。 */
const DEFAULT_AGENT_GROUPING: AgentGrouping = "space";

const DEFAULT_HERDR_PATH = "/opt/homebrew/bin/herdr";

export function herdrBinaryPath(): string {
  const configured = preferences().herdrPath?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_HERDR_PATH;
}

export function agentGrouping(): AgentGrouping {
  const configured = preferences().agentGrouping;
  return configured === "space" || configured === "status" ? configured : DEFAULT_AGENT_GROUPING;
}

export function terminalAppPath(): string | undefined {
  return preferences().terminalApp?.path;
}

export function terminalApp(): Application | undefined {
  return preferences().terminalApp;
}

function preferences(): HerdrPreferences {
  return getPreferenceValues<HerdrPreferences>();
}
