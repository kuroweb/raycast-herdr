import { useEffect } from "react";
import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { SpaceItem } from "./spaces/space-item";
import { TabItem } from "./spaces/tab-item";
import { PaneItem } from "./spaces/pane-item";
import { CreateSpaceForm } from "./spaces/create-form";
import { listPaneGroups, shortenPath } from "./herdr/workspace";
import { describeError, isUnavailable } from "./herdr/errors";
import { openHerdr } from "./herdr/launch";
import { ENTITY_ICON } from "./herdr/status";

const REFRESH_INTERVAL_MS = 2_000;

export default function Command() {
  const { data, isLoading, error, revalidate } = useCachedPromise(listPaneGroups, [], { initialData: [] });

  // workspace・tab・pane の増減や状態はHerdr側で変わるので、開いている間はポーリングで追従する。
  useEffect(() => {
    const timer = setInterval(revalidate, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [revalidate]);

  const groups = data ?? [];
  // 同じworkspaceがtabの数だけ並ぶので、workspaceの一覧としては重複を畳む。
  const spaces = [...new Map(groups.map((group) => [group.space.id, group.space])).values()];

  return (
    <List isLoading={isLoading} searchBarPlaceholder="workspace・tab・pane で絞り込む">
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
            icon={ENTITY_ICON.workspace}
            title="workspaceがありません"
            description="Herdrを起動すると、ここに表示されます。"
            actions={
              <ActionPanel>
                <Action.Push
                  title="Workspaceを作成"
                  icon={ENTITY_ICON.workspace}
                  target={<CreateSpaceForm spaces={spaces} onCreated={revalidate} />}
                />
                <Action title="Herdrを開く" icon={Icon.Terminal} onAction={() => openHerdr()} />
              </ActionPanel>
            }
          />
          {/*
            workspace → tab → pane の順に流す。並び順そのものが階層を表す。
            Raycastのセクションは見出しの文字が無いと区切りとして描かれないので、
            workspaceの行と重複しないディレクトリを見出しに置く。
          */}
          {spaces.map((space) => (
            <List.Section key={space.id} title={space.cwd ? shortenPath(space.cwd) : space.label}>
              <SpaceItem space={space} spaces={spaces} onRefresh={revalidate} />
              {groups
                .filter((group) => group.space.id === space.id)
                .flatMap(({ tab, panes }) => [
                  <TabItem key={tab.id} tab={tab} space={space} onRefresh={revalidate} />,
                  ...panes.map((pane) => (
                    <PaneItem key={pane.id} pane={pane} onRefresh={revalidate} showDirectory={pane.cwd !== space.cwd} />
                  )),
                ])}
            </List.Section>
          ))}
        </>
      )}
    </List>
  );
}
