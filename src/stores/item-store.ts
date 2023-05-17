import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { runeImgs } from 'src/common/runes'
import { Item, type Power as IPower, type Property as IProperty, type Affix as IAffix } from 'src/types/item'

interface ILabel {
  value: number | string,
  label: string
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
    status: [] as Array<Status>,
    quality: [] as Array<Quality>,
    runeTypes: [] as Array<RuneType>,
    runes: [] as Array<Rune>,
    types: [] as Array<ItemType>,
    currencies: [] as Array<ItemType>,
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
    }
  }),
  getters: {
    findStatus: (state) => {
      return (statusCode?: string): Status | undefined => state.status.find(s => s.value === statusCode)
    },
    filterClasses: (state) => {
      return (type?: string): Array<EquipmentClass> => type ? state.classes.filter(c => c.type === type) : state.classes
    },
    findType: (state) => {
      return (type: string): ItemType | undefined => state.types.find(t => t.value === type)
    },
    filterRunes: (state) => {
      return (type?: string): Array<Rune> => type ? state.runes.filter(r => r.type === type) : state.runes
    },
    findRune: (state) => {
      return (id: string): Rune | undefined => state.runes.find(r => r.value === id)
    },
    filterPowers: (state) => {
      return (word: string | null): Array<Power> => word ? state.powers.data.filter(p => p.label.indexOf(word) !== -1) : state.powers.data
    },
    filterProperties: (state) => {
      return (word: string | null): Array<Property> => word ? state.properties.data.filter(p => p.label.indexOf(word) !== -1) : state.properties.data
    },
    filterAffixes: (state) => {
      return (word: string | null): Array<Affix> => word ? state.affixes.data.filter(a => a.label.indexOf(word) !== -1) : state.affixes.data
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
              this.status = response.data.status
              this.quality = response.data.quality
              this.runeTypes = response.data.runeTypes
              this.runes = response.data.runes.map((r: Rune) => ({ ...r, img: runeImgs[r.value as keyof typeof runeImgs] }))
              this.types = response.data.types
              this.currencies = [{ value: 'offer', label: '제안 받기' }, ...response.data.types.filter((t: ItemType) => t.isCurrency)]
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
        api.post('/d4/item/add', { item: item })
          .then((response) => {
            delete response.data.expanded
            response.data.powers = (response.data.powers as Array<IPower>).filter((pw: IPower) => pw.action !== 8).map(({ action, ...pw }) => pw)
            response.data.properties = (response.data.properties as Array<IProperty>).filter((p: IProperty) => p.action !== 8).map(({ action, ...p }) => p)
            response.data.affixes = (response.data.affixes as Array<IAffix>).filter((a: IAffix) => a.action !== 8).map(({ action, ...a }) => a)
            resolve(response.data)
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    updateItem(item: Item) {
      return new Promise<Item>((resolve, reject) => {
        api.post('/d4/item/update', { item: item })
          .then((response) => {
            delete response.data.expanded
            delete response.data.action
            response.data.powers = (response.data.powers as Array<IPower>).filter((pw: IPower) => pw.action !== 8).map(({ action, ...pw }) => pw)
            response.data.properties = (response.data.properties as Array<IProperty>).filter((p: IProperty) => p.action !== 8).map(({ action, ...p }) => p)
            response.data.affixes = (response.data.affixes as Array<IAffix>).filter((a: IAffix) => a.action !== 8).map(({ action, ...a }) => a)
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
    }
  }
})