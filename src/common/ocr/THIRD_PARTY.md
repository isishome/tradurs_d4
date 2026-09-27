# Browser OCR dependencies

- `ppu-paddle-ocr` 6.6.0: MIT, https://github.com/PT-Perkasa-Pilar-Utama/ppu-paddle-ocr
- `onnxruntime-web` 1.30.0: MIT, https://github.com/microsoft/onnxruntime
- PP-OCRv5 models/dictionaries: Apache-2.0, upstream PaddlePaddle/PaddleOCR;
  https://huggingface.co/snowfluke/ppu-paddle-ocr-models/tree/bf1d5edb0335d3262be7caf13f766ba274b4cadd

Models are downloaded unchanged from the pinned upstream revision; ONNX WASM is loaded from
the pinned jsDelivr package. The selected image is processed in a browser worker, not uploaded
to these hosts. Network access to Hugging Face and jsDelivr is needed on first use. The worker
is released after one idle minute. No Tesseract fallback is included.

Reference design: sibling d2r_v2 ADR-024. D4-specific comparison: `poc/ocr/README.md`.
