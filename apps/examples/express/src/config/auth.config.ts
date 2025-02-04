import Apple from "@oneum-io/express/providers/apple"
import Auth0 from "@oneum-io/express/providers/auth0"
import AzureB2C from "@oneum-io/express/providers/azure-ad-b2c"
import BoxyHQSAML from "@oneum-io/express/providers/boxyhq-saml"
import Cognito from "@oneum-io/express/providers/cognito"
import Coinbase from "@oneum-io/express/providers/coinbase"
import Discord from "@oneum-io/express/providers/discord"
import Dropbox from "@oneum-io/express/providers/dropbox"
import Facebook from "@oneum-io/express/providers/facebook"
import GitHub from "@oneum-io/express/providers/github"
import GitLab from "@oneum-io/express/providers/gitlab"
import Google from "@oneum-io/express/providers/google"
import Hubspot from "@oneum-io/express/providers/hubspot"
import Keycloak from "@oneum-io/express/providers/keycloak"
import LinkedIn from "@oneum-io/express/providers/linkedin"
import Netlify from "@oneum-io/express/providers/netlify"
import Okta from "@oneum-io/express/providers/okta"
import Passage from "@oneum-io/express/providers/passage"
import Pinterest from "@oneum-io/express/providers/pinterest"
import Reddit from "@oneum-io/express/providers/reddit"
import Slack from "@oneum-io/express/providers/slack"
import Spotify from "@oneum-io/express/providers/spotify"
import Twitch from "@oneum-io/express/providers/twitch"
import Twitter from "@oneum-io/express/providers/twitter"
import WorkOS from "@oneum-io/express/providers/workos"
import Zoom from "@oneum-io/express/providers/zoom"

export const authConfig = {
  trustHost: true,
  providers: [
    Apple,
    Auth0,
    AzureB2C({
      clientId: process.env.AUTH_AZURE_AD_B2C_ID,
      clientSecret: process.env.AUTH_AZURE_AD_B2C_SECRET,
      issuer: process.env.AUTH_AZURE_AD_B2C_ISSUER,
    }),
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
    Netlify,
    Okta,
    Passage,
    Pinterest,
    Reddit,
    Slack,
    Spotify,
    Twitch,
    Twitter,
    WorkOS({
      connection: process.env.AUTH_WORKOS_CONNECTION!,
    }),
    Zoom,
  ],
}
