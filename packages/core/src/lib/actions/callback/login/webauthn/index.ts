import type {
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from "../../../../../adapters.js"
import type { JWT } from "../../../../../jwt.js"
import type { InternalOptions } from "../../../../../types.js"
import type { SessionToken } from "../../../../utils/cookie.js"
import { getUser } from "./util.js"
import { getUserByAccount, pickSession } from "../util.js"

export async function handleWebauthnLoginOrRegister(
  _: SessionToken,
  profile: AdapterUser,
  _session: AdapterSession | JWT | null,
  _account: AdapterAccount,
  _user: AdapterUser | null,
  useJwtSession: boolean,
  options: InternalOptions
) {
  // Check if the account exists
  const userByAccount = await getUserByAccount(_account, options)

  const {
    user,
    account,
    isNewUser,
    hasSession = false,
  } = await getUser(profile, _account, _user, options, userByAccount)

  const session = await pickSession(
    hasSession,
    _session,
    user,
    useJwtSession,
    options
  )

  return { session, user, account, isNewUser }
}
