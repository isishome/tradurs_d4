<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useItemStore } from 'stores/item-store'
import { useAccountStore } from 'stores/account-store'
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { scrollPos } from 'src/common'

import { Item } from 'src/types/item'
import { icons } from 'src/common/icons'
import D4Items from 'components/D4Items.vue'
import { sleep } from 'src/common'

// init module
const router = useRouter()
const is = useItemStore()
const as = useAccountStore()
const { t } = useI18n({ useScope: 'global' })
const $q = useQuasar()

// loading variable
const loadingAffixes = computed<boolean>(() => is.affixes.loading)
const loadingProperties = computed<boolean>(() => is.properties.loading)
const disable = ref(true)
const loading = computed<boolean>(
  () => loadingProperties.value || loadingAffixes.value || disable.value
)

// variable
const position = computed(() => as.position)
const newItems = computed(() => is.socket.newItems)
const newOffer = computed(() => is.socket.newOffer)
const acceptedOffer = computed(() => is.socket.acceptedOffer)
const complete = computed(() => is.socket.complete)

const filter = computed(() => is.filter.request)

const itemsRef = ref<typeof D4Items | null>(null)
const items = ref<Array<Item>>([])

// insert or update item
const upsertItem = (item: Item, done: Function) => {
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)
  disable.value = true
  is[item.itemId !== '' ? 'updateItem' : 'addItem'](item)
    .then((response) => {
      Object.assign(item, response)
      if (findIndex !== -1)
        items.value.splice(findIndex, 1, item)
      else
        items.value.unshift(item)

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
    is.getItems(itemId)
      .then((result: Array<Item>) => {
        if (result.length > 0)
          Object.assign(findItem, result[0])
      }).catch(() => {
      }).then(() => {
        disable.value = false
      })
  }
}

const create = () => {
  itemsRef.value?.create()
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

  is.getItems(undefined, filter)
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

watch(newItems, (val: number) => {
  if (val > 0)
    notify('newItems', t('messages.newItems', val), t('btn.refresh'), () => {
      itemsRef.value?.hideEditable()
      itemsRef.value?.hideOffers()
      getList()
    })
})

watch(newOffer, (val: string | null) => {
  if (val)
    notify('', t('messages.newOffer'), t('btn.move'), () => {
      router.push({ name: 'item-detail', params: { itemid: val }, state: { offers: true } })
    })
})

watch(acceptedOffer, (val: { itemName: string, itemId: string } | null) => {
  if (val)
    notify('', t('messages.acceptedOffer', { in: val.itemName }), t('btn.move'), () => { router.push({ name: 'item-detail', params: { itemid: val.itemId }, state: { offers: true } }) })
})

watch(complete, (val: { itemName: string, itemId: string } | null) => {
  if (val)
    notify('', t('messages.complete', { in: val.itemName }), t('btn.move'), () => { router.push({ name: 'item-detail', params: { itemid: val.itemId }, state: { offers: true } }) })
})

watch(filter, (val, old) => {
  if (Number.isInteger(val) && val !== old)
    getList(is.filter)
})

onMounted(() => {
  getList()
})
</script>
<template>
  <D4Btn v-if="as.signed" round @click="create" class="sticky" color="var(--q-secondary)" :disable="disable" shadow>
    <img :src="icons.add" height="24" class="invert" />
  </D4Btn>
  <div>
    <div class="row justify-center items-center">
      <D4Items ref="itemsRef" :items="items" :loading="loading" @upsert-item="upsertItem" @delete-item="deleteItem"
        @relist-item="relistItem" @status-item="statusItem" @update-only="updateOnly" />
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
