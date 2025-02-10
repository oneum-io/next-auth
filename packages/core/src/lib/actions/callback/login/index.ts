import type {
  AdapterAccount,
  AdapterAccountType,
  AdapterUser,
} from "../../../../adapters.js"
import type { Account, InternalOptions, User } from "../../../../types.js"
import type { SessionToken } from "../../../utils/cookie.js"
import { getHandler } from "./handler.js"
import {
  DEFAULT_TYPES,
  noDatabaseSolution,
  obtainSessionAndUser,
  verifyProvider,
} from "./util.js"

const experimentalCredentialsHandler = (options: InternalOptions) => {
  const {
    experimental: { enableCredentialsSession },
  } = options

  return enableCredentialsSession
    ? [...DEFAULT_TYPES, "credentials" as AdapterAccountType]
    : DEFAULT_TYPES
}

/**
 * This function handles the complex flow of signing users in, and either creating,
 * linking (or not linking) accounts, depending on if the user is currently logged
 * in, if they have acount already and the authentication mechanism they are using.
 *
 * It prevents insecure behaviour, such as linking OAuth accounts unless a user is
 * signed in and authenticated with an existing valid account.
 *
 * All verification (e.g. OAuth flow or email address verification flows) are done
 * prior to this handler being called to avoid additional complexity in this handler.
 * @param sessionToken Session token
 * @param _profile Provider profile
 * @param _account Provider account
 * @param options
 * @returns authentication details
 */
export async function handleLoginOrRegister(
  sessionToken: SessionToken,
  _profile: User | AdapterUser | { email: string },
  _account: AdapterAccount | Account | null,
  options: InternalOptions
) {
  const providerTypes = experimentalCredentialsHandler(options)
  // Input validation
  verifyProvider(_account, providerTypes)

  const {
    adapter,
    session: { strategy: sessionStrategy },
  } = options

  // If no adapter was presented, return a dummy session object
  const noDb = noDatabaseSolution(_account, _profile, adapter)

  if (noDb !== null) return noDb

  // Preparing auth details for current handler
  const profile = _profile as AdapterUser
  const account = _account as AdapterAccount

  const useJwtSession = sessionStrategy === "jwt"

  const { session: _session, user: _user } = await obtainSessionAndUser(
    sessionToken,
    useJwtSession,
    options
  )

  // Selecting a handler according to account type
  const handler = getHandler<typeof account.type>(account)

  // Handler execution
  const details = await handler(
    sessionToken,
    profile,
    _session,
    account,
    _user,
    useJwtSession,
    options
  )

  return details
}
