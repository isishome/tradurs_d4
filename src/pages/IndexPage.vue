<script setup lang="ts">
import { nanoid } from 'nanoid'
import { useRoute, useRouter } from 'vue-router'
import { useItemStore, type Property, type Affix } from 'stores/item-store'
import { AxiosInstance } from 'axios'
import { ref, computed, inject, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { Item } from 'src/types/item'
import { icons } from 'src/common/icons'
import PhraseGen from 'korean-random-words'
import D4Items from 'components/D4Items.vue'

// init module
const route = useRoute()
const router = useRouter()
const store = useItemStore()
const $q = useQuasar()

// common variable
const routeName = computed(() => route.name)
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
const itemsRef = ref<typeof D4Items | null>(null)
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
const saveItems = (items: Array<Item>) => {
  $q.localStorage.set('items', JSON.stringify(items))
}

const setItem = (item: Item, newItem: Item): void => {
  item.itemId = newItem.itemId
  item.tradeType = newItem.tradeType
  item.name = newItem.name
  item.quantity = newItem.quantity
  item.quality = newItem.quality
  item.itemType = newItem.itemType
  item.itemPowerValues = newItem.itemPowerValues
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

  saveItems(items.value)
}

// insert or update item
const upsertItem = (item: Item, done: Function) => {
  const findItem = items.value.find((i) => i.itemId === item.itemId)

  if (findItem) {
    setItem(findItem, item)
    findItem.loading = false
  }
  else if (item.itemId === '') {
    store.addItem(item)
      .then((itemId: string) => {
        item.itemId = itemId
        items.value.splice(0, 0, item)
        saveItems(items.value)
      })
      .catch(() => { })
      .then(() => { done() })
  }
}

const deleteItem = (item: Item, done: Function) => {
  const findItem = items.value.find((i) => i.itemId === item.itemId)
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)

  if (findItem) {
    // remove api here
    items.value.splice(findIndex, 1)

    saveItems(items.value)
  }

  setTimeout(() => {
    done()
  }, 2000)
}

// temp generate items
const gen = (): Array<Item> => {
  const propertyIds = store.properties.data.map((p: Property) => p.value)
  const affixIds = store.affixes.data.map((a: Affix) => a.value)
  const genItems = Array.from({ length: 100 }, (_, i) => {
    const item = new Item()
    item.tradeType = ['sell', 'buy'][
      Math.floor(Math.random() * 2)
    ]
    item.name = phraseGen.generatePhrase()
    item.quantity = Math.floor(Math.random() * 10)
    item.quality = quality.value.map((q) => q.value)[
      Math.floor(Math.random() * quality.value.length)
    ]
    item.itemType = types.value.map((t) => t.value)[
      Math.floor(Math.random() * types.value.length)
    ]
    item.itemPowerValues = [333]
    item.itemTypeValues = [123]
    item.equipmentClass = classes.value.map((c) => c.value)[
      Math.floor(Math.random() * classes.value.length)
    ]
    item.runeId = runes.value.map((r) => r.value)[
      Math.floor(Math.random() * runes.value.length)
    ]
    item.properties = Array.from(
      { length: Math.floor(Math.random() * 2 + 5) },
      () => ({
        valueId: nanoid(),
        propertyId: propertyIds[Math.floor(Math.random() * propertyIds.length)],
        propertyValues: [11]
      })
    )
    item.affixes = Array.from(
      { length: Math.floor(Math.random() * 6 + 5) },
      () => ({
        valueId: nanoid(),
        affixId: affixIds[Math.floor(Math.random() * affixIds.length)],
        affixValues: [11]
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

  return [...items.value, ...genItems]
}

const create = () => {
  if (itemsRef.value)
    itemsRef.value.create()
}

//store.getAffixes()
//store.getProperties()
// const axios = inject('axios') as AxiosInstance

// axios
//   .get('/test')

let itemList: Array<Item> = []

const getDetail = (): Item | undefined => {
  getList()

  const findItem = itemList.find((i: Item) => i.itemId === route.params.itemid)
  if (findItem)
    findItem.expanded = true

  return findItem
}

const getList = () => {
  if (itemList.length === 0) {
    if ($q.localStorage.has('items'))
      itemList = JSON.parse($q.localStorage.getItem('items') as string) as Array<Item>
    else {
      itemList = gen()
      saveItems(itemList)
    }
  }
}

watch(() => route.params.itemid, (val: string | string[] | undefined) => {
  if (val)
    items.value = [getDetail() as Item]
  else
    items.value = itemList
})

onMounted(() => {
  Promise.all([store.getAffixes(), store.getProperties()])
    .then(() => {
      if (route.params.itemid)
        items.value = [getDetail() as Item]
      else {
        setTimeout(() => {
          getList()
          items.value = itemList
        }, 1000)
      }
    })
})
</script>
 
<template>
  <D4Btn v-if="routeName === 'item-detail'" round :to="{ name: 'item-list' }" class="create" color="var(--q-secondary)"
    shadow>
    <img :src="icons.list" height="20" class="invert" />
  </D4Btn>
  <D4Btn v-if="routeName === 'item-list'" round @click="create" class="create" shadow>
    <img :src="icons.add" height="20" class="invert" />
  </D4Btn>
  <div class="row justify-center items-center">
    <!-- <textarea class="col-12" rows="20" style="padding:0;margin:0;line-height:10px;font-size:8px;">
                  {{ items }}
                  </textarea> -->
    <D4Items ref="itemsRef" :items="items" :loading="loading" @upsert-item="upsertItem" @delete-item="deleteItem" />
  </div>
</template>

<style scoped>
.create {
  position: sticky;
  top: 90%;
  left: 100%;
  z-index: 1;
}
</style>
