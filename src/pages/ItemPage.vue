<script lang="ts">
import { useGlobalStore } from 'src/stores/global-store'
import { useItemStore, type OfferInfo } from 'stores/item-store'
import { scrollPos } from 'src/common'
import { Item, IPrice } from 'src/types/item'

export default {
  preFetch({ store, currentRoute }) {
    const is = useItemStore(store)
    const gs = useGlobalStore(store)

    is.clearSocket()

    const tempItem = new Item()
    tempItem.quality = 'normal'
    tempItem.loading = true
    tempItem.user.loading = true
    tempItem.price.loading = true
    is.detailItem.splice(0, 1, tempItem)

    return is.getItems(1, currentRoute.params.itemid)
      .then((result: Array<Item>) => {
        if (result.length > 0) {
          result[0].expanded = true
          gs.itemName = result[0].name
          is.detailItem.splice(0, 1, result[0])
        }
        else
          is.detailItem.splice(0, 1)
      }, () => {
        is.detailItem.splice(0, 1)
      })
  }
}
</script>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, watch, onUnmounted, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar, uid } from 'quasar'
import { useAccountStore } from 'stores/account-store'
import D4Items from 'components/D4Items.vue'

const props = defineProps<{
  itemid: string
}>()

// init module
const route = useRoute()
const router = useRouter()
const { t, n } = useI18n({ useScope: 'global' })
const $q = useQuasar()
const is = useItemStore()
const gs = useGlobalStore()
const as = useAccountStore()

// loading variable
const completeInfo = ref(false)
const disable = ref(false)
const newItems = computed(() => is.socket.newItems)
const newOffer = computed(() => is.socket.newOffer)
const acceptedOffer = computed(() => is.socket.acceptedOffer)
const retractedOffer = computed(() => is.socket.retractedOffer)
const turnedDownOffer = computed(() => is.socket.turnedDownOffer)
const complete = computed(() => is.socket.complete)

// variable
const itemsRef = ref<typeof D4Items | null>(null)

// insert or update item
const upsertItem = (item: Item, done: Function) => {
  disable.value = true

  is[item.itemId !== '' ? 'updateItem' : 'addItem'](item)
    .then((response) => {
      if (item.itemId !== '')
        is.detailItem.splice(0, 1, response)
      else {
        as.retrieve()
        is.clearFilter()
        router.push({ name: 'tradeList', params: { lang: route.params.lang } })
      }

      Object.assign(item, response)
      itemsRef.value?.hideEditable()

      disable.value = false
    })
    .catch(() => {
      done()
      disable.value = false
    })
}

const deleteItem = (item: Item, done: Function) => {
  disable.value = true
  is.deleteItem(item.itemId)
    .then(() => {
      router.push({ name: 'tradeList', params: { lang: route.params.lang } })
    })
    .catch(() => {
      done()
      updateOnly(item.itemId)
      disable.value = false
    })
}

const relistItem = (item: Item, done: Function) => {
  disable.value = true
  is.relistItem(item.itemId)
    .then(() => {
      as.retrieve()
      router.push({ name: 'tradeList', params: { lang: route.params.lang } })
    })
    .catch(() => {
      done()
      updateOnly(item.itemId)
      disable.value = false
    })
}

const statusItem = (item: Item, done: Function) => {
  disable.value = true
  is.statusItem(item.itemId)
    .then(() => {
      if (is.detailItem.length > 0)
        is.detailItem[0].statusCode = is.detailItem[0].statusCode === '000' ? '002' : '000'
      itemsRef.value?.hideEditable()
      disable.value = false
    })
    .catch(() => {
      done()
      updateOnly(item.itemId)
      disable.value = false
    })
}

const updateOnly = (itemId: string, cb?: Function) => {
  disable.value = true
  is.getItems(1, itemId)
    .then((result: Array<Item>) => {
      if (result.length > 0) {
        result[0].expanded = true
        is.detailItem.splice(0, 1, result[0])
      }

      if (cb)
        cb(is.detailItem[0])

    }).catch(() => {
    }).then(() => {
      disable.value = false
    })
}

const copy = (itemId: string) => {
  if (itemId === is.detailItem[0].itemId)
    itemsRef.value?.copyItem(is.detailItem[0])
}
const favorite = (itemId: string, favorite: boolean) => {
  is.favorite(itemId, favorite)
    .then(() => {
      if (is.detailItem.length > 0)
        is.detailItem[0].favorite = favorite
    })
}

const getItem = () => {
  is.clearSocket()

  const tempItem = new Item()
  tempItem.quality = 'normal'
  tempItem.loading = true
  tempItem.user.loading = true
  tempItem.price.loading = true
  is.detailItem.splice(0, 1, tempItem)

  is.getItems(1, props.itemid)
    .then((result: Array<Item>) => {
      if (result.length > 0) {
        result[0].loading = false
        result[0].expanded = true
        result[0].user.loading = false
        result[0].price.loading = false

        is.detailItem.splice(0, 1, result[0])
      }
      else
        is.detailItem.splice(0, 1)
    })
    .catch(() => {
      is.detailItem.splice(0, 1)
    })
    .then(() => {
      disable.value = false

      if (history.state.offers) {
        itemsRef.value?.openOffers(props.itemid)
        history.state.offers = false
      }
    })
}

