import type { AdapterAccount, AdapterUser } from "../../../../../adapters.js"
import { AccountNotLinked } from "../../../../../errors.js"
import { getCurrentAccount } from "../util.js"

const signin = (account: AdapterAccount, user: AdapterUser) => {
  const currentAccount = getCurrentAccount(account, user)

  return { account: currentAccount, user, isNewUser: false, hasSession: false }
}

const signinByUser = (account: AdapterAccount, user: AdapterUser) => {
  const obj = signin(account, user)

  return { ...obj, hasSession: true }
}

export const signinByAccount = (
  account: AdapterAccount,
  user: AdapterUser | null,
  userByAccount: AdapterUser
) => {
  if (user) {
    // If the user is already signed in with this account, we don't need to do anything
    if (userByAccount.id === user.id) {
      return signinByUser(account, user)
    }

    // If the user is currently signed in, but the new account they are signing in
    // with is already associated with another user, then we cannot link them
    // and need to return an error
    throw new AccountNotLinked(
      "The account is already associated with another user",
      { provider: account.provider }
    )
  }

  // If there is no active session, but the account being signed in with is already
  // associated with a valid user then create session to sign the user in.
  return signin(account, userByAccount)
}
