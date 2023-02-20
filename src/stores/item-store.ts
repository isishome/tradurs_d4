import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import PhraseGen from 'korean-random-words'
import { runeImgs } from 'src/common/runes'

export interface Quality {
  value: string,
  label: string
}

export interface RuneType {
  value: string,
  label: string
}

interface Rune {
  value: string,
  type: string,
  label: string,
  attribute: string,
  img: string
}

export interface ItemType {
  value: string,
  label: string,
  attribute: string,
  hasProperties: boolean,
  hasAffixes: boolean,
  isCurrency: boolean
}

export interface EquipmentClass {
  value: string,
  label: string,
  type: string
}

export interface AttributeType {
  value: string,
  label: string,
  sort: number
}

export interface Property {
  value: number,
  type: string,
  label: string,
  sort?: number
}

export interface Affix {
  value: number,
  type: string,
  label: string,
  sort?: number
}

export const useItemStore = defineStore('item', {
  state: () => ({
    base: {
      loading: false as boolean,
      request: 0 as number
    },
    quality: [] as Array<Quality>,
    runeTypes: [] as Array<RuneType>,
    runes: [] as Array<Rune>,
    types: [] as Array<ItemType>,
    currencies: [] as Array<ItemType>,
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
    }
  }),
  getters: {
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
    filterProperties: (state) => {
      return (word: string | null): Array<Property> => word ? state.properties.data.filter(p => p.label.indexOf(word) !== -1) : state.properties.data
    },
    filterAffixes: (state) => {
      return (word: string | null): Array<Affix> => word ? state.affixes.data.filter(a => a.label.indexOf(word) !== -1) : state.affixes.data
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
    getProperties() {
      return new Promise<void>((resolve) => {
        //let error: unknown = null
        if (this.properties.request === 0) {
          this.properties.loading = true
          const phraseGen = new PhraseGen({
            delimiter: ' {x} '
          })
          setTimeout(() => {
            this.properties.data = Array.from({ length: 200 }, (_, i) => ({
              value: i + 1,
              label: phraseGen.generatePhrase(),
              type: this.attributeTypes.filter(at => at.value !== 'socket').map(at => at.value)[Math.floor(Math.random() * (this.attributeTypes.length - 1))],
              sort: i + 1
            }))
            this.properties.request++
            this.properties.loading = false
            resolve()
          }, 200)
        }
        else
          resolve()
      })
    },
    getAffixes() {
      return new Promise<void>((resolve) => {
        //let error: unknown = null
        if (this.affixes.request === 0) {
          this.affixes.loading = true
          const phraseGen = new PhraseGen({
            delimiter: ' {x} '
          })
          setTimeout(() => {
            this.affixes.data = Array.from({ length: 200 }, (_, i) => ({
              value: i + 1,
              label: phraseGen.generatePhrase(),
              type: this.attributeTypes.map(at => at.value)[Math.floor(Math.random() * this.attributeTypes.length)],
              sort: i + 1
            }))
            this.affixes.request++
            this.affixes.loading = false
            resolve()
          }, 200)
        }
        else
          resolve()
      })
    },
    addAttribute(category: string | null, property: Property | Affix): void {
      const target = category === 'properties' ? this.properties : category === 'affixes' ? this.affixes : undefined
      if (target?.data.filter(p => p.value === property.value).length === 0) {
        target?.data.push(property)
      }
    }
  }
})