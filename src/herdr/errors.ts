import { HerdrCliError, HerdrUnavailableError } from "./types";

const MESSAGES: Record<string, string> = {
  agent_not_found: "対象のagentが見つかりません。一覧を更新してください。",
  agent_blocked: "agentが承認待ち(blocked)のため送信できません。ターミナルで応答してください。",
  agent_prompt_stalled: "プロンプトを送信しましたが、agentが反応しませんでした。",
  timeout: "herdrの応答がタイムアウトしました。",
  invalid_agent_name: "agent名は英小文字・数字・- _ のみ、32文字以内です。",
  invalid_key: "このキー名はHerdrが受け付けません。esc / enter / up / down / 数字 などを使ってください。",
  unexpected_response: "herdrの応答を解釈できませんでした。",
};

/** CLIのエラーコードを操作者向けの日本語に変換する。 */
export function describeError(error: unknown): string {
  if (error instanceof HerdrUnavailableError) {
    return error.message;
  }
  if (error instanceof HerdrCliError) {
    return MESSAGES[error.code] ?? error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

export function isUnavailable(error: unknown): boolean {
  return error instanceof HerdrUnavailableError;
}
