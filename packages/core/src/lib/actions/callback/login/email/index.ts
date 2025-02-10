import type {
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from "../../../../../adapters.js"
import type { JWT } from "../../../../../jwt.js"
import type { InternalOptions } from "../../../../../types.js"
import type { SessionToken } from "../../../../utils/cookie.js"
import { getDbUser, getNewSession } from "../util.js"
import { getUser } from "./util.js"

export async function handleEmailLoginOrRegister(
  sessionToken: SessionToken,
  profile: AdapterUser,
  _session: AdapterSession | JWT | null,
  _: AdapterAccount,
  _user: AdapterUser | null,
  useJwtSession: boolean,
  options: InternalOptions
) {
  // If signing in with an email check if an account with the same email address exists already
  const dbUser = await getDbUser(profile, options)

  const { user, isNewUser } = await getUser(
    sessionToken,
    profile,
    _user,
    useJwtSession,
    options,
    dbUser
  )

  // Create new session
  const session = await getNewSession(user, useJwtSession, options)

  return { session, user, isNewUser }
}
