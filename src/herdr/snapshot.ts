import { runJson } from "./cli";

/** herdr api snapshot の中身。workspace / tab / pane を1回で取れるので、各一覧の共通の入力にする。 */
export type Snapshot = { workspaces?: unknown; tabs?: unknown; panes?: unknown };

export async function fetchSnapshot(): Promise<Snapshot> {
  const result = await runJson<{ snapshot?: Snapshot }>(["api", "snapshot"]);
  return result.snapshot ?? {};
}
