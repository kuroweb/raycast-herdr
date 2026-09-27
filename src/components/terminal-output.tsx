import { Action, ActionPanel, Detail, Icon, useNavigation } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { describeError } from "../herdr/errors";

type Row = { title: string; text: string };

type Props = {
  navigationTitle: string;
  target: string;
  read: (target: string) => Promise<string>;
  /** 状態タグ。agentが居ない素のpaneでは省く。 */
  status?: { label: string; color: string };
  rows: Row[];
};

/** agentのpaneと素のpaneで同じ読み方ができるよう、出力表示を1つにまとめる。 */
export function TerminalOutput({ navigationTitle, target, read, status, rows }: Props) {
  const { pop } = useNavigation();
  const { data, isLoading, error, revalidate } = useCachedPromise(read, [target]);
  const body = error ? `**読み込めません**\n\n${describeError(error)}` : toCodeBlock(data ?? "");

  return (
    <Detail
      isLoading={isLoading}
      navigationTitle={navigationTitle}
      markdown={body}
      metadata={
        <Detail.Metadata>
          {status ? (
            <Detail.Metadata.TagList title="Status">
              <Detail.Metadata.TagList.Item text={status.label} color={status.color} />
            </Detail.Metadata.TagList>
          ) : null}
          {rows.map((row) => (
            <Detail.Metadata.Label key={row.title} title={row.title} text={row.text} />
          ))}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action title="再読み込み" icon={Icon.ArrowClockwise} onAction={revalidate} />
          <Action title="戻る" icon={Icon.ArrowLeft} shortcut={{ modifiers: [], key: "arrowLeft" }} onAction={pop} />
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
