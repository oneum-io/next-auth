import { type Session } from "@oneum-io/express"

declare module "express" {
  interface Response {
    locals: {
      session?: Session
    }
  }
}
