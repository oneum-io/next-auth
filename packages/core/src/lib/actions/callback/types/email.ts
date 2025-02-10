import type {
  Account,
  InternalOptions,
  RequestInternal,
} from "../../../../types.js"
import type { Cookie, SessionStore } from "../../../utils/cookie.js"
import {
  redirectNewUserFlow,
  redirector,
  type HandleAuthorizedFunction,
} from "./util.js"
import { createHash } from "../../../utils/web.js"
import { Verification } from "../../../../errors.js"
import { sessionCookies } from "../cookieToken.js"
import { Handled } from "../login/handler.js"
import { handleLoginOrRegister } from "../login/index.js"

const redirectNoToken = (paramToken?: unknown) => {
  if (typeof paramToken === "string" && paramToken) return

  const error = new TypeError(
    "Missing token. The sign-in URL was manually opened without token or the link was not sent correctly in the email.",
    { cause: { hasToken: !!paramToken } }
  )

  error.name = "Configuration"

  throw error
}

export const emailHandler =
  <T extends "email">(handleAuthorized: HandleAuthorizedFunction) =>
  async (
    request: RequestInternal,
    sessionStore: SessionStore,
    cookies: Cookie[],
    options: InternalOptions<T>,
    useJwtSession: boolean
  ) => {
    const { query } = request
    const {
      provider,
      adapter,
      jwt,
      events,
      callbacks,
      callbackUrl,
      session: { maxAge: sessionMaxAge },
    } = options
    const paramToken = query?.token as string | undefined
    const paramIdentifier = query?.email as string | undefined

    redirectNoToken(paramToken)

    const secret = provider.secret ?? options.secret
    const invite = await adapter?.useVerificationToken({
      identifier: paramIdentifier!, // TODO: Drop this requirement for lookup in official adapters too
      token: await createHash(`${paramToken}${secret}`),
    })

    const hasInvite = !!invite
    const expired = hasInvite && invite.expires.valueOf() < Date.now()
    const invalidInvite =
      !hasInvite ||
      expired ||
      // The user might have configured the link to not contain the identifier
      // so we only compare if it exists
      (paramIdentifier && invite.identifier !== paramIdentifier)
    if (invalidInvite) throw new Verification({ hasInvite, expired })
    const { identifier } = invite
    const user = (await adapter!.getUserByEmail(identifier)) ?? {
      id: crypto.randomUUID(),
      email: identifier,
      emailVerified: null,
    }

    const account: Account = {
      providerAccountId: user.email,
      userId: user.id,
      type: "email" as const,
      provider: provider.id,
    }

    const redirect = await handleAuthorized({ user, account }, options)
    if (redirect) return redirector(redirect, cookies)

    // Sign user in
    const {
      user: loggedInUser,
      session,
      isNewUser,
    } = (await handleLoginOrRegister(
      sessionStore.value,
      user,
      account,
      options
    )) as Handled

    await sessionCookies(
      loggedInUser,
      account,
      null,
      session,
      isNewUser,
      isNewUser ? "signUp" : "signIn",
      cookies,
      sessionStore,
      jwt,
      sessionMaxAge,
      callbacks,
      options,
      useJwtSession
    )

    await events.signIn?.({ user: loggedInUser, account, isNewUser })

    const newUserRedirect = redirectNewUserFlow(cookies, options, isNewUser)
    if (newUserRedirect) return newUserRedirect

    // Callback URL is already verified at this point, so safe to use it specified
    return redirector(callbackUrl, cookies)
  }
