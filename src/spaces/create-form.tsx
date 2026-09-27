import { statSync } from "node:fs";
import { useState } from "react";
import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { createSpace, expandPath, shortenPath, Space } from "../herdr/workspace";
import { describeError } from "../herdr/errors";
import { revealTerminal } from "../herdr/terminal";

type Props = {
  /** 入力候補に使う既存workspace。同じリポジトリの隣に作ることが多いため。 */
  spaces: Space[];
  onCreated: () => void;
};

export function CreateSpaceForm({ spaces, onCreated }: Props) {
  const { pop } = useNavigation();
  const [cwd, setCwd] = useState("");
  const [label, setLabel] = useState("");
  const [cwdError, setCwdError] = useState<string | undefined>();

  async function submit() {
    const path = cwd.trim().length > 0 ? expandPath(cwd) : undefined;
    if (path && !isDirectory(path)) {
      setCwdError("ディレクトリが見つかりません");
      return;
    }

    const toast = await showToast({ style: Toast.Style.Animated, title: "作成中" });
    try {
      await createSpace({ cwd: path, label: label.trim() || undefined });
      toast.style = Toast.Style.Success;
      toast.title = "workspaceを作成しました";
      onCreated();
      pop();
      // 作成直後は中で作業を始めるので、ターミナルまで送る。
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
      <Form.TextField
        id="cwd"
        title="ディレクトリ"
        placeholder="~/environment/project（省略可）"
        info="空にすると Herdr の new_cwd 設定に従う。"
        value={cwd}
        error={cwdError}
        onChange={(value) => {
          setCwd(value);
          setCwdError(undefined);
        }}
      />
      {candidates(spaces).length > 0 ? (
        <Form.Dropdown id="candidate" title="既存から選ぶ" value="" onChange={(value) => value && setCwd(value)}>
          <Form.Dropdown.Item value="" title="選択しない" />
          {candidates(spaces).map((path) => (
            <Form.Dropdown.Item key={path} value={path} title={shortenPath(path)} />
          ))}
        </Form.Dropdown>
      ) : null}
      <Form.TextField
        id="label"
        title="ラベル"
        placeholder="省略するとディレクトリ名になる"
        value={label}
        onChange={setLabel}
      />
      <Form.Description text="作成したworkspaceにフォーカスする。⏎ または ⌘⏎ で作成。" />
    </Form>
  );
}

function candidates(spaces: Space[]): string[] {
  return [...new Set(spaces.map((space) => space.cwd).filter((cwd): cwd is string => cwd !== undefined))];
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}
