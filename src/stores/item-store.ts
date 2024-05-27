import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { createWorker, ImageLike } from 'tesseract.js'
import { Item, Offer } from 'src/types/item'

export interface ILabel {
  value: number | string,
  label: string
}

export interface Status extends ILabel { }

export interface RuneType extends ILabel { }

export interface Tier extends ILabel {
  value: string,
  fullName: string
}

export interface Quality extends ILabel {
  fullName: string,
  upgradeLimit: number | null,
  affixLimit: number | null,
  hasAttributeTypes: Array<string>
}

export interface Rune extends ILabel {
  type: string,
  attribute: string,
  img: string
}

export interface AspectCategory extends ILabel { }

export interface Gem extends ILabel {
  quality: string,
  qualityName: string,
  level: number | null
}

export interface Elixir extends ILabel {
  elixir: string,
  gradable: boolean,
  craftable: boolean,
  onlyHardcore: boolean,
  grade: string,
  gradeName: string,
  level: number | null
}

export interface Summoning extends ILabel {
  summoningGroup?: string,
  quantity?: number
}

export interface ItemType extends ILabel {
  attribute: string,
  isCurrency: boolean,
  onlyCurrency: boolean
}

export interface EquipmentClass extends ILabel {
  type: string,
  isCurrency: boolean,
  properties: number[]
}

export interface AttributeType extends ILabel {
  sort: number,
  hasAttributes: Array<string>
}

export interface Property extends ILabel {
  type: string,
  sort?: number
}

export interface Affix extends ILabel {
  type: string,
  color?: string,
  sort?: number,
  disable: boolean
}

export interface Restriction extends ILabel {
  type: string,
  sort?: number
}

export interface Pact extends ILabel { }

export interface Award {
  ranking: number,
  good?: number,
  bad?: number,
  itemId?: number,
  items?: number,
  itemName?: string,
  itemType?: string,
  itemTypeValue1?: string,
  itemTypeValue2?: string,
  imageId?: number,
  price?: string | number | null,
  battleTag: string
}

export interface Awards {
  highPriced: Array<Award>,
  bestManners: Array<Award>,
  mostSold: Array<Award>,
  mostPurchased: Array<Award>
}

export interface AwardsPick {
  itemId: number,
  hardcore: boolean,
  ladder: boolean
}

export type OfferInfo = { itemName: string, itemId: string, price?: string }

export interface IStorage {
  hardcore: boolean,
  ladder: boolean,
  expanded: boolean,
  presets: Array<IPreset>
}

export interface IFilter {
  onlyCurrency: boolean,
  favorite: boolean,
  quality: Array<string>,
  status: string,
  mine: boolean | null,
  offered: boolean | null,
  offer: boolean | null,
  power: [number, number],
  level: [number, number],
  itemTypes: Array<string>,
  itemTypeValues1: { [key: string]: Array<number> },
  itemTypeValues2: { [key: string]: Array<number> },
  greaterCount: number,
  properties: Array<number>,
  affixes: Array<number>,
  restrictions: Array<number>,
  name: string,
  request: number,
  loading: boolean,
  fixed: boolean
}

export interface IPreset extends ILabel {
  filter: IFilter
}

export type IErrorItem = {
  itemId: string
  name: string
  message: string
  quality: string | undefined
}

export type Sort = 'date_desc' | 'price_desc' | 'price_asc'

