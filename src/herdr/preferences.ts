import { Application, getPreferenceValues } from "@raycast/api";

export type HerdrPreferences = {
  herdrPath?: string;
  terminalApp?: Application;
};

const DEFAULT_HERDR_PATH = "/opt/homebrew/bin/herdr";

export function herdrBinaryPath(): string {
  const configured = preferences().herdrPath?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_HERDR_PATH;
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
