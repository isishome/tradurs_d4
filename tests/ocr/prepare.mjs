import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

await build({
  entryPoints: [fileURLToPath(new URL('../../src/common/affix-matcher.ts', import.meta.url))],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: fileURLToPath(new URL('.generated/matcher.mjs', import.meta.url))
})
