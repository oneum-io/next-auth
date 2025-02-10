import type { AdapterAccount, AdapterUser } from "../../../../../adapters.js"
import { OAuthAccountNotLinked } from "../../../../../errors.js"

const signinByUser = (
  account: AdapterAccount,
  user: AdapterUser,
  userByAccount: AdapterUser
) => {
  // If the user is already signed in with this account, we don't need to do anything
  if (userByAccount.id === user.id) {
    return { user, isNewUser: false, hasSession: true }
  }

  // If the user is currently signed in, but the new account they are signing in
  // with is already associated with another user, then we cannot link them
  // and need to return an error.
  throw new OAuthAccountNotLinked(
    "The account is already associated with another user",
    { provider: account.provider }
  )
}

export const signinByAccount = (
  account: AdapterAccount,
  user: AdapterUser | null,
  userByAccount: AdapterUser
) => {
  if (user) {
    return signinByUser(account, user, userByAccount)
  }

  return { user: userByAccount, isNewUser: false, hasSession: false }
}
