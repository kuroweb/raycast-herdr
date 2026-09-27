import { createConnection } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";
import { runText } from "./cli";
import { HerdrCliError, HerdrUnavailableError } from "./types";

const DEFAULT_SOCKET_PATH = join(homedir(), ".config", "herdr", "herdr.sock");
const TIMEOUT_MS = 5_000;

let cached: string | undefined;

/**
 * herdrのソケットAPIを直接呼ぶ。
 * CLIに出ていない操作（pane.focus のようにID指定でpaneをフォーカスする類）のための経路で、
 * CLIで足りるものはCLIのまま扱う。
 */
export async function request<T>(method: string, params: object): Promise<T> {
  const path = await socketPath();
  const payload = JSON.stringify({ id: `raycast-${Date.now()}`, method, params });
  const response = await send(path, payload);

  let parsed: { result?: unknown; error?: { code?: string; message?: string } };
  try {
    parsed = JSON.parse(response);
  } catch {
    throw new HerdrCliError("unexpected_response", "herdrの応答を解釈できません");
  }
  if (parsed.error) {
    throw new HerdrCliError(parsed.error.code ?? "unknown_error", parsed.error.message ?? "herdr request failed");
  }
  if (parsed.result === undefined) {
    throw new HerdrCliError("unexpected_response", "herdrの応答を解釈できません");
  }
  return parsed.result as T;
}

async function socketPath(): Promise<string> {
  if (cached) {
    return cached;
  }
  try {
    // 名前付きセッションでは既定パスと違うので、サーバの申告を優先する。
    cached = parseSocketPath(await runText(["status", "server"])) ?? DEFAULT_SOCKET_PATH;
  } catch {
    cached = DEFAULT_SOCKET_PATH;
  }
  return cached;
}

export function parseSocketPath(statusOutput: string): string | undefined {
  const matched = statusOutput.match(/^\s*socket:\s*(\S+)\s*$/m);
  return matched?.[1];
}

function send(path: string, payload: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = createConnection(path);
    let buffer = "";

    const fail = (error: Error) => {
      socket.destroy();
      reject(error);
    };

    socket.setTimeout(TIMEOUT_MS, () => fail(new HerdrCliError("timeout", "herdrの応答がタイムアウトしました")));
    socket.on("error", () => fail(new HerdrUnavailableError(`herdrのソケットに接続できません: ${path}`)));
    socket.on("connect", () => socket.write(`${payload}\n`));
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      // 応答は1行のJSON。改行が来た時点で読み終わり。
      const end = buffer.indexOf("\n");
      if (end >= 0) {
        socket.end();
        resolve(buffer.slice(0, end));
      }
    });
    socket.on("end", () => {
      if (buffer.length > 0) {
        resolve(buffer.trim());
      }
    });
  });
}
