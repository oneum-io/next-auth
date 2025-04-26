import type {
  Adapter,
  AdapterAccount,
  AdapterAccountType,
  AdapterSession,
  AdapterUser,
} from "../../../../adapters.js"
import type { Account, InternalOptions, User } from "../../../../types.js"
import type { SessionToken } from "../../../utils/cookie.js"
import type { JWT } from "../../../../jwt.js"
import { fromDate } from "../../../utils/date.js"

export const DEFAULT_TYPES = [
  "email",
  "oauth",
  "oidc",
  "webauthn",
] satisfies AdapterAccountType[]

// Input validation
export const verifyProvider = (
  account: AdapterAccount | Account | null,
  types: AdapterAccountType[] = DEFAULT_TYPES
) => {
  if (!account?.providerAccountId || !account.type) {
    throw new Error("Missing or invalid provider account")
  }

  if (!types.includes(account.type)) {
    throw new Error("Provider not supported")
  }
}

// If no adapter is configured, the user is not stored in the database and cannot
// persist data; in this mode we just return a dummy session object
export const noDatabaseSolution = (
  account: AdapterAccount | Account | null,
  profile: User | AdapterUser | { email: string },
  adapter?: Adapter | null
) => {
  if (adapter) return null

  return { user: profile as User, account: account as Account }
}

const obtainJwtSessionAndUser = async (
  sessionToken: SessionToken,
  options: InternalOptions
) => {
  try {
    const { jwt, adapter } = options
    // TODO: move for sessionCookies too?
    const salt = options.cookies.sessionToken.name
    const session = await jwt.decode({ ...jwt, token: sessionToken, salt })

    if (session && "sub" in session && session.sub) {
      const user = await adapter?.getUser(session.sub)

      return { user, session }
    }

    return { session, user: null }
  } catch {
    // if session can't be verified, treat as no session
    return { session: null, user: null }
  }
}

const obtainDatabaseSessionAndUser = async (
  sessionToken: SessionToken,
  options: InternalOptions
) => {
  const { adapter } = options

  const userAndSession = await adapter?.getSessionAndUser(sessionToken)

  if (!userAndSession) return { session: null, user: null }

  const { session, user } = userAndSession

  return { session, user }
}

// Preparing the session and user for the current flow
export const obtainSessionAndUser = async (
  sessionToken: SessionToken,
  useJwtSession: boolean,
  options: InternalOptions
) => {
  if (!sessionToken) {
    return { session: null, user: null }
  }

  if (useJwtSession) {
    return await obtainJwtSessionAndUser(sessionToken, options)
  }

  return await obtainDatabaseSessionAndUser(sessionToken, options)
}

export const getNewSession = async (
  user: AdapterUser,
  useJwtSession: boolean,
  options: InternalOptions
): Promise<Partial<AdapterSession> | undefined> => {
  if (useJwtSession) return {}

  const {
    adapter,
    session: { generateSessionToken, maxAge },
    experimental: { enableCredentialsSession = false },
  } = options

  const session: AdapterSession = {
    sessionToken: generateSessionToken(),
    userId: user.id,
    expires: fromDate(maxAge),
  }

  if (enableCredentialsSession && options.provider.type === "credentials") {
    session.credentials = true
  }

  return await adapter?.createSession(session)
}

export const getDbUser = async (
  profile: AdapterUser,
  options: InternalOptions
) => {
  const { adapter } = options

  const userByEmail = profile.email
    ? await adapter?.getUserByEmail(profile.email)
    : null

  return userByEmail
}

export const getCurrentAccount = (
  account: AdapterAccount,
  user: AdapterUser
) => {
  return { ...account, userId: user.id } as AdapterAccount
}

export const getUserByAccount = async (
  account: AdapterAccount,
  options: InternalOptions
) => {
  const { adapter } = options
  const user = await adapter?.getUserByAccount({
    providerAccountId: account.providerAccountId,
    provider: account.provider,
  })

  return user
}

export const linkUserAccounts = async (
  profile: AdapterUser,
  account: AdapterAccount,
  currentAccount: AdapterAccount,
  user: AdapterUser,
  options: InternalOptions
) => {
  const { adapter, events } = options

  await adapter?.linkAccount(currentAccount)
  await events.linkAccount?.({ user, account, profile })
}

export const pickSession = async (
  hasSession: boolean,
  session: AdapterSession | JWT | null,
  user: AdapterUser,
  useJwtSession: boolean,
  options: InternalOptions
) => {
  if (hasSession) {
    return session
  }

  return await getNewSession(user, useJwtSession, options)
}
