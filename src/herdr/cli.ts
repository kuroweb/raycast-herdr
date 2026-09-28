import { execFile } from "node:child_process";
import { HerdrCliError, HerdrUnavailableError } from "./types";
import { herdrBinaryPath } from "./preferences";

type ExecResult = { stdout: string; stderr: string; code: number };

/** herdr CLI を実行し、JSONエンベロープの result を返す。 */
export async function runJson<T>(args: string[]): Promise<T> {
  const { stdout, stderr, code } = await exec(args);
  const envelope = tryParseEnvelope(stdout);

  if (envelope?.error) {
    throw new HerdrCliError(envelope.error.code ?? "unknown_error", envelope.error.message ?? "herdr command failed");
  }
  if (code !== 0 || !envelope || envelope.result === undefined) {
    throw unexpected(stdout, stderr, code);
  }
  return envelope.result as T;
}

/** herdr agent read / status のように生テキストを返すコマンド用。 */
export async function runText(args: string[]): Promise<string> {
  const { stdout, stderr, code } = await exec(args);
  if (code === 0) {
    return stdout;
  }
  // 失敗時はテキストコマンドでも JSON エラーが返るため、コードを拾えるようにする。
  const envelope = tryParseEnvelope(stdout);
  if (envelope?.error) {
    throw new HerdrCliError(envelope.error.code ?? "unknown_error", envelope.error.message ?? "herdr command failed");
  }
  throw unexpected(stdout, stderr, code);
}

/** 成功時に出力しない操作コマンドを実行する。失敗時のJSONエンベロープは従来どおり解釈する。 */
export async function runVoid(args: string[]): Promise<void> {
  const { stdout, stderr, code } = await exec(args);
  const envelope = tryParseEnvelope(stdout);

  if (envelope?.error) {
    throw new HerdrCliError(envelope.error.code ?? "unknown_error", envelope.error.message ?? "herdr command failed");
  }
  if (code !== 0 || (stdout.trim().length > 0 && (!envelope || envelope.result === undefined))) {
    throw unexpected(stdout, stderr, code);
  }
}

type Envelope = { result?: unknown; error?: { code?: string; message?: string } };

function tryParseEnvelope(stdout: string): Envelope | undefined {
  try {
    const parsed: unknown = JSON.parse(stdout);
    return typeof parsed === "object" && parsed !== null ? (parsed as Envelope) : undefined;
  } catch {
    return undefined;
  }
}

function unexpected(stdout: string, stderr: string, code: number): HerdrCliError {
  const detail = stderr.trim() || stdout.trim() || `exit code ${code}`;
  return new HerdrCliError("unexpected_response", `herdrの応答を解釈できません: ${truncate(detail)}`);
}

function truncate(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}

function exec(args: string[]): Promise<ExecResult> {
  const binary = herdrBinaryPath();
  return new Promise((resolve, reject) => {
    execFile(binary, args, { timeout: 10_000, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && isSpawnFailure(error)) {
        reject(new HerdrUnavailableError(`herdrコマンドが見つかりません: ${binary}`));
        return;
      }
      resolve({ stdout, stderr, code: typeof error?.code === "number" ? error.code : 0 });
    });
  });
}

function isSpawnFailure(error: { code?: string | number | null }): boolean {
  return error.code === "ENOENT" || error.code === "EACCES" || error.code === "ENOTDIR";
}
