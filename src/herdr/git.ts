import { readFile, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";

/** リポジトリの入れ子を辿る上限。これ以上遡ると無関係なリポジトリを拾う。 */
const MAX_DEPTH = 6;

/**
 * 作業ディレクトリのブランチ名を返す。
 * git コマンドを起動せず .git を直接読む。一覧のたびに全workspace分を引くので、
 * プロセス起動のコストを避けたい。
 */
export async function branchOf(cwd: string): Promise<string | undefined> {
  const gitDir = await findGitDir(cwd);
  if (!gitDir) {
    return undefined;
  }
  try {
    return parseHead(await readFile(join(gitDir, "HEAD"), "utf8"));
  } catch {
    return undefined;
  }
}

/** HEAD の中身からブランチ名を取り出す。detached HEAD では短縮したコミットIDを返す。 */
export function parseHead(content: string): string | undefined {
  const head = content.trim();
  if (head.length === 0) {
    return undefined;
  }
  const ref = head.match(/^ref:\s*refs\/heads\/(.+)$/);
  if (ref) {
    return ref[1];
  }
  return /^[0-9a-f]{7,40}$/.test(head) ? head.slice(0, 7) : undefined;
}

/** `.git` がファイルのときは worktree なので、中に書かれた gitdir を使う。 */
export function parseGitFile(content: string, base: string): string | undefined {
  const matched = content.trim().match(/^gitdir:\s*(.+)$/);
  if (!matched) {
    return undefined;
  }
  const path = matched[1].trim();
  return isAbsolute(path) ? path : resolve(base, path);
}

async function findGitDir(cwd: string): Promise<string | undefined> {
  let current = cwd;
  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const candidate = join(current, ".git");
    try {
      const info = await stat(candidate);
      if (info.isDirectory()) {
        return candidate;
      }
      if (info.isFile()) {
        return parseGitFile(await readFile(candidate, "utf8"), current);
      }
    } catch {
      // このディレクトリには無いので、親へ。
    }
    const parent = dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
  return undefined;
}
