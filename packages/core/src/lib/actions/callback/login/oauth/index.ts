import type {
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from "../../../../../adapters.js"
import type { JWT } from "../../../../../jwt.js"
import type { InternalOptions } from "../../../../../types.js"
import type { SessionToken } from "../../../../utils/cookie.js"
import { getUserByAccount, pickSession } from "../util.js"
import { getUser } from "./util.js"

export async function handleOAuthLoginOrRegister(
  _: SessionToken,
  profile: AdapterUser,
  _session: AdapterSession | JWT | null,
  _account: AdapterAccount,
  _user: AdapterUser | null,
  useJwtSession: boolean,
  options: InternalOptions
) {
  // If signing in with OAuth account, check to see if the account exists already
  const userByAccount = await getUserByAccount(_account, options)

  const { user, isNewUser, hasSession } = await getUser(
    profile,
    _account,
    _user,
    options,
    userByAccount
  )

  const session = await pickSession(
    hasSession,
    _session,
    user,
    useJwtSession,
    options
  )

  return { user, session, isNewUser }
}
