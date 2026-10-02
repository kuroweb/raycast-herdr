import { useEffect } from "react";
import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { AgentListItem } from "./agents/agent-list-item";
import { listAgentGroups } from "./herdr/panel";
import { describeError, isUnavailable } from "./herdr/errors";
import { openHerdr } from "./herdr/launch";

const REFRESH_INTERVAL_MS = 2_000;

export default function Command() {
  const { data, isLoading, error, revalidate } = useCachedPromise(listAgentGroups, [], { initialData: [] });

  // 状態は外部プロセス側で変わるので、ビューを開いている間はポーリングで追従する。
  useEffect(() => {
    const timer = setInterval(revalidate, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [revalidate]);

  const groups = data ?? [];

  return (
    <List isLoading={isLoading} searchBarPlaceholder="タイトル・ディレクトリ・pane IDで絞り込む">
      {error ? (
        <List.EmptyView
          icon={Icon.Warning}
          title={isUnavailable(error) ? "herdrコマンドが見つかりません" : "agentを取得できません"}
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
            icon={Icon.Terminal}
            title="稼働中のagentがありません"
            description="Herdrのpaneでagentを起動すると、ここに表示されます。"
            actions={
              <ActionPanel>
                <Action title="Herdrを開く" icon={Icon.Terminal} onAction={() => openHerdr()} />
                <Action title="再読み込み" icon={Icon.ArrowClockwise} onAction={revalidate} />
              </ActionPanel>
            }
          />
          {groups.map((group) => (
            <List.Section key={group.key} title={group.title} subtitle={group.subtitle}>
              {group.agents.map((agent) => (
                <AgentListItem key={agent.paneId} agent={agent} onRefresh={revalidate} />
              ))}
            </List.Section>
          ))}
        </>
      )}
    </List>
  );
}
