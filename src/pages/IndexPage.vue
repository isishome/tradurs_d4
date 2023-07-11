<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGlobalStore } from 'src/stores/global-store'
import { useItemStore, type OfferInfo } from 'stores/item-store'
import { useAccountStore } from 'stores/account-store'
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar, uid } from 'quasar'
import { scrollPos } from 'src/common'

import { Item, IPrice } from 'src/types/item'
import D4Items from 'components/D4Items.vue'

// init module
const router = useRouter()
const gs = useGlobalStore()
const is = useItemStore()
const as = useAccountStore()
const { t, n } = useI18n({ useScope: 'global' })
const $q = useQuasar()

// loading variable
const disable = ref(false)

// variable
const position = computed(() => as.position)
const newItems = computed(() => is.socket.newItems)
const newOffer = computed(() => is.socket.newOffer)
const acceptedOffer = computed(() => is.socket.acceptedOffer)
const retractedOffer = computed(() => is.socket.retractedOffer)
const turnedDownOffer = computed(() => is.socket.turnedDownOffer)
const complete = computed(() => is.socket.complete)
const filter = computed(() => is.filter.request)
const expanded = computed(() => is.equalDefaultFilter)
const itemsRef = ref<typeof D4Items | null>(null)
const items = ref<Array<Item>>([])
const page = ref<number>(1)
const over = computed(() => is.itemPage.over)
const more = computed(() => is.itemPage.more)

// insert or update item
const upsertItem = (item: Item, done: Function) => {
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)

  if (findIndex === -1)
    scrollPos()

  disable.value = true
  is[item.itemId !== '' ? 'updateItem' : 'addItem'](item)
    .then((response) => {
      Object.assign(item, response)
      if (findIndex !== -1)
        items.value.splice(findIndex, 1, item)
      else {
        as.retrieve()
        is.clearFilter()
        page.value = 1
        getList(is.filter)
      }

      itemsRef.value?.hideEditable()
      disable.value = false
    })
    .catch(() => {
      done()
      disable.value = false
    })
}

const deleteItem = (item: Item, done: Function) => {
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)

  if (findIndex !== -1) {
    disable.value = true
    is.deleteItem(item.itemId)
      .then(() => {
        items.value.splice(findIndex, 1)
        itemsRef.value?.hideEditable()
        disable.value = false
      })
      .catch(() => {
        done()
        updateOnly(item.itemId)
        disable.value = false
      })
  }
}

const relistItem = (item: Item, done: Function) => {
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)
  if (findIndex !== -1) {
    scrollPos()
    disable.value = true
    is.relistItem(item.itemId)
      .then(() => {
        as.retrieve()
        itemsRef.value?.hideEditable()
        disable.value = false
        page.value = 1
        getList(is.filter)
      })
      .catch(() => {
        done()
        updateOnly(item.itemId)
        disable.value = false
      })
  }
}

const statusItem = (item: Item, done: Function) => {
  const findItem = items.value.find((i) => i.itemId === item.itemId)
  if (findItem) {
    disable.value = true
    is.statusItem(item.itemId)
      .then(() => {
        findItem.statusCode = findItem.statusCode === '000' ? '002' : '000'
        itemsRef.value?.hideEditable()
        disable.value = false
      })
      .catch(() => {
        done()
        updateOnly(item.itemId)
        disable.value = false
      })
  }
}

const updateOnly = (itemId: string, cb?: Function) => {
  const findItem = items.value.find((i) => i.itemId === itemId)

  if (findItem) {
    disable.value = true
    is.getItems(page.value, itemId)
      .then((result: Array<Item>) => {
        if (result.length > 0) {
          result[0].expanded = true
          Object.assign(findItem, result[0])
        }

        if (cb)
          cb(findItem)

      }).catch(() => {
      }).then(() => {
        disable.value = false
      })
  }
}

const copy = (itemId: string) => {
  const findItem = items.value.find((i) => i.itemId === itemId)

  if (findItem)
    itemsRef.value?.copyItem(findItem)
}

const favorite = (itemId: string, favorite: boolean) => {
  const findItem = items.value.find((i) => i.itemId === itemId)

  if (findItem) {
    is.favorite(itemId, favorite)
      .then(() => {
        findItem.favorite = favorite
      })
  }
}

const prev = () => {
  if (page.value > 1) {
    gs.refresh++
    page.value--
    getList(is.filter)
  }
}

const next = () => {
  gs.refresh++
  page.value++
  getList(is.filter)
}

const create = (item?: Item) => {
  itemsRef.value?.create(item)
}

