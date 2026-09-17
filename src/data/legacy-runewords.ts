export type LegacyRuneCode =
  | 'amn'
  | 'ber'
  | 'eth'
  | 'ist'
  | 'ith'
  | 'jah'
  | 'lo'
  | 'mal'
  | 'ohm'
  | 'ort'
  | 'ral'
  | 'sol'
  | 'tal'
  | 'thul'
  | 'tir'
  | 'vex'

export interface LegacyRunewordDefinition {
  key: string
  name: { ko: string; en: string }
  runeCodes: readonly LegacyRuneCode[]
  fixedItemIds: readonly number[]
}

export const legacyRuneNames: Record<
  LegacyRuneCode,
  { ko: string; en: string }
> = {
  amn: { ko: '앰', en: 'Amn' },
  ber: { ko: '베르', en: 'Ber' },
  eth: { ko: '에드', en: 'Eth' },
  ist: { ko: '이스트', en: 'Ist' },
  ith: { ko: '아이드', en: 'Ith' },
  jah: { ko: '자', en: 'Jah' },
  lo: { ko: '로', en: 'Lo' },
  mal: { ko: '말', en: 'Mal' },
  ohm: { ko: '오움', en: 'Ohm' },
  ort: { ko: '오르트', en: 'Ort' },
  ral: { ko: '랄', en: 'Ral' },
  sol: { ko: '솔', en: 'Sol' },
  tal: { ko: '탈', en: 'Tal' },
  thul: { ko: '주울', en: 'Thul' },
  tir: { ko: '티르', en: 'Tir' },
  vex: { ko: '벡스', en: 'Vex' }
}

export const legacyRunewords: readonly LegacyRunewordDefinition[] = [
  {
    key: 'prudence',
    name: { ko: '신중', en: 'Prudence' },
    runeCodes: ['mal', 'tir'],
    fixedItemIds: [15001]
  },
  {
    key: 'leaf',
    name: { ko: '잎새', en: 'Leaf' },
    runeCodes: ['tir', 'ral'],
    fixedItemIds: [15002]
  },
  {
    key: 'insight',
    name: { ko: '통찰', en: 'Insight' },
    runeCodes: ['ral', 'tir', 'tal', 'sol'],
    fixedItemIds: [15003, 15004, 15005, 15006, 15007, 15008, 15009]
  },
  {
    key: 'enigma',
    name: { ko: '수수께끼', en: 'Enigma' },
    runeCodes: ['jah', 'ith', 'ber'],
    fixedItemIds: [15010]
  },
  {
    key: 'spirit',
    name: { ko: '영혼', en: 'Spirit' },
    runeCodes: ['tal', 'thul', 'ort', 'amn'],
    fixedItemIds: [15011, 15012, 15013, 15014, 15015, 15016, 15017, 15019, 15020]
  },
  {
    key: 'holy-thunder',
    name: { ko: '신성한 천둥', en: 'Holy Thunder' },
    runeCodes: ['eth', 'ral', 'ort', 'tal'],
    fixedItemIds: [15021, 15022]
  },
  {
    key: 'kings-grace',
    name: { ko: '왕의 은총', en: "King's Grace" },
    runeCodes: ['amn', 'ral', 'thul'],
    fixedItemIds: [15023, 15024, 15025]
  },
  {
    key: 'phoenix',
    name: { ko: '불사조', en: 'Phoenix' },
    runeCodes: ['vex', 'vex', 'lo', 'jah'],
    fixedItemIds: [15026, 15027, 15028, 15029, 15030, 15031, 15032, 15033, 15034, 15035]
  },
  {
    key: 'pattern',
    name: { ko: '귀감', en: 'Pattern' },
    runeCodes: ['tal', 'ort', 'thul'],
    fixedItemIds: [15036]
  },
  {
    key: 'rain',
    name: { ko: '비', en: 'Rain' },
    runeCodes: ['ort', 'mal', 'ith'],
    fixedItemIds: [15037]
  },
  {
    key: 'call-to-arms',
    name: { ko: '소집', en: 'Call to Arms' },
    runeCodes: ['amn', 'ral', 'mal', 'ist', 'ohm'],
    fixedItemIds: [15038, 15039, 15040, 15041, 15042, 15043, 15044, 15045, 15046]
  },
  {
    key: 'edge',
    name: { ko: '모서리', en: 'Edge' },
    runeCodes: ['tir', 'tal', 'amn'],
    fixedItemIds: [15047, 15048, 15049, 15050, 15051, 15052, 15053, 15054, 15055, 15056]
  },
  {
    key: 'ancients-pledge',
    name: { ko: '고대인의 서약', en: "Ancient's Pledge" },
    runeCodes: ['ral', 'ort', 'tal'],
    fixedItemIds: [15057, 15058, 15059]
  },
  {
    key: 'strength',
    name: { ko: '강함', en: 'Strength' },
    runeCodes: ['amn', 'tir'],
    fixedItemIds: [15060, 15061, 15062, 15063, 15064, 15065, 15066, 15067, 15068]
  },
  {
    key: 'grief',
    name: { ko: '슬픔', en: 'Grief' },
    runeCodes: ['eth', 'tir', 'lo', 'mal', 'ral'],
    fixedItemIds: [15069, 15070]
  },
  {
    key: 'lore',
    name: { ko: '전승', en: 'Lore' },
    runeCodes: ['ort', 'sol'],
    fixedItemIds: [15071]
  },
  {
    key: 'infinity',
    name: { ko: '무한', en: 'Infinity' },
    runeCodes: ['ber', 'mal', 'ber', 'ist'],
    fixedItemIds: [15072, 15073, 15074, 15075, 15076, 15077, 15078, 15079, 15080, 15081]
  },
  {
    key: 'stealth',
    name: { ko: '잠행', en: 'Stealth' },
    runeCodes: ['tal', 'eth'],
    fixedItemIds: [15082]
  },
  {
    key: 'zephyr',
    name: { ko: '서풍', en: 'Zephyr' },
    runeCodes: ['ort', 'eth'],
    fixedItemIds: [15083, 15084]
  }
]

const runewordByFixedItemId = new Map<number, LegacyRunewordDefinition>(
  legacyRunewords.flatMap((runeword) =>
    runeword.fixedItemIds.map((fixedItemId) => [fixedItemId, runeword])
  )
)

export const findLegacyRuneword = (fixedItemId?: number | string) => {
  const normalizedId = Number(fixedItemId)
  return normalizedId ? runewordByFixedItemId.get(normalizedId) : undefined
}

export const legacyRuneLabel = (code: LegacyRuneCode, locale: string) =>
  legacyRuneNames[code][locale.toLowerCase().startsWith('ko') ? 'ko' : 'en']
