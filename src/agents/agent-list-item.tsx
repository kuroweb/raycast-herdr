import { Action, ActionPanel, Alert, confirmAlert, Icon, Keyboard, List, showToast, Toast } from "@raycast/api";
import { Agent } from "../herdr/types";
import { agentIcon, ENTITY_ICON, presentation } from "../herdr/status";
import { shortenPath } from "../herdr/workspace";
import { describeError } from "../herdr/errors";
import { focusAgentAndReveal } from "../herdr/terminal";
import { closePane } from "../herdr/layout";
import { AgentOutput } from "./output-detail";
import { PromptForm } from "./prompt-form";
import { RespondView, ResponseActionSections } from "./respond";
import { RenameForm } from "./rename-form";

type Props = {
  agent: Agent;
  onRefresh: () => void;
};

export function AgentListItem({ agent, onRefresh }: Props) {
  const status = presentation(agent.status);

  async function close() {
    const confirmed = await confirmAlert({
      title: `${agent.title} を閉じますか`,
      message: "このpaneで動いているagentも終了します。",
      icon: Icon.Trash,
      primaryAction: { title: "閉じる", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) {
      return;
    }
    try {
      await closePane(agent.paneId);
      onRefresh();
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "閉じられません", message: describeError(error) });
    }
  }

  return (
    <List.Item
      icon={agentIcon(agent.kind, status.color)}
      title={agent.title}
      subtitle={agent.cwd.length > 0 ? shortenPath(agent.cwd) : undefined}
      keywords={[agent.paneId, agent.cwd, agent.kind, agent.name ?? ""]}
      accessories={[
        ...(agent.focused ? [{ icon: Icon.Eye, tooltip: "フォーカス中" }] : []),
        { tag: { value: status.label, color: status.color } },
        // 種別はアイコンで分かるので出さない。付け替えた名前だけは他に出る場所が無いので残す。
        ...(agent.name ? [{ text: agent.name }] : []),
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section title={`Agent: ${agent.name ?? agent.kind}`}>
            <Action
              title="フォーカス"
              icon={ENTITY_ICON.agent}
              onAction={async () => {
                try {
                  await focusAgentAndReveal(agent);
                } catch (error) {
                  await showToast({
                    style: Toast.Style.Failure,
                    title: "フォーカスできません",
                    message: describeError(error),
                  });
                }
              }}
            />
            <Action.Push
              title="応答内容を見る"
              icon={Icon.Reply}
              shortcut={Keyboard.Shortcut.Common.ToggleQuickLook}
              target={<RespondView target={agent.paneId} title={agent.title} />}
            />
            <Action.Push
              title="プロンプトを送信"
              icon={ENTITY_ICON.agent}
              shortcut={{ modifiers: ["cmd"], key: "m" }}
              target={<PromptForm target={agent.paneId} title={agent.title} cwd={agent.cwd} onSubmitted={onRefresh} />}
            />
            <Action.Push
              title="出力を見る"
              icon={ENTITY_ICON.agent}
              shortcut={Keyboard.Shortcut.Common.Open}
              target={<AgentOutput agent={agent} />}
            />
            <Action.Push
              title="名前を変更"
              icon={ENTITY_ICON.agent}
              shortcut={Keyboard.Shortcut.Common.Edit}
              target={<RenameForm agent={agent} onRenamed={onRefresh} />}
            />
          </ActionPanel.Section>
          <ResponseActionSections target={agent.paneId} onSent={onRefresh} />
          <ActionPanel.Section>
            <Action
              title="Paneを閉じる"
              icon={ENTITY_ICON.pane}
              style={Action.Style.Destructive}
              shortcut={Keyboard.Shortcut.Common.Remove}
              onAction={close}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Pane IDをコピー"
              content={agent.paneId}
              shortcut={Keyboard.Shortcut.Common.Copy}
            />
            <Action.CopyToClipboard title="作業ディレクトリをコピー" content={agent.cwd} />
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
