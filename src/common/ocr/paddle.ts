import { OcrLanguage, OcrRequest, OcrResponse } from './models'
import PaddleWorker from './paddle.worker?worker'

interface Pending {
  resolve: (text: string) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export class PaddleOcrClient {
  private worker: Worker | undefined
  private sequence = 0
  private pending = new Map<number, Pending>()
  private idleTimer: ReturnType<typeof setTimeout> | undefined

  constructor(
    private createWorker?: () => Worker,
    private timeoutMs = 120_000,
    private idleMs = 60_000
  ) {}

  async extract(image: Blob, language: OcrLanguage): Promise<string> {
    if (!this.createWorker && (typeof Worker === 'undefined' || typeof WebAssembly === 'undefined')) {
      throw new Error('OCR is unavailable')
    }
    const bytes = await image.arrayBuffer()
    clearTimeout(this.idleTimer)
    if (!this.worker) {
      this.worker = this.createWorker?.() ?? new PaddleWorker()
      this.worker.onmessage = ({ data }: MessageEvent<OcrResponse>) => {
        const pending = this.pending.get(data.id)
        if (!pending) return
        if ('error' in data) {
          this.terminate(new Error('OCR failed'))
          return
        }
        clearTimeout(pending.timer)
        this.pending.delete(data.id)
        pending.resolve(data.text)
        if (!this.pending.size) this.idleTimer = setTimeout(() => this.terminate(), this.idleMs)
      }
      this.worker.onerror = () => this.terminate(new Error('OCR worker failed'))
      this.worker.onmessageerror = () => this.terminate(new Error('OCR response failed'))
    }
    const worker = this.worker
    const id = ++this.sequence
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.terminate(new Error('OCR timed out')), this.timeoutMs)
      this.pending.set(id, { resolve, reject, timer })
      const request: OcrRequest = { id, language, image: bytes }
      try {
        worker.postMessage(request, [bytes])
      } catch {
        this.terminate(new Error('OCR request failed'))
      }
    })
  }

  terminate(error = new Error('OCR terminated')) {
    clearTimeout(this.idleTimer)
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer)
      pending.reject(error)
    }
    this.pending.clear()
    this.worker?.terminate()
    this.worker = undefined
  }
}

export function normalizeOcrText(text: string, language: OcrLanguage): string {
  const letters = language === 'ko' ? '가-힣' : 'a-zA-Z'
  return text.normalize('NFKC')
    .replace(/[−–—]/g, '-')
    .replace(/\r\n?/g, '\n')
    .replace(new RegExp(`[^0-9%${letters}\\/\\+\\.\\[\\]\\-\\,\\:\\n\\(\\) ]`, 'g'), '')
    .split('\n')
    .map(line => line.replace(/ {2,}/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

const client = new PaddleOcrClient()
export async function recognize(image: Blob, lang: string): Promise<string> {
  const language = lang === 'ko' ? 'ko' : 'en'
  return normalizeOcrText(await client.extract(image, language), language)
}
