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
import { agentIcon, ENTITY_ICON, presentation } from "../herdr/status";
import { describeError } from "../herdr/errors";
import { revealTerminal } from "../herdr/terminal";
import { shortenPath } from "../herdr/workspace";
import { TerminalOutput } from "../components/terminal-output";
import { RenamePaneForm } from "./pane-forms";
import { PromptForm } from "../agents/prompt-form";
import { RespondView } from "../agents/respond";

type Props = {
  pane: Pane;
  /** 所属tabの表示名。pathと同じく、行を見ただけで在り処が分かるようにする。 */
  tabLabel: string;
  onRefresh: () => void;
  /** workspaceへの操作。workspaceは見出しにしか出ないので、行から呼べるようにする。 */
  extraSections?: ActionPanel.Children;
};

export function PaneItem({ pane, tabLabel, onRefresh, extraSections }: Props) {
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
      subtitle={subtitleOf(pane, tabLabel)}
      keywords={[pane.id, pane.cwd, pane.agent ?? "", tabLabel]}
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
            {pane.agent ? (
              <Action.Push
                title="応答する"
                icon={Icon.Reply}
                shortcut={Keyboard.Shortcut.Common.ToggleQuickLook}
                target={<RespondView target={pane.id} title={title} />}
              />
            ) : null}
            {pane.agent ? (
              <Action.Push
                title="プロンプトを送信"
                icon={ENTITY_ICON.agent}
                shortcut={{ modifiers: ["cmd"], key: "m" }}
                target={<PromptForm target={pane.id} title={title} cwd={pane.cwd} onSubmitted={onRefresh} />}
              />
            ) : null}
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
          {extraSections}
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

/**
 * 中身が分かる形にする。agentが動いていればその種別のアイコン、
 * 動いていなければシェル。Agentsコマンドの行と同じ見た目になる。
 */
function iconOf(pane: Pane): Image.ImageLike {
  const status = presentation(pane.status);
  return pane.agent
    ? agentIcon(pane.agent, status.color)
    : { source: ENTITY_ICON.shell, tintColor: Color.SecondaryText };
}

/** 右端は フォーカス中 → 状態。種別はアイコンの形で出すので、タグは状態に使う。 */
function accessoriesOf(pane: Pane): List.Item.Accessory[] {
  const status = presentation(pane.status);
  return [
    ...(pane.focused ? [{ icon: Icon.Eye, tooltip: "フォーカス中" }] : []),
    ...(pane.agent ? [{ tag: { value: status.label, color: status.color } }] : []),
  ];
}

/** 在り処を1行にまとめる。tabは全workspaceで同じ番号が並ぶので、pathと並べて意味を持たせる。 */
function subtitleOf(pane: Pane, tabLabel: string): string {
  const path = pane.cwd.length > 0 ? shortenPath(pane.cwd) : "";
  return path.length > 0 ? `Tab ${tabLabel} · ${path}` : `Tab ${tabLabel}`;
}
