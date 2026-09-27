import { useEffect } from "react";
import { Action, ActionPanel, Alert, confirmAlert, Icon, List, showToast, Toast, Keyboard } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { PaneItem } from "./spaces/pane-item";
import { CreateSpaceForm } from "./spaces/create-form";
import { RenameSpaceForm } from "./spaces/rename-form";
import { TabList } from "./spaces/tab-list";
import { closeSpace, listSpaceSections, shortenPath, Space } from "./herdr/workspace";
import { describeError, isUnavailable } from "./herdr/errors";
import { openHerdr } from "./herdr/launch";
import { presentation } from "./herdr/status";

const REFRESH_INTERVAL_MS = 2_000;

export default function Command() {
  const { data, isLoading, error, revalidate } = useCachedPromise(listSpaceSections, [], { initialData: [] });

  // workspace・pane の増減や状態はHerdr側で変わるので、開いている間はポーリングで追従する。
  useEffect(() => {
    const timer = setInterval(revalidate, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [revalidate]);

  const sections = data ?? [];
  const spaces = sections.map((section) => section.space);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="pane・workspace・ディレクトリで絞り込む">
      {error ? (
        <List.EmptyView
          icon={Icon.Warning}
          title={isUnavailable(error) ? "herdrコマンドが見つかりません" : "workspaceを取得できません"}
          description={describeError(error)}
          actions={
            <ActionPanel>
              <Action title="再試行" icon={Icon.ArrowClockwise} onAction={revalidate} />
              <Action title="Herdrを開く" icon={Icon.Terminal} onAction={() => openHerdr()} />
            </ActionPanel>
          }
        />
      ) : (
        <>
          <List.EmptyView
            icon={Icon.AppWindowGrid2x2}
            title="workspaceがありません"
            description="Herdrを起動すると、ここに表示されます。"
            actions={
              <ActionPanel>
                <Action.Push
                  title="Workspaceを作成"
                  icon={Icon.Plus}
                  target={<CreateSpaceForm spaces={spaces} onCreated={revalidate} />}
                />
                <Action title="Herdrを開く" icon={Icon.Terminal} onAction={() => openHerdr()} />
              </ActionPanel>
            }
          />
          {sections.map(({ space, panes }) => (
            <List.Section key={space.id} title={space.label} subtitle={space.cwd ? shortenPath(space.cwd) : space.id}>
              {panes.map((pane) => (
                <PaneItem
                  key={pane.id}
                  pane={pane}
                  onRefresh={revalidate}
                  showDirectory={pane.cwd !== space.cwd}
                  extraSections={<SpaceActions space={space} spaces={spaces} onRefresh={revalidate} />}
                />
              ))}
            </List.Section>
          ))}
        </>
      )}
    </List>
  );
}

/** pane行から、その所属workspaceを操作するための一式。見出しは操作対象にできないため行側に置く。 */
function SpaceActions({ space, spaces, onRefresh }: { space: Space; spaces: Space[]; onRefresh: () => void }) {
  const status = presentation(space.status);

  async function close() {
    const confirmed = await confirmAlert({
      title: `${space.label} を閉じますか`,
      message: `${space.paneCount}個のpaneが閉じます。実行中のagentも終了します。`,
      icon: Icon.Trash,
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
        title="Tabを見る"
        icon={Icon.AppWindowSidebarRight}
        shortcut={{ modifiers: [], key: "arrowRight" }}
        target={<TabList space={space} />}
      />
      <Action.Push
        title="Workspaceを作成"
        icon={Icon.Plus}
        shortcut={Keyboard.Shortcut.Common.New}
        target={<CreateSpaceForm spaces={spaces} onCreated={onRefresh} />}
      />
      <Action.Push
        title="Workspaceのラベルを変更"
        icon={Icon.Pencil}
        shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
        target={<RenameSpaceForm space={space} onRenamed={onRefresh} />}
      />
      <Action
        title="Workspaceを閉じる"
        icon={Icon.Trash}
        style={Action.Style.Destructive}
        shortcut={{ modifiers: ["cmd", "shift"], key: "x" }}
        onAction={close}
      />
    </ActionPanel.Section>
  );
}
