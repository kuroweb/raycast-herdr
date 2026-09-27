import { useState } from "react";
import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { renameSpace, Space } from "../herdr/workspace";
import { describeError } from "../herdr/errors";

type Props = {
  space: Space;
  onRenamed: () => void;
};

export function RenameSpaceForm({ space, onRenamed }: Props) {
  const { pop } = useNavigation();
  const [label, setLabel] = useState(space.label);
  const [error, setError] = useState<string | undefined>();

  async function submit() {
    if (label.trim().length === 0) {
      setError("ラベルを入力してください");
      return;
    }
    const toast = await showToast({ style: Toast.Style.Animated, title: "変更中" });
    try {
      await renameSpace(space.id, label.trim());
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
            shortcut={{ modifiers: ["cmd"], key: "return" }}
            title="変更"
            icon={Icon.Pencil}
            onSubmit={submit}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Workspace" text={space.label} />
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