const notify = (group: string, message: string, caption: string, actionLabel: string, action: Function) => {
  const genGroup = group === '' ? uid() : group

  $q.notify({
    group: genGroup,
    progress: true,
    multiLine: true,
    message,
    caption,
    actions: [
      {
        label: actionLabel, color: 'white', handler: () => { action() }
      }
    ]
  })
}

const parseOfferPrice = (priceStr?: string) => {
  const price: IPrice = JSON.parse(priceStr || '{}')
  const currencyName = price.currency === 'gold' ? t('item.gold') : price.currency === 'summoning' ? is.summonings.find(s => s.value === price.currencyValue)?.label : ''
  const currencyValue = price.currency === 'gold' ? ` : ${n(Number.parseFloat(price.currencyValue as string), 'decimal')}` : price.currency === 'summoning' ? ` x ${price.quantity}` : ''

  return { currencyName, currencyValue }
}

watch(() => props.itemid, (val, old) => {
  if (val && val !== old)
    getItem()
})

watch(newItems, (val: number) => {
  if (val > 0)
    notify('newItems', t('messages.newItems', val), '', t('btn.refresh'), () => {
      router.push({ name: 'tradeList', params: { lang: route.params.lang } })
    })
})

watch(newOffer, (val: OfferInfo | null) => {
  if (val) {
    const parsing = parseOfferPrice(val.price)
    notify('', t('messages.newOffer'), `[${val.itemName}] ${parsing.currencyName}${parsing.currencyValue}`, t('btn.move'), () => {
      if (props.itemid === val.itemId) {
        updateOnly(val.itemId, () => {
          itemsRef.value?.openOffers(props.itemid)
        })
      }
      else
        router.push({ name: 'itemInfo', params: { lang: route.params.lang, itemid: val.itemId }, state: { offers: true } })
    })
  }
})

watch(acceptedOffer, (val: OfferInfo | null) => {
  if (val) {
    const parsing = parseOfferPrice(val.price)
    notify('', t('messages.acceptedOffer'), `[${val.itemName}] ${parsing.currencyName}${parsing.currencyValue}`, t('btn.move'), () => {
      if (props.itemid === val.itemId) {
        updateOnly(val.itemId, () => {
          itemsRef.value?.openOffers(props.itemid)
        })
      }
      else
        router.push({ name: 'itemInfo', params: { lang: route.params.lang, itemid: val.itemId }, state: { offers: true } })
    })
  }
})

watch(retractedOffer, (val: OfferInfo | null) => {
  if (val) {
    const parsing = parseOfferPrice(val.price)
    notify('', t('messages.retractedOffer'), `[${val.itemName}] ${parsing.currencyName}${parsing.currencyValue}`, t('btn.move'), () => {
      if (props.itemid === val.itemId) {
        updateOnly(val.itemId, () => {
          itemsRef.value?.openOffers(props.itemid)
        })
      }
      else
        router.push({ name: 'itemInfo', params: { lang: route.params.lang, itemid: val.itemId }, state: { offers: true } })
    })
  }
})

watch(turnedDownOffer, (val: OfferInfo | null) => {
  if (val) {
    const parsing = parseOfferPrice(val.price)
    notify('', t('messages.turnedDownOffer'), `[${val.itemName}] ${parsing.currencyName}${parsing.currencyValue}`, t('btn.move'), () => {
      if (props.itemid === val.itemId) {
        updateOnly(val.itemId, () => {
          itemsRef.value?.openOffers(props.itemid)
        })
      }
      else
        router.push({ name: 'itemInfo', params: { lang: route.params.lang, itemid: val.itemId }, state: { offers: true } })
    })
  }
})

watch(complete, (val: { itemName: string, itemId: string } | null) => {
  if (val)
    notify('', t('messages.complete', { in: val.itemName }), '', t('btn.move'), () => {
      if (props.itemid === val.itemId) {
        updateOnly(props.itemid, () => {
          itemsRef.value?.openOffers(props.itemid)
        })
      }
      else
        router.push({ name: 'itemInfo', params: { lang: route.params.lang, itemid: val.itemId }, state: { offers: true } })
    })
})

onMounted(() => {
  scrollPos()

  if (history.state.offers) {
    itemsRef.value?.openOffers(props.itemid)
    history.state.offers = false
  }

  setTimeout(() => {
    completeInfo.value = true
  }, 100)
})

onUnmounted(() => {
  gs.itemName = null
  is.detailItem.splice(0, is.detailItem.length)
})
</script>

<template>
  <div>
    <div class="row justify-center items-center">
      <D4Items ref="itemsRef" :items="is.detailItem" @upsert-item="upsertItem" @delete-item="deleteItem"
        @relist-item="relistItem" @status-item="statusItem" @update-only="updateOnly" @copy="copy"
        @favorite="favorite" />
    </div>
    <div class="q-py-lg"></div>
    <D4Btn v-if="completeInfo" round :to="{ name: 'tradeList', params: { lang: route.params.lang } }" class="sticky-btn"
      color="var(--q-light-normal)" shadow>
      <img src="/images/icons/list.svg" width="20" height="20" class="invert" alt="Tradurs List Icon" />
    </D4Btn>
  </div>
</template>

<style scoped>
.sticky-btn {
  position: sticky;
  bottom: 8%;
  left: 100%;
  z-index: 1;
}

@media (max-width:600px) {
  .sticky-btn {
    bottom: 10px;
  }
}
</style>
