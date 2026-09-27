# D4 OCR comparison — 2026-09-27

Task: `query/d4/docs/tasks/task-csj-008.md`. No app server, production DB, or deployment was used.

## Inputs and reproducibility

`cases.json` records seven public **in-game screenshots**, original download URLs, crop coordinates,
and 91 manually transcribed fields. Five Korean September 2026 captures come from
https://m.inven.co.kr/board/diablo4/6023/11229; two English 2023 captures come from
https://www.pcgamer.com/diablo-4-ancestral-items/. Web-generated item cards were excluded.
Download each `source` into `fixtures/<file>`. Fixture images and generated bundles are ignored;
they are not product assets. Do not substitute AI-generated images for recognition tests.

Run from `d4`: `node poc/ocr/run.mjs`, `node poc/ocr/score.mjs`,
`node poc/ocr/match-score.mjs`, `node poc/ocr/affix-metrics.mjs`,
`node --test poc/ocr/client.test.mjs poc/ocr/matcher.test.mjs`.
The matcher tests require the generated matcher from `match-score.mjs`.
Property/affix classification regressions: also run `node --test poc/ocr/properties.test.mjs`.
Task011 adds actual Enigma/ring/boots OCR JSON and `property-ui-results.json`: base/rolled Armor
are separated, flat ring resistance uses new property45, and Quality/Transmuted metadata does not
fail the boots attribute-only scan. Registration correctly rejects Account Bound. The property45
UI preview injects the pending dictionary/relation into browser memory only; apply its standalone
SQL and reload backend/cache1.15.7 for normal use. Legendary wording mismatches remain separate.
The comparison harness uses Tesseract and Playwright installed in sibling `d2r_v2`; these are
**PoC-only dependencies**, not D4 production dependencies. Chromium defaults to the installed
`chromium-1234` executable; set `OCR_CHROMIUM` to override it. Network access is required for
model/WASM downloads. Both engines use the same Chromium, image crop, language, and original
or legacy preprocessed image. `baseline-worker.ts` preserves the original matching algorithm.

## Character/field results

| Configuration | Korean fields | English fields | Combined |
|---|---:|---:|---:|
| Legacy preprocessing + Tesseract/current extraction | 55/71 | 17/20 | 72/91 (79.1%) |
| Original crop + Paddle | 69/71 | 19/20 | 88/91 (96.7%) |
| Legacy preprocessing + Paddle | 70/71 | 19/20 | 89/91 (97.8%) |

Paddle original was selected because binary preprocessing erased English rarity/account-bound
lines outside this field list. No automatic destructive thresholding or artwork masking remains.
The user-selected crop stays at original resolution; Paddle performs its own detection resizing.
`scores.json` includes failures and field-level substring edit distance. This is **not whole-page
CER**. No language-dependent typo replacements are used in this character metric. Tesseract's
first/all-block variants did not differ in these seven samples.

Korean warm recognition median: Tesseract 903 ms, Paddle 2,303 ms. English: 871 ms vs 2,235 ms.
Paddle is more accurate here but slower. Timings are single runs, not a performance benchmark.
Cold model download varies with connection/cache. `production-results.json` separately proves
that the actual SSR-build module worker processed Korean and English screenshots (~5.3/6.3 s).
Run `node poc/ocr/production-worker.mjs` after `npm run build` to reproduce that check.

## Affix matching, not just OCR text

`affix-truth.json` records 46 visible affix occurrences as **catalog ID + ordered values**, including
duplicate socket-derived occurrences and two zero-placeholder unique powers. `match-score.mjs`
loads the current canonical SQL dictionary (2,046 labels/language), runs the saved OCR text through
the baseline and new matching algorithms, and saves all matches. `affix-metrics.json` reports ID
recall, ID+value recall, and unmatched predictions. No catalog-prefilled zero values count as hits.

| Configuration | ID + value matches | Unmatched predictions |
|---|---:|---:|
| Tesseract + old parser | 35/46 (76.1%) | 10 |
| Paddle + old parser | 40/46 (87.0%) | 10 |
| Paddle + improved parser | 44/46 (95.7%) | 1 |

The original PoC SQL reader accidentally skipped four-column aspect rows and CONCAT/multiline
templates. The shared audit reader now includes them. The denominator also includes the Spirit
image's Fire/Holy multiplier after task 009 added its missing dictionary ID. Older 36/45 figures
used the incomplete dictionary and are superseded, not directly comparable accuracy claims.

This is a **matching-stage replay**, not a measured browser registration completion rate.
It feeds the whole tooltip to the dictionary matcher to expose false positives. Innate armor,
amulet resistance, and socket counts are excluded from the affix denominator and predictions.
Current fixed-item registration considers general/socket affixes plus that item's unique powers;
account-bound images must use attribute-only mode. The old fixed-item UI filled catalog defaults
even when absent from the image. It now returns only recognized rows and their values/ranges.

