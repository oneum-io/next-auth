import type {
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from "../../../../../adapters.js"
import type { JWT } from "../../../../../jwt.js"
import type { InternalOptions } from "../../../../../types.js"
import type { SessionToken } from "../../../../utils/cookie.js"
import { defaultHandler, experimentalHandler } from "./util.js"

export async function handleCredentialsLoginOrRegister(
  sessionToken: SessionToken,
  profile: AdapterUser,
  _session: AdapterSession | JWT | null,
  _account: AdapterAccount,
  _user: AdapterUser | null,
  useJwtSession: boolean,
  options: InternalOptions
) {
  const {
    experimental: { enableCredentialsSession },
  } = options

  if (enableCredentialsSession) {
    return await experimentalHandler(
      sessionToken,
      _account,
      profile,
      _session,
      _user,
      useJwtSession,
      options
    )
  }

  return defaultHandler(profile)
}
