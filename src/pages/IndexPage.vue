<script setup lang="ts">
import { nanoid } from 'nanoid'
import { useRoute } from 'vue-router'
import { useItemStore, type Power, type Property, type Affix } from 'stores/item-store'
import { ref, computed, onMounted, watch } from 'vue'
import { Item } from 'src/types/item'
import { icons } from 'src/common/icons'
import PhraseGen from 'korean-random-words'
import D4Items from 'components/D4Items.vue'

// init module
const route = useRoute()
const store = useItemStore()

// common variable
const routeName = computed(() => route.name)
const phraseGen = new PhraseGen({
  delimiter: ' '
})

// loading variable
const loadingPowers = computed<boolean>(() => store.powers.loading)
const loadingAffixes = computed<boolean>(() => store.affixes.loading)
const loadingProperties = computed<boolean>(() => store.properties.loading)
const loading = computed<boolean>(
  () => loadingPowers.value || loadingProperties.value || loadingAffixes.value
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

const setItem = (item: Item, newItem: Item): void => {
  item.itemId = newItem.itemId
  item.tradeType = newItem.tradeType
  item.name = newItem.name
  item.quantity = newItem.quantity
  item.quality = newItem.quality
  item.itemType = newItem.itemType
  item.itemTypeValues = newItem.itemTypeValues
  item.equipmentClass = newItem.equipmentClass
  item.runeId = newItem.runeId
  item.powers.splice(0, item.powers.length)
  item.powers.push(...newItem.powers.filter((p) => p.action !== 8))
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

// insert or update item
const upsertItem = (item: Item, done: Function) => {
  const findItem = items.value.find((i) => i.itemId === item.itemId)

  if (findItem) {
    store.updateItem(item)
      .then((resultItem: Item) => {
        setItem(findItem, resultItem)
      })
      .catch(() => { })
      .then(() => { done() })
  }
  else if (item.itemId === '') {
    store.addItem(item)
      .then((resultItem: Item) => {
        items.value.splice(0, 0, resultItem)
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
  }

  setTimeout(() => {
    done()
  }, 2000)
}

// temp generate items
const gen = (): Array<Item> => {
  const powerIds = store.powers.data.map((p: Power) => p.value)
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
    item.itemTypeValues = [123]
    item.equipmentClass = classes.value.map((c) => c.value)[
      Math.floor(Math.random() * classes.value.length)
    ]
    item.runeId = runes.value.map((r) => r.value)[
      Math.floor(Math.random() * runes.value.length)
    ]
    item.powers = Array.from(
      { length: Math.ceil(Math.random() * 2) },
      () => ({
        valueId: nanoid(),
        powerId: powerIds[Math.floor(Math.random() * powerIds.length)],
        powerValues: [11]
      })
    )
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



  return [...items.value, ...genItems]
}

const create = () => {
  if (itemsRef.value)
    itemsRef.value.create()
}

watch(() => route.params.itemid, (val: string | string[] | undefined) => {
  getList(val)
})

const getList = (itemId: string | string[] | undefined) => {
  store.getItems(itemId)
    .then((result: Array<Item>) => {
      items.value = result
      // let i = 0
      // while (i < items.value.length) {
      //   const item = result.shift()
      //   if (item) {
      //     setItem(items.value[i], item)
      //     i++
      //   } else items.value.splice(2, 1)
      // }
    })

}

onMounted(() => {
  Promise.all([store.getPowers(), store.getAffixes(), store.getProperties()])
    .then(() => {
      getList(route.params.itemid)
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
