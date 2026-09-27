import { useState } from "react";
import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { promptAgent } from "../herdr/agent";
import { describeError } from "../herdr/errors";
import { Agent } from "../herdr/types";

type Props = {
  agent: Agent;
  onSubmitted: () => void;
};

export function PromptForm({ agent, onSubmitted }: Props) {
  const { pop } = useNavigation();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>();

  async function submit() {
    if (text.trim().length === 0) {
      setError("プロンプトを入力してください");
      return;
    }
    const toast = await showToast({ style: Toast.Style.Animated, title: "送信中" });
    try {
      await promptAgent(agent.paneId, text);
      toast.style = Toast.Style.Success;
      toast.title = "送信しました";
      onSubmitted();
      pop();
    } catch (cause) {
      toast.style = Toast.Style.Failure;
      toast.title = "送信できません";
      toast.message = describeError(cause);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            shortcut={{ modifiers: ["cmd"], key: "return" }}
            title="送信"
            icon={Icon.Message}
            onSubmit={submit}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Agent" text={agent.title} />
      <Form.Description title="Directory" text={agent.cwd} />
      <Form.TextArea
        id="prompt"
        title="プロンプト"
        placeholder="agentに送る指示"
        value={text}
        error={error}
        onChange={(value) => {
          setText(value);
          setError(undefined);
        }}
      />
    </Form>
  );
}
