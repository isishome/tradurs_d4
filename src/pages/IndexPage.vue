<script setup lang="ts">
import { useItemStore } from 'stores/item-store'
import { AxiosInstance } from 'axios'
import { ref, computed, inject } from 'vue'
import { Item } from 'src/types/item'
import PhraseGen from 'korean-random-words'
import D4Items from 'components/D4Items.vue'

// init module
const store = useItemStore()

// common variable
const phraseGen = new PhraseGen({
  delimiter: ' '
})

// loading variable
const loadingAffixes = computed<boolean>(() => store.affixes.loading)
const loadingProperties = computed<boolean>(() => store.properties.loading)
const loading = computed<boolean>(
  () => loadingProperties.value || loadingAffixes.value
)

// variable
const items = ref<Array<Item>>(
  Array.from({ length: 3 }, () => {
    const item = new Item()
    item.loading = true
    return item
  })
)
const quality = computed(() => store.quality)
const types = computed(() => store.types)
const classes = computed(() => store.classes)
const runes = computed(() => store.runes)

// set item
const setItem = (item: Item, newItem: Item): void => {
  item.itemId = newItem.itemId
  item.name = newItem.name
  item.quantity = newItem.quantity
  item.quality = newItem.quality
  item.itemType = newItem.itemType
  item.itemTypeValues = newItem.itemTypeValues
  item.equipmentClass = newItem.equipmentClass
  item.runeId = newItem.runeId
  item.properties.splice(0, item.properties.length)
  item.properties.push(...newItem.properties.filter((p) => p.action !== 8))
  item.affixes.splice(0, item.affixes.length)
  item.affixes.push(...newItem.affixes.filter((a) => a.action !== 8))
  item.price.currency = newItem.price.currency
  item.price.currencyValue =
    newItem.price.currency === 'offer' ? null : newItem.price.currencyValue
  item.price.quantity = newItem.price.quantity
  item.user = newItem.user
  item.offers = newItem.offers
  item.loading = newItem.loading
}

// update item
const updateItem = (item: Item): void => {
  const findItem = items.value.find((i) => i.itemId === item.itemId)

  if (findItem) setItem(findItem, item)
}

// temp generate items
const gen = (): void => {
  const genItems = Array.from({ length: 1000 }, (_, i) => {
    const item = new Item()
    item.itemId = i + 1 // Math.floor(Math.random() * 1000000)
    item.name = phraseGen.generatePhrase()
    item.quantity = Math.floor(Math.random() * 10)
    item.quality = quality.value.map((q) => q.value)[
      Math.floor(Math.random() * quality.value.length)
    ]
    item.itemType = types.value.map((t) => t.value)[
      Math.floor(Math.random() * types.value.length)
    ]
    item.itemTypeValues = [100]
    item.equipmentClass = classes.value.map((c) => c.value)[
      Math.floor(Math.random() * classes.value.length)
    ]
    item.runeId = runes.value.map((r) => r.value)[
      Math.floor(Math.random() * runes.value.length)
    ]
    item.properties = Array.from(
      { length: Math.floor(Math.random() * 2 + 1) },
      () => ({
        valueId: Math.floor(Math.random() * 1000000),
        propertyId: Math.floor(Math.random() * 200 + 1),
        propertyValues: [
          Math.floor(Math.random() * 999),
          Math.floor(Math.random() * 999),
          Math.floor(Math.random() * 999)
        ]
      })
    )
    item.affixes = Array.from(
      { length: Math.floor(Math.random() * 6 + 1) },
      () => ({
        valueId: Math.floor(Math.random() * 1000000),
        affixId: Math.floor(Math.random() * 200 + 1),
        affixValues: [
          Math.floor(Math.random() * 999),
          Math.floor(Math.random() * 999),
          Math.floor(Math.random() * 999)
        ]
      })
    )
    item.price = [
      {
        currency: types.value.filter((t) => t.isCurrency).map((t) => t.value)[
          Math.floor(
            Math.random() * types.value.filter((t) => t.isCurrency).length
          )
        ],
        currencyValue: runes.value.map((r) => r.value)[
          Math.floor(Math.random() * runes.value.length)
        ],
        quantity: Math.floor(Math.random() * 1 + 1)
      },
      { currency: 'offer', currencyValue: null, quantity: 1 }
    ][Math.round(Math.random())]
    item.user = phraseGen.generatePhrase()
    item.offers = Math.floor(Math.random() * 20)
    item.loading = false
    return item
  })
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
    } else items.value.splice(2, 1)
  }

  items.value = [...items.value, ...genItems]
}

store.getAffixes()
store.getProperties()
const axios = inject('axios') as AxiosInstance

axios
  .get('/test')

setTimeout(() => {
  gen()
}, 200)
</script>
 
<template>
  <div class="row justify-center items-center">
    <!-- <textarea class="col-12" rows="20" style="padding:0;margin:0;line-height:10px;font-size:8px;">
          {{ items }}
          </textarea> -->
    <D4Items :items="items" :loading="loading" @update-item="updateItem" />
  </div>
</template>
