<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useGlobalStore } from 'stores/global-store'
import { useItemStore, type OfferInfo, type AwardsPick, type IErrorItem, Sort } from 'stores/item-store'
import { useAccountStore } from 'stores/account-store'
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar, uid } from 'quasar'
import { Item, IPrice } from 'src/types/item'
import { scrollPos } from 'src/common'

import D4Items from 'components/D4Items.vue'
import D4Filter from 'components/D4Filter.vue'

interface IProps {
  filter?: InstanceType<typeof D4Filter>
}

const props = withDefaults(defineProps<IProps>(), {})

// init module
const route = useRoute()
const router = useRouter()
const is = useItemStore()
const gs = useGlobalStore()
const as = useAccountStore()
const { t, tm, n } = useI18n({ useScope: 'global' })
const $q = useQuasar()

// loading variable
const completeList = ref(false)
const disable = ref(false)

// variable
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
const listHeaderRef = ref<HTMLDivElement | undefined>()
const stickyTop = ref<number>(0)
const selectedAll = ref<boolean>(false)
const sortOptions = reactive<Array<{ value: string, label: string }>>(tm('sort.options'))
const isExpanded = computed(() => is.storage.data.expanded)
const noSelected = computed(() => items.value.filter(i => i.selected).length === 0)
const selectAction = ref<boolean>(false)
const errorInfo = reactive<{ show: boolean, title: string, items: Array<IErrorItem> }>({
  show: false,
  title: '',
  items: []
})

const updateSort = (sortValue: Sort) => {
  is.sort = sortValue
  reload()
}

const reload = () => {
  if (page.value === 1)
    getList(true)
  else
    router.push({ name: 'tradeList', params: { lang: route.params.lang }, query: { page: 1 }, state: { scrollTop: true } })
}


