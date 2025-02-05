import type { InternalProvider } from "../../types.js"

function validateQuery(query?: Record<string, unknown>): boolean {
  if (!query) return false
  if (typeof query !== "object") return false

  return true
}

function validatePQuery(query?: Record<string, unknown>): boolean {
  const { p = "" } = Object(query)

  return typeof p === "string" && p.length > 0
}

export function parseQueryProviders(
  query?: Record<string, unknown>,
  delimiter: string = ","
): string[] {
  if (!validateQuery(query)) return []
  if (!validatePQuery(query)) return []

  const { p = "" } = Object(query)

  const providers = String(p)
    .split(delimiter)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  return providers
}

export function useProvider(
  provider: InternalProvider,
  p?: string[] | null
): boolean {
  if (!Array.isArray(p)) return true
  if (p.length === 0) return true

  return p.includes(provider.id)
}
