import { SvelteKitAuth } from "@oneum-io/sveltekit"
import Apple from "@oneum-io/sveltekit/providers/apple"
import Auth0 from "@oneum-io/sveltekit/providers/auth0"
import AzureB2C from "@oneum-io/sveltekit/providers/azure-ad-b2c"
import BoxyHQSAML from "@oneum-io/sveltekit/providers/boxyhq-saml"
import Cognito from "@oneum-io/sveltekit/providers/cognito"
import Coinbase from "@oneum-io/sveltekit/providers/coinbase"
import Discord from "@oneum-io/sveltekit/providers/discord"
import Dropbox from "@oneum-io/sveltekit/providers/dropbox"
import Facebook from "@oneum-io/sveltekit/providers/facebook"
import GitHub from "@oneum-io/sveltekit/providers/github"
import GitLab from "@oneum-io/sveltekit/providers/gitlab"
import Google from "@oneum-io/sveltekit/providers/google"
import Hubspot from "@oneum-io/sveltekit/providers/hubspot"
import Keycloak from "@oneum-io/sveltekit/providers/keycloak"
import LinkedIn from "@oneum-io/sveltekit/providers/linkedin"
import Netlify from "@oneum-io/sveltekit/providers/netlify"
import Okta from "@oneum-io/sveltekit/providers/okta"
import Passage from "@oneum-io/sveltekit/providers/passage"
import Pinterest from "@oneum-io/sveltekit/providers/pinterest"
import Reddit from "@oneum-io/sveltekit/providers/reddit"
import Slack from "@oneum-io/sveltekit/providers/slack"
import Spotify from "@oneum-io/sveltekit/providers/spotify"
import Twitch from "@oneum-io/sveltekit/providers/twitch"
import Twitter from "@oneum-io/sveltekit/providers/twitter"
import WorkOS from "@oneum-io/sveltekit/providers/workos"
import Zoom from "@oneum-io/sveltekit/providers/zoom"
import { env } from "$env/dynamic/private"

export const { handle, signIn, signOut } = SvelteKitAuth({
  trustHost: true,
  providers: [
    Apple,
    Auth0,
    AzureB2C({
      clientId: env.AUTH_AZURE_AD_B2C_ID,
      clientSecret: env.AUTH_AZURE_AD_B2C_SECRET,
      issuer: env.AUTH_AZURE_AD_B2C_ISSUER,
    }),
    BoxyHQSAML({
      clientId: "dummy",
      clientSecret: "dummy",
      issuer: env.AUTH_BOXYHQ_SAML_ISSUER,
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
      connection: env.AUTH_WORKOS_CONNECTION!,
    }),
    Zoom,
  ],
})
