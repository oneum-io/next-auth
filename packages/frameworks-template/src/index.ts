/**
 *
 * :::warning
 * `@oneum-io/<framework-id>` is currently experimental. The API _will_ change in the future.
 * :::
 *
 * <framework-name> Auth is the official <framework-name> integration for Auth.js.
 * It provides a simple way to add authentication to your <framework-name> app in a few lines of code.
 *
 * ## Installation
 * ```bash npm2yarn
 * npm install @oneum-io/<framework-id>
 * ```
 *
 * ## Usage
 *
 * ### Provider Configuration
 *
 * ## Signing in and signing out
 *
 * ## Managing the session
 *
 * ## Authorization
 *
 * ```
 *
 * @module @oneum-io/<framework-id>
 */

// Re-export types of Auth.js
export type {
  Account,
  DefaultSession,
  Profile,
  Session,
  User,
} from "@oneum-io/core/types"

export function FrameworkAuth() {
  throw new Error("Not implemented")
}