const getList = (filter?: any) => {
  is.clearSocket()
  scrollPos(position.value.top)
  is.filter.loading = true

  items.value =
    Array.from({ length: items.value.length || is.itemPage.rows }, () => {
      const item = new Item()
      item.quality = 'normal'
      item.loading = true
      item.user.loading = true
      item.price.loading = true
      return item
    })

  is.getItems(page.value, undefined, filter)
    .then((result: Array<Item>) => {

      // auto expanded
      result.forEach((i: Item) => {
        i.expanded = expanded.value
      })

      let i = 0
      while (i < items.value.length) {
        const item = result.shift()
        if (item) {
          items.value[i] = item
          i++
        } else {
          items.value.splice(i)
          break
        }
      }
      items.value.push(...result)

      if (is.awardsPick.length > 0) {
        const pickItemId = is.awardsPick[Math.floor(Math.random() * is.awardsPick.length)].toString()
        is.getItems(1, pickItemId)
          .then((pick: Array<Item>) => {
            pick = pick.map((p: Item) => ({ ...p, reward: true }))
            items.value.unshift(...pick)
          })
      }
    }).catch(() => {
      items.value = []
    }).then(() => {
      is.filter.loading = false
      disable.value = false
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

watch(newItems, (val: number) => {
  if (val > 0)
    notify('newItems', t('messages.newItems', val), '', t('btn.refresh'), () => {
      itemsRef.value?.hideEditable()
      itemsRef.value?.hideOffers()
      is.clearFilter()
      page.value = 1
      getList(is.filter)
    })
})

watch(newOffer, (val: OfferInfo | null) => {
  if (val) {
    const offerPrice: IPrice = JSON.parse(val.price || '{}')
    notify('', t('messages.newOffer'), `[${val.itemName}] ${offerPrice.currency === 'gold' ? t('item.gold') : ''} : ${n(Number.parseFloat(offerPrice.currencyValue as string), 'decimal')}`, t('btn.move'), () => {
      router.push({ name: 'itemInfo', params: { itemid: val.itemId }, state: { offers: true } })
    })
  }
})

watch(acceptedOffer, (val: OfferInfo | null) => {
  if (val) {
    const offerPrice: IPrice = JSON.parse(val.price || '{}')
    notify('', t('messages.acceptedOffer', { in: val.itemName }), `[${val.itemName}] ${offerPrice.currency === 'gold' ? t('item.gold') : ''} : ${n(Number.parseFloat(offerPrice.currencyValue as string), 'decimal')}`, t('btn.move'), () => {
      router.push({ name: 'itemInfo', params: { itemid: val.itemId }, state: { offers: true } })
    })
  }
})

watch(retractedOffer, (val: OfferInfo | null) => {
  if (val) {
    const offerPrice: IPrice = JSON.parse(val.price || '{}')
    notify('', t('messages.retractedOffer', { in: val.itemName }), `[${val.itemName}] ${offerPrice.currency === 'gold' ? t('item.gold') : ''} : ${n(Number.parseFloat(offerPrice.currencyValue as string), 'decimal')}`, t('btn.move'), () => {
      router.push({ name: 'itemInfo', params: { itemid: val.itemId }, state: { offers: true } })
    })
  }
})

watch(turnedDownOffer, (val: OfferInfo | null) => {
  if (val) {
    const offerPrice: IPrice = JSON.parse(val.price || '{}')
    notify('', t('messages.turnedDownOffer', { in: val.itemName }), `[${val.itemName}] ${offerPrice.currency === 'gold' ? t('item.gold') : ''} : ${n(Number.parseFloat(offerPrice.currencyValue as string), 'decimal')}`, t('btn.move'), () => {
      router.push({ name: 'itemInfo', params: { itemid: val.itemId }, state: { offers: true } })
    })
  }
})

watch(complete, (val: OfferInfo | null) => {
  if (val)
    notify('', t('messages.complete', { in: val.itemName }), '', t('btn.move'), () => { router.push({ name: 'itemInfo', params: { itemid: val.itemId }, state: { offers: true } }) })
})

watch(filter, (val, old) => {
  if (Number.isInteger(val) && val !== old) {
    page.value = 1
    getList(is.filter)
  }
})

onMounted(() => {
  as.position = { top: 0, left: 0 }
  getList(is.filter.fixed ? is.filter : undefined)
})

onUnmounted(() => {
  is.clearFilter()
})

defineExpose({ getList })
</script>
<template>
  <div></div>
  <div>
    <div class="row justify-center items-center">
      <D4Items ref="itemsRef" :items="items" @upsert-item="upsertItem" @delete-item="deleteItem" @relist-item="relistItem"
        @status-item="statusItem" @update-only="updateOnly" @copy="copy" @favorite="favorite" />
    </div>
  </div>
  <div class="q-pt-xl"></div>
  <D4Btn v-if="as.signed" round @click="create" class="sticky-btn" color="var(--q-secondary)" :disable="disable" shadow>
    <img src="/images/icons/add.svg" width="24" height="24" class="invert" alt="icon_add" />
  </D4Btn>
  <D4Btn v-else style="visibility: hidden;" />
  <div class="row q-gutter-xs items-center paging">
    <D4Btn round @click="prev" color="var(--q-light-magic)" :disable="!over || disable" :shadow="!$q.dark.isActive">
      <img src="/images/icons/prev.svg" width="24" height="24" class="invert" alt="icon_prev" />
    </D4Btn>
    <D4Btn round @click="next" color="var(--q-light-magic)" :disable="!more || disable" :shadow="!$q.dark.isActive">
      <img src="/images/icons/next.svg" width="24" height="24" class="invert" alt="icon_next" />
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

.paging {
  position: absolute;
  transform: translateY(-90%);
}
</style>
