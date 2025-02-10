import type {
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from "../../../../adapters.js"
import type { JWT } from "../../../../jwt.js"
import type { ProviderType } from "../../../../providers/index.js"
import type { InternalOptions } from "../../../../types.js"
import type { SessionToken } from "../../../utils/cookie.js"
import { handleCredentialsLoginOrRegister } from "./credentials/index.js"
import { handleEmailLoginOrRegister } from "./email/index.js"
import { handleOAuthLoginOrRegister } from "./oauth/index.js"
import { handleWebauthnLoginOrRegister } from "./webauthn/index.js"

export interface Handled {
  account?: AdapterAccount
  session?: Partial<AdapterSession> | JWT | null
  user: AdapterUser
  isNewUser: boolean
}

type Handler<T extends ProviderType> = <K extends T>(
  sessionToken: SessionToken,
  profile: AdapterUser,
  _session: AdapterSession | JWT | null,
  _account: AdapterAccount,
  _user: AdapterUser | null | undefined,
  useJwtSession: boolean,
  options: InternalOptions<K>
) => Promise<Handled>

const handlers = {
  email: handleEmailLoginOrRegister,
  webauthn: handleWebauthnLoginOrRegister,
  oauth: handleOAuthLoginOrRegister,
  oidc: handleOAuthLoginOrRegister,
  credentials: handleCredentialsLoginOrRegister,
}

export const getHandler = <T extends ProviderType>(account: AdapterAccount) => {
  const handler = handlers[account.type] as Handler<T>

  return handler
}
