import type { AdapterAccount, AdapterUser } from "../../../../../adapters.js"
import type { InternalOptions } from "../../../../../types.js"
import { AccountNotLinked } from "../../../../../errors.js"
import { getCurrentAccount, getDbUser, linkUserAccounts } from "../util.js"

const linkAccounts = async (
  profile: AdapterUser,
  account: AdapterAccount,
  user: AdapterUser,
  options: InternalOptions
) => {
  const currentAccount = getCurrentAccount(account, user)
  await linkUserAccounts(profile, account, currentAccount, user, options)

  return currentAccount
}
const signinByUser = async (
  profile: AdapterUser,
  account: AdapterAccount,
  user: AdapterUser,
  options: InternalOptions
) => {
  // If the user is already signed in and the account isn't already associated
  // with another user account then we can go ahead and link the accounts safely.
  const currentAccount = await linkAccounts(profile, account, user, options)
  return { hasSession: true, isNewUser: false, user, account: currentAccount }
}

const getUserByEmail = async (
  profile: AdapterUser,
  account: AdapterAccount,
  options: InternalOptions
) => {
  const userByEmail = await getDbUser(profile, options)

  if (userByEmail) {
    // We don't trust user-provided email addresses, so we don't want to link accounts
    // if the email address associated with the new account is already associated with
    // an existing account.
    throw new AccountNotLinked(
      "Another account already exists with the same e-mail address",
      { provider: account.provider }
    )
  }
  const { adapter, events } = options

  // If the current user is not logged in and the profile isn't linked to any user
  // accounts (by email or provider account id)...
  //
  // If no account matching the same [provider].id or .email exists, we can
  // create a new account for the user, link it to the OAuth account and
  // create a new session for them so they are signed in with it.
  const user = (await adapter?.createUser({ ...profile })) as AdapterUser

  await events.createUser?.({ user })

  return user
}

const signInByEmail = async (
  profile: AdapterUser,
  account: AdapterAccount,
  options: InternalOptions
) => {
  const user = await getUserByEmail(profile, account, options)
  const obj = await signinByUser(profile, account, user, options)

  return { ...obj, isNewUser: true, hasSession: false }
}

export const signinCommon = async (
  profile: AdapterUser,
  account: AdapterAccount,
  user: AdapterUser | null,
  options: InternalOptions
) => {
  // If the account doesn't exist, we'll create it
  if (user) {
    return await signinByUser(profile, account, user, options)
  }

  /// If the user is not signed in and it looks like a new account then we
  // check there also isn't an user account already associated with the same
  // email address as the one in the request.
  return await signInByEmail(profile, account, options)
}
