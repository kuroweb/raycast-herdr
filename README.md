# Raycast Herdr

[Herdr](https://herdr.dev) で動いているコーディング agent の状態を把握し、そのまま操作する Raycast 拡張。

Herdr の TUI に attach しなくても、承認待ち（blocked）や完了（done）に気づき、その agent へ一手で辿り着けるようにするのが目的。

## 必要なもの

- macOS / Raycast
- Herdr 0.9.1 以降（`herdr status server` が `status: running` を返す状態）
- （任意）ターミナルアプリ。フォーカス時に前面へ出すときに使う。

Notion のようなトークンは要らない。ローカルの `herdr` コマンドをそのまま実行して状態を読む。

## セットアップ

### 1. Herdr サーバを起動しておく

```bash
herdr status server
```

`status: running` でなければ、Open Herdr コマンド、または `herdr` で TUI を起動しておく。サーバに届かないときは、一覧とメニューバーにエラーとして出て、そこから Open Herdr を呼べる。

### 2. Herdr Binary を確認する

Raycast はログインシェルの `PATH` を継承しないので、`herdr` の絶対パスが必要。既定は `/opt/homebrew/bin/herdr`。

```bash
which herdr
```

これと違う場所にあれば、この拡張の Preferences で差し替える。

### 3. Terminal App を設定する（任意）

`herdr agent focus` は Herdr の TUI 内でフォーカスを移すだけで、ターミナル自体は前面に来ない。Preferences で使っているターミナルアプリを選ぶと、フォーカスと同時に前面化する。未設定ならフォーカスして Raycast を閉じるところまでで止まる。

Open Herdr で新規ウィンドウを開けるのは Terminal.app と iTerm2。他のターミナルを選んだ場合は前面化だけ行い、`herdr` の入力は手で行う。

### 設定一覧

| 設定 | 既定 | 用途 |
| --- | --- | --- |
| Herdr Binary | `/opt/homebrew/bin/herdr` | `herdr` コマンドの絶対パス |
| Terminal App | 未設定 | フォーカス時に前面化し、Open Herdr で起動するアプリ。未設定時は Terminal.app |

## コマンド

### Agents

- タイトル、作業ディレクトリ、pane ID、agent 種別を横断検索する。
- 並び順は blocked → done → working → idle → unknown。手を入れる必要があるものが上に来る。同順位はタイトル順。
- アイコンは agent の種別ごとに変える。`herdr agent start --kind` が受け付ける24種すべてに、重複しないアイコンを割り当てている。
  - ロゴのある種別は公式の Herdr 拡張（`raycast/extensions`）のものを `assets/agents/` に置いて使う。明暗2種があるものはテーマで切り替える。ロゴは色を塗ると別物になるので状態色を乗せない。状態は右端のタグで読む。
  - それ以外は種別ごとに違う組み込みアイコンに状態色を乗せる。未知の種別は共通の agent アイコン。
- 種別のラベルは出さない（アイコンで分かるため）。`⌘⇧E` で付け替えた agent 名があるときだけ、タグの右に出す。
- 開いている間は2秒ごとに状態を取り直す。状態は Herdr 側で変わるため、こちらから見に行く必要がある。
- Enter でその agent にフォーカスし、Raycast を閉じてターミナルを前面化する。
- `⌘O` で応答待ちの画面（`herdr agent read --source detection`）を出す。開いている間は2秒ごとに取り直すので、応答した結果がそのまま見える。`⇧⏎` 決定、`⇧Esc` 取り消し、`⇧↑↓←→` 選択肢の移動を、一覧からも応答画面からも同じキーで送れる。
- `⌘M` でプロンプトを送る。送信の成否だけを見て返り、agent の応答完了は待たない。agent が blocked のときは Herdr 側で拒否されるので、ターミナルで承認を返してから送る。
- `⌘E` で一覧に出るタイトルを変える。素のタイトルは agent が書き換えるターミナルタイトルなので、上書きには pane のラベル（`herdr pane rename`）を使う。解除するとターミナルタイトルに戻る。Spaces の行と同じ ラベル → ターミナルタイトル の順で決まる。
- `⌘⇧E` で agent 名を付ける。`[a-z][a-z0-9_-]{0,31}` かつ live agent 間で一意。名前の解除もこの画面から行う。
- 稼働中の agent が無いとき、`herdr` が見つからないとき、サーバに届かないときで、それぞれ別の案内を出す。

### Spaces

- workspace を見出しに、pane を行にした一覧。階層を降りる画面は無く、動いているものがここで全部見える。
- 行は pane だけ。workspace は見出し、tab は pane の行の副題（`Tab 1 · ~/path`）に出す。どちらも行を占めない。tab は pane が1つだけのことが多く、行にすると空振りが増えるため。ブランチは代表ディレクトリの `.git/HEAD` を直接読んで取る（git コマンドを起動すると、一覧のたびに workspace の数だけプロセスが立つため）。worktree のように `.git` がファイルの場合は、その中の `gitdir` を辿る。detached HEAD では短縮したコミットIDを出す。
- アイコンの**形**が中身（agent が動いていればその種別のアイコン、動いていなければシェル）、右端のタグが状態。Agents コマンドの行と同じ見た目になる。
- agent が居ない行には状態が無いので、アイコンを灰色にしてタグを出さない。
- 並びは workspace の番号順、その中は tab の番号順、さらに pane ID 順。TUI での並びと一致させている。
- ディレクトリは pane の行にだけ出す。workspace と tab の行には出さない。pane ごとに違いうるのはここだけで、上位の行に出すと同じパスが並ぶため。
- 行の名前は ラベル → ターミナルタイトル → 動いているプロセス名 の順で決める。`wE:p1` のような内部 ID は画面に出さない。素の pane には `terminal_title` が付かないため、タイトルの無い pane にだけ `herdr pane process-info` を引いてプロセス名（`zsh`、`npm` など）を補う。
- どの行も操作するのは**その行の階層だけ**。キーは階層をまたいで共通で、対象だけが変わる。
  - pane（無印）: `⏎` フォーカス、`⌘E` ラベル変更、`⌃X` クローズ（確認あり）
  - tab（shift 付き）: `⌘⇧⏎` フォーカス、`⌘⇧N` 作成、`⌘⇧E` ラベル変更、`⌘⇧X` クローズ（確認あり）
  - workspace（opt 付き）: `⌘⌥N` 作成、`⌘⌥E` ラベル変更、`⌘⌥X` クローズ（確認あり）
  - pane のみ: `⌘D` 右に分割、`⌘⇧D` 下に分割、`⌘Z` ズームの切り替え
  - agent が居る pane のみ: `⌘O` 応答する、`⌘M` プロンプトを送信（どちらも Agents コマンドと同じキー）
- 一覧は `herdr api snapshot` から作る。workspace 自体は cwd を持たないので、配下 pane の最頻ディレクトリを代表として表示している。
- pane のフォーカスは workspace → tab → pane の順に辿る。pane だけは CLI に ID 指定のフォーカスが無いため、ソケット API の `pane.focus` を直接呼ぶ。失敗したときだけ、agent なら `agent focus`、素の pane なら `pane layout` の座標を見た隣接移動（最大8手）に落とす。
- フォーカス後のターミナル前面化は `/usr/bin/open -a` で行い、**Raycast のウィンドウを閉じる前**に呼ぶ。閉じたあとだと Raycast がコマンドの実行を打ち切り、前面化が走らないまま終わることがある。Raycast はフォーカスを失うと自分で閉じるので、この順でも取り残されない。
- `open -a` を使うのは、LaunchServices 経由で macOS の自動化の許可が要らないため。失敗したときだけ AppleScript の `activate` にフォールバックする。

### Agent Status

- blocked と done の合計をメニューバーのタイトルに出す。0件のときは数字を出さず、アイコンだけにする。
- アイコンの色は最優先の状態に従う（blocked は赤、done は緑、working は橙、それ以外は灰）。
- メニューは状態ごとのセクションに分かれ、項目のクリックでフォーカスする。下部から Agents / Spaces の一覧と Open Herdr を呼べる。
- 30秒間隔で更新する。Raycast が閉じていても動く。
- Terminal App が未設定のときは、設定へ誘導する項目が出る。

### Open Herdr

- ターミナルの新規ウィンドウで `herdr` を実行する。bare `herdr` は既存セッションがあれば attach するので、起動と復帰を1つの操作で兼ねる。
- 新規ウィンドウを AppleScript で開けるのは Terminal.app と iTerm2。未対応のターミナルでは前面化だけ行い、その旨を通知する。
- AppleScript でウィンドウを作るため、初回は macOS が「Raycast がターミナルを操作しようとしています」と許可を求める。許可しないとこのコマンドだけ失敗する（フォーカスの前面化は `open -a` なので影響しない）。
- 起動は `/bin/sh -lc` 経由。ログインシェルを通すのは、Herdr が前提にする環境変数を引き継ぐため。
- すでに attach 済みのウィンドウがあっても、新しいウィンドウを開く。Herdr の TUI クライアントは複数同時に動く。

## 状態の読み方

Herdr の agent は idle / working / blocked / done / unknown の5状態。

- **blocked**: 承認や質問の UI を Herdr が認識した状態。返事をするまで agent は進まない。
- **done**: 完了のうち、まだ確認していないもの。フォーカスすると Herdr 側で確認済みになり `idle` に変わる。この拡張でフォーカスしても同じなので、一覧から開くと done が消えるのは正常。
- **unknown**: agent はいるが分類できない状態。完了を意味しない。

## 仕組み

原則として `herdr` CLI を実行して結果を読む。CLI が既定で JSON を返すため、Herdr 本体のプロトコル変更から隔離される。CLI に出ていない操作だけ、ソケット API（`~/.config/herdr/herdr.sock`、改行区切りの JSON）を直接呼ぶ。今のところ `pane.focus` だけが該当する。

| 操作 | コマンド |
| --- | --- |
| 一覧 | `herdr agent list` |
| フォーカス | `herdr agent focus <pane-id>` |
| プロンプト送信 | `herdr agent prompt <pane-id> <text>` |
| リネーム | `herdr agent rename <pane-id> <name>` / `--clear` |
| サーバ確認 | `herdr status server` |
| 起動・attach | `herdr`（ターミナルの新規ウィンドウで実行） |
| workspace一覧 | `herdr api snapshot` |
| workspace操作 | `herdr workspace focus/create/rename/close` |
| tab操作 | `herdr tab focus/create/rename/close` |
| pane操作 | `herdr pane read/rename/close/split/zoom` |
| paneのフォーカス | ソケットAPI `pane.focus`（CLI に相当コマンドが無い） |

target には pane ID を使う。live agent name は通常未設定で、命名規則と一意性の制約があるため一覧からの指定に向かない。`herdr agent read` だけは JSON ではなく生テキストを返すので、別経路で扱う。

## ローカルで開発する

```bash
npm install
npm run dev
```

Raycast を開くと、開発中の拡張がルート検索に出る。

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run lint` は author の検証で失敗する。Raycast Store に登録されたハンドルでないと 404 になるためで、開発とビルドには影響しない。

### テスト

```bash
npm run test
npm run test:watch
```

- ユニットテストは `tests/` にあり、`src/` と同じ構成で並べる。
- Raycast API は `tests/support/` のモックへ差し替えるので、実行に Raycast も Herdr も要らない。
- コマンドの UI（`*.tsx`）はテスト対象外。CLI 応答のパース、並び順、状態の集計を `herdr/` 側へ切り出してテストする。

### ディレクトリ構成

```
src/
  herdr/        herdr CLI の実行・応答パース・状態の表示規則・設定の解決・ターミナル起動
  agents/       Agents コマンドの一覧項目と、プロンプト・リネーム・応答の各画面
  spaces/       Spaces コマンドの pane 行、workspace / tab への操作、作成・ラベル変更の各画面
  *.tsx         package.json の commands に対応するエントリポイント
```

子プロセスを起動するのは `herdr/cli.ts` だけ。その上のパースと並び順は純関数にして、実際に Herdr を動かさずに検証できるようにしている。
