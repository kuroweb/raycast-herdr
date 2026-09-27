import { closeMainWindow, open } from "@raycast/api";
import { focusAgent } from "./agent";
import { terminalAppPath } from "./preferences";

/**
 * agent focus はソケット越しにTUI内のフォーカスを移すだけで、ターミナルは前面に来ず
 * Raycastも開いたままになる。agentへ辿り着くのが目的の操作なので、
 * Raycastを閉じてターミナルを前面化するところまでを1手で行う。
 */
export async function focusAgentAndReveal(target: string): Promise<void> {
  await focusAgent(target);
  // 先に閉じないと、後続のアプリ前面化がRaycastのウィンドウに隠れる。
  await closeMainWindow({ clearRootSearch: true });
  const app = terminalAppPath();
  if (app) {
    await open(app);
  }
}
