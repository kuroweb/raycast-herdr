import { execFile } from "node:child_process";
import { Application, open } from "@raycast/api";
import { herdrBinaryPath, terminalApp } from "./preferences";

/** Terminal App が未設定・未対応のときに使う、macOS標準のターミナル。 */
const TERMINAL_BUNDLE_ID = "com.apple.Terminal";
const ITERM_BUNDLE_ID = "com.googlecode.iterm2";

export type LaunchResult =
  | { kind: "launched"; appName: string }
  /** AppleScriptで新規ウィンドウを開けないアプリ。前面化だけ行い、起動は操作者に委ねる。 */
  | { kind: "activated"; appName: string };

/**
 * ターミナルの新規ウィンドウで `herdr` を起動する。
 * bare herdr は既存セッションがあればattachするので、起動と復帰を1つの操作で兼ねられる。
 */
export async function openHerdr(): Promise<LaunchResult> {
  const app = terminalApp();
  const command = launchCommand(herdrBinaryPath());
  const bundleId = app?.bundleId ?? TERMINAL_BUNDLE_ID;
  const appName = app?.name ?? "Terminal";

  const script = newWindowScript(bundleId, command);
  if (!script) {
    // 対応外のターミナルは前面化までにとどめる。誤ったAppleScriptで壊すよりは確実。
    await open(app?.path ?? TERMINAL_BUNDLE_ID);
    return { kind: "activated", appName };
  }

  await osascript(script);
  return { kind: "launched", appName };
}

/** ログインシェル経由で起動し、herdr側が前提にする環境変数を引き継ぐ。 */
export function launchCommand(binary: string): string {
  return `/bin/sh -lc ${shellQuote(binary)}`;
}

/** 対応ターミナルごとの新規ウィンドウ生成。未対応なら undefined。 */
export function newWindowScript(bundleId: string, command: string): string | undefined {
  const target = `tell application id ${appleScriptString(bundleId)}`;
  switch (bundleId) {
    case TERMINAL_BUNDLE_ID:
      return [target, "activate", `do script ${appleScriptString(command)}`, "end tell"].join("\n");
    case ITERM_BUNDLE_ID:
      return [
        target,
        "activate",
        `create window with default profile command ${appleScriptString(command)}`,
        "end tell",
      ].join("\n");
    default:
      return undefined;
  }
}

export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function appleScriptString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function osascript(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile("osascript", ["-e", script], { timeout: 10_000 }, (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }
      resolve();
    });
  });
}

export function isSupportedTerminal(app: Application | undefined): boolean {
  return newWindowScript(app?.bundleId ?? TERMINAL_BUNDLE_ID, "true") !== undefined;
}

/**
 * ターミナルを前面に出し、キーボード入力も渡す。
 * 既定は /usr/bin/open -a。LaunchServices 経由なので自動化の許可が要らず、
 * 許可未設定の環境でも確実に前面化できる。失敗したときだけ AppleScript の activate を試す。
 */
export async function activateTerminal(): Promise<void> {
  const app = terminalApp();
  if (!app) {
    return;
  }
  try {
    await openApp(app.path);
  } catch (error) {
    if (!app.bundleId) {
      throw error;
    }
    await osascript(`tell application id ${appleScriptString(app.bundleId)} to activate`);
  }
}

function openApp(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile("/usr/bin/open", ["-a", path], { timeout: 10_000 }, (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }
      resolve();
    });
  });
}
