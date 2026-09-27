import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { readAgentOutput } from "../herdr/agent";
import { describeError } from "../herdr/errors";
import { presentation } from "../herdr/status";
import { Agent } from "../herdr/types";

type Props = {
  agent: Agent;
};

export function AgentOutput({ agent }: Props) {
  const { data, isLoading, error, revalidate } = useCachedPromise(readAgentOutput, [agent.paneId]);
  const status = presentation(agent.status);

  const body = error ? `**読み込めません**\n\n${describeError(error)}` : toCodeBlock(data ?? "");

  return (
    <Detail
      isLoading={isLoading}
      navigationTitle={agent.title}
      markdown={body}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.TagList title="Status">
            <Detail.Metadata.TagList.Item text={status.label} color={status.color} />
          </Detail.Metadata.TagList>
          <Detail.Metadata.Label title="Agent" text={agent.name ?? agent.kind} />
          <Detail.Metadata.Label title="Pane" text={agent.paneId} />
          <Detail.Metadata.Label title="Directory" text={agent.cwd} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action title="再読み込み" icon={Icon.ArrowClockwise} onAction={revalidate} />
          <Action.CopyToClipboard title="出力をコピー" content={data ?? ""} />
        </ActionPanel>
      }
    />
  );
}

/** ターミナル出力は等幅かつ折り返し無しで読めないと意味がないため、コードブロックに包む。 */
function toCodeBlock(output: string): string {
  const trimmed = output.replace(/\s+$/, "");
  return trimmed.length === 0 ? "_出力がありません_" : ["```text", trimmed, "```"].join("\n");
}
