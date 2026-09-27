export const AGENT_STATUSES = ["blocked", "done", "working", "idle", "unknown"] as const;

export type AgentStatus = (typeof AGENT_STATUSES)[number];

export type Agent = {
  /** agent種別ラベル（claude, codex など）。target には使えない。 */
  kind: string;
  status: AgentStatus;
  /** agent commands の target。live agent name は通常未設定なので pane_id を使う。 */
  paneId: string;
  tabId: string;
  workspaceId: string;
  /** rename で付けた live agent name。未設定なら undefined。 */
  name?: string;
  cwd: string;
  /** ANSI装飾とstatus記号を除いたターミナルタイトル。 */
  title: string;
  focused: boolean;
};

/** herdr CLI が返す構造化エラー（{"error":{"code","message"}}）。 */
export class HerdrCliError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "HerdrCliError";
    this.code = code;
  }
}

/** herdr サーバ（またはバイナリ）に到達できない。UI側で案内を出し分けるため別型にする。 */
export class HerdrUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HerdrUnavailableError";
  }
}
