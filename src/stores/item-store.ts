import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { i18n } from 'boot/i18n'
import { createWorker, ImageLike } from 'tesseract.js'
import { Item, Offer } from 'src/types/item'
import { sleep } from 'src/common'

export interface ILabel {
  value: number | string,
  label: string,
  lang?: string
}

export interface Status extends ILabel { }

export interface RuneType extends ILabel { }

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
  qualityName: string
}

export interface ItemType extends ILabel {
  attribute: string,
  isCurrency: boolean,
  onlyCurrency: boolean
}

export interface EquipmentClass extends ILabel {
  type: string,
  properties: number[]
}

export interface AttributeType extends ILabel {
  sort: number,
  hasAttributes: Array<string>
}

export interface Property extends ILabel {
  type: string,
  sort?: number,
  lang: string
}

export interface Affix extends ILabel {
  type: string,
  sort?: number
}

export interface Restriction extends ILabel {
  type: string,
  sort?: number
}

export const useItemStore = defineStore('item', {
  state: () => ({
    base: {
      loading: false as boolean,
      request: 0 as number
    },
    itemStatus: [] as Array<Status>,
    offerStatus: [] as Array<Status>,
    quality: [] as Array<Quality>,
    runeTypes: [] as Array<RuneType>,
    runes: [] as Array<Rune>,
    aspectCategories: [] as Array<AspectCategory>,
    gems: [] as Array<Gem>,
    types: [] as Array<ItemType>,
    classes: [] as Array<EquipmentClass>,
    attributeTypes: [] as Array<AttributeType>,
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
    socket: {
      newItems: 0,
      newOffer: null as string | null,
      acceptedOffer: null as { itemName: string, itemId: string } | null,
      complete: null as { itemName: string, itemId: string } | null
    },
    filter: {
      favorite: false as boolean,
      quality: [] as Array<string>,
      hardcore: null as boolean | null,
      ladder: null as boolean | null,
      available: false as boolean | null,
      onlyCurrency: false as boolean | null,
      mine: false as boolean | null,
      offer: false as boolean | null,
      power: [0, 9999] as [number, number],
      level: [0, 999] as [number, number],
      itemTypes: [] as Array<string>,
      itemTypeValues1: {} as { [key: string]: Array<number> },
      itemTypeValues2: {} as { [key: string]: Array<number> },
      properties: [] as Array<number>,
      affixes: [] as Array<number>,
      restrictions: [],
      name: '' as string,
      request: 0,
      loading: false
    },
    detailItem: [] as Array<Item>,
    page: {
      rows: 30 as number,
      over: false as boolean,
      more: false as boolean
    },
    analyze: {
      lang: `가-힣ぁ-ゔァ-ヴー々〆〤一-龥a-zA-Z`
    }
  }),
  getters: {
    findItemStatus: (state) => {
      return (statusCode?: string): Status | undefined => state.itemStatus.find(s => s.value === statusCode && s.lang === i18n.global.locale.value)
    },
    findOfferStatus: (state) => {
      return (statusCode?: string): Status | undefined => state.offerStatus.find(s => s.value === statusCode && s.lang === i18n.global.locale.value)
    },
    findQuality: (state) => {
      return (type?: string): Quality | undefined => state.quality.find(q => q.value === type && q.lang === i18n.global.locale.value)
    },
    filterQuality: (state) => {
      return (type?: string): Array<Quality> => type ? state.quality.filter(q => q.value === type && q.lang === i18n.global.locale.value) : state.quality.filter(q => q.lang === i18n.global.locale.value)
    },
    findClass: (state) => {
      return (className?: string): EquipmentClass | undefined => state.classes.find(c => c.value === className && c.lang === i18n.global.locale.value)
    },
    filterClasses: (state) => {
      return (type?: string): Array<EquipmentClass> => type ? state.classes.filter(c => c.type === type && c.lang === i18n.global.locale.value) : state.classes.filter(c => c.lang === i18n.global.locale.value)
    },
    findType: (state) => {
      return (type: string): ItemType | undefined => state.types.find(t => t.value === type && !t.onlyCurrency && t.lang === i18n.global.locale.value)
    },
    filterTypes: (state) => {
      return (type?: string): Array<ItemType> => type ? state.types.filter(t => t.value === type && !t.onlyCurrency && t.lang === i18n.global.locale.value) : state.types.filter(t => !t.onlyCurrency && t.lang === i18n.global.locale.value)
    },
    currencies: (state) => {
      return (): Array<ILabel> => state.types.filter(t => (t.isCurrency || t.onlyCurrency) && t.lang === i18n.global.locale.value)
    },
    findRuneType: (state) => {
      return (type?: string): RuneType | undefined => state.runeTypes.find(rt => rt.value === type && rt.lang === i18n.global.locale.value)
    },
    filterRunesByType: (state) => {
      return (type?: string): Array<Rune> => type ? state.runes.filter(r => r.type === type && r.lang === i18n.global.locale.value) : state.runes.filter(r => r.lang === i18n.global.locale.value)
    },
    findRune: (state) => {
      return (id: string): Rune | undefined => state.runes.find(r => r.value === id && r.lang === i18n.global.locale.value)
    },
    filterAspectCategories: (state) => {
      return (): Array<AspectCategory> => state.aspectCategories.filter(ac => ac.lang === i18n.global.locale.value)
    },
    filterGems: (state) => {
      return (): Array<Gem> => state.gems.filter(g => g.lang === i18n.global.locale.value)
    },
    filterAttributeTypes: (state) => {
      return (attribute?: string): Array<AttributeType> => attribute ? state.attributeTypes.filter(at => at.hasAttributes.includes(attribute) && at.lang === i18n.global.locale.value) : state.attributeTypes.filter(at => at.lang === i18n.global.locale.value)
    },
    filterProperties: (state) => {
      return (word?: string): Array<Property> => word ? state.properties.data.filter(p => p.label.toLowerCase().indexOf(word.toLowerCase()) !== -1 && p.lang === i18n.global.locale.value) : state.properties.data.filter(p => p.lang === i18n.global.locale.value)
    },
    filterAffixes: (state) => {
      return (word?: string): Array<Affix> => word ? state.affixes.data.filter(a => a.label.toLowerCase().indexOf(word.toLowerCase()) !== -1) : state.affixes.data
    },
    filterRestrictions: (state) => {
      return (word?: string): Array<Restriction> => word ? state.restrictions.data.filter(r => r.label.toLowerCase().indexOf(word.toLowerCase()) !== -1) : state.restrictions.data
    },
    findProperty: (state) => {
      return (propertyId: number): Property | undefined => state.properties.data.find(p => p.value === propertyId && p.lang === i18n.global.locale.value)
    },
    findAffix: (state) => {
      return (affixId: number): Affix | undefined => state.affixes.data.find(a => a.value === affixId)
    },
    findRestriction: (state) => {
      return (restrictId: number): Restriction | undefined => state.restrictions.data.find(r => r.value === restrictId)
    },
    matchProperties: (state) => {
      return (type: string, attribute: string): boolean => type && attribute ? state.properties.data.filter(p => p.type === type && p.label.trim() === attribute).length > 0 : false
    },
    matchAffixes: (state) => {
      return (type: string, attribute: string): boolean => type && attribute ? state.affixes.data.filter(a => a.type === type && a.label.trim() === attribute).length > 0 : false
    },
    matchRestrictions: (state) => {
      return (type: string, attribute: string): boolean => type && attribute ? state.restrictions.data.filter(r => r.type === type && r.label.trim() === attribute).length > 0 : false
    }
  },
  actions: {
    clearSocket() {
      this.socket.newItems = 0
      this.socket.newOffer = null
      this.socket.acceptedOffer = null
      this.socket.complete = null
    },
    clearFilter() {
      this.filter.favorite = false
      this.filter.quality = []
      this.filter.hardcore = null
      this.filter.ladder = null
      this.filter.available = false
      this.filter.onlyCurrency = false
      this.filter.mine = false
      this.filter.offer = false
      this.filter.power = [0, 9999]
      this.filter.level = [0, 999]
      this.filter.itemTypes = []
      this.filter.itemTypeValues1 = {}
      this.filter.itemTypeValues2 = {}
      this.filter.properties = []
      this.filter.affixes = []
      this.filter.restrictions = []
      this.filter.name = ''
      this.filter.request = 0
      this.filter.loading = false
    },
    getBase() {
      return new Promise<void>((resolve, reject) => {
        let error: unknown = null
        if (this.base.request === 0) {
          this.base.loading = true
          api.get('/d4/item/base')
            .then((response) => {
              this.itemStatus = response.data.itemStatus
              this.offerStatus = response.data.offerStatus
              this.quality = response.data.quality
              this.runeTypes = response.data.runeTypes
              this.runes = response.data.runes
              this.aspectCategories = response.data.aspectCategories
              this.gems = response.data.gems
              this.types = response.data.types
              this.classes = response.data.classes
              this.attributeTypes = response.data.attributeTypes
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.base.loading = false
              this.base.request++

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
              this.properties.request++

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
              this.affixes.request++

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
              this.restrictions.request++

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
    getItems(page: number, itemId?: string | string[], filter?: any) {
      return new Promise<Array<Item>>((resolve, reject) => {
        api.post('/d4/item', { page, rows: this.page.rows, itemId, filter })
          .then(async (response) => {
            await sleep(1000)
            this.page.over = page > 1
            this.page.more = response.data.length > this.page.rows
            response.data.splice(this.page.rows, 1)
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    addAttribute(category: string | null, attribute: Property | Affix | Restriction) {
      return new Promise<Property | Affix | Restriction>((resolve, reject) => {
        api.post('/d4/item/attribute', { category: category, attribute: attribute })
          .then(async (response) => {
            if (response.data.length) {
              attribute.value = response.data[0].value
              attribute.sort = response.data[0].sort
              const target = category === 'properties' ? this.properties : category === 'affixes' ? this.affixes : category === 'restrictions' ? this.restrictions : undefined
              if (target?.data.filter(p => p.value === attribute.value).length === 0)
                target?.data.push(attribute)

              resolve(attribute)
            }
            else
              reject()
          })
          .catch((e) => { reject(e) })
      })
    },
    addItem(item: Item) {
      return new Promise<Item>((resolve, reject) => {
        api.post('/d4/item/add', { item })
          .then(async (response) => {
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    updateItem(item: Item) {
      return new Promise<Item>((resolve, reject) => {
        api.post('/d4/item/update', { item })
          .then(async (response) => {
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    relistItem(itemId: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/relist', { itemId: itemId })
          .then(async () => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    deleteItem(itemId: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/delete', { itemId: itemId })
          .then(async () => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    statusItem(itemId: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/status', { itemId: itemId })
          .then(async () => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    getOffers(itemId: string, offerId?: string) {
      return new Promise<Array<Offer>>((resolve, reject) => {
        api.get('/d4/item/offer', { params: { itemId, offerId } })
          .then(async (response) => {
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
          .then(async (response) => {
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
          .then(async () => {
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
          .then(async () => {
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
          .then(async () => {
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
          .then(async () => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    async recognize(image: ImageLike) {
      const worker = await createWorker()

      await worker.loadLanguage('eng+kor')
      await worker.initialize('eng+kor')
      await worker.setParameters({
        preserve_interword_spaces: '1'
      })
      const { data: { text } } = await worker.recognize(image)
      await worker.terminate()
      const parsedText = text.replace(new RegExp(`[^0-9${this.analyze.lang}\/\%\+\.\[\]\-\,\:\n ]`, 'gi'), '').replace(/[ ]{2,}/gi, ' ')
      return parsedText
    }
  }
})