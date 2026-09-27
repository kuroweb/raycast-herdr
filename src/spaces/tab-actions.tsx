import { Action, ActionPanel, Alert, confirmAlert, Icon, showToast, Toast } from "@raycast/api";
import { closeTab, focusTab, Tab } from "../herdr/layout";
import { ENTITY_ICON } from "../herdr/status";
import { describeError } from "../herdr/errors";
import { revealTerminal } from "../herdr/terminal";
import { Space } from "../herdr/workspace";
import { CreateTabForm, RenameTabForm } from "./tab-forms";

type Props = {
  tab: Tab;
  space: Space;
  onRefresh: () => void;
};

/** tabは行にしないので、配下のpane行から操作する。 */
export function TabActions({ tab, space, onRefresh }: Props) {
  async function focus() {
    try {
      await focusTab(tab.id);
      await revealTerminal();
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "フォーカスできません", message: describeError(error) });
    }
  }

  async function close() {
    const confirmed = await confirmAlert({
      title: `Tab ${tab.label} を閉じますか`,
      message: `${tab.paneCount}個のpaneが閉じます。実行中のagentも終了します。`,
      icon: ENTITY_ICON.tab,
      primaryAction: { title: "閉じる", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) {
      return;
    }
    try {
      await closeTab(tab.id);
      onRefresh();
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "閉じられません", message: describeError(error) });
    }
  }

  return (
    <ActionPanel.Section title={`Tab ${tab.label}`}>
      <Action
        title="Tabにフォーカス"
        icon={ENTITY_ICON.tab}
        shortcut={{ modifiers: ["cmd", "shift"], key: "return" }}
        onAction={focus}
      />
      <Action.Push
        title="Tabを作成"
        icon={ENTITY_ICON.tab}
        shortcut={{ modifiers: ["cmd", "shift"], key: "n" }}
        target={<CreateTabForm workspaceId={space.id} workspaceLabel={space.label} onCreated={onRefresh} />}
      />
      <Action.Push
        title="Tabのラベルを変更"
        icon={ENTITY_ICON.tab}
        shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
        target={<RenameTabForm tabId={tab.id} tabLabel={tab.label} onRenamed={onRefresh} />}
      />
      <Action
        title="Tabを閉じる"
        icon={Icon.Trash}
        style={Action.Style.Destructive}
        shortcut={{ modifiers: ["cmd", "shift"], key: "x" }}
        onAction={close}
      />
    </ActionPanel.Section>
  );
}
