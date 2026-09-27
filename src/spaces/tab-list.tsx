import { useEffect } from "react";
import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Icon,
  Keyboard,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { closeTab, focusTab, listTabs, Tab } from "../herdr/layout";
import { presentation } from "../herdr/status";
import { describeError } from "../herdr/errors";
import { revealTerminal } from "../herdr/terminal";
import { Space } from "../herdr/workspace";
import { CreateTabForm, RenameTabForm } from "./tab-forms";
import { PaneList } from "./pane-list";

const REFRESH_INTERVAL_MS = 2_000;

export function TabList({ space }: { space: Space }) {
  const { data, isLoading, revalidate } = useCachedPromise(listTabs, [space.id], { initialData: [] });

  useEffect(() => {
    const timer = setInterval(revalidate, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [revalidate]);

  return (
    <List isLoading={isLoading} navigationTitle={space.label} searchBarPlaceholder="ラベル・番号・tab IDで絞り込む">
      {(data ?? []).map((tab) => (
        <TabItem key={tab.id} tab={tab} space={space} onRefresh={revalidate} />
      ))}
    </List>
  );
}

function TabItem({ tab, space, onRefresh }: { tab: Tab; space: Space; onRefresh: () => void }) {
  const { pop } = useNavigation();
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
      title: `${tab.label} を閉じますか`,
      message: `${tab.paneCount}個のpaneが閉じます。実行中のagentも終了します。`,
      icon: Icon.Trash,
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
      icon={{ source: status.icon, tintColor: status.color }}
      title={tab.label}
      keywords={[tab.id, String(tab.number)]}
      accessories={[
        ...(tab.focused ? [{ icon: Icon.Eye, tooltip: "フォーカス中" }] : []),
        { tag: { value: status.label, color: status.color } },
        { text: `pane ${tab.paneCount}` },
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action title="フォーカス" icon={Icon.Window} onAction={focus} />
            <Action.Push
              title="Paneを見る"
              icon={Icon.AppWindowSidebarRight}
              shortcut={{ modifiers: [], key: "arrowRight" }}
              target={<PaneList tab={tab} />}
            />
            <Action.Push
              title="Tabを作成"
              icon={Icon.Plus}
              shortcut={Keyboard.Shortcut.Common.New}
              target={<CreateTabForm space={space} onCreated={onRefresh} />}
            />
            <Action.Push
              title="ラベルを変更"
              icon={Icon.Pencil}
              shortcut={Keyboard.Shortcut.Common.Edit}
              target={<RenameTabForm tab={tab} onRenamed={onRefresh} />}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="Tabを閉じる"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              shortcut={Keyboard.Shortcut.Common.Remove}
              onAction={close}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            {/* 一段上の一覧へ戻る。降りるのが → なので、戻るのは ← が直感的。 */}
            <Action title="戻る" icon={Icon.ArrowLeft} shortcut={{ modifiers: [], key: "arrowLeft" }} onAction={pop} />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.CopyToClipboard title="Tab IDをコピー" content={tab.id} shortcut={Keyboard.Shortcut.Common.Copy} />
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
