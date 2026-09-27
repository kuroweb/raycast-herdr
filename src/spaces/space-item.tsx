import { Action, ActionPanel, Alert, confirmAlert, Icon, Keyboard, List, showToast, Toast } from "@raycast/api";
import { closeSpace, focusSpace, Space } from "../herdr/workspace";
import { ENTITY_ICON, presentation } from "../herdr/status";
import { describeError } from "../herdr/errors";
import { revealTerminal } from "../herdr/terminal";
import { CreateSpaceForm } from "./create-form";
import { RenameSpaceForm } from "./rename-form";

type Props = {
  space: Space;
  /** 作成フォームのディレクトリ候補に使う。 */
  spaces: Space[];
  onRefresh: () => void;
};

export function SpaceItem({ space, spaces, onRefresh }: Props) {
  const status = presentation(space.status);

  async function focus() {
    try {
      await focusSpace(space.id);
      await revealTerminal();
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "フォーカスできません", message: describeError(error) });
    }
  }

  async function close() {
    const confirmed = await confirmAlert({
      title: `${space.label} を閉じますか`,
      message: `${space.paneCount}個のpaneが閉じます。実行中のagentも終了します。`,
      icon: ENTITY_ICON.workspace,
      primaryAction: { title: "閉じる", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) {
      return;
    }
    try {
      await closeSpace(space.id);
      await showToast({ style: Toast.Style.Success, title: `${space.label} を閉じました` });
      onRefresh();
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "閉じられません", message: describeError(error) });
    }
  }

  return (
    <List.Item
      icon={{ source: ENTITY_ICON.workspace, tintColor: status.color }}
      title={space.label}
      keywords={[space.id, String(space.number), space.cwd ?? ""]}
      accessories={[
        ...(space.focused ? [{ icon: Icon.Eye, tooltip: "フォーカス中" }] : []),
        // agentが居ないworkspaceには状態が無いので、タグを出さない。
        ...(space.status === "unknown" ? [] : [{ tag: { value: status.label, color: status.color } }]),
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section title={`Workspace ${space.label}`}>
            <Action title="フォーカス" icon={ENTITY_ICON.workspace} onAction={focus} />
            <Action.Push
              title="Workspaceを作成"
              icon={ENTITY_ICON.workspace}
              shortcut={Keyboard.Shortcut.Common.New}
              target={<CreateSpaceForm spaces={spaces} onCreated={onRefresh} />}
            />
            <Action.Push
              title="ラベルを変更"
              icon={ENTITY_ICON.workspace}
              shortcut={Keyboard.Shortcut.Common.Edit}
              target={<RenameSpaceForm space={space} onRenamed={onRefresh} />}
            />
            <Action
              title="Workspaceを閉じる"
              icon={ENTITY_ICON.workspace}
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
