<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useItemStore } from 'stores/item-store'
import { useAccountStore } from 'stores/account-store'
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { scrollPos } from 'src/common'

import { Item } from 'src/types/item'
import { icons } from 'src/common/icons'
import D4Items from 'components/D4Items.vue'

// init module
const route = useRoute()
const router = useRouter()
const is = useItemStore()
const as = useAccountStore()
const { t } = useI18n({ useScope: 'global' })
const $q = useQuasar()

// loading variable
const disable = ref(false)

// variable
const position = computed(() => as.position)
const newItems = computed(() => is.socket.newItems)
const newOffer = computed(() => is.socket.newOffer)
const acceptedOffer = computed(() => is.socket.acceptedOffer)
const complete = computed(() => is.socket.complete)
const filter = computed(() => is.filter.request)
const itemsRef = ref<typeof D4Items | null>(null)
const items = ref<Array<Item>>([])
const page = computed(() => route.query.page ? Number.parseInt(route.query.page.toString()) : 1)
const over = computed(() => is.page.over)
const more = computed(() => is.page.more)

// insert or update item
const upsertItem = (item: Item, done: Function) => {
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)
  disable.value = true
  is[item.itemId !== '' ? 'updateItem' : 'addItem'](item)
    .then((response) => {
      Object.assign(item, response)
      is.clearFilter()
      if (findIndex !== -1)
        items.value.splice(findIndex, 1, item)
      else {
        as.checkSign(true)
        is.clearFilter()
        if (page.value !== 1)
          router.push({ name: 'tradeList', query: { page: 1 } })
        else
          getList(is.filter)
      }

      itemsRef.value?.hideEditable()

      if (findIndex === -1)
        scrollPos()

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
        disable.value = false
      })
  }
}

const relistItem = (item: Item, done: Function) => {
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)
  if (findIndex !== -1) {
    disable.value = true
    is.relistItem(item.itemId)
      .then(() => {
        const relistItem = items.value.splice(findIndex, 1)
        as.checkSign(true)
        items.value.unshift(...relistItem)
        itemsRef.value?.hideEditable()
        scrollPos()
        disable.value = false
      })
      .catch(() => {
        done()
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
        disable.value = false
      })
  }
}

const updateOnly = (itemId: string) => {
  const findItem = items.value.find((i) => i.itemId === itemId)

  if (findItem) {
    disable.value = true
    is.getItems(page.value, itemId)
      .then((result: Array<Item>) => {
        if (result.length > 0)
          Object.assign(findItem, result[0])
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
  router.push({ name: 'tradeList', query: { page: page.value - 1 } })
}

const next = () => {
  router.push({ name: 'tradeList', query: { page: page.value + 1 } })
}

const create = (item?: Item) => {
  itemsRef.value?.create(item)
}

const getList = (filter?: any) => {
  is.clearSocket()
  is.filter.loading = true

  items.value =
    Array.from({ length: 3 }, () => {
      const item = new Item()
      item.loading = true
      item.user.loading = true
      item.price.loading = true
      return item
    })

  is.getItems(page.value, undefined, filter)
    .then((result: Array<Item>) => {
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
      scrollPos(position.value.top, 'auto')
    }).catch(() => {
      items.value = []
    }).then(() => {
      is.filter.loading = false
      disable.value = false
    })
}

const notify = (group: string, message: string, actionLabel: string, action: Function) => {
  $q.notify({
    group,
    progress: true,
    multiLine: true,
    message,
    actions: [
      {
        label: actionLabel, color: 'white', handler: () => { action() }
      }
    ]
  })
}

watch(page, () => {
  scrollPos()
  getList(is.filter)
})

watch(newItems, (val: number) => {
  if (val > 0)
    notify('newItems', t('messages.newItems', val), t('btn.refresh'), () => {
      itemsRef.value?.hideEditable()
      itemsRef.value?.hideOffers()
      as.position = { left: 0, top: 0 }
      getList()
    })
})

watch(newOffer, (val: string | null) => {
  if (val)
    notify('', t('messages.newOffer'), t('btn.move'), () => {
      router.push({ name: 'itemInfo', params: { itemid: val }, state: { offers: true } })
    })
})

watch(acceptedOffer, (val: { itemName: string, itemId: string } | null) => {
  if (val)
    notify('', t('messages.acceptedOffer', { in: val.itemName }), t('btn.move'), () => { router.push({ name: 'itemInfo', params: { itemid: val.itemId }, state: { offers: true } }) })
})

watch(complete, (val: { itemName: string, itemId: string } | null) => {
  if (val)
    notify('', t('messages.complete', { in: val.itemName }), t('btn.move'), () => { router.push({ name: 'itemInfo', params: { itemid: val.itemId }, state: { offers: true } }) })
})

watch(filter, (val, old) => {
  if (Number.isInteger(val) && val !== old) {
    router.push({ name: 'tradeList', query: { page: 1 } })
    getList(is.filter)
  }
})

onMounted(() => {
  as.position = { top: 0, left: 0 }
  getList()
})

onUnmounted(() => {
  is.clearFilter()
})
</script>
<template>
  <div class="row q-gutter-xs items-center sticky-first">
    <D4Btn round @click="prev" color="var(--q-magic)" :disable="!over || disable" shadow>
      <img :src="icons.prev" width="24" height="24" class="invert" alt="icon_prev" />
    </D4Btn>
    <D4Btn round @click="next" color="var(--q-magic)" :disable="!more || disable" shadow>
      <img :src="icons.next" width="24" height="24" class="invert" alt="icon_next" />
    </D4Btn>
  </div>
  <D4Btn v-if="as.signed" round @click="create" class="sticky-second" color="var(--q-secondary)" :disable="disable"
    shadow>
    <img :src="icons.add" width="24" height="24" class="invert" alt="icon_add" />
  </D4Btn>
  <div>
    <div class="row justify-center items-center">
      <D4Items ref="itemsRef" :items="items" :loading="disable" @upsert-item="upsertItem" @delete-item="deleteItem"
        @relist-item="relistItem" @status-item="statusItem" @update-only="updateOnly" @copy="copy" @favorite="favorite" />
    </div>
  </div>
</template>

<style scoped>
.sticky-first {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1;
  transform: translateY(-100%);
}

.sticky-second {
  position: sticky;
  top: 90%;
  left: 100%;
  z-index: 1;
}
</style>
