import { describe, expect, it } from "vitest";
import { appleScriptString, launchCommand, newWindowScript, shellQuote } from "../src/herdr/launch";

describe("shellQuote", () => {
  it("空白を含むパスを1語に保つ", () => {
    expect(shellQuote("/Applications/My Tools/herdr")).toBe("'/Applications/My Tools/herdr'");
  });

  it("シングルクォートを閉じ直してエスケープする", () => {
    expect(shellQuote("/tmp/it's/herdr")).toBe(`'/tmp/it'\\''s/herdr'`);
  });
});

describe("appleScriptString", () => {
  it("バックスラッシュと二重引用符をエスケープする", () => {
    expect(appleScriptString('a"b\\c')).toBe('"a\\"b\\\\c"');
  });
});

describe("launchCommand", () => {
  it("ログインシェル経由で起動する", () => {
    expect(launchCommand("/opt/homebrew/bin/herdr")).toBe("/bin/sh -lc '/opt/homebrew/bin/herdr'");
  });
});

describe("newWindowScript", () => {
  it("Terminalはdo scriptで開く", () => {
    const script = newWindowScript("com.apple.Terminal", "/bin/sh -lc 'herdr'");
    expect(script).toContain('tell application id "com.apple.Terminal"');
    expect(script).toContain("do script \"/bin/sh -lc 'herdr'\"");
  });

  it("iTermはcreate windowで開く", () => {
    const script = newWindowScript("com.googlecode.iterm2", "/bin/sh -lc 'herdr'");
    expect(script).toContain("create window with default profile command");
  });

  it("未対応のターミナルはundefinedを返す", () => {
    expect(newWindowScript("dev.warp.Warp-Stable", "true")).toBeUndefined();
  });
});
