# Season 14 / Lord of Hatred Item Update Audit

Date checked: 2026-07-01

## Sources Checked

- Blizzard official 2.6 patch notes:
  - https://news.blizzard.com/ko-kr/article/24266869/iv-2-6
- Blizzard official Paladin / Lord of Hatred article:
  - https://news.blizzard.com/en-us/article/24244399/wield-divine-might-as-the-paladin
- Blizzard official Reckoning article:
  - https://news.blizzard.com/en-us/article/24267729/prepare-for-the-reckoning-lord-of-hatred-draws-near
- Wowhead item pages referenced by the local fixed item candidate notes
- D4Builds uniques page and loaded JS bundles:
  - https://d4builds.gg/database/uniques/

## Current Local State

The frontend renders fixed item images from:

```text
/images/items/fixed/{quality}-{sort}.webp
```

The current fixed item SQL reference used during this audit was:

```text
fixed_items_reckoning.sql
```

Image/SQL comparison:

| Quality | SQL rows | SQL max sort | Image files | Image max sort | Issue |
| --- | ---: | ---: | ---: | ---: | --- |
| unique | 112 | 112 | 111 | 112 | `unique-6.webp` is missing |
| mythic | 2 | 3 | 3 | 3 | `mythic-1.webp` is unreferenced by final SQL |
| set | 209 | 209 | 209 | 209 | None found |

## Confirmed Findings

### `unique-6.webp` is missing

SQL sort 6 currently points to:

```text
Promise of Glory / Paladin Unique Flail
```

This image is missing:

```text
public/images/items/fixed/unique-6.webp
```

Do not fill this image blindly yet. The official Paladin article has an inconsistency:

- The text references Paladin uniques such as `Promise of Glory`.
- The official item-card images show names including `Seal of the Second Trumpet`, `Sunbrand`, and `Dawnfire`, which are not present in the current SQL.
- Wowhead candidate URLs in the local candidate file validate many Lord of Hatred items, but no Wowhead URL for `Promise of Glory` was found in the local candidate URL list.

### `mythic-1.webp` should not be re-added to SQL without a new source

`Seal of the Severed Finger` exists on Wowhead:

```text
https://www.wowhead.com/diablo-4/item/seal-of-the-severed-finger-2622265
```

However, the current SQL explicitly says it was removed from final Season 14 data:

```text
Seal of the Severed Finger was removed from final Season 14 data.
Legacy production rows are remapped in 8. alter.sql.
```

Therefore, `mythic-1.webp` is treated as a legacy or reserved asset unless a newer official source says otherwise.

## Update Plan

1. Resolve the Paladin unique list conflict before changing production data.
   - Compare the current SQL Paladin unique list with official Blizzard item-card images.
   - Recheck Wowhead for pages matching:
     - `Promise of Glory`
     - `Seal of the Second Trumpet`
     - `Sunbrand`
     - `Dawnfire`
   - Use D4Builds/Maxroll only as secondary references if they expose item pages for these names.

2. Update fixed item SQL only after at least one primary source or two reliable secondary sources confirm the final name/type mapping.
   - If `Promise of Glory` is superseded by `Sunbrand` or another final name, update SQL names and affix mapping in the backend/query repo.
   - If `Promise of Glory` is still valid, add only `unique-6.webp`.

3. Update frontend assets after the mapping is confirmed.
   - Add `public/images/items/fixed/unique-6.webp`.
   - Keep `mythic-1.webp` untouched unless final SQL intentionally reintroduces sort 1.

4. Re-run the fixed item image audit after any data or asset change.

5. Run frontend verification:
   - `npm run typecheck`
   - `npm run build`

## Do Not Change Yet

- Do not delete `mythic-1.webp`; it may be a legacy asset.
- Do not add a guessed `unique-6.webp`; the current SQL item name has not been confirmed against official current imagery.
- Do not modify backend/query data from this frontend repo without explicitly deciding that backend/query data is part of the update.

