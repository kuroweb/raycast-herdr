import { closeMainWindow, open } from "@raycast/api";
import { focusAgent } from "./agent";
import { terminalAppPath } from "./preferences";

/**
 * Herdrのフォーカスを移したあとの後処理。
 * focus系コマンドはソケット越しにTUI内のフォーカスを移すだけで、Raycastは開いたまま、
 * ターミナルも前面に来ない。agentやworkspaceへ辿り着くのが目的なので、そこまでを1手で行う。
 */
export async function revealTerminal(): Promise<void> {
  // 先に閉じないと、後続のアプリ前面化がRaycastのウィンドウに隠れる。
  await closeMainWindow({ clearRootSearch: true });
  const app = terminalAppPath();
  if (app) {
    await open(app);
  }
}

export async function focusAgentAndReveal(target: string): Promise<void> {
  await focusAgent(target);
  await revealTerminal();
}
