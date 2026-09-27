import { Action, ActionPanel, Alert, confirmAlert, Icon, Keyboard, List, showToast, Toast } from "@raycast/api";
import { closeTab, focusTab, Tab } from "../herdr/layout";
import { ENTITY_ICON, presentation } from "../herdr/status";
import { describeError } from "../herdr/errors";
import { revealTerminal } from "../herdr/terminal";
import { Space } from "../herdr/workspace";
import { CreateTabForm, RenameTabForm } from "./tab-forms";

type Props = {
  tab: Tab;
  space: Space;
  onRefresh: () => void;
};

export function TabItem({ tab, space, onRefresh }: Props) {
  const status = presentation(tab.status);

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
    <List.Item
      icon={{ source: ENTITY_ICON.tab, tintColor: status.color }}
      title={`Tab ${tab.label}`}
      keywords={[tab.id, String(tab.number), space.label]}
      accessories={[
        ...(tab.focused ? [{ icon: Icon.Eye, tooltip: "フォーカス中" }] : []),
        // agentが居ないtabには状態が無いので、タグを出さない。
        ...(tab.status === "unknown" ? [] : [{ tag: { value: status.label, color: status.color } }]),
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section title={`Tab ${tab.label}`}>
            <Action title="フォーカス" icon={ENTITY_ICON.tab} onAction={focus} />
            <Action.Push
              title="Tabを作成"
              icon={ENTITY_ICON.tab}
              shortcut={Keyboard.Shortcut.Common.New}
              target={<CreateTabForm workspaceId={space.id} workspaceLabel={space.label} onCreated={onRefresh} />}
            />
            <Action.Push
              title="ラベルを変更"
              icon={ENTITY_ICON.tab}
              shortcut={Keyboard.Shortcut.Common.Edit}
              target={<RenameTabForm tabId={tab.id} tabLabel={tab.label} onRenamed={onRefresh} />}
            />
            <Action
              title="Tabを閉じる"
              icon={ENTITY_ICON.tab}
              style={Action.Style.Destructive}
              shortcut={Keyboard.Shortcut.Common.Remove}
              onAction={close}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
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
