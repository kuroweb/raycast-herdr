// テストからは Raycast の実行環境を読めないため、参照している値だけを差し替える。
export const Color = {
  Red: "raycast-red",
  Green: "raycast-green",
  Orange: "raycast-orange",
  SecondaryText: "raycast-secondary-text",
} as const;

export const Icon = {
  ExclamationMark: "exclamation-mark",
  CheckCircle: "check-circle",
  CircleProgress50: "circle-progress-50",
  Circle: "circle",
  QuestionMark: "question-mark",
} as const;

export function getPreferenceValues() {
  return {};
}

export async function open() {
  return undefined;
}
