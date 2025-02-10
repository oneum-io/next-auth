import {
  AuthError,
  AccessDenied,
  CallbackRouteError,
  InvalidProvider,
} from "../../../errors.js"

import type {
  InternalOptions,
  RequestInternal,
  ResponseInternal,
} from "../../../types.js"
import type { Cookie, SessionStore } from "../../utils/cookie.js"
import { getCallbackHandlers } from "./types/index.js"

const callbackHandlers = getCallbackHandlers(handleAuthorized)

/** Handle callbacks from login services */
export async function callback(
  request: RequestInternal,
  options: InternalOptions,
  sessionStore: SessionStore,
  cookies: Cookie[]
): Promise<ResponseInternal> {
  if (!options.provider)
    throw new InvalidProvider("Callback route called without provider")
  const { query, body, method } = request
  const {
    provider,
    session: { strategy: sessionStrategy },
    logger,
  } = options

  const useJwtSession = sessionStrategy === "jwt"

  try {
    const handler = callbackHandlers(method, provider.type)

    if (typeof handler === "function") {
      return await handler(
        request,
        sessionStore,
        cookies,
        options,
        useJwtSession
      )
    }

    throw new InvalidProvider(
      `Callback for provider type (${provider.type}) is not supported`
    )
  } catch (e) {
    if (e instanceof AuthError) throw e
    const error = new CallbackRouteError(e as Error, { provider: provider.id })
    logger.debug("callback route error details", { method, query, body })
    throw error
  }
}

async function handleAuthorized(
  params: Parameters<InternalOptions["callbacks"]["signIn"]>[0],
  config: InternalOptions
): Promise<string | undefined> {
  let authorized
  const { signIn, redirect } = config.callbacks
  try {
    authorized = await signIn(params)
  } catch (e) {
    if (e instanceof AuthError) throw e
    throw new AccessDenied(e as Error)
  }
  if (!authorized) throw new AccessDenied("AccessDenied")
  if (typeof authorized !== "string") return
  return await redirect({ url: authorized, baseUrl: config.url.origin })
}
