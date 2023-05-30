<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useItemStore } from 'stores/item-store'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { scrollPos } from 'src/common'

import { Item } from 'src/types/item'
import { icons } from 'src/common/icons'
import D4Items from 'components/D4Items.vue'

const props = defineProps<{
  itemid: string
}>()

// init module
const router = useRouter()
const is = useItemStore()
const { t } = useI18n({ useScope: 'global' })
const $q = useQuasar()

// loading variable
const loadingAffixes = computed<boolean>(() => is.affixes.loading)
const loadingProperties = computed<boolean>(() => is.properties.loading)
const disable = ref(true)
const loading = computed<boolean>(
  () => loadingProperties.value || loadingAffixes.value || disable.value
)
const newItems = computed(() => is.socket.newItems)
const newOffer = computed(() => is.socket.newOffer)
const acceptedOffer = computed(() => is.socket.acceptedOffer)
const complete = computed(() => is.socket.complete)

// variable
const itemsRef = ref<typeof D4Items | null>(null)
const itemInfo = reactive<Item>(new Item())

// insert or update item
const upsertItem = (item: Item, done: Function) => {
  disable.value = true

  is.updateItem(item)
    .then((response) => {
      Object.assign(item, response)
      Object.assign(itemInfo, item)
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
      router.push({ name: 'item-list' })
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
      router.push({ name: 'item-list' })
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
      itemInfo.statusCode = itemInfo.statusCode === '000' ? '002' : '000'
      itemsRef.value?.hideEditable()
      disable.value = false
    })
    .catch(() => {
      done()
      disable.value = false
    })
}

const updateOnly = (itemId: string) => {
  disable.value = true
  is.getItems(itemId)
    .then((result: Array<Item>) => {
      if (result.length > 0)
        Object.assign(itemInfo, result[0])
    }).catch(() => {
    }).then(() => {
      disable.value = false
    })
}

const getItem = () => {
  is.clearSocket()

  const tempItem = new Item()
  tempItem.loading = true
  tempItem.user.loading = true
  tempItem.price.loading = true
  Object.assign(itemInfo, tempItem)

  is.getItems(props.itemid)
    .then((result: Array<Item>) => {
      if (result.length > 0) {
        const resultItem = result[0]
        resultItem.loading = false
        resultItem.expanded = true
        resultItem.user.loading = false
        resultItem.price.loading = false
        Object.assign(itemInfo, resultItem)
      }
    }).catch(() => {
      Object.assign(itemInfo, tempItem)
    }).then(() => {
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
      router.push({ name: 'item-list' })
    })
})

watch(newOffer, (val: string | null) => {
  if (val)
    notify('', t('messages.newOffer'), t('btn.move'), () => {
      if (props.itemid === val)
        itemsRef.value?.openOffers(props.itemid)
      else
        router.push({ name: 'item-detail', params: { itemid: val }, state: { offers: true } })
    })
})

watch(acceptedOffer, (val: { itemName: string, itemId: string } | null) => {
  if (val)
    notify('', t('messages.acceptedOffer', { in: val.itemName }), t('btn.move'), () => {
      if (props.itemid === val.itemId)
        itemsRef.value?.openOffers(props.itemid)
      else
        router.push({ name: 'item-detail', params: { itemid: val.itemId }, state: { offers: true } })
    })
})

watch(complete, (val: { itemName: string, itemId: string } | null) => {
  if (val)
    notify('', t('messages.complete', { in: val.itemName }), t('btn.move'), () => {
      if (props.itemid === val.itemId) {
        getItem()
        itemsRef.value?.openOffers(props.itemid)
      }
      else
        router.push({ name: 'item-detail', params: { itemid: val.itemId }, state: { offers: true } })
    })
})

onMounted(() => {
  getItem()
})
</script>

<template>
  <D4Btn round :to="{ name: 'item-list' }" class="sticky" color="var(--q-light-normal)" shadow>
    <img :src="icons.list" height="20" class="invert" />
  </D4Btn>
  <div>
    <div class="row justify-center items-center">
      <D4Items ref="itemsRef" :items="[itemInfo]" :loading="loading" @upsert-item="upsertItem" @delete-item="deleteItem"
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
