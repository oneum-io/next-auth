import type { ProviderType } from "../../../../providers/index.js"
import type { InternalOptions, RequestInternal } from "../../../../types.js"
import type { Cookie, SessionStore } from "../../../utils/cookie.js"

export type HandleAuthorizedFunction = (
  params: Parameters<InternalOptions["callbacks"]["signIn"]>[0],
  config: InternalOptions
) => Promise<string | undefined>

export const redirector = (redirect: string, cookies: Cookie[]) => {
  return { redirect, cookies }
}

export const redirectNewUserFlow = <T extends ProviderType>(
  cookies: Cookie[],
  options: InternalOptions<T>,
  isNewUser?: boolean
) => {
  const { pages, callbackUrl } = options

  // Handle first logins on new accounts
  // e.g. option to send users to a new account landing page on initial login
  // Not that the callback URL is preserved, so the journey can still be resumed
  if (isNewUser && pages.newUser) {
    const url = `${pages.newUser}${pages.newUser.includes("?") ? "&" : "?"}${new URLSearchParams({ callbackUrl })}`
    return redirector(url, cookies)
  }

  return null
}

type Redirector = {
  redirect: string
  cookies: Cookie[]
}

export type CallbackHandler<T extends ProviderType> = <K extends T>(
  request: RequestInternal,
  sessionStore: SessionStore,
  cookies: Cookie[],
  options: InternalOptions<K>,
  useJwtSession: boolean
) => Promise<Redirector>
