import { PaddleOcrService } from 'ppu-paddle-ocr/web'
import { createWorker } from '../../../d2r_v2/packages/ocr-client/node_modules/tesseract.js/src/index.js'

const workers = new Map()
window.tesseract = async (data, lang) => {
  let worker = workers.get(lang)
  if (!worker) {
    worker = await createWorker(lang === 'ko' ? 'kor' : 'eng', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0'
    })
    await worker.setParameters({ preserve_interword_spaces: '1' })
    workers.set(lang, worker)
  }
  const start = performance.now()
  const { data: result } = await worker.recognize(data, undefined, { blocks: true })
  const lineText = blocks => blocks.flatMap(b => b.paragraphs).flatMap(p => p.lines).filter(l => l.confidence > 50).map(l => l.text).join('')
  return { text: result.text, currentText: lineText((result.blocks ?? []).slice(0, 1)), allBlockText: lineText(result.blocks ?? []), ms: performance.now() - start }
}

// Standalone comparison only; the app's development server is not used.
const base = 'https://huggingface.co/snowfluke/ppu-paddle-ocr-models/resolve/bf1d5edb0335d3262be7caf13f766ba274b4cadd'
const services = new Map()
window.paddle = async (data, lang) => {
  let service = services.get(lang)
  if (!service) {
    const korean = lang === 'ko'
    service = new PaddleOcrService({
      model: {
        detection: `${base}/detection/PP-OCRv5_mobile_det_infer.${korean ? 'onnx' : 'ort'}`,
        recognition: `${base}/recognition/multi/${korean ? 'korean' : 'en'}/v5/${korean ? 'korean' : 'en'}_PP-OCRv5_mobile_rec_infer.${korean ? 'onnx' : 'ort'}`,
        charactersDictionary: `${base}/recognition/multi/${korean ? 'korean' : 'en'}/v5/ppocrv5_${korean ? 'korean' : 'en'}_dict.txt`
      },
      session: { executionProviders: ['wasm'] }
    })
    await service.initialize()
    services.set(lang, service)
  }
  const image = await (await fetch(data)).arrayBuffer()
  const start = performance.now()
  const result = await service.recognize(image, { noCache: true })
  return { text: result.text, ms: performance.now() - start }
}

window.prepare = async (data, processed, crop) => {
  const image = new Image()
  image.src = data
  await image.decode()
  if (crop) {
    const cropped = document.createElement('canvas')
    cropped.width = crop[2]
    cropped.height = crop[3]
    cropped.getContext('2d').drawImage(image, ...crop, 0, 0, crop[2], crop[3])
    image.src = cropped.toDataURL('image/png')
    await image.decode()
  }
  const canvas = document.createElement('canvas')
  const scale = processed ? Math.round(700 / image.width * 1000) / 1000 : 1
  canvas.width = image.width * scale
  canvas.height = image.height * scale
  const ctx = canvas.getContext('2d')
  if (!processed) ctx.drawImage(image, 0, 0)
  else {
    if (/^data:image\/(png|webp)/.test(data)) {
      ctx.fillStyle = '#443322'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    const pw = Math.ceil(image.width * 0.32)
    const ph = Math.ceil(image.width * 0.36)
    ctx.drawImage(image, 0, 0, image.width - pw, ph, 0, 0, Math.round((image.width - pw) * scale), Math.round(ph * scale))
    ctx.drawImage(image, 0, ph, image.width, image.height - ph, 0, Math.round(ph * scale), image.width * scale, Math.round((image.height - ph) * scale))
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let sum = 0
    for (let i = 0; i < pixels.length; i += 4) sum += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
    const brightness = sum / (canvas.width * canvas.height)
    ctx.filter = brightness < 60 ? 'brightness(1) contrast(1.4) blur(.6px) sepia(1)' : 'grayscale(1) contrast(2) brightness(1.2)'
    ctx.drawImage(canvas, 0, 0)
    if (brightness >= 60) {
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < frame.data.length; i += 4) {
        const color = (frame.data[i] + frame.data[i + 1] + frame.data[i + 2]) / 3 > 140 ? 255 : 0
        frame.data[i] = frame.data[i + 1] = frame.data[i + 2] = color
      }
      ctx.putImageData(frame, 0, 0)
    }
  }
  return canvas.toDataURL('image/png')
}
