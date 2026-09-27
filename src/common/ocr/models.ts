// Keep this revision in sync with the measured PoC and THIRD_PARTY.md.
const base = 'https://huggingface.co/snowfluke/ppu-paddle-ocr-models/resolve/bf1d5edb0335d3262be7caf13f766ba274b4cadd'

export type OcrLanguage = 'ko' | 'en'

export const models = {
  ko: {
    detection: `${base}/detection/PP-OCRv5_mobile_det_infer.onnx`,
    recognition: `${base}/recognition/multi/korean/v5/korean_PP-OCRv5_mobile_rec_infer.onnx`,
    charactersDictionary: `${base}/recognition/multi/korean/v5/ppocrv5_korean_dict.txt`
  },
  en: {
    detection: `${base}/detection/PP-OCRv5_mobile_det_infer.ort`,
    recognition: `${base}/recognition/multi/en/v5/en_PP-OCRv5_mobile_rec_infer.ort`,
    charactersDictionary: `${base}/recognition/multi/en/v5/ppocrv5_en_dict.txt`
  }
}

export interface OcrRequest {
  id: number
  language: OcrLanguage
  image: ArrayBuffer
}

export type OcrResponse = { id: number; text: string } | { id: number; error: true }
