const dateToSeconds = (date: Date) => date.getTime() / 1000

const addSecondsToDate = (date: Date, seconds: number) => {
  return new Date(date.getTime() + Number(seconds) * 1000)
}

export const expiredInToExpiredAt = (expired_in?: number): number => {
  const now = new Date()
  if (typeof expired_in !== "number" && typeof expired_in !== "string") {
    return dateToSeconds(now)
  }

  const expiredTime = addSecondsToDate(now, expired_in)

  const expired_at = dateToSeconds(expiredTime)

  return expired_at
}

export const capitalize = (str?: string): string => {
  const s = String(str || "")
  return s.charAt(0).toUpperCase() + s.slice(1)
}