export const useItemStore = defineStore('item', {
  state: () => ({
    storage: {
      loading: false as boolean,
      request: 0 as number,
      data: {} as IStorage
    },
    base: {
      loading: false as boolean,
      request: 0 as number
    },
    itemStatus: [] as Array<Status>,
    offerStatus: [] as Array<Status>,
    tiers: [] as Array<Tier>,
    quality: [] as Array<Quality>,
    runeTypes: [] as Array<RuneType>,
    runes: [] as Array<Rune>,
    aspectCategories: [] as Array<AspectCategory>,
    gems: [] as Array<Gem>,
    elixirs: [] as Array<Elixir>,
    summonings: [] as Array<Summoning>,
    materials: [] as Array<Summoning>,
    types: [] as Array<ItemType>,
    classes: [] as Array<EquipmentClass>,
    attributeTypes: [] as Array<AttributeType>,
    awards: 0 as number,
    awardsPick: [] as Array<AwardsPick>,
    properties: {
      data: [] as Array<Property>,
      loading: false,
      request: 0
    },
    affixes: {
      data: [] as Array<Affix>,
      loading: false,
      request: 0
    },
    restrictions: {
      data: [] as Array<Restriction>,
      loading: false,
      request: 0
    },
    pacts: {
      data: [] as Array<Pact>,
      loading: false,
      request: 0
    },
    socket: {
      newItems: 0,
      newOffer: null as OfferInfo | null,
      acceptedOffer: null as OfferInfo | null,
      retractedOffer: null as OfferInfo | null,
      turnedDownOffer: null as OfferInfo | null,
      complete: null as OfferInfo | null
    },
    sort: 'date_desc' as Sort,
    filter: {
      onlyCurrency: false,
      favorite: false,
      quality: [],
      status: '000',
      mine: false,
      offered: false,
      offer: false,
      power: [0, 9999],
      level: [0, 999],
      itemTypes: [],
      itemTypeValues1: {},
      itemTypeValues2: {},
      greaterCount: 0,
      properties: [],
      affixes: [],
      restrictions: [],
      name: '',
      request: 0,
      loading: false,
      fixed: false
    } as IFilter,
    detailItem: [] as Array<Item>,
    itemPage: {
      rows: 20 as number,
      over: false as boolean,
      more: false as boolean
    },
    analyze: {
      similarRate: {
        ko: .8,
        en: .7
      },
      lang: {
        ko: `가-힣`,
        en: `a-zA-Z`,
        ja: `ぁ-ゔァ-ヴー々〆〤`,
        zh: `一-龥`
      },
      replaces: {
        ko: [[`낮`, `낫`]],
        en: []
      }
    }
  }),
  getters: {
    findPreset: (state) => {
      return (id: number): IPreset | undefined => state.storage.data.presets.find(p => p.value === id)
    },
    findItemStatus: (state) => {
      return (statusCode?: string): Status | undefined => state.itemStatus.find(s => s.value === statusCode)
    },
    findOfferStatus: (state) => {
      return (statusCode?: string): Status | undefined => state.offerStatus.find(s => s.value === statusCode)
    },
    findTier: (state) => {
      return (id?: string | null): Tier | undefined => state.tiers.find(t => t.value === id)
    },
    findQuality: (state) => {
      return (type?: string): Quality | undefined => state.quality.find(q => q.value === type)
    },
    filterQuality: (state) => {
      return (type?: string): Array<Quality> => type ? state.quality.filter(q => q.value === type) : state.quality
    },
    findType: (state) => {
      return (type: string): ItemType | undefined => state.types.find(t => t.value === type && !t.onlyCurrency)
    },
    filterTypes: (state) => {
      return (type?: string): Array<ItemType> => type ? state.types.filter(t => t.value === type && !t.onlyCurrency) : state.types.filter(t => !t.onlyCurrency)
    },
    findClass: (state) => {
      return (className?: string): EquipmentClass | undefined => state.classes.find(c => c.value === className)
    },
    filterClasses: (state) => {
      return (type?: string): Array<EquipmentClass> => type ? state.classes.filter(c => c.type === type) : state.classes
    },
    currencies: (state) => {
      return (): Array<ILabel> => [...state.types.filter(t => t.isCurrency || t.onlyCurrency), ...state.classes.filter(c => c.isCurrency)]
    },
    findRuneType: (state) => {
      return (type?: string): RuneType | undefined => state.runeTypes.find(rt => rt.value === type)
    },
    findRune: (state) => {
      return (id: string): Rune | undefined => state.runes.find(r => r.value === id)
    },
    filterRunesByType: (state) => {
      return (type?: string): Array<Rune> => type ? state.runes.filter(r => r.type === type) : state.runes
    },
    filterAttributeTypes: (state) => {
      return (attribute?: string): Array<AttributeType> => attribute ? state.attributeTypes.filter(at => at.hasAttributes.includes(attribute)) : state.attributeTypes
    },
    filterProperties: (state) => {
      return (word?: string): Array<Property> => word ? state.properties.data.filter(p => p.label.toLowerCase().indexOf(word.toLowerCase()) !== -1) : state.properties.data
    },
    filterAffixes: (state) => {
      return (word?: string): Array<Affix> => word ? state.affixes.data.filter(a => a.label.toLowerCase().indexOf(word.toLowerCase()) !== -1) : state.affixes.data
    },
    availableAffixes: (state) => {
      return (): Array<Affix> => state.affixes.data.filter((a: Affix) => !a.disable)
    },
    filterRestrictions: (state) => {
      return (word?: string): Array<Restriction> => word ? state.restrictions.data.filter(r => r.label.toLowerCase().indexOf(word.toLowerCase()) !== -1) : state.restrictions.data
    },
    findProperty: (state) => {
      return (propertyId: number): Property | undefined => state.properties.data.find(p => p.value === propertyId)
    },
    findAffix: (state) => {
      return (affixId: number): Affix | undefined => state.affixes.data.find(a => a.value === affixId)
    },
    findRestriction: (state) => {
      return (restrictId: number): Restriction | undefined => state.restrictions.data.find(r => r.value === restrictId)
    },
    matchAffixes: (state) => {
      return (type: string, attribute: string): boolean => type && attribute ? state.affixes.data.filter(a => a.type === type && a.label.trim() === attribute).length > 0 : false
    },
    filterMaterials: (state) => {
      return (summoning: string): Array<Summoning> => summoning ? state.materials.filter(m => m.summoningGroup === summoning) : []
    },
    needExpand: (state) => {
      return !(
        state.filter.greaterCount === 0 &&
        state.filter.properties.length === 0 &&
        state.filter.affixes.length === 0 &&
        state.filter.restrictions.length === 0)
    },
    showRewardItem: (state) => {
      return !(
        state.filter.onlyCurrency === true ||
        state.filter.favorite === true ||
        state.filter.quality.length > 0 ||
        state.filter.status !== '000' ||
        state.filter.mine === true ||
        state.filter.offered === true ||
        state.filter.offer === true ||
        state.filter.power[0] > 0 ||
        state.filter.power[1] < 9999 ||
        state.filter.level[0] > 0 ||
        state.filter.level[1] < 999 ||
        state.filter.itemTypes.length > 0 ||
        state.filter.greaterCount > 0 ||
        state.filter.properties.length > 0 ||
        state.filter.affixes.length > 0 ||
        state.filter.restrictions.length > 0 ||
        state.filter.name !== '')
    }
  },
  actions: {
    clearSocket() {
      this.socket.newItems = 0
      this.socket.newOffer = null
      this.socket.acceptedOffer = null
      this.socket.retractedOffer = null
      this.socket.turnedDownOffer = null
      this.socket.complete = null
    },
    clearFilter(isForced: boolean = false) {
      if (isForced || !this.filter.fixed) {
        this.filter.onlyCurrency = false
        this.filter.favorite = false
        this.filter.quality = []
        this.filter.status = '000'
        this.filter.mine = false
        this.filter.offered = false
        this.filter.offer = false
        this.filter.power = [0, 9999]
        this.filter.level = [0, 999]
        this.filter.itemTypes = []
        this.filter.itemTypeValues1 = {}
        this.filter.itemTypeValues2 = {}
        this.filter.greaterCount = 0
        this.filter.properties = []
        this.filter.affixes = []
        this.filter.restrictions = []
        this.filter.name = ''
        this.filter.request = 0
        this.filter.loading = false
      }
    },
    getStorage(isForced: boolean = false) {
      return new Promise<void>((resolve, reject) => {
        let error: unknown = null
        if (this.storage.request === 0 || isForced) {
          this.storage.request++
          api.get('/d4/account/storage')
            .then((response) => {
              this.storage.data = response.data
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.storage.loading = false

              if (error)
                reject()
              else
                resolve()
            })
        }
        else
          resolve()
      })
    },
    setStorage() {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/account/storage/update', { hardcore: this.storage.data.hardcore, ladder: this.storage.data.ladder, expanded: this.storage.data.expanded })
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    getBase() {
      return new Promise<void>((resolve, reject) => {
        let error: unknown = null
        if (this.base.request === 0) {
          this.base.request++
          this.base.loading = true
          api.get('/d4/item/base')
            .then((response) => {
              this.itemStatus = response.data.itemStatus
              this.offerStatus = response.data.offerStatus
              this.tiers = response.data.tiers
              this.quality = response.data.quality
              this.runeTypes = response.data.runeTypes
              this.runes = response.data.runes
              this.aspectCategories = response.data.aspectCategories
              this.gems = response.data.gems
              this.elixirs = response.data.elixirs
              this.summonings = response.data.summonings
              this.materials = response.data.materials
              this.types = response.data.types
              this.classes = response.data.classes
              this.attributeTypes = response.data.attributeTypes
              this.awards = response.data.awards
              this.awardsPick = response.data.awardsPick
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.base.loading = false

              if (error)
                reject()
              else
                resolve()
            })
        }
        else
          resolve()
      })
    },
    getProperties() {
      return new Promise<void>((resolve, reject) => {
        let error: unknown = null
        if (this.properties.request === 0) {
          this.properties.request++
          this.properties.loading = true
          api.get('/d4/item/properties')
            .then((response) => {
              this.properties.data = response.data
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.properties.loading = false

              if (error)
                reject()
              else
                resolve()
            })
        }
        else
          resolve()
      })
    },
    getAffixes() {
      return new Promise<void>((resolve, reject) => {
        let error: unknown = null
        if (this.affixes.request === 0) {
          this.affixes.request++
          this.affixes.loading = true
          api.get('/d4/item/affixes')
            .then((response) => {
              this.affixes.data = response.data
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.affixes.loading = false

              if (error)
                reject()
              else
                resolve()
            })
        }
        else
          resolve()
      })
    },
    getRestrictions() {
      return new Promise<void>((resolve, reject) => {
        let error: unknown = null
        if (this.restrictions.request === 0) {
          this.restrictions.request++
          this.restrictions.loading = true
          api.get('/d4/item/restrictions')
            .then((response) => {
              this.restrictions.data = response.data
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.restrictions.loading = false

              if (error)
                reject()
              else
                resolve()
            })
        }
        else
          resolve()
      })
    },
    getPacts() {
      return new Promise<void>((resolve, reject) => {
        let error: unknown = null
        if (this.pacts.request === 0) {
          this.pacts.request++
          this.pacts.loading = true
          api.get('/d4/item/pacts')
            .then((response) => {
              this.pacts.data = response.data
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.pacts.loading = false

              if (error)
                reject()
              else
                resolve()
            })
        }
        else
          resolve()
      })
    },
    getItems(page: number, itemId?: string | string[]) {
      return new Promise<Array<Item>>((resolve, reject) => {
        api.post('/d4/item', { page, rows: this.itemPage.rows, itemId, basicFilter: { hardcore: this.storage.data.hardcore, ladder: this.storage.data.ladder }, filter: this.filter, sort: this.sort })
          .then((response) => {
            if (!itemId) {
              this.itemPage.over = page > 1
              this.itemPage.more = response.data.length > this.itemPage.rows
              response.data.splice(this.itemPage.rows, 1)
            }
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    addAttribute(category: string | null, attribute: Property | Affix | Restriction) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/attribute', { category: category, attribute: attribute })
          .then(() => {
            resolve()
          })
          .catch((e) => { reject(e) })
      })
    },
    addItem(item: Item) {
      return new Promise<Item>((resolve, reject) => {
        api.post('/d4/item/add', { item })
          .then((response) => {
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    updateItem(item: Item) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/update', { item })
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    relistItem(itemId: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/relist', { itemId })
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    relistItems(itemIds: Array<string>) {
      return new Promise<Array<IErrorItem>>((resolve, reject) => {
        api.post('/d4/item/relist/batch', { itemIds })
          .then((response) => {
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    statusItem(itemId: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/status', { itemId: itemId })
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    statusItems(itemIds: Array<string>, status: string) {
      return new Promise<Array<IErrorItem>>((resolve, reject) => {
        api.post('/d4/item/status/batch', { itemIds, status })
          .then((response) => {
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    reRegisterItem(itemId: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/reregister', { itemId })
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    reRegisterItems(itemIds: Array<string>) {
      return new Promise<Array<IErrorItem>>((resolve, reject) => {
        api.post('/d4/item/reregister/batch', { itemIds })
          .then((response) => {
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    deleteItem(itemId: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/delete', { itemId: itemId })
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    deleteItems(itemIds: Array<string>) {
      return new Promise<Array<IErrorItem>>((resolve, reject) => {
        api.post('/d4/item/delete/batch', { itemIds })
          .then((response) => {
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    getOffers(itemId: string, offerId?: string) {
      return new Promise<Array<Offer>>((resolve, reject) => {
        api.get('/d4/item/offer', { params: { itemId, offerId } })
          .then((response) => {
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    makeOffer(offer: Offer) {
      return new Promise<Offer>((resolve, reject) => {
        api.post('/d4/item/offer/make', { offer })
          .then((response) => {
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    acceptOffer(offer: Offer) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/offer/accept', { offer })
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    retractOffer(offerId: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/offer/retract', { offerId })
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    turnDownOffer(offerId: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/offer/turndown', { offerId })
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    addEvaluations(itemId: string, evaluations: Array<number>) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/evaluations/add', { itemId, evaluations })
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    favorite(itemId: string, favorite: boolean) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/favorite', { itemId, favorite })
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    getAwards() {
      return new Promise<Awards>((resolve, reject) => {
        api.get('/d4/awards')
          .then((response) => {
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    addPreset(name: string) {
      return new Promise<number>((resolve, reject) => {
        const cloneFilter = JSON.parse(JSON.stringify(this.filter))
        delete cloneFilter.request
        delete cloneFilter.loading
        delete cloneFilter.fixed

        api.post('/d4/account/preset/add', { name, preset: cloneFilter })
          .then((response) => {
            this.storage.data.presets.push({ value: response.data, label: name, filter: cloneFilter })
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    removePreset(id: number) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/account/preset/remove', { id })
          .then(() => {
            const presetIndex = this.storage.data.presets.findIndex((p: IPreset) => p.value === id)

            if (presetIndex !== -1)
              this.storage.data.presets.splice(presetIndex, 1)

            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    async recognize(image: ImageLike, lang: string) {
      const locale = (lang === 'ko') ? 'kor' : 'eng'
      const worker = await createWorker(locale)
      // const worker = await createWorker(locale, 1, {
      //   workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.1.0/dist/worker.min.js',
      //   langPath: 'https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_best/kor.traineddata.gz',
      //   corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.1.0',
      // })
      await worker.setParameters({
        preserve_interword_spaces: '1'
      })
      const { data: { text } } = await worker.recognize(image)
      await worker.terminate()

      const parsedText = text.replace(new RegExp(`[^0-9${this.analyze.lang[lang as keyof typeof this.analyze.lang]}\\/\\+\\.\\[\\]\\-\\,\\:\\n\\(\\) ]`, 'gi'), '').replace(/[ ]{2,}/gi, ' ')
      return parsedText
    }
  }
})