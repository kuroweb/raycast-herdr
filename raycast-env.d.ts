/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Herdr Binary - herdrコマンドの絶対パス。RaycastはログインシェルのPATHを継承しないため絶対パスが必要。 */
  "herdrPath": string,
  /** Terminal App - focus時に前面化するターミナルアプリ。未設定ならフォーカス変更のみ行う。 */
  "terminalApp"?: import("@raycast/api").Application,
  /** Output Lines - 出力プレビューで読み込む行数。 */
  "readLines": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `agents` command */
  export type Agents = ExtensionPreferences & {}
  /** Preferences accessible in the `agent-status` command */
  export type AgentStatus = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `agents` command */
  export type Agents = {}
  /** Arguments passed to the `agent-status` command */
  export type AgentStatus = {}
}

