# Shield Armor Classification

- Status: Complete
- Registered: 2026-09-15
- Scope: D4 frontend and database taxonomy

## Objective

Classify `shield` as `armor` throughout the current Diablo 4 item flow so that
shields appear under the armor selector and newly registered or analyzed shield
items use `item_type = 'armor'`.

## Compatibility Decision

Existing listings, saved searches, and statistics stored as `weapon + shield`
are intentionally out of scope. No historical item migration is included.

## Implementation

- Change both localized `equipment_classes` seed rows for `shield` from
  `weapon` to `armor`.
- Add the idempotent runtime taxonomy update to the season deployment SQL.
- Move the normal shield image assets from `weapon/shield` to `armor/shield`.
- Move the frontend shield image-count mapping from `weapon` to `armor`.
- Confirm that registration, filtering, fixed-item analysis, and normal item
  rendering derive the top-level type from the equipment-class API data.

## Acceptance Criteria

- The base-data API returns `shield` with `type = 'armor'` after DB deployment
  and backend restart.
- Armor selection includes Shield; Weapon selection does not.
- New shield listings and OCR results use `armor + shield`.
- `/images/items/armor/shield/0.webp` through `19.webp` exist.
- Frontend type checking and SSR production build pass.

## Verification

- `npm run typecheck` passed on 2026-09-15.
- `npm run build` passed for the Quasar SSR target on 2026-09-15.
- Confirmed 20 shield assets at `public/images/items/armor/shield` and no
  remaining `public/images/items/weapon/shield` directory.
- Confirmed no remaining source or seed reference that classifies `shield` as
  `weapon`.
