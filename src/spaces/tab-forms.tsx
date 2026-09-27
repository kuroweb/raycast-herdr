import { useState } from "react";
import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { createTab, renameTab } from "../herdr/layout";
import { describeError } from "../herdr/errors";
import { revealTerminal } from "../herdr/terminal";

export function CreateTabForm({
  workspaceId,
  workspaceLabel,
  onCreated,
}: {
  workspaceId: string;
  workspaceLabel: string;
  onCreated: () => void;
}) {
  const { pop } = useNavigation();
  const [label, setLabel] = useState("");

  async function submit() {
    const toast = await showToast({ style: Toast.Style.Animated, title: "作成中" });
    try {
      await createTab({ workspaceId, label: label.trim() || undefined });
      toast.style = Toast.Style.Success;
      toast.title = "tabを作成しました";
      onCreated();
      pop();
      await revealTerminal();
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "作成できません";
      toast.message = describeError(error);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="作成"
            icon={Icon.Plus}
            shortcut={{ modifiers: ["cmd"], key: "return" }}
            onSubmit={submit}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Workspace" text={workspaceLabel} />
      <Form.TextField id="label" title="ラベル" placeholder="省略すると番号になる" value={label} onChange={setLabel} />
      <Form.Description text="作成したtabにフォーカスする。ディレクトリはHerdrの new_cwd 設定に従う。" />
    </Form>
  );
}

export function RenameTabForm({
  tabId,
  tabLabel,
  onRenamed,
}: {
  tabId: string;
  tabLabel: string;
  onRenamed: () => void;
}) {
  const { pop } = useNavigation();
  const [label, setLabel] = useState(tabLabel);
  const [error, setError] = useState<string | undefined>();

  async function submit() {
    if (label.trim().length === 0) {
      setError("ラベルを入力してください");
      return;
    }
    const toast = await showToast({ style: Toast.Style.Animated, title: "変更中" });
    try {
      await renameTab(tabId, label.trim());
      toast.style = Toast.Style.Success;
      toast.title = "ラベルを変更しました";
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
            title="変更"
            icon={Icon.Pencil}
            shortcut={{ modifiers: ["cmd"], key: "return" }}
            onSubmit={submit}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Tab" text={`Tab ${tabLabel}`} />
      <Form.TextField
        id="label"
        title="ラベル"
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
