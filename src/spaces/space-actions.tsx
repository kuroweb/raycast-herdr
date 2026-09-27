import { Action, ActionPanel, Alert, confirmAlert, Icon, showToast, Toast } from "@raycast/api";
import { closeSpace, Space } from "../herdr/workspace";
import { ENTITY_ICON, presentation } from "../herdr/status";
import { describeError } from "../herdr/errors";
import { CreateSpaceForm } from "./create-form";
import { RenameSpaceForm } from "./rename-form";

type Props = {
  space: Space;
  /** 作成フォームのディレクトリ候補に使う。 */
  spaces: Space[];
  onRefresh: () => void;
};

/**
 * workspaceへの操作。workspaceは見出しにしか出ず見出しは選べないので、配下の行から呼ぶ。
 * その行自身の操作(無印)やtabの操作(shift)と衝突しないよう、opt付きのキーで揃える。
 */
export function SpaceActions({ space, spaces, onRefresh }: Props) {
  const status = presentation(space.status);

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
    <ActionPanel.Section title={`Workspace: ${space.label}（${status.label}）`}>
      <Action.Push
        title="Workspaceを作成"
        icon={ENTITY_ICON.workspace}
        shortcut={{ modifiers: ["cmd", "opt"], key: "n" }}
        target={<CreateSpaceForm spaces={spaces} onCreated={onRefresh} />}
      />
      <Action.Push
        title="Workspaceのラベルを変更"
        icon={ENTITY_ICON.workspace}
        shortcut={{ modifiers: ["cmd", "opt"], key: "e" }}
        target={<RenameSpaceForm space={space} onRenamed={onRefresh} />}
      />
      <Action
        title="Workspaceを閉じる"
        icon={Icon.Trash}
        style={Action.Style.Destructive}
        shortcut={{ modifiers: ["cmd", "opt"], key: "x" }}
        onAction={close}
      />
    </ActionPanel.Section>
  );
}
