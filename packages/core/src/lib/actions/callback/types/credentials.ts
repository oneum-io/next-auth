import { CredentialsSignin } from "../../../../errors.js"
import type {
  Account,
  InternalOptions,
  RequestInternal,
} from "../../../../types.js"
import type { Cookie, SessionStore } from "../../../utils/cookie.js"
import type { Handled } from "../login/handler.js"
import { sessionCookies } from "../cookieToken.js"
import { handleLoginOrRegister } from "../login/index.js"
import { redirector, type HandleAuthorizedFunction } from "./util.js"

export const credentialsHandler =
  <T extends "credentials">(handleAuthorized: HandleAuthorizedFunction) =>
  async (
    request: RequestInternal,
    sessionStore: SessionStore,
    cookies: Cookie[],
    options: InternalOptions<T>,
    useJwtSession: boolean
  ) => {
    const { body, query, headers, method } = request
    const {
      url,
      provider,
      jwt,
      events,
      callbacks,
      callbackUrl,
      session: { maxAge: sessionMaxAge },
      experimental: { enableCredentialsSession },
    } = options
    const credentials = body ?? {}

    // TODO: Forward the original request as is, instead of reconstructing it
    for (const [k, v] of Object.entries(query ?? {})) {
      url.searchParams.set(k, v)
    }

    const userFromAuthorize = await provider.authorize(
      credentials,
      // prettier-ignore
      new Request(url, { headers, method, body: JSON.stringify(body) })
    )
    const user = userFromAuthorize

    if (!user) throw new CredentialsSignin()
    else user.id = user.id?.toString() ?? crypto.randomUUID()

    const account = {
      providerAccountId: user.id,
      type: "credentials",
      provider: provider.id,
    } satisfies Account

    const redirect = await handleAuthorized(
      { user, account, credentials },
      options
    )

    if (redirect) return redirector(redirect, cookies)

    const {
      session,
      user: loggerInUser,
      isNewUser,
    } = (await handleLoginOrRegister(
      sessionStore.value,
      user,
      account,
      options
    )) as Handled

    await sessionCookies(
      loggerInUser,
      account,
      null,
      session,
      isNewUser,
      "signIn",
      cookies,
      sessionStore,
      jwt,
      sessionMaxAge,
      callbacks,
      options,
      enableCredentialsSession ? useJwtSession : true
    )

    await events.signIn?.({ user, account })

    return redirector(callbackUrl, cookies)
  }
