import { basename } from "node:path";
import { Action, ActionPanel, Icon, Keyboard, List, showToast, Toast } from "@raycast/api";
import { Agent } from "../herdr/types";
import { presentation } from "../herdr/status";
import { describeError } from "../herdr/errors";
import { focusAgentAndReveal } from "../herdr/terminal";
import { AgentOutput } from "./output-detail";
import { PromptForm } from "./prompt-form";
import { RenameForm } from "./rename-form";

type Props = {
  agent: Agent;
  onRefresh: () => void;
};

export function AgentListItem({ agent, onRefresh }: Props) {
  const status = presentation(agent.status);

  return (
    <List.Item
      icon={{ source: status.icon, tintColor: status.color }}
      title={agent.title}
      subtitle={agent.cwd.length > 0 ? basename(agent.cwd) : undefined}
      keywords={[agent.paneId, agent.cwd, agent.kind, agent.name ?? ""]}
      accessories={[
        ...(agent.focused ? [{ icon: Icon.Eye, tooltip: "フォーカス中" }] : []),
        { tag: { value: status.label, color: status.color } },
        { text: agent.name ?? agent.kind, tooltip: agent.cwd },
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action
              title="フォーカス"
              icon={Icon.Window}
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
              title="プロンプトを送信"
              icon={Icon.Message}
              shortcut={{ modifiers: ["cmd"], key: "m" }}
              target={<PromptForm agent={agent} onSubmitted={onRefresh} />}
            />
            <Action.Push
              title="出力を見る"
              icon={Icon.Text}
              shortcut={Keyboard.Shortcut.Common.Open}
              target={<AgentOutput agent={agent} />}
            />
            <Action.Push
              title="名前を変更"
              icon={Icon.Pencil}
              shortcut={Keyboard.Shortcut.Common.Edit}
              target={<RenameForm agent={agent} onRenamed={onRefresh} />}
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
