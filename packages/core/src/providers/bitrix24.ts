import type { OAuthConfig, OAuthUserConfig } from "./index.js"
import { customFetch } from "../lib/symbols.js"
import { expiredInToExpiredAt } from "../lib/util.js"

export interface Bitrix24Profile {
  result: {
    ID: string | number
    XML_ID?: string
    ACTIVE: boolean
    NAME: string
    LAST_NAME: string
    SECOND_NAME?: string
    TITLE?: string
    EMAIL: string
    LAST_LOGIN: string
    DATE_REGISTER: string
    IS_ONLINE: "Y" | "N"
    TIME_ZONE?: string
    TIME_ZONE_OFFSET: string
    TIMESTAMP_X?: string
    LAST_ACTIVITY_DATE: string
    PERSONAL_GENDER: string
    PERSONAL_PROFESSION?: string
    PERSONAL_WWW?: string
    PERSONAL_BIRTHDAY: string
    PERSONAL_PHOTO?: string
    PERSONAL_ICQ?: string
    PERSONAL_PHONE?: string
    PERSONAL_FAX?: string
    PERSONAL_MOBILE?: string
    PERSONAL_PAGER?: string
    PERSONAL_STREET?: string
    PERSONAL_CITY?: string
    PERSONAL_STATE?: string
    PERSONAL_ZIP?: string
    PERSONAL_COUNTRY?: string
    PERSONAL_MAILBOX?: string
    PERSONAL_NOTES?: string[]
    WORK_PHONE?: string
    WORK_COMPANY?: string
    WORK_POSITION: string
    WORK_DEPARTMENT?: string
    WORK_WWW?: string
    WORK_FAX?: string
    WORK_PAGER?: string
    WORK_STREET?: string
    WORK_MAILBOX?: string
    WORK_CITY?: string
    WORK_STATE?: string
    WORK_ZIP?: string
    WORK_COUNTRY?: string
    WORK_PROFILE?: string
    WORK_LOGO?: string
    WORK_NOTES?: string
    UF_SKYPE_LINK?: string
    UF_ZOOM?: string
    UF_EMPLOYMENT_DATE: string
    UF_TIMEMAN?: string
    UF_DEPARTMENT: number[]
    UF_INTERESTS?: string[]
    UF_SKILLS?: string[]
    UF_WEB_SITES?: string[]
    UF_XING?: string
    UF_LINKEDIN?: string
    UF_FACEBOOK?: string
    UF_TWITTER?: string
    UF_SKYPE?: string
    UF_DISTRICT?: string
    UF_PHONE_INNER?: string
    USER_TYPE?: string
  }
  time: {
    start: number
    finish: number
    duration: number
    processing: number
    date_start: string
    date_finish: string
    operating: number
  }
}

const DEFAULT_OAUTH_URL = "https://oauth.bitrix.info"

const authorize = async (
  url: URL,
  args: Parameters<typeof fetch>,
  clientId?: string,
  clientSecret?: string
) => {
  const [_, request] = args
  const body = new URLSearchParams(request?.body as string)

  const domain = body.get("domain") ?? new URL(DEFAULT_OAUTH_URL).hostname
  body.delete("domain")

  for (const [key, value] of body) {
    url.searchParams.append(key, value)
  }

  url.hostname = domain
  url.protocol = "https:"
  url.searchParams.set("client_id", String(clientId))
  url.searchParams.set("client_secret", String(clientSecret))

  const customHeaders = {
    ...request?.headers,
    "Content-Type": "application/json",
  }

  const response = await fetch(url, {
    ...request,
    headers: customHeaders,
  })

  const json = await response.json()

  return Response.json({ ...json })
}

export default function Bitrix24<P extends Bitrix24Profile>(
  config?: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    async [customFetch](...args: Parameters<typeof fetch>) {
      const url = new URL(args[0] instanceof Request ? args[0].url : args[0])

      if (url.pathname.endsWith("/oauth/token/")) {
        return await authorize(
          url,
          args,
          config?.clientId,
          config?.clientSecret
        )
      }

      return fetch(...args)
    },
    id: "bitrix24",
    name: "Bitrix24",
    type: "oauth",
    allowDangerousEmailAccountLinking: true,
    client: {
      token_endpoint_auth_method: "none",
    },
    checks: ["none"],
    authorization: {
      url: `${DEFAULT_OAUTH_URL}/oauth/authorize/`,
      params: {
        scope: "crm,im,user",
      },
    },
    token: {
      url: "https://oauth.bitrix.info/oauth/token/",
      async conform(response: Response) {
        const response_data = await response.json()
        const data = {
          ...response_data,
          client_endpoint: response_data.client_endpoint,
          server_endpoint: response_data.server_endpoint,
        }

        if (data.expires_in) {
          if (!data.expires_at) {
            data.expires_at = expiredInToExpiredAt(data.expires_in)
          }
          delete data.expires_in
        }

        if (
          data.token_type &&
          String(data.token_type).toLowerCase() === "bearer"
        ) {
          console.warn(
            "token_type is 'bearer'. Redundant workaround, please open an issue."
          )
          return data
        }
        return Response.json({ ...data, token_type: "bearer" }, response)
      },
    },
    account(account) {
      return {
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        scope: account.scope,
        id_token: account.id_token,
        token_type: account.token_type,
        session_state: account.session_state,
        client_endpoint: account.client_endpoint,
        server_endpoint: account.server_endpoint,
        memberId: account.member_id,
      }
    },
    userinfo: {
      url: "https://oauth.bitrix.info/rest/user.current",
      async request({ tokens }) {
        const client_endpoint = tokens.client_endpoint
        const url = new URL("user.current", String(client_endpoint))

        return await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth: tokens.access_token,
          }),
          method: "POST",
        }).then(async (res) => await res.json())
      },
    },
    profile(profile) {
      const title = profile.result.TITLE ? `${profile.result.TITLE} ` : ""
      const middle_name = profile.result.SECOND_NAME
        ? `${profile.result.SECOND_NAME} `
        : " "
      const first_name = profile.result.NAME
      const last_name = profile.result.LAST_NAME
      const name = `${title}${first_name}${middle_name}${last_name}`.trim()
      return {
        id: profile.result.ID.toString(),
        name,
        email: profile.result.EMAIL,
        image: profile.result.PERSONAL_PHOTO ?? null,
      }
    },
    customCallbackParams: ["domain", "server_domain"],
    options: config,
  }
}
