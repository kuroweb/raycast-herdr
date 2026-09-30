import { Action, ActionPanel, Alert, confirmAlert, Icon, Keyboard, List, showToast, Toast } from "@raycast/api";
import { Agent } from "../herdr/types";
import { agentTitle } from "../herdr/agent";
import { agentIcon, ENTITY_ICON, presentation } from "../herdr/status";
import { shortenPath } from "../herdr/workspace";
import { describeError } from "../herdr/errors";
import { focusAgentAndReveal } from "../herdr/terminal";
import { closePane } from "../herdr/layout";
import { PromptForm } from "./prompt-form";
import { RespondView, ResponseActionSections } from "./respond";
import { RenameForm } from "./rename-form";

type Props = {
  agent: Agent;
  onRefresh: () => void;
};

export function AgentListItem({ agent, onRefresh }: Props) {
  const status = presentation(agent.status);
  const title = agentTitle(agent);

  async function close() {
    const confirmed = await confirmAlert({
      title: `${title} を閉じますか`,
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
      title={title}
      subtitle={agent.cwd.length > 0 ? shortenPath(agent.cwd) : undefined}
      keywords={[agent.paneId, agent.cwd, agent.kind, agent.name ?? "", agent.title]}
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
              icon={Icon.SpeechBubble}
              shortcut={Keyboard.Shortcut.Common.Open}
              target={<RespondView target={agent.paneId} title={title} />}
            />
            <Action.Push
              title="プロンプトを送信"
              icon={Icon.TextInput}
              shortcut={{ modifiers: ["cmd"], key: "m" }}
              target={<PromptForm target={agent.paneId} title={title} cwd={agent.cwd} onSubmitted={onRefresh} />}
            />
            <Action.Push
              title="エージェント名を変更"
              icon={Icon.Tag}
              shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
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
              title="作業ディレクトリをコピー"
              content={agent.cwd}
              shortcut={Keyboard.Shortcut.Common.Copy}
            />
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
