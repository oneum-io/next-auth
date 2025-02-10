import type { Account, Profile, User, InternalOptions } from "../../../types.js"
import type { AdapterSession, AdapterUser } from "../../../adapters.js"
import type { JWT } from "../../../jwt.js"
import type { Cookie, SessionStore } from "../../utils/cookie.js"

type Trigger = Parameters<InternalOptions["callbacks"]["jwt"]>[0]["trigger"]
type IsNewUser = Parameters<InternalOptions["callbacks"]["jwt"]>[0]["isNewUser"]

const databaseToken = (
  cookies: Cookie[],
  session: AdapterSession | null,
  options: InternalOptions
) => {
  if (!session) return
  cookies.push({
    name: options.cookies.sessionToken.name,
    value: session.sessionToken,
    options: {
      ...options.cookies.sessionToken.options,
      expires: session.expires,
    },
  })

  return cookies
}

const jwtNullToken = (cookies: Cookie[], sessionStore: SessionStore) => {
  cookies.push(...sessionStore.clean())

  return cookies
}

const jwtStringToken = async (
  token: JWT,
  cookies: Cookie[],
  sessionStore: SessionStore,
  jwt: InternalOptions["jwt"],
  sessionMaxAge: InternalOptions["session"]["maxAge"],
  options: InternalOptions
) => {
  const salt = options.cookies.sessionToken.name
  // Encode token
  const newToken = await jwt.encode({ ...options.jwt, token, salt })

  // Set cookie expiry date
  const cookieExpires = new Date()
  cookieExpires.setTime(cookieExpires.getTime() + sessionMaxAge * 1000)

  const sessionCookies = sessionStore.chunk(newToken, {
    expires: cookieExpires,
  })

  cookies.push(...sessionCookies)

  return cookies
}

const createToken = async (
  user: AdapterUser | User,
  account: Account,
  profile: Profile | null,
  isNewUser: IsNewUser,
  trigger: Trigger,
  callbacks: InternalOptions["callbacks"]
) => {
  const defaultToken = {
    name: user.name,
    email: user.email,
    picture: user.image,
    sub: user.id?.toString(),
  }

  const token = await callbacks.jwt({
    token: defaultToken,
    user,
    account,
    ...(profile ? { profile } : {}),
    isNewUser,
    trigger,
  })

  return token
}

const jwtToken = async (
  user: AdapterUser | User,
  account: Account,
  profile: Profile | null,
  isNewUser: IsNewUser,
  trigger: Trigger,
  cookies: Cookie[],
  sessionStore: SessionStore,
  jwt: InternalOptions["jwt"],
  callbacks: InternalOptions["callbacks"],
  sessionMaxAge: InternalOptions["session"]["maxAge"],
  options: InternalOptions
) => {
  const token = await createToken(
    user,
    account,
    profile,
    isNewUser,
    trigger,
    callbacks
  )

  // Clear cookies if token is null
  if (token === null) {
    return jwtNullToken(cookies, sessionStore)
  }

  return await jwtStringToken(
    token,
    cookies,
    sessionStore,
    jwt,
    sessionMaxAge,
    options
  )
}

export const sessionCookies = async (
  user: User | AdapterUser,
  account: Account,
  profile: Profile | null,
  session: JWT | AdapterSession | null | undefined,
  isNewUser: IsNewUser,
  trigger: Trigger,
  cookies: Cookie[],
  sessionStore: SessionStore,
  jwt: InternalOptions["jwt"],
  sessionMaxAge: InternalOptions["session"]["maxAge"],
  callbacks: InternalOptions["callbacks"],
  options: InternalOptions,
  useJwtSession: boolean
) => {
  if (useJwtSession) {
    return await jwtToken(
      user,
      account,
      profile,
      isNewUser,
      trigger,
      cookies,
      sessionStore,
      jwt,
      callbacks,
      sessionMaxAge,
      options
    )
  }

  return databaseToken(cookies, session as AdapterSession, options)
}
