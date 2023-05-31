import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { i18n } from 'boot/i18n'
import { runeImgs } from 'src/common/runes'
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
  upgradeLimit: number | null,
  affixLimit: number | null
}

export interface Rune extends ILabel {
  type: string,
  attribute: string,
  img: string
}

export interface ItemType extends ILabel {
  attribute: string,
  hasProperties: boolean,
  hasAffixes: boolean,
  isCurrency: boolean,
  onlyCurrency: boolean
}

export interface EquipmentClass extends ILabel {
  type: string
}

export interface AttributeType extends ILabel {
  sort: number,
  forAffixes: boolean
}

export interface Property extends ILabel {
  type: string,
  sort?: number
}

export interface Affix extends ILabel {
  type: string,
  sort?: number
}

export interface Restriction extends ILabel {
  type: string,
  sort?: number
}

const timeout = 0

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
      quality: [] as Array<string>,
      hardcore: null as boolean | null,
      ladder: null as boolean | null,
      itemTypes: [] as Array<string>,
      equipmentClasses: {} as { [key: string]: Array<number> },
      name: '' as string,
      request: 0,
      loading: false
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
      return (type?: string): Quality | undefined => type ? state.quality.find(q => q.value === type && q.lang === i18n.global.locale.value) : state.quality.find(q => q.lang === i18n.global.locale.value)
    },
    filterQuality: (state) => {
      return (type?: string): Array<Quality> => type ? state.quality.filter(q => q.value === type && q.lang === i18n.global.locale.value) : state.quality.filter(q => q.lang === i18n.global.locale.value)
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
    filterRunes: (state) => {
      return (type?: string): Array<Rune> => type ? state.runes.filter(r => r.type === type && r.lang === i18n.global.locale.value) : state.runes.filter(r => r.lang === i18n.global.locale.value)
    },
    findRune: (state) => {
      return (id: string): Rune | undefined => state.runes.find(r => r.value === id && r.lang === i18n.global.locale.value)
    },
    filterAttributeTypes: (state) => {
      return (attribute?: string): Array<AttributeType> => attribute === 'restrictions' ? [] : attribute !== 'affixes' ? state.attributeTypes.filter(at => !at.forAffixes && at.lang === i18n.global.locale.value) : state.attributeTypes.filter(at => at.lang === i18n.global.locale.value)
    },
    filterProperties: (state) => {
      return (word?: string): Array<Property> => word ? state.properties.data.filter(p => p.label.toLowerCase().indexOf(word.toLowerCase()) !== -1) : state.properties.data
    },
    filterAffixes: (state) => {
      return (word?: string): Array<Affix> => word ? state.affixes.data.filter(a => a.label.toLowerCase().indexOf(word.toLowerCase()) !== -1) : state.affixes.data
    },
    filterRestrictions: (state) => {
      return (word?: string): Array<Restriction> => word ? state.restrictions.data.filter(a => a.label.toLowerCase().indexOf(word.toLowerCase()) !== -1) : state.restrictions.data
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
    matchProperties: (state) => {
      return (attribute: string): boolean => attribute ? state.properties.data.filter(p => p.label.trim() === attribute).length > 0 : false
    },
    matchAffixes: (state) => {
      return (attribute: string): boolean => attribute ? state.affixes.data.filter(a => a.label.trim() === attribute).length > 0 : false
    },
    matchRestrictions: (state) => {
      return (attribute: string): boolean => attribute ? state.restrictions.data.filter(r => r.label.trim() === attribute).length > 0 : false
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
      this.filter.quality = []
      this.filter.hardcore = null
      this.filter.ladder = null
      this.filter.itemTypes = []
      this.filter.equipmentClasses = {}
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
              this.runes = response.data.runes.map((r: Rune) => ({ ...r, img: runeImgs[r.value as keyof typeof runeImgs] }))
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
    getItems(itemId?: string | string[], filter?: any) {
      return new Promise<Array<Item>>((resolve, reject) => {
        api.get('/d4/item', { params: { itemId: itemId, filter } })
          .then(async (response) => {
            await sleep(timeout)
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
            await sleep(timeout)
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
            await sleep(timeout)
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
            await sleep(timeout)
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
            await sleep(timeout)
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
            await sleep(timeout)
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
            await sleep(timeout)
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
            await sleep(timeout)
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
            await sleep(timeout)
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    acceptOffer(offerId: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/offer/accept', { offerId })
          .then(async () => {
            await sleep(timeout)
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
            await sleep(timeout)
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    }
  }
})