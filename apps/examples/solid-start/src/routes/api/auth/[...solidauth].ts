import { SolidAuth, type SolidAuthConfig } from "@oneum-io/solid-start"
import GitHub from "@oneum-io/solid-start/providers/github"
import { serverEnv } from "~/env/server"

export const authOpts: SolidAuthConfig = {
  providers: [
    GitHub({
      clientId: serverEnv.GITHUB_ID,
      clientSecret: serverEnv.GITHUB_SECRET,
    }),
  ],
  debug: false,
}

export const { GET, POST } = SolidAuth(authOpts)
