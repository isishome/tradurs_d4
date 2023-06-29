<script setup lang="ts">
import { useQuasar, date } from 'quasar'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountStore } from 'src/stores/account-store'
import { useI18n } from 'vue-i18n'
import { scrollPos } from 'src/common'
import { icons } from 'src/common/icons'

interface Message {
  msgId: number,
  msgType: string,
  msgValue: string,
  itemId: number,
  itemName: string,
  currency: string,
  currencyValue: string,
  regDate: string,
  readYn: boolean,
  quantity: number,
  show: boolean,
  selected: boolean
}

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const as = useAccountStore()
const { t, n } = useI18n({ useScope: 'global' })

as.newMessages = false

const messages = reactive<Array<Message>>([])
const selected = ref<boolean>(false)
const disable = computed(() => messages.filter(m => !m.readYn).length === 0)
const loading = ref<boolean>(true)
const page = computed(() => route.query.page ? Number.parseInt(route.query.page.toString()) : 1)
const over = computed(() => as.messagePage.over)
const more = computed(() => as.messagePage.more)
const newMessages = computed(() => as.newMessages)

const getList = () => {
  as.newMessages = false
  selected.value = false
  messages.splice(0, messages.length)
  loading.value = true
  as.getMessages(page.value)
    .then((result) => {
      Object.assign(messages, result)
    })
    .catch(() => { })
    .then(() => {
      loading.value = false
    })
}

const read = (message: Message) => {
  if (!message.readYn && !message.show) {
    as.readMessage([message.msgId])
      .then(() => {
        message.readYn = true
        message.show = true
        message.selected = false
      })
  }
  else
    message.show = !message.show
}

const reads = () => {
  const selected = messages.filter(m => m.selected)
  if (selected.length > 0) {
    as.readMessage(selected.map(m => m.msgId))
      .then(() => {
        selected.forEach(m => m.readYn = true)
      })
  }
}

const refresh = () => {
  if (page.value !== 1)
    router.push({ name: 'messages' })
  else
    getList()
}

const prev = () => {
  router.push({ name: 'messages', query: page.value > 2 ? { page: page.value - 1 } : {} })
}

const next = () => {
  router.push({ name: 'messages', query: { page: page.value + 1 } })
}

watch(page, () => {
  scrollPos()
  getList()
})

onMounted(() => {
  getList()
})
</script>

