import { Application, getPreferenceValues } from "@raycast/api";

export type HerdrPreferences = {
  herdrPath?: string;
  terminalApp?: Application;
  readLines?: string;
};

const DEFAULT_HERDR_PATH = "/opt/homebrew/bin/herdr";
const DEFAULT_READ_LINES = 200;

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

export function readLines(): number {
  const parsed = Number.parseInt(preferences().readLines ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_READ_LINES;
}

function preferences(): HerdrPreferences {
  return getPreferenceValues<HerdrPreferences>();
}