Unsupported historic Corpse Skill Attack Speed/Darkness Skill Damage have no exact current
dictionary counterpart and are excluded from
the denominator. Gloom's historical wording maps to existing ID 168 and remains in the test.
The Call to Arms/Grief unique descriptions differ from the canonical sentences and remain
explicit expected failures, not guessed new affixes. Current metrics are in `affix-metrics.json`.

The matcher now preserves contiguous line boundaries, reads numeric-only continuation lines,
separates flat/% options, rejects overly distant short labels, normalizes placeholders/case,
supports known resource-on-kill/passive wording, and parses fixed numbers/rolls/ranges in order.
It does not guess damaged numeric values. A remaining Call to Arms nested effect can look like
a separate life affix. This remains a false-positive case; selecting a fixed item does not by
itself guarantee exclusion because real general affixes must also remain recognizable.

## Validation and limits

Client lifecycle and parser regression tests, repository TypeScript check, SSR production build,
and actual built worker KO/EN execution are the automated checks. No configured lint script exists.
The npm 10.8.2 `ci --dry-run --ignore-scripts` lock check passed; this was not a clean installation.
Local Node 24 exceeds this repository's declared Node 16/18/20 range and emitted an engine warning.

Development reload regression: `node --test poc/ocr/dev-deps.test.mjs` invokes the actual
installed Vite optimizer in an isolated cache, without starting an application server.
The lazy worker dependencies must be explicitly included at startup, with an ES2020
development prebundle target for ONNX BigInt syntax. The original default target caused
optimization failure, which Vite handles by sending a full-page reload. This check now passes;
the user's crop/recognize interaction still needs confirmation after the configuration reload.

Follow-up: the local ESM alias fixed missing exports but did not fix the actual served worker.
Authorized Playwright against the running application reproduced `HTMLElement is not defined`
from `/@vite/client:116`: Vite 2 injected its DOM-only client to rewrite an ONNX dynamic import.
All configuration contexts now use the same pinned ONNX CDN ESM URL, outside Vite import-analysis.
Only Paddle is explicitly preoptimized, targeting ES2020. `node poc/ocr/live-worker.mjs` tests the
actual worker served by the already-running server; KO and EN passed. The older isolated
`development-results.json` checks did not exercise this server transform and were insufficient.

Actual login/upload/crop checks confirmed account-bound rejection, successful repeated scans,
and attribute-only recognition. No listing was submitted and no credentials/state file was saved.
User Leoric/Elegy images exposed dictionary and fixed-item matching failures despite readable OCR.
Task 009 prepares canonical corrections and migrations; it has not changed a database.
`elegy-live-result.json` saves actual dev-worker OCR: old 3212 text has no match; corrected text
recovers 48% with range 30–50. Parser regression also checks all seven visible Elegy option lines.
Leoric no longer needs an item-specific phrase alias after correcting its dictionary sentence.

The actual crop UI exposed another numeric regression: its default 98% crop read armor 1,603
as 1,6033. `leoric-crop-comparison.json` records the real browser experiment; full-coverage
native-pixel cropping recovered 1,603. Cropping now initializes only after image readiness,
uses 100% coverage and precise natural aspect ratio, and copies integer source pixels for
unrotated images. It retains Cropper transforms for rotated/flipped images. Typecheck/build
passed. The final dev-UI recheck was interrupted by localhost:6090 refusing connections;
the user server was not restarted. Do not claim final full-UI acceptance from the experiment.

Resumed after the user restarted :6090: authorized Playwright exercised actual upload/default
crop/recognition and registration inputs. `final-ui-results.json` records Leoric armor1603,
power900, all seven affix/socket rows, Elegy's seven option rows (48% / 30–50), and account-bound
registration rejection. Repeated scans had zero unexpected navigations or runtime errors.
The eight corrected catalog IDs were injected only into browser memory; no DB or listing was
written. The live unpatched catalog still omitted Leoric's flat Fire Resistance and unique power.
Initial sandbox CDN access was denied; the approved external-network browser run passed.
No credentials/authentication state were saved. This supersedes the final-UI interruption above;
DB/cache rollout, user acceptance, mobile and arbitrary crop/transform combinations remain open.
An extra `npx vue-tsc --noEmit` attempt failed inside the downloaded tool's TypeScript resolution
(`ERR_PACKAGE_PATH_NOT_EXPORTED`); do not report it as a passing Vue typecheck.
Seven images are a small, nonrandom development set, with old English tooltips. They are not a
held-out validation set. Values/ranges, mobile latency, network failure/retry, multiple scans,
fixed-item selection and actual filter application still require user registration-screen checks.
