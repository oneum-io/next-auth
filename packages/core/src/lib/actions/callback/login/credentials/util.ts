import type {
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from "../../../../../adapters.js"
import { AccountNotLinked } from "../../../../../errors.js"
import { JWT } from "../../../../../jwt.js"
import type { InternalOptions } from "../../../../../types.js"
import type { SessionToken } from "../../../../utils/cookie.js"
import { getCurrentAccount, pickSession } from "../util.js"

export const defaultHandler = (user: AdapterUser) => {
  return { user, isNewUser: false, session: null }
}

const getUserWithSession = (
  profile: AdapterUser,
  account: AdapterAccount,
  user: AdapterUser
) => {
  // If the user is already signed in with this account, we don't need to do anything
  if (profile.id === user.id) {
    const currentAccount = getCurrentAccount(account, user)

    return { hasSession: true, isNewUser: false, user, account: currentAccount }
  }

  // If the user is currently signed in, but the new account they are signin in
  // with is already associated with another user, then we cannot link them
  // and need to return an error.
  throw new AccountNotLinked(
    "The account is already associated with another user",
    { provider: account.provider }
  )
}

const getUserWithNoSession = (user: AdapterUser, account: AdapterAccount) => {
  const currentAccount = getCurrentAccount(account, user)

  return { hasSession: false, isNewUser: false, user, account: currentAccount }
}

const getUser = (
  profile: AdapterUser,
  account: AdapterAccount,
  user: AdapterUser | null
) => {
  if (user) {
    return getUserWithSession(profile, account, user)
  }

  return getUserWithNoSession(profile, account)
}

export const experimentalHandler = async (
  _: SessionToken,
  account: AdapterAccount,
  profile: AdapterUser,
  _session: AdapterSession | JWT | null,
  _user: AdapterUser | null,
  useJwtSession: boolean,
  options: InternalOptions
) => {
  const { user, isNewUser, hasSession } = getUser(profile, account, _user)!

  const session = await pickSession(
    hasSession,
    _session,
    user,
    useJwtSession,
    options
  )

  return { user, isNewUser, session }
}
