import { useEffect, useState } from "react";
import { Action, ActionPanel, Detail, Form, Icon, Keyboard, showToast, Toast, useNavigation } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { clearAgentInput, readAgentDetection, sendAgentKeys } from "../herdr/agent";
import { sendPaneText } from "../herdr/layout";
import { describeError } from "../herdr/errors";

const REFRESH_INTERVAL_MS = 2_000;

type Props = {
  /** 応答先のpane ID。 */
  target: string;
  title: string;
};

type ResponseActionsProps = {
  target: string;
  onSent: () => void;
};

/**
 * 承認や選択肢への応答をRaycastから返す。
 * agentが止まっているのは入力待ちのときなので、何を聞かれているかを出したまま
 * キーを送れるようにする。ターミナルに戻らずに片付けるのが目的。
 */
export function RespondView({ target, title }: Props) {
  const { data, isLoading, error, revalidate } = useCachedPromise(readAgentDetection, [target]);

  // 応答すると画面が変わるので、送った直後だけでなく常に追従する。
  useEffect(() => {
    const timer = setInterval(revalidate, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [revalidate]);

  const body = error ? `**読み込めません**\n\n${describeError(error)}` : toCodeBlock(data ?? "");

  return (
    <Detail
      isLoading={isLoading}
      navigationTitle={title}
      markdown={body}
      actions={
        <ActionPanel>
          <ResponseActionSections target={target} onSent={revalidate} />
          <ActionPanel.Section>
            <Action
              title="再読み込み"
              icon={Icon.ArrowClockwise}
              shortcut={Keyboard.Shortcut.Common.Refresh}
              onAction={revalidate}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

/** 一覧と応答画面のどちらからでも、同じキー操作をagentへ送れるようにする。 */
export function ResponseActionSections({ target, onSent }: ResponseActionsProps) {
  async function send(keys: string[], label: string) {
    try {
      await sendAgentKeys(target, keys);
      await showToast({ style: Toast.Style.Success, title: `${label} を送りました` });
      onSent();
    } catch (cause) {
      await showToast({ style: Toast.Style.Failure, title: "送れません", message: describeError(cause) });
    }
  }

  return (
    <>
      <ActionPanel.Section title="応答">
        <Action
          title="決定（Enter）"
          icon={Icon.Check}
          shortcut={{ modifiers: ["shift"], key: "enter" }}
          onAction={() => send(["enter"], "Enter")}
        />
        <Action
          title="取り消し（Esc）"
          icon={Icon.XMarkCircle}
          shortcut={{ modifiers: ["shift"], key: "escape" }}
          onAction={() => send(["esc"], "Esc")}
        />
        <Action
          title="上の選択肢へ"
          icon={Icon.ArrowUp}
          shortcut={{ modifiers: ["shift"], key: "arrowUp" }}
          onAction={() => send(["up"], "↑")}
        />
        <Action
          title="下の選択肢へ"
          icon={Icon.ArrowDown}
          shortcut={{ modifiers: ["shift"], key: "arrowDown" }}
          onAction={() => send(["down"], "↓")}
        />
        <Action
          title="左の選択肢へ"
          icon={Icon.ArrowLeft}
          shortcut={{ modifiers: ["shift"], key: "arrowLeft" }}
          onAction={() => send(["left"], "←")}
        />
        <Action
          title="右の選択肢へ"
          icon={Icon.ArrowRight}
          shortcut={{ modifiers: ["shift"], key: "arrowRight" }}
          onAction={() => send(["right"], "→")}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action.Push
          title="文章で答える"
          icon={Icon.Text}
          shortcut={{ modifiers: ["cmd"], key: "t" }}
          target={<AnswerForm target={target} onSent={onSent} />}
        />
      </ActionPanel.Section>
    </>
  );
}

/** 選択肢ではなく自由記述で聞かれたとき用。文字を送ってから確定する。 */
function AnswerForm({ target, onSent }: { target: string; onSent: () => void }) {
  const { pop } = useNavigation();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>();

  async function submit() {
    if (text.trim().length === 0) {
      setError("回答を入力してください");
      return;
    }
    const toast = await showToast({ style: Toast.Style.Animated, title: "送信中" });
    try {
      await sendPaneText(target, text);
      await sendAgentKeys(target, ["enter"]);
      await clearAgentInput(target, text);
      toast.style = Toast.Style.Success;
      toast.title = "送信しました";
      onSent();
      pop();
    } catch (cause) {
      toast.style = Toast.Style.Failure;
      toast.title = "送れません";
      toast.message = describeError(cause);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="送信"
            icon={Icon.Text}
            shortcut={{ modifiers: ["cmd"], key: "return" }}
            onSubmit={submit}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="answer"
        title="回答"
        placeholder="そのまま入力され、最後に Enter が送られる"
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

function toCodeBlock(output: string): string {
  const trimmed = output.replace(/\s+$/, "");
  return trimmed.length === 0 ? "_応答待ちの表示がありません_" : ["```text", trimmed, "```"].join("\n");
}
