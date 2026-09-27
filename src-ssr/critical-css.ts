// Only these small, immutable build assets belong in the initial HTML.
// Keep the files themselves: Vite still uses them during client navigation.
const assetPattern = /^\/?(?:[\w-]+\/)*assets\/((?:register|MainLayout)\.[a-f0-9]{8,64}\.css)$/
const maxBytes = 16 * 1024

export function createCriticalCssRenderer(readAsset: (name: string) => string) {
  const cache = new Map<string, string | undefined>()
  return (file: string): string | undefined => {
    const match = assetPattern.exec(file)
    if (!match) return undefined
    if (cache.has(file)) return cache.get(file)

    let result: string | undefined
    try {
      const css = readAsset(match[1])
      // Root-relative image references keep their meaning inside HTML. All
      // other URLs/imports fall back to external CSS rather than being rebased.
      const withoutRootUrls = css.replace(/url\(\s*(['"]?)\/(?!\/)[a-zA-Z0-9_./-]+\1\s*\)/g, '')
      if (css.length > 0 && Buffer.byteLength(css, 'utf8') <= maxBytes &&
          !/@import|url\s*\(|<\/style/i.test(withoutRootUrls)) {
        result = `<style data-ssr-css="${file}">${css}</style>`
      }
    } catch {
      // Missing/unreadable assets must not prevent the page from rendering.
    }
    cache.set(file, result)
    return result
  }
}
