import { AuthError } from "../../../../errors.js"
import { InternalOptions, RequestInternal } from "../../../../types.js"
import { Cookie, SessionStore } from "../../../utils/cookie.js"
import {
  assertInternalOptionsWebAuthn,
  verifyAuthenticate,
  verifyRegister,
  type InternalOptionsWebAuthn,
} from "../../../utils/webauthn-utils.js"
import { sessionCookies } from "../cookieToken.js"
import { Handled } from "../login/handler.js"
import { handleLoginOrRegister } from "../login/index.js"
import {
  HandleAuthorizedFunction,
  redirectNewUserFlow,
  redirector,
} from "./util.js"

const verifyAuth = async (
  request: RequestInternal,
  cookies: Cookie[],
  _: InternalOptions<"webauthn">,
  localOptions: InternalOptionsWebAuthn
) => {
  const verified = await verifyAuthenticate(localOptions, request, cookies)

  const { user, account } = verified

  return { user, account, authenticator: undefined }
}

const verifyReg = async (
  request: RequestInternal,
  cookies: Cookie[],
  options: InternalOptions,
  _: InternalOptionsWebAuthn
) => {
  const verified = await verifyRegister(options, request, cookies)

  const { user, account, authenticator } = verified

  return { user, account, authenticator }
}

const actions = {
  authenticate: verifyAuth,
  register: verifyReg,
}

const verifyAction = async (
  action: "register" | "authenticate",
  request: RequestInternal,
  cookies: Cookie[],
  options: InternalOptions<"webauthn">,
  localOptions: InternalOptionsWebAuthn
) => {
  const verifier = actions[action]

  if (typeof verifier !== "function")
    throw new AuthError("Invalid action parameter")

  return await verifier(request, cookies, options, localOptions)
}

export const WebauthnHandler =
  <T extends "webauthn">(handleAuthorized: HandleAuthorizedFunction) =>
  async (
    request: RequestInternal,
    sessionStore: SessionStore,
    cookies: Cookie[],
    options: InternalOptions<T>,
    useJwtSession: boolean
  ) => {
    // Get callback action from request. It should be either 'authenticate' or 'register'
    const { body = {} } = request
    const { action } = body ?? {}
    const {
      events,
      jwt,
      callbacks,
      callbackUrl,
      session: { maxAge: sessionMaxAge },
    } = options

    if (
      typeof action !== "string" ||
      (action !== "authenticate" && action !== "register")
    ) {
      throw new AuthError("Invalid action parameter")
    }

    // Return an error if the adapter is missing or the provider
    // is not a webauthn provider
    const localOptions = assertInternalOptionsWebAuthn(options)

    // Verify request to get user, account and authenticator
    const { user, account, authenticator } = await verifyAction(
      action,
      request,
      cookies,
      options,
      localOptions
    )

    // Check if user is allowed to sign in
    await handleAuthorized({ user, account }, options)

    const {
      user: loggedInUser,
      isNewUser,
      session,
      account: currentAccount,
    } = (await handleLoginOrRegister(
      sessionStore.value,
      user,
      account,
      options
    )) as Handled

    if (!currentAccount) {
      // This is mostly for type checking. It should never actually happen
      throw new AuthError("Error creating or finding account")
    }

    // Create new authenticator if needed
    if (authenticator && loggedInUser.id) {
      await localOptions.adapter.createAuthenticator({
        ...authenticator,
        userId: loggedInUser.id,
      })
    }

    await sessionCookies(
      loggedInUser,
      currentAccount,
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

    await events.signIn?.({
      user: loggedInUser,
      account: currentAccount,
      isNewUser,
    })

    const isNewUserRedirect = redirectNewUserFlow(cookies, options, isNewUser)
    if (isNewUserRedirect) return isNewUserRedirect

    return redirector(callbackUrl, cookies)
  }
