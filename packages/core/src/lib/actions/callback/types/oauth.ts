import type {
  Account,
  InternalOptions,
  Profile,
  RequestInternal,
  User,
} from "../../../../types.js"
import { Cookie, SessionStore } from "../../../utils/cookie.js"
import {
  redirector,
  redirectNewUserFlow,
  type HandleAuthorizedFunction,
} from "./util.js"
import { handleOAuth } from "../oauth/callback.js"
import { state } from "../oauth/checks.js"
import { sessionCookies } from "../cookieToken.js"
import { Handled } from "../login/handler.js"
import { handleLoginOrRegister } from "../login/index.js"

type OAuthOptions = "oauth" | "oidc"

const redirectProxy = async (
  params: Record<string, string>,
  cookies: Cookie[],
  options: InternalOptions<OAuthOptions>
) => {
  const { logger, url } = options
  // NOT: We rely on the state being encrypted using a shared secret
  // between the proxy and the original server.
  const parsedState = await state.decode(params.state, options)
  const shouldRedirect =
    parsedState?.origin && new URL(parsedState.origin).origin !== url.origin

  if (!shouldRedirect) return null

  const proxyRedirect = `${parsedState.origin}?${new URLSearchParams(params)}`
  logger.debug("Redirecting to", proxyRedirect)

  return redirector(proxyRedirect, cookies)
}

const redirectUnauthorized = (
  options: InternalOptions<OAuthOptions>,
  cookies: Cookie[],
  user?: User,
  account?: Account,
  profile?: Profile
) => {
  const { url } = options
  if (!user || !account || !profile) {
    return redirector(`${url}/signin`, cookies)
  }

  return null
}

const redirectCallback = async (
  handleAuthorized: HandleAuthorizedFunction,
  options: InternalOptions<OAuthOptions>,
  cookies: Cookie[],
  account?: Account,
  user?: User,
  profile?: Profile
) => {
  const { provider, adapter } = options
  // Check if user is allowed to sign in
  // Attempt to get Profile from OAuth provider details before invoking
  // signIn callback - but if not user object is returned, that is fine
  // (that just means it's a new user signing in for the first time).
  const userByAccount = adapter
    ? await adapter.getUserByAccount({
        providerAccountId: String(account?.providerAccountId),
        provider: provider.id,
      })
    : null

  const redirect = await handleAuthorized(
    {
      user: Object(userByAccount ?? user),
      account,
      profile,
    },
    options
  )

  if (redirect) return redirector(redirect, cookies)

  return null
}

const redirectFlow = async (
  sessionStore: SessionStore,
  cookies: Cookie[],
  options: InternalOptions<OAuthOptions>,
  useJwtSession: boolean,
  userFromProvider: User,
  account: Account,
  profile: Profile
) => {
  const {
    events,
    callbacks,
    callbackUrl,
    jwt,
    session: { maxAge: sessionMaxAge },
  } = options
  const { user, session, isNewUser } = (await handleLoginOrRegister(
    sessionStore.value,
    userFromProvider,
    account,
    options
  )) as Handled

  await sessionCookies(
    user,
    account,
    profile,
    session,
    isNewUser,
    isNewUser ? "signIn" : "signUp",
    cookies,
    sessionStore,
    jwt,
    sessionMaxAge,
    callbacks,
    options,
    useJwtSession
  )

  await events?.signIn?.({
    user,
    account,
    profile,
    isNewUser,
  })

  const newUserRedirect = redirectNewUserFlow(cookies, options, isNewUser)

  if (newUserRedirect) return newUserRedirect

  return redirector(callbackUrl, cookies)
}

export const OAuthHandler =
  <T extends OAuthOptions>(handleAuthorized: HandleAuthorizedFunction) =>
  async (
    request: RequestInternal,
    sessionStore: SessionStore,
    cookies: Cookie[],
    options: InternalOptions<T>,
    useJwtSession: boolean
  ) => {
    const { body, query } = request
    const { provider, logger } = options
    const params =
      provider.authorization?.url.searchParams.get("response_mode") ===
      "form_post"
        ? body
        : query

    // If we have a state and we are on a redirect proxy, we try to parse it
    // and see if it contains a valid origin to redirect to. If it does, we
    // redirect the user to that origin with the original state
    if (options.isOnRedirectProxy && params?.state) {
      const r = await redirectProxy(params, cookies, options)
      if (r !== null) return r
    }

    const authorizationResult = await handleOAuth(
      params,
      request.cookies,
      options
    )

    if (authorizationResult.cookies.length) {
      cookies.push(...authorizationResult.cookies)
    }

    logger.debug("authorization result", authorizationResult)

    const {
      user: userFromProvider,
      account,
      profile: OAuthProfile,
    } = authorizationResult

    const isUnauthorizedRedirect = redirectUnauthorized(
      options,
      cookies,
      userFromProvider,
      account,
      OAuthProfile
    )

    /// If we don't have a profile object then either something went wrong
    /// or the user canceled signing in. We don't know which, so we just
    /// direct the user to the signin page for now. We could do something
    /// else in the future.
    // TODO: Handle user cancelling signin
    if (isUnauthorizedRedirect) return isUnauthorizedRedirect

    const redirect = await redirectCallback(
      handleAuthorized,
      options,
      cookies,
      account,
      userFromProvider,
      OAuthProfile
    )

    if (redirect) return redirect

    const flow = redirectFlow(
      sessionStore,
      cookies,
      options,
      useJwtSession,
      userFromProvider!,
      account!,
      OAuthProfile
    )

    return flow
  }
