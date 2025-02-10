import type { AdapterAccount, AdapterUser } from "../../../../../adapters.js"
import type { OAuthConfig } from "../../../../../providers/oauth.js"
import type { InternalOptions } from "../../../../../types.js"
import { OAuthAccountNotLinked } from "../../../../../errors.js"
import { getCurrentAccount, getDbUser, linkUserAccounts } from "../util.js"

const hasEmail = (
  account: AdapterAccount,
  user: AdapterUser,
  options: InternalOptions<"oauth" | "oidc">
) => {
  const provider = options.provider as OAuthConfig<any>

  if (provider?.allowDangerousEmailAccountLinking) {
    // If you trust the oauth provider to correctly verify email addresses, you can opt-in to
    // account linking event when the user is not signed-in.
    return { user, isNewUser: false }
  }

  // We end up here when we don't have an account with the same [provider].id *BUT*
  // we do already have an account with the same email address as the one in the
  // OAuth profile the user has just tried to sign in with.
  //
  // We don't want to have two accounts with the same email address, and we don't
  // want to link them in case it's not safe to do so, so instead we prompt the user
  // to sign in via email to verify their identity and then link the accounts.
  throw new OAuthAccountNotLinked(
    "Another account already exists with the same e-mail address",
    { provider: account.provider }
  )
}

const hasNoEmail = async (
  profile: AdapterUser,
  options: InternalOptions<"oauth" | "oidc">
) => {
  // If the current user is not logged in and the profile isn't linked to any user
  // accounts (by email or account id)...
  //
  // If no account matching the same [provider].id or .email exists, we can
  // create a new account for the user, link it to the OAuth account and
  // create a new session for them so they are signed in with it.
  const { adapter } = options
  const user = (await adapter?.createUser({
    ...profile,
    emailVerified: null,
  })) as AdapterUser

  return { user, isNewUser: true }
}

const signin = async (
  profile: AdapterUser,
  account: AdapterAccount,
  options: InternalOptions<"oauth" | "oidc">,
  userByEmail?: AdapterUser | null
) => {
  if (userByEmail) {
    return hasEmail(account, userByEmail, options)
  }

  return await hasNoEmail(profile, options)
}

const signinByEmail = async (
  profile: AdapterUser,
  account: AdapterAccount,
  options: InternalOptions
) => {
  // If the user is not signed in and it looks like a new OAuth account then we
  // check there also isn't an user account already associated with the same
  // email address as the one in the OAuth profile.
  //
  // This step is often overlooked in OAuth implementations, but covers the following cases:
  //
  // 1. It makes it harder for someone to accidentally create two accounts.
  //    e.g. by signin in with email, then again with an oauth account connected to the same email.
  // 2. It makes it harder to hijack a user account using a 3rd party OAuth account.
  //    e.g. by creating an oauth account then changing the email address associated with it.
  //
  // It's quite common for services to automatically link accounts in this case, but it's
  // a better practice to require the user to sign in *then* link accounts to be sure
  // someone is not exploiting a problem with a third party OAuth service.
  //
  // OAuth providers should require email address verification to prevent this, but in
  // practice this is not always the case; this helps protect against that.
  const userByEmail = await getDbUser(profile, options)

  const { user, isNewUser } = await signin(
    profile,
    account,
    options,
    userByEmail
  )

  const { events } = options
  await events.createUser?.({ user })

  const currentAccount = getCurrentAccount(account, user)

  await linkUserAccounts(
    profile,
    account,
    currentAccount,
    user as AdapterUser,
    options
  )

  return { user, isNewUser, hasSession: false }
}

const signinByUser = async (
  profile: AdapterUser,
  account: AdapterAccount,
  user: AdapterUser,
  options: InternalOptions<"oauth" | "oidc">
) => {
  await linkUserAccounts(profile, account, account, user, options)

  // As they are already signed in, we don't need to do anything after linking them
  return { user, isNewUser: false, hasSession: true }
}

const updateAccount = (
  account: AdapterAccount,
  options: InternalOptions<"oauth" | "oidc">
) => {
  const { provider: p } = options
  const { type, provider, providerAccountId, userId, ...tokenSet } = account
  const defaults = { providerAccountId, provider, type, userId }

  return Object.assign(p.account(tokenSet) ?? {}, defaults)
}

export const signinCommon = async <T extends "oauth" | "oidc">(
  profile: AdapterUser,
  _account: AdapterAccount,
  user: AdapterUser | null,
  options: InternalOptions<T>
) => {
  const account = updateAccount(_account, options)

  if (user) {
    // If the user is already signed in and the OAuth account isn't already associated
    // with another user account then we can go ahead and link the accounts safely.
    return await signinByUser(profile, account, user, options)
  }

  return await signinByEmail(profile, account, options)
}