<template>
  <div class="q-pa-md q-gutter-y-md">
    <q-list bordered class="rounded-borders">
      <q-item>
        <q-item-section side>
          <q-checkbox size="xs" color="grey-secondary" v-model="selected" :disable="disable"
            @update:model-value="val => messages.filter(m => !m.readYn).forEach(m => m.selected = val)" />
        </q-item-section>
        <q-item-section>
          <div>
            <q-btn outline v-show="newMessages" no-caps push :disable="disable" unelevated
              aria-label="Tradurs Refresh Button" @click="refresh">
              <div class="row items-center q-gutter-x-sm">
                <img :src="icons.refresh" width="18" height="18" class="icon" alt="icon_prev" @click="prev" />
                <div>
                  {{ t('btn.newMessages') }}
                </div>
              </div>
            </q-btn>
          </div>
        </q-item-section>
        <q-item-section side>
          <q-btn no-caps push :disable="disable" unelevated aria-label="Tradurs Read Button" color="grey-8"
            :label="t('btn.markRead')" @click="reads" />
        </q-item-section>
      </q-item>
      <template v-for="message in messages" :key="message.msgId">
        <q-separator />
        <q-item clickable v-ripple @click="read(message)" :class="['q-py-lg', { 'read': message.readYn }]">
          <q-item-section side @click.stop>
            <q-checkbox size="xs" color="grey-10" v-model="message.selected" :disable="message.readYn" />
          </q-item-section>
          <q-item-section avatar v-show="!$q.screen.lt.sm">
            <q-avatar size="md" color="grey-4 text-dark">
              D4
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold" lines="1">{{ ['900', '999'].includes(message.msgType) ? 'Tradurs' :
              message.itemName
            }}</q-item-label>
            <q-item-label caption lines="2">{{ t(`messages.title${message.msgType}`) }}</q-item-label>
            <q-item-label caption lines="2" v-if="message.currency === 'gold'">{{ `${t('item.gold')} :
                          ${n(Number.parseFloat(message.currencyValue as string))}` }}</q-item-label>
          </q-item-section>
          <q-item-section side top>
            <q-item-label lines="2" style="max-width:60px" class="text-right">
              {{ date.isSameDate(message.regDate, Date.now(), 'date') ? date.formatDate(message.regDate, 'HH:mm') :
                date.formatDate(message.regDate, 'YY.MM.DD HH:mm') }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-slide-transition>
          <div v-show="message.show">
            <q-item class="q-pa-lg row items-center"
              :class="['900', '999'].includes(message.msgType) ? '' : 'justify-center'"
              style="background-color: var(--q-cloud);">
              <q-item-label>
                <div v-if="['900', '999'].includes(message.msgType)" class="text-area">{{
                  message.msgValue }}
                </div>
                <q-btn v-else no-caps unelevated aria-label="Tradurs Go Item Button" color="primary"
                  :to="{ name: 'itemInfo', params: { itemid: message.itemId }, state: { offers: true } }">
                  {{ t('btn.gotoItem') }}
                </q-btn>
              </q-item-label>
            </q-item>
          </div>
        </q-slide-transition>
      </template>
      <template v-if="loading" v-for="c in as.messagePage.rows" :key="c">
        <q-separator />
        <q-item class="q-py-md">
          <q-item-section side>
            <q-skeleton type="rect" width="18px" height="18px" class="q-mx-xs" />
          </q-item-section>
          <q-item-section avatar v-show="!$q.screen.lt.sm">
            <q-skeleton type="QAvatar" width="36px" height="36px" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold" lines="1">
              <q-skeleton type="text" width="100px" height="24px" />
            </q-item-label>
            <q-item-label caption>
              <q-skeleton type="text" width="160px" height="18px" />
            </q-item-label>
            <q-item-label caption>
              <q-skeleton type="text" width="80px" height="18px" />
            </q-item-label>
          </q-item-section>
          <q-item-section side top>
            <q-item-label class="column items-end">
              <q-skeleton type="text" width="60px" height="24px" />
              <q-skeleton type="text" width="40px" height="24px" />
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
      <q-item v-show="!loading && messages.length === 0">
        <q-item-section>
          <q-item-label class="row justify-center q-pt-md q-pb-xl">{{ t('messages.noData') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <div class="row justify-between q-px-sm paging">
      <div>{{ t('message.page', { page }) }}</div>
      <div class="row justify-end items-center q-gutter-x-md">
        <q-btn flat dense round padding="0" :disable="!over || loading" :shadow="!$q.dark.isActive">
          <img :src="icons.prev" width="24" height="24" class="icon" alt="icon_prev" @click="prev" />
        </q-btn>
        <q-btn flat dense round padding="0" :disable="!more || loading" :shadow="!$q.dark.isActive" @click="next">
          <img :src="icons.next" width="24" height="24" class="icon" alt="icon_next" />
        </q-btn>
      </div>
    </div>
    <div class="q-py-md"></div>
  </div>
</template>

<style scoped>
.read,
.read:deep(.q-item__label--caption),
.read:deep(.q-item__section--side),
.body--light .read:deep(.q-checkbox__inner) {
  color: rgb(100, 100, 100);
}

.body--light .read,
.body--light .read:deep(.q-item__label--caption),
.body--light .read:deep(.q-item__section--side),
.body--light .read:deep(.q-checkbox__inner) {
  color: rgb(150, 150, 150);
}

.read .q-avatar {
  opacity: .4;
}

.text-area {
  line-height: 1.6;
  white-space: pre-wrap;
}

.paging:deep(.q-btn.disabled) {
  opacity: .2 !important;
}
</style>