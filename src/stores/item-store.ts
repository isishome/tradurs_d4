import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { i18n } from 'boot/i18n'
import { runeImgs } from 'src/common/runes'
import { Item, Offer, type Power as IPower, type Property as IProperty, type Affix as IAffix } from 'src/types/item'

interface ILabel {
  value: number | string,
  label: string,
  lang?: string
}

export interface Status extends ILabel { }

export interface Quality extends ILabel { }

export interface RuneType extends ILabel { }

export interface Rune extends ILabel {
  type: string,
  attribute: string,
  img: string
}

export interface ItemType extends ILabel {
  attribute: string,
  hasPowers: boolean,
  hasProperties: boolean,
  hasAffixes: boolean,
  isCurrency: boolean
}

export interface EquipmentClass extends ILabel {
  type: string
}

export interface AttributeType extends ILabel {
  sort: number
}

export interface Power extends ILabel {
  type: string,
  sort?: number
}

export interface Property extends ILabel {
  type: string,
  sort?: number
}

export interface Affix extends ILabel {
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
    types: [] as Array<ItemType>,
    classes: [] as Array<EquipmentClass>,
    attributeTypes: [] as Array<AttributeType>,
    powers: {
      data: [] as Array<Power>,
      loading: false,
      request: 0
    },
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
    socket: {
      newItems: 0,
      newOffer: null as string | null,
      acceptedOffer: null as { itemName: string, itemId: string } | null
    }
  }),
  getters: {
    findItemStatus: (state) => {
      return (statusCode?: string): Status | undefined => state.itemStatus.find(s => s.value === statusCode && s.lang === i18n.global.locale.value)
    },
    findOfferStatus: (state) => {
      return (statusCode?: string): Status | undefined => state.offerStatus.find(s => s.value === statusCode && s.lang === i18n.global.locale.value)
    },
    filterQuality: (state) => {
      return (type?: string): Array<Quality> => type ? state.quality.filter(q => q.value === type && q.lang === i18n.global.locale.value) : state.quality.filter(q => q.lang === i18n.global.locale.value)
    },
    filterClasses: (state) => {
      return (type?: string): Array<EquipmentClass> => type ? state.classes.filter(c => c.type === type && c.lang === i18n.global.locale.value) : state.classes.filter(c => c.lang === i18n.global.locale.value)
    },
    findType: (state) => {
      return (type: string): ItemType | undefined => state.types.find(t => t.value === type && t.lang === i18n.global.locale.value)
    },
    filterTypes: (state) => {
      return (type?: string): Array<ItemType> => type ? state.types.filter(t => t.value === type && t.lang === i18n.global.locale.value) : state.types.filter(t => t.lang === i18n.global.locale.value)
    },
    currencies: (state) => {
      return (): Array<ILabel> => state.types.filter(t => t.isCurrency && t.lang === i18n.global.locale.value)
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
      return (type?: string): Array<AttributeType> => type ? state.attributeTypes.filter(at => at.value === type && at.lang === i18n.global.locale.value) : state.attributeTypes.filter(at => at.lang === i18n.global.locale.value)
    },
    filterPowers: (state) => {
      return (word?: string): Array<Power> => word ? state.powers.data.filter(p => p.label.toLowerCase().indexOf(word.toLowerCase()) !== -1) : state.powers.data
    },
    filterProperties: (state) => {
      return (word?: string): Array<Property> => word ? state.properties.data.filter(p => p.label.toLowerCase().indexOf(word.toLowerCase()) !== -1) : state.properties.data
    },
    filterAffixes: (state) => {
      return (word?: string): Array<Affix> => word ? state.affixes.data.filter(a => a.label.toLowerCase().indexOf(word.toLowerCase()) !== -1) : state.affixes.data
    },
    matchPowers: (state) => {
      return (attribute: string): boolean => attribute ? state.powers.data.filter(p => p.label.trim() === attribute).length > 0 : false
    },
    matchProperties: (state) => {
      return (attribute: string): boolean => attribute ? state.properties.data.filter(p => p.label.trim() === attribute).length > 0 : false
    },
    matchAffixes: (state) => {
      return (attribute: string): boolean => attribute ? state.affixes.data.filter(a => a.label.trim() === attribute).length > 0 : false
    }
  },
  actions: {
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
    getPowers() {
      return new Promise<void>((resolve, reject) => {
        let error: unknown = null
        if (this.powers.request === 0) {
          this.powers.loading = true
          api.get('/d4/item/powers')
            .then((response) => {
              this.powers.data = response.data
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              this.powers.loading = false
              this.powers.request++

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
    getItems(itemId: string | string[] | undefined) {
      return new Promise<Array<Item>>((resolve, reject) => {
        api.get('/d4/item', { params: { itemId: itemId } })
          .then((response) => {
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    addAttribute(category: string | null, attribute: Power | Property | Affix) {
      return new Promise<Power | Property | Affix>((resolve, reject) => {
        api.post('/d4/item/attribute', { category: category, attribute: attribute })
          .then((response) => {
            if (response.data.length) {
              attribute.value = response.data[0].value
              attribute.sort = response.data[0].sort
              const target = category === 'powers' ? this.powers : category === 'properties' ? this.properties : category === 'affixes' ? this.affixes : undefined
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
          .then((response) => {
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
          .then((response) => {
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
          .then(() => {
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
          .then(() => {
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
          .then(() => {
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
    acceptOffer(offerId: string) {
      return new Promise<void>((resolve, reject) => {
        api.post('/d4/item/offer/accept', { offerId })
          .then(() => {
            resolve()
          })
          .catch((e) => {
            reject(e)
          })
      })
    }
  }
})