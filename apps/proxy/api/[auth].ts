import { Auth, setEnvDefaults, type AuthConfig } from "@oneum-io/core"
import Apple from "@oneum-io/core/providers/apple"
import Auth0 from "@oneum-io/core/providers/auth0"
import AzureB2C from "@oneum-io/core/providers/azure-ad-b2c"
import BankId from "@oneum-io/core/providers/bankid-no"
import BoxyHQSAML from "@oneum-io/core/providers/boxyhq-saml"
import Cognito from "@oneum-io/core/providers/cognito"
import Coinbase from "@oneum-io/core/providers/coinbase"
import Discord from "@oneum-io/core/providers/discord"
import Dropbox from "@oneum-io/core/providers/dropbox"
import Facebook from "@oneum-io/core/providers/facebook"
import GitHub from "@oneum-io/core/providers/github"
import GitLab from "@oneum-io/core/providers/gitlab"
import Google from "@oneum-io/core/providers/google"
import Hubspot from "@oneum-io/core/providers/hubspot"
import Keycloak from "@oneum-io/core/providers/keycloak"
import LinkedIn from "@oneum-io/core/providers/linkedin"
import MicrosoftEntraId from "@oneum-io/core/providers/microsoft-entra-id"
import Netlify from "@oneum-io/core/providers/netlify"
import Okta from "@oneum-io/core/providers/okta"
import Passage from "@oneum-io/core/providers/passage"
import Pinterest from "@oneum-io/core/providers/pinterest"
import Reddit from "@oneum-io/core/providers/reddit"
import Salesforce from "@oneum-io/core/providers/salesforce"
import Slack from "@oneum-io/core/providers/slack"
import Spotify from "@oneum-io/core/providers/spotify"
import Twitch from "@oneum-io/core/providers/twitch"
import Twitter from "@oneum-io/core/providers/twitter"
import Vipps from "@oneum-io/core/providers/vipps"
import WorkOS from "@oneum-io/core/providers/workos"
import Zoom from "@oneum-io/core/providers/zoom"

const authConfig: AuthConfig = {
  providers: [
    Apple,
    Auth0,
    AzureB2C,
    BankId,
    BoxyHQSAML({
      clientId: "dummy",
      clientSecret: "dummy",
      issuer: process.env.AUTH_BOXYHQ_SAML_ISSUER,
    }),
    Cognito,
    Coinbase,
    Discord,
    Dropbox,
    Facebook,
    GitHub,
    GitLab,
    Google,
    Hubspot,
    Keycloak,
    LinkedIn,
    MicrosoftEntraId,
    Netlify,
    Okta,
    Passage,
    Pinterest,
    Reddit,
    Salesforce,
    Slack,
    Spotify,
    Twitch,
    Twitter,
    Vipps,
    WorkOS,
    Zoom,
    {
      id: "tiktok",
      name: "TikTok",
      type: "oauth",
      checks: ["state"],
      clientId: process.env.AUTH_TIKTOK_ID,
      clientSecret: process.env.AUTH_TIKTOK_SECRET,
      authorization: {
        url: "https://www.tiktok.com/v2/auth/authorize",
        params: {
          client_key: process.env.AUTH_TIKTOK_ID,
          scope: "user.info.basic",
        },
      },
      token: "https://open.tiktokapis.com/v2/oauth/token/",
      userinfo:
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name,username",
      profile(profile: any) {
        return profile
      },
      style: {
        bg: "#000",
        text: "#fff",
      },
    },
  ],
  basePath: "/api",
}
setEnvDefaults(process.env, authConfig)

export default function handler(req: Request) {
  return Auth(req, authConfig)
}

export const config = { runtime: "edge" }
