import type { InternalOptions } from "../../../../types.js"
import { customFetch } from "../../../symbols.js"

type TypeofReturnType =
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "symbol"
  | "object"
  | "function"
type NonUndefined<T> = T extends undefined ? never : T
type Provider = InternalOptions<"oauth" | "oidc">["provider"]

/**
 * Checks if provider's config is defined
 * @param provider Provider Config
 * @returns boolean
 */
function hasProvider(provider?: Provider | null) {
  return provider && typeof provider === "object"
}

/**
 * Checks if provider's config option is defined and non-nullable
 * @param provider Provider Config
 * @param key Provider Config Option
 * @returns boolean
 */
function hasProviderParam(provider: Provider, key: keyof Provider) {
  if (!hasProvider(provider)) return false

  return (
    key in provider &&
    typeof provider[key] !== "undefined" &&
    provider[key] !== null
  )
}

/**
 * Checks if provider's config option is present
 * @param provider Provider Config
 * @param key Provider Config Option
 * @param keyType Provider Config Option type
 * @returns boolean
 */
function hasProviderParamType(
  provider: Provider,
  key: keyof Provider,
  keyType: TypeofReturnType
) {
  return hasProviderParam(provider, key) && typeof provider[key] === keyType
}

/**
 * Checks if provider config has options
 * @param provider Provider Config
 * @returns boolean
 */
function validateHasOptions(provider: Provider) {
  return hasProviderParamType(provider, "options", "object")
}

/**
 * Checks if customFetch function was defined
 * @param provider Provider config
 * @returns boolean
 */
function validateHasCustomFetch(provider: Provider) {
  return hasProviderParamType(provider, customFetch, "function")
}

/**
 * Checks if some of custom params are present
 * @param params  custom params array
 * @returns boolean
 */
function validateHasCustomParams(params?: string[]) {
  return Array.isArray(params) && params.length > 0
}

/**
 * Returns defined custom parameters sent upon request of access token
 * @param provider Callback Provider
 * @returns custom params
 */
function getCustomCallbackParams(provider: Provider): string[] | null {
  if (!validateHasOptions(provider)) return null
  if (!validateHasCustomFetch(provider)) return null

  const { customCallbackParams } = provider.options as NonUndefined<
    Provider["options"]
  >

  if (!validateHasCustomParams(customCallbackParams)) return null

  return (
    (customCallbackParams as NonUndefined<
      Provider["options"]
    >["customCallbackParams"]) || null
  )
}

/**
 * Returns additional parameters object to be upon OAuth2, OIDC token requested.
 * It is available only if custom params definition and customFetch are present in
 * provider's options and config, respectively.
 *
 * @param provider Provider's config
 * @param codeGrantParams  Grant params for OAuth2 or OIDC code obtaning request
 * @returns additionalParameters object
 */
export function additionalParameters(
  provider: Provider,
  codeGrantParams: URLSearchParams
): Record<string, string> {
  const additionalParameters: Record<string, string> = {}
  const customCallbackParams = getCustomCallbackParams(provider)

  if (!customCallbackParams) return additionalParameters

  for (const param of customCallbackParams) {
    const value = codeGrantParams.get(param)

    if (typeof value === "string" && typeof param === "string") {
      additionalParameters[param] = value
    }
  }

  return additionalParameters
}
