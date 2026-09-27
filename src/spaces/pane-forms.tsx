import { useState } from "react";
import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { clearPaneLabel, Pane, renamePane } from "../herdr/layout";
import { describeError } from "../herdr/errors";

export function RenamePaneForm({ pane, onRenamed }: { pane: Pane; onRenamed: () => void }) {
  const { pop } = useNavigation();
  const [label, setLabel] = useState(pane.label ?? "");
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
            title="ラベルを設定"
            icon={Icon.Pencil}
            shortcut={{ modifiers: ["cmd"], key: "return" }}
            onSubmit={() => {
              if (label.trim().length === 0) {
                setError("ラベルを入力してください");
                return;
              }
              return run(() => renamePane(pane.id, label.trim()), "ラベルを変更しました");
            }}
          />
          <Action
            title="ラベルを解除"
            icon={Icon.XMarkCircle}
            onAction={() => run(() => clearPaneLabel(pane.id), "ラベルを解除しました")}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Pane" text={pane.label ?? pane.title ?? "シェル"} />
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
