import type { CallbackHandler, HandleAuthorizedFunction } from "./util.js"
import type { RequestInternal } from "../../../../types.js"
import type { ProviderType } from "../../../../providers/index.js"
import { OAuthHandler } from "./oauth.js"
import { emailHandler } from "./email.js"
import { credentialsHandler } from "./credentials.js"
import { WebauthnHandler } from "./webauthn.js"

export const getCallbackHandlers = (
  handleAuthorized: HandleAuthorizedFunction
) => {
  return <T extends ProviderType>(
    method: RequestInternal["method"],
    providerType: T
  ) => {
    const methods = {
      oauth: OAuthHandler<"oauth">(handleAuthorized),
      oidc: OAuthHandler<"oidc">(handleAuthorized),
      email: emailHandler<"email">(handleAuthorized),
      credentials:
        method === "POST" &&
        credentialsHandler<"credentials">(handleAuthorized),
      webauthn:
        method === "POST" && WebauthnHandler<"webauthn">(handleAuthorized),
    } as Record<T, CallbackHandler<T> | boolean>

    return methods[providerType]
  }
}
