# raycast-herdr

Herdrで稼働中のコーディングagentを、Raycastから一覧・監視・操作するための拡張（PoC）。

## できること

- **Agents**（view）: 稼働中agentの一覧。要対応（blocked → done）を先頭に並べ、タイトル・作業ディレクトリ・pane IDで検索できる。開いている間は2秒ごとに状態を更新する。
  - `Enter` フォーカス（Terminal App設定時はターミナルを前面化）
  - `⌘M` プロンプト送信
  - `⌘O` ターミナル出力のプレビュー
  - `⌘E` agent名のリネーム / 解除
  - `⌘⇧C` pane IDのコピー、`⌘R` 再読み込み
- **Agent Status**（menu-bar）: 要対応件数をメニューバーに表示し、status別のメニューから直接フォーカスする。30秒間隔で更新。

## 仕組み

`herdr` CLI をそのまま実行して結果を読む。ソケットAPIは直接触らない。

| 操作 | コマンド |
| --- | --- |
| 一覧 | `herdr agent list` |
| フォーカス | `herdr agent focus <pane-id>` |
| プロンプト送信 | `herdr agent prompt <pane-id> <text>` |
| リネーム | `herdr agent rename <pane-id> <name>` / `--clear` |
| 出力読み | `herdr agent read <pane-id> --source recent --lines N` |
| サーバ確認 | `herdr status server` |

agent commandsの `<TARGET>` には **pane ID** を使う。live agent nameは通常未設定で、命名規則と一意性の制約があるため。

## 設定

| 設定 | 既定 | 備考 |
| --- | --- | --- |
| Herdr Binary | `/opt/homebrew/bin/herdr` | Raycastはログインシェルの `PATH` を継承しないため絶対パスが必要 |
| Terminal App | 未設定 | `agent focus` はTUI内のフォーカスを移すだけでターミナルを前面化しないため、必要ならここで指定する |
| Output Lines | `200` | 出力プレビューの行数 |

## 挙動の注意

- `done` は「サーバがまだ確認済みにしていない完了」。フォーカスすると `idle` に変わるのが正常な挙動。
- agentが `blocked`（承認待ち）のときは `agent prompt` が送信前に拒否される。
- `herdr agent read` だけはJSONではなく生テキストを返すため、専用の経路で扱っている。

## 開発

```sh
npm install
npm run dev        # Raycastに開発版として読み込む
npm test
npm run typecheck
npm run lint
```
