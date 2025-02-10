import type { AdapterAccount, AdapterUser } from "../../../../../adapters.js"
import type { InternalOptions } from "../../../../../types.js"
import { signinByAccount } from "./account.js"
import { signinCommon } from "./common.js"

export const getUser = async (
  profile: AdapterUser,
  account: AdapterAccount,
  user: AdapterUser | null,
  options: InternalOptions,
  userByAccount?: AdapterUser | null
) => {
  if (userByAccount) {
    return signinByAccount(account, user, userByAccount)
  }

  return await signinCommon(profile, account, user, options)
}
