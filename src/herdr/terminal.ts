import { closeMainWindow } from "@raycast/api";
import { focusPaneTarget } from "./layout";
import { Agent } from "./types";
import { activateTerminal } from "./launch";

/**
 * Herdrのフォーカスを移したあとの後処理。
 * focus系コマンドはソケット越しにTUI内のフォーカスを移すだけで、Raycastは開いたまま、
 * ターミナルも前面に来ない。agentやworkspaceへ辿り着くのが目的なので、そこまでを1手で行う。
 */
export async function revealTerminal(): Promise<void> {
  // 先にターミナルを前面化する。closeMainWindow のあとだとRaycastがコマンドの実行を
  // 打ち切るため、前面化が走らないまま終わることがある。
  // Raycastはフォーカスを失うと自分でウィンドウを閉じるので、この順でも取り残されない。
  await activateTerminal();
  await closeMainWindow({ clearRootSearch: true });
}

export async function focusAgentAndReveal(agent: Agent): Promise<void> {
  await focusPaneTarget({
    id: agent.paneId,
    tabId: agent.tabId,
    workspaceId: agent.workspaceId,
    agent: agent.kind,
  });
  await revealTerminal();
}
