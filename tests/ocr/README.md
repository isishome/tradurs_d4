# OCR regression tests

Run `npm run test:ocr` from `d4` with dependencies installed and the sibling `query`
repository present. The command builds the current matcher before running the tests;
it requires no previous PoC run, browser, development server, or model download.

Coverage includes worker lifecycle/errors, Vite dependency optimization, affix values
and ranges, property/affix boundaries, quality/transmutation metadata, and legendary
effects. Four text fixtures retain actual user-image OCR output for parser regression.
They do not measure engine accuracy. Generated test bundles/caches are ignored.

The Tesseract/Paddle comparison harness, screenshots and benchmark artifacts were
removed at the user's request on 2026-09-27. Historical results remain in Git history
and `query/d4/docs/tasks/task-csj-008.md`.
