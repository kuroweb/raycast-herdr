import { describe, expect, it } from "vitest";
import { parseSocketPath } from "../src/herdr/socket";

describe("parseSocketPath", () => {
  it("herdr status server の出力からソケットパスを取り出す", () => {
    const output = [
      "status: running",
      "version: 0.9.1",
      "endpoint_compatible: yes",
      "socket: /Users/u/.config/herdr/herdr.sock",
    ].join("\n");
    expect(parseSocketPath(output)).toBe("/Users/u/.config/herdr/herdr.sock");
  });

  it("名前付きセッションの別パスも取れる", () => {
    expect(parseSocketPath("socket: /Users/u/.config/herdr/work.sock\n")).toBe("/Users/u/.config/herdr/work.sock");
  });

  it("socket行が無ければundefined", () => {
    expect(parseSocketPath("status: stopped\n")).toBeUndefined();
  });
});
