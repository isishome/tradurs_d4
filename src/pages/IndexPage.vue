<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useItemStore, type OfferInfo, type AwardsPick, Sort } from 'stores/item-store'
import { useAccountStore } from 'stores/account-store'
import { ref, computed, defineAsyncComponent, onMounted, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar, uid } from 'quasar'
import { scrollPos } from 'src/common'
import { Item, IPrice } from 'src/types/item'

const D4Items = defineAsyncComponent(() => import('components/D4Items.vue'))

// init module
const route = useRoute()
const router = useRouter()
const is = useItemStore()
const as = useAccountStore()
const { t, tm, n } = useI18n({ useScope: 'global' })
const $q = useQuasar()

// loading variable
const completeList = ref(false)
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
const isDefaultFilter = computed(() => is.equalDefaultFilter)
const itemsRef = ref<typeof D4Items | null>(null)
const items = ref<Array<Item>>([])
const rewardItem = ref<Item | undefined>()
const page = ref<number>(route.query.page ? parseInt(route.query.page as string) : 1)
const over = computed(() => is.itemPage.over)
const more = computed(() => is.itemPage.more)
const selectable = computed(() => is.filter.mine)
const sortOptions = reactive<Array<{ value: string, label: string }>>(tm('sort.options'))

const updateSort = (sortValue: Sort) => {
  is.sort = sortValue
  reload()
}

const reload = () => {
  if (page.value === 1)
    getList()
  else
    router.push({ name: 'tradeList', params: { lang: route.params.lang }, query: { page: 1 } })
}


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
        reload()
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
        reload()
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

const create = (item?: Item) => {
  itemsRef.value?.create(item)
}