// insert or update item
const upsertItem = (item: Item, done: Function) => {
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)

  disable.value = true
  is[item.itemId !== '' ? 'updateItem' : 'addItem'](item)
    .then(() => {
      if (findIndex !== -1) {
        is.getItems(1, item.itemId)
          .then((result: Array<Item>) => {
            if (result.length > 0)
              items.value.splice(findIndex, 1, result[0])
          })
      }
      else {
        as.retrieve()
        props.filter?.clearFilter()
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

const relistItem = (item: Item, done: Function) => {
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)
  if (findIndex !== -1) {
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

const reRegisterItem = (item: Item, done: Function) => {
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)
  if (findIndex !== -1) {
    disable.value = true
    is.reRegisterItem(item.itemId)
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

const getList = async (scrollTop?: boolean) => {
  is.filter.loading = true
  disable.value = true

  items.value =
    Array.from({ length: items.value.length || is.itemPage.rows }, () => {
      const item = new Item()
      item.quality = 'normal'
      item.loading = true
      item.expanded = isExpanded.value
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
      items.value.forEach(i => i.expanded = isExpanded.value)

    }).catch(() => {
      items.value = []
    }).then(() => {
      is.filter.loading = false
      disable.value = false
      setTimeout(() => {
        completeList.value = true
        if (!!scrollTop)
          scrollPos()
      }, 100)
    })

  rewardItem.value = undefined

  if (page.value === 1 && !isDefaultFilter.value) {
    const awardsPick = is.awardsPick.filter((ap: AwardsPick) => ap.hardcore === is.storage.data.hardcore && ap.ladder === is.storage.data.ladder)
    if (awardsPick.length > 0) {
      const pickItemId = awardsPick[Math.floor(Math.random() * awardsPick.length)].itemId.toString()
      is.getItems(1, pickItemId)
        .then((pick: Array<Item>) => {
          rewardItem.value = pick.map((p: Item) => ({ ...p, reward: true, expanded: isExpanded.value }))?.[0]
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

const selectAll = (val: boolean) => {
  items.value.forEach(i => i.selected = val)

  if (rewardItem.value)
    rewardItem.value.selected = val
}

const itemInfo = (item?: Item) => {
  return {
    name: item?.itemTypeValue1 === 'gem' ? is.gems.find(g => g.value === item?.itemTypeValue2)?.label ?? '' :
      item?.itemTypeValue1 === 'elixir' ? is.elixirs.find(e => e.value === item?.itemTypeValue2)?.label ?? '' :
        item?.itemTypeValue1 === 'summoning' ? is.summonings.find(s => s.value === item?.itemTypeValue2)?.label ?? '' :
          item?.name ?? '',
    quality: item?.quality
  }
}

const relistItems = () => {
  $q.dialog({
    title: t('relistItems.title'),
    message: `<div class="text-subtitle1">${t('relistItems.subTitle')}</div><div class="q-mt-xs text-caption text-red-6">${t('relistItems.message')}</div>`,
    html: true,
    persistent: true,
    cancel: { label: t('btn.cancel'), noCaps: true, color: 'grey', outline: true },
    ok: { label: t('btn.accept'), noCaps: true, color: 'primary', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'fade',
    transitionHide: 'fade',
    noRouteDismiss: true,
    class: 'q-pa-sm'
  }).onOk(() => {
    gs.loading = true
    disable.value = true
    is.filter.loading = true
    selectAction.value = false
    is.relistItems(items.value.filter(i => i.selected).map(i => i.itemId))
      .then((erroritems: Array<IErrorItem>) => {
        if (erroritems.length > 0) {
          errorInfo.title = t('relistItems.failedTitle')
          errorInfo.show = true
          errorInfo.items.splice(0, errorInfo.items.length)
          errorInfo.items.push(...erroritems.map(i => ({ ...i, ...itemInfo(items.value.find(it => it.itemId === i.itemId.toString())) })))
        }
      })
      .catch(() => { })
      .then(() => {
        as.retrieve()

        is.filter.loading = false
        disable.value = false
        gs.loading = false

        selectAll(false)
        selectedAll.value = false
        reload()
      })
  })
}

const statusItems = (status: string) => {
  const statusWord = t(`btn.${status}`)
  $q.dialog({
    title: t('statusItems.title', { type: statusWord }),
    message: `<div class="text-subtitle1">${t('statusItems.subTitle', { type: statusWord })}</div><div class="q-mt-xs text-caption text-red-6">${t('statusItems.message', { type: statusWord })}</div>`,
    html: true,
    persistent: true,
    cancel: { label: t('btn.cancel'), noCaps: true, color: 'grey', outline: true },
    ok: { label: t('btn.accept'), noCaps: true, color: 'primary', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'fade',
    transitionHide: 'fade',
    noRouteDismiss: true,
    class: 'q-pa-sm'
  }).onOk(() => {
    gs.loading = true
    disable.value = true
    is.filter.loading = true
    selectAction.value = false
    is.statusItems(items.value.filter(i => i.selected).map(i => i.itemId), status)
      .then((erroritems: Array<IErrorItem>) => {
        if (erroritems.length > 0) {
          errorInfo.title = t('statusItems.failedTitle', { type: statusWord })
          errorInfo.show = true
          errorInfo.items.splice(0, errorInfo.items.length)
          errorInfo.items.push(...erroritems.map(i => ({ ...i, ...itemInfo(items.value.find(it => it.itemId === i.itemId.toString())) })))
        }
      })
      .catch(() => { })
      .then(() => {
        is.filter.loading = false
        disable.value = false
        gs.loading = false

        selectAll(false)
        selectedAll.value = false
        reload()
      })
  })
}

const reRegisterItems = () => {
  $q.dialog({
    title: t('reRegisterItems.title'),
    message: `<div class="text-subtitle1">${t('reRegisterItems.subTitle')}</div><div class="q-mt-xs text-caption text-red-6">${t('reRegisterItems.message')}</div>`,
    html: true,
    persistent: true,
    cancel: { label: t('btn.cancel'), noCaps: true, color: 'grey', outline: true },
    ok: { label: t('btn.accept'), noCaps: true, color: 'primary', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'fade',
    transitionHide: 'fade',
    noRouteDismiss: true,
    class: 'q-pa-sm'
  }).onOk(() => {
    gs.loading = true
    disable.value = true
    is.filter.loading = true
    selectAction.value = false
    is.reRegisterItems(items.value.filter(i => i.selected).map(i => i.itemId))
      .then((erroritems: Array<IErrorItem>) => {
        if (erroritems.length > 0) {
          errorInfo.title = t('reRegisterItems.failedTitle')
          errorInfo.show = true
          errorInfo.items.splice(0, errorInfo.items.length)
          errorInfo.items.push(...erroritems.map(i => ({ ...i, ...itemInfo(items.value.find(it => it.itemId === i.itemId.toString())) })))
        }
      })
      .catch(() => { })
      .then(() => {
        as.retrieve()

        is.filter.loading = false
        disable.value = false
        gs.loading = false

        selectAll(false)
        selectedAll.value = false
        reload()
      })
  })
}

const deleteItems = () => {
  $q.dialog({
    title: t('deleteItems.title'),
    message: `<div class="text-subtitle1">${t('deleteItems.subTitle')}</div><div class="q-mt-xs text-caption text-red-6">${t('deleteItems.message')}</div>`,
    html: true,
    persistent: true,
    cancel: { label: t('btn.cancel'), noCaps: true, color: 'grey', outline: true },
    ok: { label: t('btn.delete'), noCaps: true, color: 'negative', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'fade',
    transitionHide: 'fade',
    noRouteDismiss: true,
    class: 'q-pa-sm'
  }).onOk(() => {
    gs.loading = true
    disable.value = true
    is.filter.loading = true
    selectAction.value = false
    is.deleteItems(items.value.filter(i => i.selected).map(i => i.itemId))
      .then((erroritems: Array<IErrorItem>) => {
        if (erroritems.length > 0) {
          errorInfo.title = t('deleteItems.failedTitle')
          errorInfo.show = true
          errorInfo.items.splice(0, errorInfo.items.length)
          errorInfo.items.push(...erroritems.map(i => ({ ...i, ...itemInfo(items.value.find(it => it.itemId === i.itemId.toString())) })))
        }
      })
      .catch(() => { })
      .then(() => {
        as.retrieve()

        is.filter.loading = false
        disable.value = false
        gs.loading = false

        selectAll(false)
        selectedAll.value = false
        reload()
      })
  })
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
      props.filter?.clearFilter()
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
  stickyTop.value = listHeaderRef.value?.getBoundingClientRect().top ?? 0
  getList()
})
</script>

<template>
  <div ref="listHeaderRef">
    <div class="row justify-between items-start absolute full-width q-px-md list-header"
      :class="{ scroll: gs.scrollTop > stickyTop - gs.offsetTop }" :style="`top:${gs.offsetTop}px`">
      <div class="row items-center q-gutter-x-sm">
        <q-btn-dropdown v-if="as.signed && is.filter.mine" v-model="selectAction" :disable="disable" flat dense
          unelevated no-caps auto-close :ripple="false" class="no-hover"
          :content-style="{ 'borderRadius': '0 0 4px 4px', 'boxShadow': 'none' }" :class="{ active: selectAction }"
          transition-show="none" transition-hide="none" transition-duration="0"
          dropdown-icon="img:/images/icons/dropdown.svg">
          <template #label>
            <q-checkbox :dark="(!$q.dark.isActive && selectAction) || ($q.dark.isActive && !selectAction)"
              v-model="selectedAll" :label="t('selectAll')" dense size="xs" class="text-caption"
              @update:model-value="selectAll" />
            <q-separator :dark="(!$q.dark.isActive && selectAction) || ($q.dark.isActive && !selectAction)" vertical
              class="q-ml-md q-my-xs" />
          </template>
          <q-list :bordered="!$q.screen.lt.sm" class="text-caption no-border"
            :class="[{ 'cursor-not-allowed': noSelected }, $q.dark.isActive ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4']"
            dense>
            <q-item :dark="false" :class="{ 'no-pointer-events disabled': noSelected }" clickable @click="relistItems">
              <q-item-section>{{ t('btn.relist') }}</q-item-section>
            </q-item>
            <q-item :dark="false" :class="{ 'no-pointer-events disabled': noSelected }" clickable
              @click="statusItems('suspend')">
              <q-item-section>{{ t('btn.suspend') }}</q-item-section>
            </q-item>
            <q-item :dark="false" :class="{ 'no-pointer-events disabled': noSelected }" clickable
              @click="statusItems('resume')">
              <q-item-section>{{ t('btn.resume') }}</q-item-section>
            </q-item>
            <q-item :dark="false" :class="{ 'no-pointer-events disabled': noSelected }" clickable
              @click="reRegisterItems">
              <q-item-section>{{ t('btn.reRegister') }}</q-item-section>
            </q-item>
            <q-item :dark="false" :class="{ 'no-pointer-events disabled': noSelected }" clickable @click="deleteItems">
              <q-item-section class="text-red-6 text-weight-bold">{{ t('btn.delete')
                }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
      <q-select v-model="is.sort" :disable="disable" dense no-error-icon hide-bottom-space emit-value map-options
        options-dense borderless transition-show="none" transition-hide="none" :transition-duration="0"
        :options="sortOptions" menu-anchor="bottom end" menu-self="top end"
        dropdown-icon="img:/images/icons/dropdown.svg" class="sort text-caption"
        popup-content-class="scroll bordered text-caption" @update:model-value="updateSort" />
    </div>
    <div>
      <div class="row justify-center items-center">
        <D4Items ref="itemsRef" class="item-list" :items="items" :reward-item="rewardItem" @upsert-item="upsertItem"
          @delete-item="deleteItem" @relist-item="relistItem" @status-item="statusItem"
          @reregister-item="reRegisterItem" @update-only="updateOnly" @copy="copy" @favorite="favorite" />
      </div>
    </div>
    <div class="q-pt-xl"></div>
    <template v-if="completeList">
      <div class="sticky-place row justify-end">
        <div v-if="as.signed" class="row items-center q-gutter-x-xs relative-position">
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
    <D4Dialog v-model="errorInfo.show">
      <template #top>
        <q-card-section>
          <div class="q-pa-md text-h6 text-weight-bold">{{ errorInfo.title }}</div>
        </q-card-section>
      </template>
      <template #middle>
        <q-card-section>
          <div class="q-py-sm" :class="$q.screen.gt.sm ? 'text-body1' : 'text-body2'">
            <ul class="q-gutter-y-sm">
              <li v-for="item in errorInfo.items" :key="item.itemId">
                <div class="column items-start">
                  <div class="text-weight-bold" :style="`color:var(--q-light-${item.quality})`">
                    {{ item.name }}
                  </div>
                  <div class="text-caption">{{ item.message }}</div>
                </div>
              </li>
            </ul>
          </div>
        </q-card-section>
      </template>
      <template #bottom>
        <q-card-section :class="{ 'col-1': $q.screen.lt.sm }">
          <div class="row justify-end items-center q-gutter-sm q-px-md" :class="{ 'q-pt-lg': $q.screen.lt.sm }">
            <D4Btn :label="t('btn.confirm')" @click="() => errorInfo.show = false" />
          </div>
        </q-card-section>
      </template>
    </D4Dialog>
  </div>
</template>

<style scoped>
.list-header {
  position: sticky;
  z-index: 2000;
  border-radius: 0 0 10px 10px;
}

.list-header.scroll {
  background-color: var(--q-dark);
  box-shadow: 0 -1px 1px 0 var(--q-dark), 0 1px 1px 0 rgb(100, 100, 100), 1px 0 1px 0 var(--q-dark-border), -1px 0 1px 0 var(--q-dark-border);
}

.body--light .list-header.scroll {
  background-color: var(--q-light);
  box-shadow: 0 -1px 1px 0 var(--q-light), 0 4px 4px 2px rgba(0, 0, 0, 0.1), 0 4px 4px rgba(0, 0, 0, 0.14);
}

.list-header:deep(.active) {
  background-color: #e0e0e0;
  color: #424242;
}

.body--light .list-header:deep(.active) {
  background-color: #424242;
  color: #e0e0e0;
}

.list-header:deep(button.active) {
  border-radius: 4px 4px 0 0;
}

.body--light .list-header:deep(.active .q-btn-dropdown__arrow img) {
  filter: invert(100) !important;
}

.body--dark .list-header:deep(.active .q-btn-dropdown__arrow img) {
  filter: invert(0) !important;
}

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