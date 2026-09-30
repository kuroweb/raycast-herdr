import { useState } from "react";
import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { agentTitle } from "../herdr/agent";
import { clearPaneLabel, renamePane } from "../herdr/layout";
import { describeError } from "../herdr/errors";
import { Agent } from "../herdr/types";

type Props = {
  agent: Agent;
  onRenamed: () => void;
};

/**
 * 一覧に出るタイトルを編集する。
 * 素のタイトルはagent側が書き換えるターミナルタイトルなので、上書きにはpaneのラベルを使う。
 * 解除するとターミナルタイトルの表示に戻る。
 */
export function TitleForm({ agent, onRenamed }: Props) {
  const { pop } = useNavigation();
  const [label, setLabel] = useState(agent.label ?? "");
  const [error, setError] = useState<string | undefined>();

  async function run(action: () => Promise<void>, successTitle: string) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "実行中" });
    try {
      await action();
      toast.style = Toast.Style.Success;
      toast.title = successTitle;
      onRenamed();
      pop();
    } catch (cause) {
      toast.style = Toast.Style.Failure;
      toast.title = "変更できません";
      toast.message = describeError(cause);
    }
  }

  return (
    <Form
      navigationTitle={agentTitle(agent)}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="タイトルを設定"
            icon={Icon.Pencil}
            shortcut={{ modifiers: ["cmd"], key: "return" }}
            onSubmit={() => {
              if (label.trim().length === 0) {
                setError("タイトルを入力してください");
                return;
              }
              return run(() => renamePane(agent.paneId, label.trim()), "タイトルを変更しました");
            }}
          />
          <Action
            title="タイトルを解除"
            icon={Icon.XMarkCircle}
            onAction={() => run(() => clearPaneLabel(agent.paneId), "タイトルを解除しました")}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="ターミナルタイトル" text={agent.title} />
      <Form.Description title="Directory" text={agent.cwd} />
      <Form.TextField
        id="label"
        title="タイトル"
        placeholder={agent.title}
        value={label}
        error={error}
        onChange={(value) => {
          setLabel(value);
          setError(undefined);
        }}
      />
    </Form>
  );
}
