import { DefaultSession, QwikAuth$ } from "@oneum-io/qwik";
import GitHub from "@oneum-io/qwik/providers/github";

declare module "@oneum-io/qwik" {
  interface Session {
    user: {
      roles: string[];
    } & DefaultSession["user"];
  }
}

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$(
  () => ({
    providers: [GitHub],
  }),
);
