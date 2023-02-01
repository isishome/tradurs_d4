import { defineStore } from 'pinia'
import { instance } from '@/axios'
import PhraseGen from 'korean-random-words'
import { runeImgs } from '@/common/runes.js'

export const useItemStore = defineStore('item', {
  state: () => ({
    base: {
      loading: false,
      request: 0
    },
    quality: [],
    runeTypes: [],
    runes: [],
    types: [],
    classes: [],
    attributeTypes: [],
    properties: {
      data: [],
      loading: false,
      request: 0
    },
    affixes: {
      data: [],
      loading: false,
      request: 0
    }
  }),
  getters: {
    filterClasses: (state) => {
      return (type) => type ? state.classes.filter(c => c.type === type) : state.classes
    },
    findType: (state) => {
      return (type) => type ? state.types.find(t => t.value === type) : {}
    },
    filterRunes: (state) => {
      return (type) => type ? state.runes.filter(r => r.type === type) : state.runes
    },
    findRune: (state) => {
      return (id) => id ? state.runes.find(r => r.value === id) : {}
    },
    filterProperties: (state) => {
      return (word) => word ? state.properties.data.filter(p => p.label.indexOf(word) !== -1) : state.properties.data
    },
    filterAffixes: (state) => {
      return (word) => word ? state.affixes.data.filter(a => a.label.indexOf(word) !== -1) : state.affixes.data
    },
    matchProperties: (state) => {
      return (attribute) => attribute ? state.properties.data.filter(p => p.label.trim() === attribute).length > 0 : false
    },
    matchAffixes: (state) => {
      return (attribute) => attribute ? state.affixes.data.filter(a => a.label.trim() === attribute).length > 0 : false
    }
  },
  actions: {
    getBase() {
      const self = this
      return new Promise((resolve, reject) => {
        let error = null
        if (self.base.request === 0) {
          self.base.loading = true
          instance.get('/d4/item/base')
            .then((response) => {
              self.quality = response.data.quality
              self.runeTypes = response.data.runeTypes
              self.runes = response.data.runes.map(r => ({ ...r, img: runeImgs[r.value] }))
              self.types = response.data.types
              self.classes = response.data.classes
              self.attributeTypes = response.data.attributeTypes
            })
            .catch((e) => {
              error = e
            })
            .then(() => {
              self.base.loading = false
              self.base.request++

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
      const self = this
      if (self.properties.request === 0) {
        self.properties.loading = true
        const phraseGen = new PhraseGen({
          delimiter: ' {x} '
        })
        setTimeout(() => {
          self.properties.data = Array.from({ length: 200 }, (_, i) => ({
            value: i + 1,
            label: phraseGen.generatePhrase(),
            type: self.attributeTypes.filter(at => at.value !== 'socket').map(at => at.value)[Math.floor(Math.random() * (self.attributeTypes.length - 1))]
          }))
          self.properties.request++
          self.properties.loading = false
        }, 200)

      }
    },
    getAffixes() {
      const self = this
      if (self.affixes.request === 0) {
        self.affixes.loading = true
        const phraseGen = new PhraseGen({
          delimiter: ' {x} '
        })
        setTimeout(() => {
          self.affixes.data = Array.from({ length: 200 }, (_, i) => ({
            value: i + 1,
            label: phraseGen.generatePhrase(),
            type: self.attributeTypes.map(at => at.value)[Math.floor(Math.random() * self.attributeTypes.length)]
          }))
          self.affixes.request++
          self.affixes.loading = false
        }, 200)
      }
    },
    addAttribute(category, property) {
      if (this[category].data.filter(p => p.value === property.value).length === 0) {
        this[category].data.push(property)
      }
    }
  }
})