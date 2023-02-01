<script setup>
import { defineAsyncComponent, ref, computed } from 'vue'
import { useQuasar, uid } from 'quasar'
import { useItemStore } from '@/stores/item.js'

import PhraseGen from 'korean-random-words'

// define async component
const Items = defineAsyncComponent(() => import('@/components/Items.vue'))

// init module
const $q = useQuasar()
const store = useItemStore()

// common variable
const phraseGen = new PhraseGen({
  delimiter: ' '
})

// variable
const items = ref(Array.from({ length: 3 }, (_, i) => ({ item_type: 'weapons', item_type_values: [0], properties: [], affixes: [], price: {}, loading: true })))
const quality = computed(() => store.quality)
const types = computed(() => store.types)
const classes = computed(() => store.classes)
const runes = computed(() => store.runes)

// set item
const setItem = (item, newItem) => {
  if (!item || !newItem)
    return

  item.name = newItem.name
  item.quality = newItem.quality
  item.item_type = newItem.item_type
  item.item_type_values = newItem.item_type_values
  item.equipment_class = newItem.equipment_class
  item.rune_id = newItem.rune_id
  item.properties.splice(0, item.properties.length)
  item.properties.push(...newItem.properties.filter(p => p.action !== 8))
  item.affixes.splice(0, item.affixes.length)
  item.affixes.push(...newItem.affixes.filter(a => a.action !== 8))
  item.price.currency = newItem.price.currency
  item.price.quantity = newItem.price.quantity
  item.loading = newItem.loading
}

// update item
const updateItem = (item) => {
  const findItem = items.value.find(i => i.item_id === item.item_id)
  setItem(findItem, item)
}

// temp generate items
const gen = () => {
  const genItems = Array.from({ length: 100 }, (_, i) => ({
    item_id: i + 1,
    name: phraseGen.generatePhrase(),
    quality: quality.value.map(q => q.value)[Math.floor(Math.random() * quality.value.length)],
    item_type: types.value.map(t => t.value)[Math.floor(Math.random() * types.value.length)],
    item_type_values: [100],
    equipment_class: classes.value.map(c => c.value)[Math.floor(Math.random() * classes.value.length)],
    rune_id: runes.value.map(r => r.value)[Math.floor(Math.random() * runes.value.length)],
    properties: Array.from({ length: Math.floor(Math.random() * 2 + 1) }, () => ({
      value_id: uid(),
      property_id: Math.floor(Math.random() * 200 + 1),
      property_values: [Math.floor(Math.random() * 999), Math.floor(Math.random() * 999), Math.floor(Math.random() * 999)]
    })),
    affixes: Array.from({ length: Math.floor(Math.random() * 6 + 1) }, () => ({
      value_id: uid(),
      affix_id: Math.floor(Math.random() * 200 + 1),
      affix_values: [Math.floor(Math.random() * 999), Math.floor(Math.random() * 999), Math.floor(Math.random() * 999)]
    })),
    price: {
      currency: runes.value.map(r => r.value)[Math.floor(Math.random() * runes.value.length)],
      quantity: Math.floor(Math.random() * 1 + 1)
    },
    editable: false
  }))

  // add adsense
  // let i = 1
  // while (items.value[i * 10]) {
  //   items.value.splice(i * 10, 0, { expanded: true })
  //   i++
  // }

  let i = 0
  while (i < items.value.length) {
    const item = genItems.shift()
    if (item) {
      setItem(items.value[i], item)
      i++
    }
    else
      items.value.splice(2, 1)
  }

  items.value = [...items.value, ...genItems]
}

store.getBase().then(() => {
  store.getAffixes()
  store.getProperties()
  setTimeout(() => {
    gen()
  }, 5000)
})

$q.dark.set(true)
</script>

<template>
  <div class="row justify-center items-center">
    <!-- <textarea class="col-12" rows="20" style="padding:0;margin:0;line-height:10px;font-size:8px;">
      {{ items }}
    </textarea> -->
    <Items :items="items" @update-item="updateItem" />
  </div>
</template>