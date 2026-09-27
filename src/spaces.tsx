import { useEffect } from "react";
import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { SpaceActions } from "./spaces/space-actions";
import { TabActions } from "./spaces/tab-actions";
import { PaneItem } from "./spaces/pane-item";
import { CreateSpaceForm } from "./spaces/create-form";
import { listPaneGroups } from "./herdr/workspace";
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
            行はpaneだけにする。workspaceは見出し、tabはpane行の副題に出し、
            どちらも行を占めない。tabはpaneが1つだけのことが多く、行にすると空振りが増える。
          */}
          {spaces.map((space) => (
            <List.Section key={space.id} title={space.label} subtitle={space.branch}>
              {groups
                .filter((group) => group.space.id === space.id)
                .flatMap(({ tab, panes }) =>
                  panes.map((pane) => (
                    <PaneItem
                      key={pane.id}
                      pane={pane}
                      tabLabel={tab.label}
                      onRefresh={revalidate}
                      extraSections={[
                        <TabActions key="tab" tab={tab} space={space} onRefresh={revalidate} />,
                        <SpaceActions key="space" space={space} spaces={spaces} onRefresh={revalidate} />,
                      ]}
                    />
                  )),
                )}
            </List.Section>
          ))}
        </>
      )}
    </List>
  );
}
