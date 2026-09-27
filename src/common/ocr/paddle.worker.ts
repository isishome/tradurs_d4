import { PaddleOcrService } from 'ppu-paddle-ocr/web'
import { env } from 'onnxruntime-web'
import { models, OcrLanguage, OcrRequest, OcrResponse } from './models'

env.wasm.numThreads = 1
env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/'

const services = new Map<OcrLanguage, Promise<PaddleOcrService>>()
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<OcrRequest>) => void) | null
  postMessage: (response: OcrResponse) => void
}

function service(language: OcrLanguage) {
  let pending = services.get(language)
  if (!pending) {
    pending = (async () => {
      const ocr = new PaddleOcrService({
        model: models[language],
        session: { executionProviders: ['wasm'] }
      })
      await ocr.initialize()
      return ocr
    })()
    pending.catch(() => services.delete(language))
    services.set(language, pending)
  }
  return pending
}

// The engine owns mutable canvases; never run two recognitions concurrently.
let queue = Promise.resolve()
scope.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    try {
      const ocr = await service(data.language)
      const result = await ocr.recognize(data.image, { noCache: true })
      scope.postMessage({ id: data.id, text: result.text })
    } catch {
      // Do not expose image data or recognized text through error logs.
      scope.postMessage({ id: data.id, error: true })
    }
  })
}
