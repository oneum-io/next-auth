import type { OAuthConfig, OAuthUserConfig } from "./index.js"
import { customFetch } from "../lib/symbols.js"
import { expiredInToExpiredAt, capitalize } from "../lib/util.js"

type AmoRight = "M" | "D" | "A"

interface AmoRights {
  view: AmoRight
  edit: AmoRight
  add: AmoRight
  delete: AmoRight
  export: AmoRight
}

interface AmoAtom {
  id: number
  name: string
  rights: {
    leads: AmoRights
    contacts: AmoRights
    companies: AmoRights
    tasks: Pick<AmoRights, "edit" | "delete">
    mail_access: boolean
    catalog_access: boolean
    status_rights: {
      entity_type: string
      pipeline_id: number
      status_id: number
      rights: Partial<AmoRights>
    }[]
    is_admin: boolean
    is_free: boolean
    is_active: boolean
    group_id: number | null
    role_id: number | null
  }
  _links: {
    self: {
      href: string
    }
  }
}

export interface AmoProfile extends AmoAtom {
  id: number
  name: string
  email: string
  lang: string
  role?: AmoAtom
  group?: string | AmoAtom
  uuid?: string | null
  amojo_id?: string | null
  user_rank?: "newbie" | "candidate" | "master"
}

const DEFAULT_OAUTH_URL = "https://www.amocrm.ru/oauth"

const token = async (
  url: URL,
  args: Parameters<typeof fetch>,
  clientId?: string,
  clientSecret?: string
) => {
  const [_, request] = args
  const body = Object.fromEntries(Object(request?.body))

  const referer =
    new URLSearchParams(request?.body as string).get("referer") ??
    new URL(DEFAULT_OAUTH_URL).hostname
  url.searchParams.delete("referer")

  url.hostname = referer
  url.protocol = "https:"

  const customHeaders = {
    ...request?.headers,
    "content-type": "application/json",
  }

  body.client_id = String(clientId)
  body.client_secret = String(clientSecret)

  const response = await fetch(url, {
    ...request,
    headers: customHeaders,
    body: JSON.stringify(body),
  })

  const data = await response.json()
  const redirect_uri = body.redirect_uri

  return Response.json({ ...data, url: url.toString(), redirect_uri })
}

export default function AmoCRM<P extends AmoProfile>(
  config?: OAuthUserConfig<P>
): OAuthConfig<P> {
  const authUrl = DEFAULT_OAUTH_URL

  return {
    async [customFetch](...args: Parameters<typeof fetch>) {
      const url = new URL(args[0] instanceof Request ? args[0].url : args[0])

      if (url.pathname.endsWith("/access_token")) {
        return await token(url, args, config?.clientId, config?.clientSecret)
      }

      return fetch(...args)
    },
    id: "amocrm",
    name: "AmoCRM",
    type: "oauth",
    authorization: authUrl,
    allowDangerousEmailAccountLinking: true,
    client: {
      token_endpoint_auth_method: "none",
    },
    checks: ["none"],
    token: {
      url: "https://www.amocrm.ru/oauth2/access_token",
      async conform(response: Response) {
        const data = await response.json()
        const url = new URL(data.url)
        delete data.url

        if (data.expires_in) {
          if (!data.expires_at) {
            data.expires_at = expiredInToExpiredAt(data.expires_in)
          }
          delete data.expires_in
        }

        const domain = url.hostname
        const origin = new URL(`${url.protocol}//${domain}`)

        const amojo = await fetch(
          new URL("/api/v4/account?with=amojo_id", origin),
          {
            headers: {
              Authorization: `${capitalize(data.token_type)} ${data.access_token}`,
              "Content-Type": "application/json",
            },
          }
        )

        const { amojo_id, current_user_id } = await amojo.json()

        const newResponse = Response.json(
          {
            ...data,
            domain,
            amojoId: String(amojo_id),
            memberId: String(current_user_id),
          },
          response
        )
        newResponse.headers.set("Content-Type", "application/json")

        return newResponse
      },
    },
    account(account) {
      return {
        ...account,
        domain: account.domain,
        redirect_uri: account.redirect_uri,
        memberId: account.amojoId,
      }
    },
    userinfo: {
      url: "https://www.amocrm.ru/api/v4/users",
      async request({ tokens }) {
        const url = new URL(
          `/api/v4/users/${tokens.memberId}`,
          `https://${tokens.domain}`
        )

        return await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `${capitalize(tokens.token_type)} ${tokens.access_token}`,
          },
        }).then(async (res) => await res.json())
      },
    },
    profile(profile) {
      return {
        id: profile.id.toString(),
        name: profile.name,
        email: profile.email,
        image: null,
      }
    },
    customCallbackParams: ["referer"],
    options: config,
  }
}
