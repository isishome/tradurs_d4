<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useItemStore } from 'stores/item-store'
import { useAccountStore } from 'stores/account-store'
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { scrollPos } from 'src/common'

import { Item } from 'src/types/item'
import { icons } from 'src/common/icons'
import D4Items from 'components/D4Items.vue'

// init module
const route = useRoute()
const router = useRouter()
const store = useItemStore()
const as = useAccountStore()
const { t } = useI18n({ useScope: 'global' })
const $q = useQuasar()

// common variable
const routeName = computed(() => route.name)

// loading variable
const loadingPowers = computed<boolean>(() => store.powers.loading)
const loadingAffixes = computed<boolean>(() => store.affixes.loading)
const loadingProperties = computed<boolean>(() => store.properties.loading)
const disable = ref(true)
const loading = computed<boolean>(
  () => loadingPowers.value || loadingProperties.value || loadingAffixes.value || disable.value
)
const newItems = computed(() => store.socket.newItems)
const newOffer = computed(() => store.socket.newOffer)
const acceptedOffer = computed(() => store.socket.acceptedOffer)

// variable
const itemsRef = ref<typeof D4Items | null>(null)
const items = ref<Array<Item>>([])

// insert or update item
const upsertItem = (item: Item, done: Function) => {
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)
  disable.value = true
  item.upsert(() => {
    if (findIndex !== -1)
      items.value.splice(findIndex, 1, item)
    else
      items.value.unshift(item)

    itemsRef.value?.hideEditable()

    if (findIndex === -1)
      scrollPos()

    disable.value = false
  }, () => {
    done()
    disable.value = false
  })
}

const deleteItem = (item: Item, done: Function) => {
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)

  if (findIndex !== -1) {
    disable.value = true
    item.delete(() => {
      items.value.splice(findIndex, 1)
      itemsRef.value?.hideEditable()
      disable.value = false
    }, () => {
      done()
      disable.value = false
    })
  }
}

const relistItem = (item: Item, done: Function) => {
  const findIndex = items.value.findIndex((i) => i.itemId === item.itemId)
  if (findIndex !== -1) {
    disable.value = true
    item.relist(() => {
      const relistItem = items.value.splice(findIndex, 1)
      items.value.unshift(...relistItem)
      itemsRef.value?.hideEditable()
      scrollPos()
      disable.value = false
    }, () => {
      done()
      disable.value = false
    })
  }
}

const statusItem = (item: Item, done: Function) => {
  const findItem = items.value.find((i) => i.itemId === item.itemId)
  if (findItem) {
    disable.value = true
    item.status(() => {
      findItem.statusCode = findItem.statusCode === '000' ? '002' : '000'
      itemsRef.value?.hideEditable()
      disable.value = false
    }, () => {
      done()
      disable.value = false
    })
  }
}

const updateOnly = (itemId: string) => {
  const findItem = items.value.find((i) => i.itemId === itemId)

  if (findItem) {
    disable.value = true
    store.getItems(itemId)
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

const getList = (itemId?: string | string[]) => {
  store.socket.newItems = 0
  store.socket.newOffer = null
  store.socket.acceptedOffer = null

  items.value =
    Array.from({ length: itemId ? 1 : 4 }, () => {
      const item = new Item()
      item.loading = true
      item.user.loading = true
      item.price.loading = true
      return item
    })

  store.getItems(itemId)
    .then((result: Array<Item>) => {
      let i = 0
      while (i < items.value.length) {
        const item = result.shift()
        if (item) {
          if (itemId)
            item.expanded = true
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
      disable.value = false
    })
}

watch(() => route.params.itemid, (val: string | string[] | undefined) => {
  getList(val)
})

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

watch(() => newItems.value, (val: number) => {
  if (val > 0)
    notify('newItems', t('messages.newItems', val), t('btn.refresh'), () => {
      if (route.name !== 'item-list')
        router.push({ name: 'item-list' })
      else
        getList()
    })
})

watch(() => newOffer.value, (val: string | null) => {
  if (val)
    notify('', t('messages.newOffer'), t('btn.move'), () => { router.push({ name: 'item-detail', params: { itemid: val } }) })
})

watch(() => acceptedOffer.value, (val: { itemName: string, itemId: string } | null) => {
  if (val)
    notify('', t('messages.acceptedOffer', { in: val.itemName }), t('btn.move'), () => { router.push({ name: 'item-detail', params: { itemid: val.itemId } }) })
})

onMounted(() => {
  getList(route.params.itemid)
})
</script>

<template>
  <D4Btn v-if="routeName === 'item-detail'" round :to="{ name: 'item-list' }" class="sticky" color="var(--q-light-normal)"
    shadow>
    <img :src="icons.list" height="20" class="invert" />
  </D4Btn>
  <D4Btn v-if="as.signed && routeName === 'item-list'" round @click="create" class="sticky" color="var(--q-secondary)"
    :disable="disable" shadow>
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
