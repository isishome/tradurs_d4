import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
await build({
  stdin: {
    contents: `
      export { loadInitialTrade } from './src/common/initial-trade';
      export { useGlobalStore } from './src/stores/global-store';
      export { useItemStore } from './src/stores/item-store';
      export { createSharedClock, useSharedClock } from './src/composables/shared-clock';
      export { default as resourceStatus } from './src-ssr/middlewares/resource-status';
    `,
    resolveDir: root
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  external: ['pinia', 'vue', 'src/common/ocr/paddle'],
  outfile: path.join(root, 'tests/performance/.generated/loaders.mjs'),
  define: { 'import.meta.env.VITE_APP_VERSION': '"performance-test"' },
  plugins: [{
    name: 'offline-platform',
    setup(builder) {
      builder.onResolve({ filter: /^quasar(?:\/wrappers)?$|^boot\/axios$|^src\/common$/ }, args => ({
        path: args.path, namespace: 'offline'
      }))
      builder.onLoad({ filter: /.*/, namespace: 'offline' }, args => ({
        contents: args.path === 'quasar' ? `
          export const LocalStorage = {
            getItem: () => null, setItem: () => {}, removeItem: () => {}
          };
          export const uid = () => 'test-id';
        ` : args.path === 'quasar/wrappers' ? 'export const ssrMiddleware = fn => fn;'
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
