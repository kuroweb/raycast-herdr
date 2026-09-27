import { showHUD, showToast, Toast } from "@raycast/api";
import { openHerdr } from "./herdr/launch";
import { describeError } from "./herdr/errors";

export default async function Command() {
  try {
    const result = await openHerdr();
    if (result.kind === "launched") {
      await showHUD(`${result.appName} でHerdrを開きました`);
      return;
    }
    await showToast({
      style: Toast.Style.Success,
      title: `${result.appName} を前面にしました`,
      message: "このターミナルは自動起動に未対応です。herdr と入力してください。",
    });
  } catch (error) {
    await showToast({ style: Toast.Style.Failure, title: "Herdrを開けません", message: describeError(error) });
  }
}
