import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
// Import only the webserver hooks, never the generated index.js/listen entry.
await build({
  entryPoints: [path.join(root, 'src-ssr/server.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['#q-app'],
  define: {
    'import.meta.env.QUASAR_PROD': 'true',
    'import.meta.env.QUASAR_DEV': 'false',
    'import.meta.dirname': JSON.stringify(path.join(root, 'dist/ssr'))
  },
  outfile: path.join(root, 'tests/performance/.generated/server-preload.cjs')
})
await build({
  stdin: {
    contents: `
      export { default as koMessages } from './src/i18n/ko';
      export { default as enMessages } from './src/i18n/en';
      export { resolveMessages } from './src/i18n/resolve-messages';
      export { loadInitialTrade } from './src/common/initial-trade';
      export { useGlobalStore } from './src/stores/global-store';
      export { useItemStore } from './src/stores/item-store';
      export { createSharedClock, useSharedClock } from './src/composables/shared-clock';
      export { default as resourceStatus } from './src-ssr/middlewares/resource-status';
      export { default as renderMiddleware } from './src-ssr/middlewares/render';
      export { createCriticalCssRenderer } from './src-ssr/critical-css';
    `,
    resolveDir: root
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  external: ['pinia', 'vue', 'src/common/ocr/paddle'],
  outfile: path.join(root, 'tests/performance/.generated/loaders.mjs'),
  define: { 'import.meta.env.VITE_APP_VERSION': '"performance-test"', 'import.meta.env.QUASAR_DEV': 'false', 'import.meta.env.QUASAR_DEBUG': 'false' },
  plugins: [{
    name: 'offline-platform',
    setup(builder) {
      builder.onResolve({ filter: /^quasar$|^#q-app$|^boot\/axios$|^src\/common$/ }, args => ({
        path: args.path, namespace: 'offline'
      }))
      builder.onLoad({ filter: /.*/, namespace: 'offline' }, args => ({
        contents: args.path === 'quasar' ? `
          export const LocalStorage = {
            getItem: () => null, setItem: () => {}, removeItem: () => {}
          };
          export const uid = () => 'test-id';
        ` : args.path === '#q-app' ? 'export const defineSsrMiddleware = fn => fn;'
          : args.path === 'src/common' ? 'export const clearLocalStorage = () => {};'
          : 'export const api = {};',
        loader: 'js'
      }))
      builder.onResolve({ filter: /^src\// }, args => args.path === 'src/common/ocr/paddle'
        ? { path: args.path, external: true }
        : { path: path.join(root, args.path + '.ts') })
    }
  }]
})