const getList = () => {
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

  is.getItems(page.value)
    .then((result: Array<Item>) => {

      // auto expanded
      result.forEach((i: Item) => {
        i.expanded = isDefaultFilter.value
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

    }).catch(() => {
      items.value = []
    }).then(() => {
      is.filter.loading = false
      disable.value = false
      setTimeout(() => {
        completeList.value = true
      }, 100)
      scrollPos()
    })

  rewardItem.value = undefined

  if (page.value === 1 && !isDefaultFilter.value) {
    const awardsPick = is.awardsPick.filter((ap: AwardsPick) => ap.hardcore === is.storage.data.hardcore && ap.ladder === is.storage.data.ladder)
    if (awardsPick.length > 0) {
      const pickItemId = awardsPick[Math.floor(Math.random() * awardsPick.length)].itemId.toString()
      is.getItems(1, pickItemId)
        .then((pick: Array<Item>) => {
          rewardItem.value = pick.map((p: Item) => ({ ...p, reward: true }))?.[0]
        })
    }
  }
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

const move = (val: number) => {
  router.push({ name: 'tradeList', params: { lang: route.params.lang }, query: { page: page.value + val } })
}

watch(() => route.query.page, (val, old) => {
  if (val !== old && route.name === 'tradeList') {
    page.value = val ? parseInt(val as string) : 1
    getList()
  }
})

watch(newItems, (val: number) => {
  if (val > 0)
    notify('newItems', t('messages.newItems', val), '', t('btn.refresh'), () => {
      itemsRef.value?.hideEditable()
      itemsRef.value?.hideOffers()
      is.clearFilter()
      reload()
    })
})

watch(newOffer, (val: OfferInfo | null) => {
  if (val) {
    const parsing = parseOfferPrice(val.price)
    notify('', t('messages.newOffer'), `[${val.itemName}] ${parsing.currencyName}${parsing.currencyValue}`, t('btn.move'), () => {
      router.push({ name: 'itemInfo', params: { lang: route.params.lang, itemid: val.itemId }, state: { offers: true } })
    })
  }
})

watch(acceptedOffer, (val: OfferInfo | null) => {
  if (val) {
    const parsing = parseOfferPrice(val.price)
    notify('', t('messages.acceptedOffer', { in: val.itemName }), `[${val.itemName}] ${parsing.currencyName}${parsing.currencyValue}`, t('btn.move'), () => {
      router.push({ name: 'itemInfo', params: { lang: route.params.lang, itemid: val.itemId }, state: { offers: true } })
    })
  }
})

watch(retractedOffer, (val: OfferInfo | null) => {
  if (val) {
    const parsing = parseOfferPrice(val.price)
    notify('', t('messages.retractedOffer', { in: val.itemName }), `[${val.itemName}] ${parsing.currencyName}${parsing.currencyValue}`, t('btn.move'), () => {
      router.push({ name: 'itemInfo', params: { lang: route.params.lang, itemid: val.itemId }, state: { offers: true } })
    })
  }
})

watch(turnedDownOffer, (val: OfferInfo | null) => {
  if (val) {
    const parsing = parseOfferPrice(val.price)
    notify('', t('messages.turnedDownOffer', { in: val.itemName }), `[${val.itemName}] ${parsing.currencyName}${parsing.currencyValue}`, t('btn.move'), () => {
      router.push({ name: 'itemInfo', params: { lang: route.params.lang, itemid: val.itemId }, state: { offers: true } })
    })
  }
})

watch(complete, (val: OfferInfo | null) => {
  if (val)
    notify('', t('messages.complete', { in: val.itemName }), '', t('btn.move'), () => { router.push({ name: 'itemInfo', params: { lang: route.params.lang, itemid: val.itemId }, state: { offers: true } }) })
})

watch(filter, (val, old) => {
  if (Number.isInteger(val) && val !== old)
    reload()
})

onMounted(() => {
  as.position = { top: 0, left: 0 }
  getList()
})
</script>

<template>
  <div class="row justify-end items-center">
    <q-select v-model="is.sort" :disable="disable" dense no-error-icon hide-bottom-space emit-value map-options
      options-dense borderless transition-show="none" transition-hide="none" :transition-duration="0"
      :options="sortOptions" menu-anchor="bottom end" menu-self="top end" dropdown-icon="img:/images/icons/dropdown.svg"
      class="sort text-caption" popup-content-class="scroll bordered text-caption" @update:model-value="updateSort" />
  </div>
  <div>
    <div class="row justify-center items-center">
      <D4Items ref="itemsRef" class="item-list" :items="items" :reward-item="rewardItem" @upsert-item="upsertItem"
        @delete-item="deleteItem" @relist-item="relistItem" @status-item="statusItem" @update-only="updateOnly"
        @copy="copy" @favorite="favorite" />
    </div>
  </div>
  <div class="q-pt-xl"></div>
  <template v-if="completeList">
    <div class="sticky-place row justify-end">
      <div v-if="as.signed" class="row items-center q-gutter-x-xs relative-position">
        <!-- <D4Btn v-if="selectable" round @click="create" color="var(--q-info)"
          :disable="disable || items.filter((item: Item) => item.selected).length === 0">
          <img src="/images/icons/remove.svg" width="24" height="24" class="invert" alt="Tradurs Add Icon" />
        </D4Btn> -->
        <D4Btn round @click="create" color="var(--q-secondary)" :disable="disable" shadow shadow-depth="deep">
          <img src="/images/icons/add.svg" width="24" height="24" class="invert" alt="Tradurs Add Icon" />
        </D4Btn>
      </div>
      <D4Btn v-else style="visibility: hidden;" />
    </div>
    <div class="row q-gutter-xs items-center paging">
      <D4Btn round @click="move(-1)" color="var(--q-light-magic)" :disable="!over || disable"
        :shadow="!$q.dark.isActive">
        <img src="/images/icons/prev.svg" width="24" height="24" class="invert" alt="Tradurs Prev Icon" />
      </D4Btn>
      <D4Btn round @click="move(1)" color="var(--q-light-magic)" :disable="!more || disable"
        :shadow="!$q.dark.isActive">
        <img src="/images/icons/next.svg" width="24" height="24" class="invert" alt="Tradurs Next Icon" />
      </D4Btn>
    </div>
  </template>
</template>

<style scoped>
.sort:deep(.q-field__control:before) {
  background-color: inherit;
}

.sort:deep(.q-field__control-container),
.sort:deep(.q-field__control),
.sort:deep(.q-field__native),
.sort:deep(.q-field__marginal) {
  height: 30px !important;
  min-height: 30px !important;
  padding: 0 !important;
}

.sticky-place {
  position: sticky;
  bottom: 8%;
  z-index: 1;
  pointer-events: none;
}

@media (max-width:600px) {
  .sticky-place {
    bottom: 10px;
  }
}

.paging {
  position: absolute;
  transform: translateY(-90%);
}

.item-list:deep(.item:not(.reward) .card-item:not(.editable) .filtered) {
  background-color: rgba(250, 200, 0);
  color: black;
  font-weight: 700;
  border-radius: 4px;
  padding-right: 6px;
}

.item-list:deep(.item:not(.reward) .card-item:not(.editable) .filtered .minmax-text) {
  color: rgba(110, 110, 110, 1) !important;
}

@media (max-width:600px) {
  .item-list:deep(.item:not(.reward) .card-item:not(.editable) .filtered) {
    line-height: 14px;
  }
}
</style>