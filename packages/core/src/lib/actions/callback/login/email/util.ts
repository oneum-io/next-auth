import type { AdapterUser } from "../../../../../adapters.js"
import type { InternalOptions } from "../../../../../types.js"
import type { SessionToken } from "../../../../utils/cookie.js"

const register = async (profile: AdapterUser, options: InternalOptions) => {
  const { adapter, events } = options

  const user = (await adapter?.createUser({
    ...profile,
    emailVerified: new Date(),
  })) as AdapterUser

  await events.createUser?.({ user })

  return { isNewUser: true, user }
}

const signin = async (
  sessionToken: SessionToken,
  _user: AdapterUser | null,
  dbUser: AdapterUser,
  useJwtSession: boolean,
  options: InternalOptions
) => {
  const { events, adapter } = options

  // If they are not already signed in as the same user, this flow will
  // sign them out of the current session and sign them in as the new user
  if (_user && _user?.id !== dbUser.id && !useJwtSession && sessionToken) {
    await adapter?.deleteSession(sessionToken)
  }

  // Update emailVerified property on the user object
  const user = (await adapter?.updateUser({
    id: dbUser.id,
    emailVerified: new Date(),
  })) as AdapterUser

  await events.updateUser?.({ user })

  return { isNewUser: false, user }
}

export const getUser = async (
  sessionToken: SessionToken,
  profile: AdapterUser,
  _user: AdapterUser | null,
  useJwtSession: boolean,
  options: InternalOptions,
  dbUser?: AdapterUser | null
) => {
  if (dbUser) {
    return signin(sessionToken, _user, dbUser, useJwtSession, options)
  }

  // Create user account if there isn't one for the email address already
  return register(profile, options)
}
