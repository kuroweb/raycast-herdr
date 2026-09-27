import { useState } from "react";
import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { clearAgentName, renameAgent } from "../herdr/agent";
import { describeError } from "../herdr/errors";
import { Agent } from "../herdr/types";

// herdr の live agent name 制約。手前で弾いてCLI往復を省く。
const NAME_PATTERN = /^[a-z][a-z0-9_-]{0,31}$/;

type Props = {
  agent: Agent;
  onRenamed: () => void;
};

export function RenameForm({ agent, onRenamed }: Props) {
  const { pop } = useNavigation();
  const [name, setName] = useState(agent.name ?? "");
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
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="名前を設定"
            shortcut={{ modifiers: ["cmd"], key: "return" }}
            icon={Icon.Pencil}
            onSubmit={() => {
              if (!NAME_PATTERN.test(name)) {
                setError("英小文字で始まり、英小文字・数字・- _ のみ、32文字以内");
                return;
              }
              return run(() => renameAgent(agent.paneId, name), "名前を変更しました");
            }}
          />
          <Action
            title="名前を解除"
            icon={Icon.XMarkCircle}
            onAction={() => run(() => clearAgentName(agent.paneId), "名前を解除しました")}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Agent" text={agent.title} />
      <Form.Description title="Directory" text={agent.cwd} />
      <Form.TextField
        id="name"
        title="Agent名"
        placeholder="reviewer"
        value={name}
        error={error}
        onChange={(value) => {
          setName(value);
          setError(undefined);
        }}
      />
    </Form>
  );
}
