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
  AppWindowGrid2x2: "app-window-grid-2x2",
  AppWindowList: "app-window-list",
  AppWindow: "app-window",
  MemoryChip: "computer-chip",
  Stars: "stars",
  Code: "code",
  Bolt: "bolt",
  Person: "person",
  Brush: "brush",
  Cog: "cog",
  Wand: "wand",
  Terminal: "terminal",
  Globe: "globe",
  Moon: "moon",
  Anchor: "anchor",
  CodeBlock: "code-block",
  Airplane: "airplane",
  Hammer: "hammer",
  Envelope: "envelope",
  Gauge: "gauge",
  Leaf: "leaf",
  Bookmark: "bookmark",
  CircleFilled: "circle-filled",
  Book: "book",
  Box: "box",
  Calculator: "calculator",
} as const;

export function getPreferenceValues() {
  return {};
}

export async function open() {
  return undefined;
}
