import type { LegacyRuneCode } from './legacy-runewords'

export type RuneUpgradeGem =
  | 'amethyst'
  | 'diamond'
  | 'emerald'
  | 'ruby'
  | 'sapphire'
  | 'topaz'

export type RuneUpgradeGemQuality = 'chipped' | 'flawless' | 'grand'

export interface RuneUpgradeRecipe {
  key: string
  inputRune: LegacyRuneCode
  inputQuantity: 2 | 3
  gem?: {
    type: RuneUpgradeGem
    quality: RuneUpgradeGemQuality
    quantity: 1
  }
  outputRune: LegacyRuneCode
  chain: 'low' | 'high'
}

export const runeUpgradeSources = [
  {
    key: 'Mobalytics',
    labelKey: 'runeUpgradeKnowledge.sourceMobalytics',
    url: 'https://mobalytics.gg/diablo-4/guides/rune-crafting-recipes'
  },
  {
    key: 'IcyVeins',
    labelKey: 'runeUpgradeKnowledge.sourceIcyVeins',
    url: 'https://www.icy-veins.com/d4/news/every-new-runeword-recipe-added-to-diablo-4-in-season-15/'
  },
  {
    key: 'D4Guides',
    labelKey: 'runeUpgradeKnowledge.sourceD4Guides',
    url: 'https://d4guides.gg/en/news/diablo-4-season-15-twelve-new-runes-from-amn-to-tir'
  }
] as const

export const runeUpgradeRecipes: readonly RuneUpgradeRecipe[] = [
  { key: 'tir-eth', inputRune: 'tir', inputQuantity: 3, outputRune: 'eth', chain: 'low' },
  { key: 'eth-ith', inputRune: 'eth', inputQuantity: 3, outputRune: 'ith', chain: 'low' },
  { key: 'ith-tal', inputRune: 'ith', inputQuantity: 3, outputRune: 'tal', chain: 'low' },
  { key: 'tal-ral', inputRune: 'tal', inputQuantity: 3, outputRune: 'ral', chain: 'low' },
  { key: 'ral-ort', inputRune: 'ral', inputQuantity: 3, outputRune: 'ort', chain: 'low' },
  { key: 'ort-thul', inputRune: 'ort', inputQuantity: 3, outputRune: 'thul', chain: 'low' },
  {
    key: 'thul-amn',
    inputRune: 'thul',
    inputQuantity: 3,
    gem: { type: 'topaz', quality: 'chipped', quantity: 1 },
    outputRune: 'amn',
    chain: 'low'
  },
  {
    key: 'amn-sol',
    inputRune: 'amn',
    inputQuantity: 3,
    gem: { type: 'amethyst', quality: 'chipped', quantity: 1 },
    outputRune: 'sol',
    chain: 'low'
  },
  {
    key: 'mal-ist',
    inputRune: 'mal',
    inputQuantity: 2,
    gem: { type: 'amethyst', quality: 'flawless', quantity: 1 },
    outputRune: 'ist',
    chain: 'high'
  },
  {
    key: 'ist-vex',
    inputRune: 'ist',
    inputQuantity: 2,
    gem: { type: 'ruby', quality: 'flawless', quantity: 1 },
    outputRune: 'vex',
    chain: 'high'
  },
  {
    key: 'vex-ohm',
    inputRune: 'vex',
    inputQuantity: 2,
    gem: { type: 'emerald', quality: 'flawless', quantity: 1 },
    outputRune: 'ohm',
    chain: 'high'
  },
  {
    key: 'ohm-lo',
    inputRune: 'ohm',
    inputQuantity: 2,
    gem: { type: 'diamond', quality: 'flawless', quantity: 1 },
    outputRune: 'lo',
    chain: 'high'
  },
  {
    key: 'lo-ber',
    inputRune: 'lo',
    inputQuantity: 2,
    gem: { type: 'topaz', quality: 'grand', quantity: 1 },
    outputRune: 'ber',
    chain: 'high'
  },
  {
    key: 'ber-jah',
    inputRune: 'ber',
    inputQuantity: 2,
    gem: { type: 'sapphire', quality: 'grand', quantity: 1 },
    outputRune: 'jah',
    chain: 'high'
  }
] as const

export const runeImage = (code: LegacyRuneCode) => {
  const ritual = new Set<LegacyRuneCode>(['amn', 'eth', 'mal', 'ort', 'tal'])
  return {
    type: ritual.has(code) ? 'ritual' : 'invocation',
    key: code === 'tal' ? 'tal-s15' : code
  }
}

const recipeKeys = new Set(runeUpgradeRecipes.map((recipe) => recipe.key))
if (runeUpgradeRecipes.length !== 14 || recipeKeys.size !== 14) {
  throw new Error('Season 15 rune-upgrade catalog must contain 14 unique recipes.')
}

const recipeSignatures = runeUpgradeRecipes.map(
  (recipe) =>
    `${recipe.inputRune}:${recipe.inputQuantity}:${recipe.gem?.quality ?? '-'}:${recipe.gem?.type ?? '-'}>${recipe.outputRune}`
)
const expectedSignatures = [
  'tir:3:-:->eth',
  'eth:3:-:->ith',
  'ith:3:-:->tal',
  'tal:3:-:->ral',
  'ral:3:-:->ort',
  'ort:3:-:->thul',
  'thul:3:chipped:topaz>amn',
  'amn:3:chipped:amethyst>sol',
  'mal:2:flawless:amethyst>ist',
  'ist:2:flawless:ruby>vex',
  'vex:2:flawless:emerald>ohm',
  'ohm:2:flawless:diamond>lo',
  'lo:2:grand:topaz>ber',
  'ber:2:grand:sapphire>jah'
]
if (recipeSignatures.some((signature, index) => signature !== expectedSignatures[index])) {
  throw new Error('Season 15 rune-upgrade recipe quantities or Gem requirements are invalid.')
}

if (
  runeUpgradeRecipes.some(
    (recipe) => recipe.inputRune === 'sol' && recipe.outputRune === 'mal'
  )
) {
  throw new Error('The unverified Sol-to-Mal bridge must not be added.')
}
