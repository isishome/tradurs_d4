<script lang="ts">
import { useGlobalStore } from 'src/stores/global-store'
import { useItemStore } from 'stores/item-store'


export default {
  preFetch({ store, currentRoute }) {
    const is = useItemStore(store)
    const gs = useGlobalStore(store)

    is.clearSocket()

    return is.getItems(1, currentRoute.params.itemid)
      .then((result: Array<Item>) => {
        if (result.length > 0) {
          result[0].expanded = true
          gs.itemName = result[0].name
          is.detailItem.push(result[0])
        }
      }, () => { })
  }
}
</script>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, computed, watch, onUnmounted, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useAccountStore } from 'stores/account-store'
import { Item } from 'src/types/item'

import { icons } from 'src/common/icons'
import D4Items from 'components/D4Items.vue'

const props = defineProps<{
  itemid: string
}>()

// init module
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const $q = useQuasar()
const is = useItemStore()
const gs = useGlobalStore()
const as = useAccountStore()

// loading variable
const disable = ref(false)
const newItems = computed(() => is.socket.newItems)
const newOffer = computed(() => is.socket.newOffer)
const acceptedOffer = computed(() => is.socket.acceptedOffer)
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
        as.checkSign(true)
        is.clearFilter()
        router.push({ name: 'tradeList', query: { page: 1 } })
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
      router.push({ name: 'tradeList' })
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
      as.checkSign(true)
      router.push({ name: 'tradeList' })
    })
    .catch(() => {
      done()
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
      disable.value = false
    })
}

const updateOnly = (itemId: string, cb?: Function) => {
  disable.value = true
  is.getItems(1, itemId)
    .then((result: Array<Item>) => {
      if (result.length > 0)
        is.detailItem.splice(0, 1, result[0])

      if (cb)
        cb()

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

watch(() => props.itemid, (val, old) => {
  if (val && val !== old)
    getItem()
})

watch(newItems, (val: number) => {
  if (val > 0)
    notify('newItems', t('messages.newItems', val), t('btn.refresh'), () => {
      router.push({ name: 'tradeList' })
    })
})

watch(newOffer, (val: string | null) => {
  if (val)
    notify('', t('messages.newOffer'), t('btn.move'), () => {
      if (props.itemid === val)
        itemsRef.value?.openOffers(props.itemid)
      else
        router.push({ name: 'itemInfo', params: { itemid: val }, state: { offers: true } })
    })
})

watch(acceptedOffer, (val: { itemName: string, itemId: string } | null) => {
  if (val)
    notify('', t('messages.acceptedOffer', { in: val.itemName }), t('btn.move'), () => {
      if (props.itemid === val.itemId)
        itemsRef.value?.openOffers(props.itemid)
      else
        router.push({ name: 'itemInfo', params: { itemid: val.itemId }, state: { offers: true } })
    })
})

watch(complete, (val: { itemName: string, itemId: string } | null) => {
  if (val)
    notify('', t('messages.complete', { in: val.itemName }), t('btn.move'), () => {
      if (props.itemid === val.itemId) {
        updateOnly(props.itemid, () => {
          itemsRef.value?.openOffers(props.itemid)
        })
      }
      else
        router.push({ name: 'itemInfo', params: { itemid: val.itemId }, state: { offers: true } })
    })
})

onMounted(() => {
  if (history.state.offers) {
    itemsRef.value?.openOffers(props.itemid)
    history.state.offers = false
  }
})

onUnmounted(() => {
  gs.itemName = null
  is.detailItem.splice(0, 1)
})
</script>

<template>
  <D4Btn round :to="{ name: 'tradeList' }" class="sticky" color="var(--q-light-normal)" shadow>
    <img :src="icons.list" width="20" height="20" class="invert" alt="icon_list" />
  </D4Btn>
  <div>
    <div class="row justify-center items-center">
      <D4Items ref="itemsRef" :items="is.detailItem" :loading="disable" @upsert-item="upsertItem"
        @delete-item="deleteItem" @relist-item="relistItem" @status-item="statusItem" @update-only="updateOnly"
        @copy="copy" @favorite="favorite" />
    </div>
  </div>
</template>

<style scoped>
.sticky {
  position: sticky;
  top: 90%;
  left: 100%;
  z-index: 1;
}
</style>
