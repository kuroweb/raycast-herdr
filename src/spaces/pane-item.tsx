import {
  Action,
  ActionPanel,
  Alert,
  Color,
  confirmAlert,
  Icon,
  Image,
  Keyboard,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { closePane, focusPane, Pane, readPaneOutput, splitPane, toggleZoom } from "../herdr/layout";
import { ENTITY_ICON, presentation } from "../herdr/status";
import { describeError } from "../herdr/errors";
import { revealTerminal } from "../herdr/terminal";
import { shortenPath } from "../herdr/workspace";
import { TerminalOutput } from "../components/terminal-output";
import { RenamePaneForm } from "./pane-forms";

type Props = {
  pane: Pane;
  onRefresh: () => void;
  /** flat表示ではworkspaceが見出しになるので、行のディレクトリ表示を省く。 */
  showDirectory?: boolean;
};

export function PaneItem({ pane, onRefresh, showDirectory = true }: Props) {
  const title = paneTitle(pane);
  const status = presentation(pane.status);

  async function run(action: () => Promise<void>, failureTitle: string, reveal = false) {
    try {
      await action();
      onRefresh();
      if (reveal) {
        await revealTerminal();
      }
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: failureTitle, message: describeError(error) });
    }
  }

  async function close() {
    const confirmed = await confirmAlert({
      title: `${title} を閉じますか`,
      message: pane.agent ? "このpaneで動いているagentも終了します。" : undefined,
      icon: Icon.Trash,
      primaryAction: { title: "閉じる", style: Alert.ActionStyle.Destructive },
    });
    if (confirmed) {
      await run(() => closePane(pane.id), "閉じられません");
    }
  }

  return (
    <List.Item
      icon={iconOf(pane)}
      title={title}
      subtitle={showDirectory && pane.cwd.length > 0 ? shortenPath(pane.cwd) : undefined}
      keywords={[pane.id, pane.cwd, pane.agent ?? ""]}
      accessories={accessoriesOf(pane)}
      actions={
        <ActionPanel>
          <ActionPanel.Section title={`Pane: ${title}`}>
            <Action
              title="フォーカス"
              icon={ENTITY_ICON.pane}
              onAction={() => run(() => focusPane(pane), "フォーカスできません", true)}
            />
            <Action.Push
              title="出力を見る"
              icon={Icon.Text}
              shortcut={Keyboard.Shortcut.Common.Open}
              target={
                <TerminalOutput
                  navigationTitle={title}
                  target={pane.id}
                  read={readPaneOutput}
                  status={pane.agent ? { label: status.label, color: status.color } : undefined}
                  rows={[
                    { title: "Agent", text: pane.agent ?? "なし" },
                    { title: "Directory", text: pane.cwd },
                  ]}
                />
              }
            />
            <Action.Push
              title="ラベルを変更"
              icon={ENTITY_ICON.pane}
              shortcut={Keyboard.Shortcut.Common.Edit}
              target={<RenamePaneForm pane={pane} onRenamed={onRefresh} />}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="右に分割"
              icon={Icon.ArrowRight}
              shortcut={{ modifiers: ["cmd"], key: "d" }}
              onAction={() => run(() => splitPane(pane.id, "right"), "分割できません", true)}
            />
            <Action
              title="下に分割"
              icon={Icon.ArrowDown}
              shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
              onAction={() => run(() => splitPane(pane.id, "down"), "分割できません", true)}
            />
            <Action
              title="ズームを切り替え"
              icon={Icon.Maximize}
              shortcut={{ modifiers: ["cmd"], key: "z" }}
              onAction={() => run(() => toggleZoom(pane.id), "ズームを切り替えられません")}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="Paneを閉じる"
              icon={ENTITY_ICON.pane}
              style={Action.Style.Destructive}
              shortcut={Keyboard.Shortcut.Common.Remove}
              onAction={close}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Pane IDをコピー"
              content={pane.id}
              shortcut={Keyboard.Shortcut.Common.Copy}
            />
            <Action
              title="再読み込み"
              icon={Icon.ArrowClockwise}
              shortcut={Keyboard.Shortcut.Common.Refresh}
              onAction={onRefresh}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

/** ラベル → ターミナルタイトル → プロセス名 の順で、内部IDは使わない。 */
function paneTitle(pane: Pane): string {
  return pane.label ?? pane.title ?? "シェル";
}

/** 形は種別（pane）、色は状態。agentが居ないpaneに状態は無いので灰色にする。 */
function iconOf(pane: Pane): Image.ImageLike {
  const status = presentation(pane.status);
  return { source: ENTITY_ICON.pane, tintColor: pane.agent ? status.color : Color.SecondaryText };
}

/** 右端は フォーカス中 → 状態。種別はアイコンの形で出すので、タグは状態に使う。 */
function accessoriesOf(pane: Pane): List.Item.Accessory[] {
  const status = presentation(pane.status);
  return [
    ...(pane.focused ? [{ icon: Icon.Eye, tooltip: "フォーカス中" }] : []),
    ...(pane.agent ? [{ tag: { value: status.label, color: status.color } }] : []),
  ];
}
