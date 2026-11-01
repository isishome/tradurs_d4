import type { Composer } from 'vue-i18n'

// tm() returns compiled message leaves, including metadata such as type/id.
// Resolve the leaves before comparing or binding them; never mutate the catalog.
export function resolveMessages<T>(value: T, rt: Composer['rt']): T {
  if (typeof value === 'string' || typeof value === 'function') {
    return rt(value as Parameters<Composer['rt']>[0]) as T
  }
  if (Array.isArray(value)) {
    return value.map(entry => resolveMessages(entry, rt)) as T
  }
  if (value && typeof value === 'object') {
    const node = value as Record<string, unknown>
    // ResourceNode in development, compact ResourceNode in production.
    if (node.type === 0 || node.t === 0) {
      return rt(value as Parameters<Composer['rt']>[0]) as T
    }
    return Object.fromEntries(
      Object.entries(node).map(([key, entry]) => [key, resolveMessages(entry, rt)])
    ) as T
  }
  return value
}
