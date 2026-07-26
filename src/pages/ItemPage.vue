<script lang="ts">
import { useGlobalStore } from 'src/stores/global-store'
import {
  useItemStore,
  type OfferInfo,
  type RelatedItems
} from 'stores/item-store'
import { Item, IPrice } from 'src/types/item'

export default {
  async preFetch({ store, currentRoute, ssrContext }) {
    const is = useItemStore(store)
    const gs = useGlobalStore(store)
    const request = ++is.detailRequest

    is.clearSocket()

    const tempItem = new Item()
    tempItem.quality = 'normal'
    tempItem.loading = true
    tempItem.user.loading = true
    tempItem.price.loading = true
    is.detailItem.splice(0, 1, tempItem)

    const options = process.env.SERVER
      ? {
          headers: {
            Cookie: ssrContext?.req.headers['cookie'],
            'Accept-Language': currentRoute.params.lang || 'ko'
          }
        }
      : undefined

    is.relatedItems = { sellerItems: [], similarItems: [] }

    return is
      .getItems(1, currentRoute.params.itemid, options)
      .then(async (result: Array<Item>) => {
        if (request !== is.detailRequest) return

        if (result.length === 0) {
          is.detailItem.splice(0, 1)
          return
        }

        result[0].expanded = true
        gs.itemName = result[0].name
        is.detailItem.splice(0, 1, result[0])

        try {
          const relatedItems = await is.getRelatedItems(
            result[0].itemId,
            options
          )
          if (request === is.detailRequest) is.relatedItems = relatedItems
        } catch {
          if (request === is.detailRequest)
            is.relatedItems = { sellerItems: [], similarItems: [] }
        }
      })
      .catch(() => {
        if (request === is.detailRequest) {
          is.detailItem.splice(0, 1)
          is.relatedItems = { sellerItems: [], similarItems: [] }
        }
      })
  }
}
</script>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, watch, onUnmounted, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar, uid } from 'quasar'
import { useAccountStore } from 'stores/account-store'

import D4Items from 'components/D4Items.vue'
import D4Filter from 'components/D4Filter.vue'
import D4ItemSlider from 'components/item/D4ItemSlider.vue'
import { formatGoldCompact } from 'src/utils/price'

const props = defineProps<{
  itemid: string
  filter?: InstanceType<typeof D4Filter>
}>()

// init module
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })
const $q = useQuasar()
const is = useItemStore()
const gs = useGlobalStore()
const as = useAccountStore()

// loading variable
const completeInfo = ref(false)
const disable = ref(false)
const relatedLoading = ref(false)
const newItems = computed(() => is.socket.newItems)
const newOffer = computed(() => is.socket.newOffer)
const acceptedOffer = computed(() => is.socket.acceptedOffer)
const retractedOffer = computed(() => is.socket.retractedOffer)
const turnedDownOffer = computed(() => is.socket.turnedDownOffer)
const complete = computed(() => is.socket.complete)

// variable
const itemsRef = ref<typeof D4Items | null>(null)
let detailController: AbortController | null = null

const clearRelatedItems = () => {
  is.relatedItems = { sellerItems: [], similarItems: [] }
}

const loadRelatedItems = async (
  itemId: string,
  request: number,
  options?: { signal?: AbortSignal }
) => {
  relatedLoading.value = true
  clearRelatedItems()

  try {
    const relatedItems: RelatedItems = await is.getRelatedItems(itemId, options)
    if (request === is.detailRequest && props.itemid === itemId)
      is.relatedItems = relatedItems
  } catch {
    if (request === is.detailRequest) clearRelatedItems()
  } finally {
    if (request === is.detailRequest) relatedLoading.value = false
  }
}

