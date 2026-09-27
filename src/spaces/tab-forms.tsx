import { useState } from "react";
import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { createTab, renameTab, Tab } from "../herdr/layout";
import { describeError } from "../herdr/errors";
import { revealTerminal } from "../herdr/terminal";
import { Space } from "../herdr/workspace";

export function CreateTabForm({ space, onCreated }: { space: Space; onCreated: () => void }) {
  const { pop } = useNavigation();
  const [label, setLabel] = useState("");

  async function submit() {
    const toast = await showToast({ style: Toast.Style.Animated, title: "作成中" });
    try {
      await createTab({ workspaceId: space.id, label: label.trim() || undefined });
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
      <Form.Description title="Workspace" text={space.label} />
      <Form.TextField id="label" title="ラベル" placeholder="省略すると番号になる" value={label} onChange={setLabel} />
      <Form.Description text="作成したtabにフォーカスする。ディレクトリはHerdrの new_cwd 設定に従う。" />
    </Form>
  );
}

export function RenameTabForm({ tab, onRenamed }: { tab: Tab; onRenamed: () => void }) {
  const { pop } = useNavigation();
  const [label, setLabel] = useState(tab.label);
  const [error, setError] = useState<string | undefined>();

  async function submit() {
    if (label.trim().length === 0) {
      setError("ラベルを入力してください");
      return;
    }
    const toast = await showToast({ style: Toast.Style.Animated, title: "変更中" });
    try {
      await renameTab(tab.id, label.trim());
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
      <Form.Description title="Tab" text={`${tab.label} (${tab.id})`} />
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
