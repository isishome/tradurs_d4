import { ssrMiddleware } from 'quasar/wrappers'

export default ssrMiddleware(({ app, resolve }) => {
  // Static files are served first. Unpublished optional manifests must not
  // fall through to the Vue error page and masquerade as successful JSON.
  app.get([
    resolve.urlPath('ai-catalog.json'),
    resolve.urlPath('.well-known/ai-catalog.json')
  ], (_req, res) => {
    res.status(404).type('text/plain').send('Not Found')
  })
})