// insert or update item
const upsertItem = (item: Item, done: Function) => {
  disable.value = true

  is[item.itemId !== '' ? 'updateItem' : 'addItem'](item)
    .then((response) => {
      if (item.itemId !== '') {
        is.getItems(1, item.itemId).then((result: Array<Item>) => {
          if (result.length > 0) {
            is.detailItem[0].itemId = 'ready'
            nextTick(() => {
              is.detailItem.splice(0, 1, result[0])
            })
          }
        })
      } else {
        as.checkSign()
        props.filter?.clearFilter()
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

const relistItem = (item: Item, done: Function) => {
  disable.value = true
  is.relistItem(item.itemId)
    .then(() => {
      as.checkSign()
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
        is.detailItem[0].statusCode =
          is.detailItem[0].statusCode === '000' ? '002' : '000'
      itemsRef.value?.hideEditable()
      disable.value = false
    })
    .catch(() => {
      done()
      updateOnly(item.itemId)
      disable.value = false
    })
}

const reRegisterItem = (item: Item, done: Function) => {
  disable.value = true
  is.reRegisterItem(item.itemId)
    .then(() => {
      as.checkSign()
      router.push({ name: 'tradeList', params: { lang: route.params.lang } })
    })
    .catch(() => {
      done()
      updateOnly(item.itemId)
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

const updateOnly = (itemId: string, cb?: Function) => {
  disable.value = true
  is.getItems(1, itemId)
    .then((result: Array<Item>) => {
      if (result.length > 0) {
        result[0].expanded = true
        is.detailItem.splice(0, 1, result[0])
      }

      if (cb) cb(is.detailItem[0])
    })
    .catch(() => {})
    .then(() => {
      disable.value = false
    })
}

const copy = (itemId: string) => {
  if (itemId === is.detailItem[0].itemId)
    itemsRef.value?.copyItem(is.detailItem[0])
}
const favorite = (itemId: string, favorite: boolean) => {
  is.favorite(itemId, favorite).then(() => {
    if (!!favorite)
      $q.notify({
        icon: 'img:/images/icons/check.svg',
        color: 'positive',
        classes: '',
        message: t('messages.favorite')
      })
    if (is.detailItem.length > 0) is.detailItem[0].favorite = favorite
  })
}

const getItem = () => {
  const request = ++is.detailRequest
  detailController?.abort()
  const controller = new AbortController()
  const itemId = props.itemid
  detailController = controller

  is.clearSocket()
  clearRelatedItems()
  relatedLoading.value = true

  const tempItem = new Item()
  tempItem.quality = 'normal'
  tempItem.loading = true
  tempItem.user.loading = true
  tempItem.price.loading = true
  is.detailItem.splice(0, 1, tempItem)

  is.getItems(1, itemId, { signal: controller.signal })
    .then((result: Array<Item>) => {
      if (request !== is.detailRequest || props.itemid !== itemId) return

      if (result.length > 0) {
        result[0].loading = false
        result[0].expanded = true
        result[0].user.loading = false
        result[0].price.loading = false

        is.detailItem.splice(0, 1, result[0])
        return loadRelatedItems(result[0].itemId, request, {
          signal: controller.signal
        })
      } else {
        is.detailItem.splice(0, 1)
        relatedLoading.value = false
      }
    })
    .catch(() => {
      if (request === is.detailRequest) {
        is.detailItem.splice(0, 1)
        clearRelatedItems()
        relatedLoading.value = false
      }
    })
    .then(() => {
      if (request !== is.detailRequest) return

      disable.value = false

      if (history.state.offers) {
        itemsRef.value?.openOffers(props.itemid)
        history.state.offers = false
      }
    })
}

const notify = (
  group: string,
  message: string,
  caption: string,
  actionLabel: string,
  action: Function
) => {
  const genGroup = group === '' ? uid() : group

  $q.notify({
    group: genGroup,
    progress: true,
    multiLine: true,
    message,
    caption,
    actions: [
      {
        label: actionLabel,
        color: 'white',
        handler: () => {
          action()
        }
      }
    ]
  })
}

const parseOfferPrice = (priceStr?: string) => {
  const price: IPrice = JSON.parse(priceStr || '{}')
  const currencyName =
    price.currency === 'gold'
      ? t('item.gold')
      : price.currency === 'summoning'
        ? is.summonings.find((s) => s.value === price.currencyValue)?.label
        : price.currency === 'gem'
          ? is.gems.find((g) => g.value === price.currencyValue)?.label
          : ''
  const currencyValue =
    price.currency === 'gold'
      ? ` : ${formatGoldCompact(price.currencyValue, locale.value)}`
      : ['summoning', 'gem'].includes(price.currency ?? '')
        ? ` x ${price.quantity}`
        : ''

  return { currencyName, currencyValue }
}

watch(
  () => props.itemid,
  (val, old) => {
    if (val && val !== old) getItem()
  }
)

watch(newItems, (val: number) => {
  if (val > 0)
    notify(
      'newItems',
      t('messages.newItems', val),
      '',
      t('btn.refresh'),
      () => {
        is.socket.newItems = 0
        router.push({ name: 'tradeList', params: { lang: route.params.lang } })
      }
    )
})

watch(newOffer, (val: OfferInfo | null) => {
  if (val) {
    const parsing = parseOfferPrice(val.price)
    notify(
      '',
      t('messages.newOffer'),
      `[${val.itemName}] ${parsing.currencyName}${parsing.currencyValue}`,
      t('btn.move'),
      () => {
        if (props.itemid === val.itemId) {
          updateOnly(val.itemId, () => {
            itemsRef.value?.openOffers(props.itemid)
          })
        } else
          router.push({
            name: 'itemInfo',
            params: { lang: route.params.lang, itemid: val.itemId },
            state: { offers: true }
          })
      }
    )
  }
})

watch(acceptedOffer, (val: OfferInfo | null) => {
  if (val) {
    const parsing = parseOfferPrice(val.price)
    notify(
      '',
      t('messages.acceptedOffer'),
      `[${val.itemName}] ${parsing.currencyName}${parsing.currencyValue}`,
      t('btn.move'),
      () => {
        if (props.itemid === val.itemId) {
          updateOnly(val.itemId, () => {
            itemsRef.value?.openOffers(props.itemid)
          })
        } else
          router.push({
            name: 'itemInfo',
            params: { lang: route.params.lang, itemid: val.itemId },
            state: { offers: true }
          })
      }
    )
  }
})

watch(retractedOffer, (val: OfferInfo | null) => {
  if (val) {
    const parsing = parseOfferPrice(val.price)
    notify(
      '',
      t('messages.retractedOffer'),
      `[${val.itemName}] ${parsing.currencyName}${parsing.currencyValue}`,
      t('btn.move'),
      () => {
        if (props.itemid === val.itemId) {
          updateOnly(val.itemId, () => {
            itemsRef.value?.openOffers(props.itemid)
          })
        } else
          router.push({
            name: 'itemInfo',
            params: { lang: route.params.lang, itemid: val.itemId },
            state: { offers: true }
          })
      }
    )
  }
})

watch(turnedDownOffer, (val: OfferInfo | null) => {
  if (val) {
    const parsing = parseOfferPrice(val.price)
    notify(
      '',
      t('messages.turnedDownOffer'),
      `[${val.itemName}] ${parsing.currencyName}${parsing.currencyValue}`,
      t('btn.move'),
      () => {
        if (props.itemid === val.itemId) {
          updateOnly(val.itemId, () => {
            itemsRef.value?.openOffers(props.itemid)
          })
        } else
          router.push({
            name: 'itemInfo',
            params: { lang: route.params.lang, itemid: val.itemId },
            state: { offers: true }
          })
      }
    )
  }
})

watch(complete, (val: { itemName: string; itemId: string } | null) => {
  if (val)
    notify(
      '',
      t('messages.complete', { in: val.itemName }),
      '',
      t('btn.move'),
      () => {
        if (props.itemid === val.itemId) {
          updateOnly(props.itemid, () => {
            itemsRef.value?.openOffers(props.itemid)
          })
        } else
          router.push({
            name: 'itemInfo',
            params: { lang: route.params.lang, itemid: val.itemId },
            state: { offers: true }
          })
      }
    )
})

onMounted(() => {
  if (history.state.offers) {
    itemsRef.value?.openOffers(props.itemid)
    history.state.offers = false
  }

  setTimeout(() => {
    completeInfo.value = true
  }, 100)
})

onUnmounted(() => {
  is.detailRequest++
  detailController?.abort()
  detailController = null
  gs.itemName = null
  is.detailItem.splice(0, is.detailItem.length)
  clearRelatedItems()
})
</script>

<template>
  <div>
    <div class="top-space"></div>
    <div class="row justify-center items-center">
      <D4Items
        ref="itemsRef"
        :items="is.detailItem"
        @upsert-item="upsertItem"
        @delete-item="deleteItem"
        @relist-item="relistItem"
        @status-item="statusItem"
        @reregister-item="reRegisterItem"
        @update-only="updateOnly"
        @copy="copy"
        @favorite="favorite"
      />
    </div>
    <div
      v-if="
        relatedLoading ||
        is.relatedItems.sellerItems.length > 0 ||
        is.relatedItems.similarItems.length > 0
      "
      class="related-panel"
    >
      <div class="related-sections column q-px-md">
        <D4ItemSlider
          :items="is.relatedItems.sellerItems"
          :loading="relatedLoading"
          :label="t('relatedItems.sellerTitle')"
          :previous-label="t('relatedItems.previous')"
          :next-label="t('relatedItems.next')"
        />
        <D4ItemSlider
          :items="is.relatedItems.similarItems"
          :loading="relatedLoading"
          :label="t('relatedItems.similarTitle')"
          :previous-label="t('relatedItems.previous')"
          :next-label="t('relatedItems.next')"
        />
      </div>
    </div>
    <div class="q-py-lg"></div>
    <D4Btn
      v-if="completeInfo"
      round
      :to="{ name: 'tradeList', params: { lang: route.params.lang } }"
      class="sticky-btn"
      color="var(--q-light-normal)"
      shadow
    >
      <img
        src="/images/icons/list.svg"
        width="20"
        height="20"
        class="invert"
        alt="Tradurs List Icon"
      />
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

.related-panel {
  margin-top: 104px;
  padding: 48px 0 56px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.025);
}

.body--light .related-panel {
  border-top-color: rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.018);
}

.related-sections {
  gap: 72px;
}

@media (max-width: 600px) {
  .related-panel {
    margin-top: 64px;
    padding: 32px 0 40px;
  }

  .related-sections {
    gap: 48px;
  }
  .sticky-btn {
    bottom: 10px;
  }
}
</style>
