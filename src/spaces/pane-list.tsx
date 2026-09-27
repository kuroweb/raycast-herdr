import { useEffect } from "react";
import { Action, ActionPanel, Icon, List, useNavigation } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { listPanes, Tab } from "../herdr/layout";
import { PaneItem } from "./pane-item";

const REFRESH_INTERVAL_MS = 2_000;

export function PaneList({ tab }: { tab: Tab }) {
  const { pop } = useNavigation();
  const { data, isLoading, revalidate } = useCachedPromise(listPanes, [tab.id], { initialData: [] });

  useEffect(() => {
    const timer = setInterval(revalidate, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [revalidate]);

  return (
    <List
      isLoading={isLoading}
      navigationTitle={tab.label}
      searchBarPlaceholder="タイトル・ディレクトリ・pane IDで絞り込む"
    >
      {(data ?? []).map((pane) => (
        <PaneItem
          key={pane.id}
          pane={pane}
          onRefresh={revalidate}
          extraSections={
            <ActionPanel.Section>
              {/* 一段上の一覧へ戻る。降りるのが → なので、戻るのは ← が直感的。 */}
              <Action
                title="戻る"
                icon={Icon.ArrowLeft}
                shortcut={{ modifiers: [], key: "arrowLeft" }}
                onAction={pop}
              />
            </ActionPanel.Section>
          }
        />
      ))}
    </List>
  );
}
