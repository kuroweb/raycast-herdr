import { beforeEach, describe, expect, it, vi } from "vitest";

const execFile = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", () => ({ execFile }));

import { runVoid } from "../src/herdr/cli";

describe("runVoid", () => {
  beforeEach(() => {
    execFile.mockReset();
  });

  it("終了コード0の空出力を成功として扱う", async () => {
    execFile.mockImplementation((_binary, _args, _options, callback) => callback(null, "", ""));

    await expect(runVoid(["pane", "send-text", "w1:p1", ""])).resolves.toBeUndefined();
  });

  it("JSONエンベロープのエラーをHerdrCliErrorにする", async () => {
    execFile.mockImplementation((_binary, _args, _options, callback) =>
      callback(null, JSON.stringify({ error: { code: "invalid_key", message: "bad key" } }), ""),
    );

    await expect(runVoid(["agent", "send-keys", "w1:p1", "bad"])).rejects.toMatchObject({
      code: "invalid_key",
      message: "bad key",
    });
  });

  it("成功時でも未知のテキスト出力は拒否する", async () => {
    execFile.mockImplementation((_binary, _args, _options, callback) => callback(null, "unexpected", ""));

    await expect(runVoid(["agent", "send-keys", "w1:p1", "enter"])).rejects.toMatchObject({
      code: "unexpected_response",
    });
  });
});
