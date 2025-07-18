<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useQuasar, date } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalStore } from 'src/stores/global-store'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore } from 'src/stores/item-store'
import { IMessage, IAnswer } from 'src/types/user'

const $q = useQuasar()
const gs = useGlobalStore()
const as = useAccountStore()
const is = useItemStore()
const { t, n } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()

const messages = reactive<Array<IMessage>>([])
const selected = ref<boolean>(false)
const disable = computed(() => messages.filter((m) => !m.readYn).length === 0)
const loading = ref<boolean>(true)
const progress = ref<boolean>(false)
const page = ref<number>(
  route.query.page ? parseInt(route.query.page as string) : 1
)
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
    .catch(() => {})
    .then(() => {
      loading.value = false
    })
}

const read = (message: IMessage) => {
  if (!message.readYn && !message.show) {
    progress.value = true
    message.disable = true
    as.readMessage([message.msgId])
      .then(() => {
        message.readYn = true
        message.show = true
        message.selected = false
        as.unreadMessages()
      })
      .catch(() => {})
      .then(() => {
        progress.value = false
        message.disable = false
      })
  } else message.show = !message.show
}

const reads = () => {
  const selectedMessages = messages.filter((m) => m.selected)
  if (selectedMessages.length > 0) {
    progress.value = true
    selectedMessages.forEach((m) => (m.disable = true))
    as.readMessage(selectedMessages.map((m) => m.msgId))
      .then(() => {
        selectedMessages.forEach((m) => (m.readYn = true))
        as.unreadMessages()
      })
      .catch(() => {})
      .then(() => {
        progress.value = false
        selected.value = false
        selectedMessages.forEach((m) => {
          m.selected = !m.readYn
          m.disable = false
        })
      })
  }
}

const answer = reactive<IAnswer>({
  open: false,
  loading: false,
  msgId: null,
  contents: '안녕하세요. Tradurs입니다.\n\n\n\n감사합니다.'
})

const sendAnswer = () => {
  answer.loading = true
  gs.answer(answer.msgId as number, answer.contents)
    .then(() => {
      $q.notify({
        icon: 'img:/images/icons/check.svg',
        color: 'positive',
        classes: '',
        message: t('contact.successAnswer')
      })
      answer.open = false
    })
    .catch(() => {})
    .then(() => {
      answer.loading = false
    })
}

const open = (msgId: number) => {
  answer.msgId = msgId
  answer.open = true
}

const close = () => {
  answer.msgId = null
  answer.contents = '안녕하세요. Tradurs입니다.\n\n\n\n감사합니다.'
  answer.loading = false
}

const move = (val: number) => {
  router.push({
    name: 'messages',
    params: { lang: route.params.lang },
    query: { page: page.value + val }
  })
}

watch(
  () => route.query.page,
  (val, old) => {
    if (val !== old && route.name === 'messages') {
      page.value = val ? parseInt(val as string) : 1
      getList()
    }
  }
)

onMounted(() => {
  getList()
})
</script>

<template>
  <div>
    <div class="text-right text-caption q-pa-xs top-space">
      {{ t('messages.expire') }}
    </div>
    <q-list bordered class="rounded-borders">
      <q-item>
        <q-item-section side>
          <q-checkbox
            size="xs"
            color="grey-secondary"
            v-model="selected"
            :disable="disable || progress"
            @update:model-value="
              (val) =>
                messages
                  .filter((m) => !m.readYn)
                  .forEach((m) => (m.selected = val))
            "
          />
        </q-item-section>
        <q-item-section> </q-item-section>
        <q-item-section side>
          <q-btn
            no-caps
            push
            :disable="disable || progress"
            unelevated
            :aria-label="t('btn.markRead')"
            color="grey-8"
            :label="t('btn.markRead')"
            @click="reads"
          />
        </q-item-section>
      </q-item>
      <q-slide-transition>
        <div v-show="newMessages" class="text-center">
          <q-separator />
          <div class="q-py-md">
            <q-btn
              color="secondary"
              v-show="newMessages"
              no-caps
              unelevated
              padding="6px"
              class="text-caption"
              aria-label="Tradurs Refresh Button"
              :to="{
                name: 'messages',
                params: { lang: route.params.lang },
                query: { page: !!!route.query.page ? 1 : undefined }
              }"
            >
              <div class="row items-center q-gutter-x-sm">
                <img
                  src="/images/icons/restore.svg"
                  width="18"
                  height="18"
                  class="invert"
                  alt="Tradurs Refresh Icon"
                />
                <div>
                  {{ t('btn.newMessages') }}
                </div>
              </div>
            </q-btn>
          </div>
        </div>
      </q-slide-transition>
      <template v-for="message in messages" :key="message.msgId">
        <q-separator />
        <q-item
          clickable
          v-ripple
          @click="read(message)"
          :class="['q-py-lg', { read: message.readYn }]"
        >
          <q-item-section side @click.stop>
            <q-checkbox
              size="xs"
              color="grey-10"
              v-model="message.selected"
              :disable="message.readYn || message.disable"
            />
          </q-item-section>
          <q-item-section avatar v-show="!$q.screen.lt.sm">
            <q-avatar size="md" color="grey-4 text-dark"> D4 </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold" lines="1">
              {{
                ['900', '999'].includes(message.msgType)
                  ? 'Tradurs'
                  : `${message.itemName}${
                      message.itemQuantity !== 1
                        ? ` x ${message.itemQuantity}`
                        : ''
                    }`
              }}
            </q-item-label>
            <q-item-label caption lines="2">
              {{ t(`messages.title${message.msgType}`) }}
            </q-item-label>
            <q-item-label caption lines="2" v-if="message.currency === 'gold'">
              {{
                `${t('item.gold')} : ${n(
                  Number.parseFloat(message.currencyValue as string)
                )} `
              }}
            </q-item-label>
            <q-item-label
              caption
              lines="2"
              v-else-if="message.currency === 'rune'"
            >
              {{
                `${is.findRune(message.currencyValue)?.label} ${t(
                  'item.rune'
                )} x ${message.quantity} `
              }}
            </q-item-label>
            <q-item-label
              caption
              lines="2"
              v-else-if="message.currency === 'summoning'"
            >
              {{
                `${
                  is.summonings.find((s) => s.value === message.currencyValue)
                    ?.label
                } x ${message.quantity} `
              }}
            </q-item-label>
          </q-item-section>
          <q-item-section side top>
            <q-item-label lines="2" style="max-width: 60px" class="text-right">
              {{
                date.isSameDate(message.regDate, Date.now(), 'date')
                  ? date.formatDate(message.regDate, 'HH:mm')
                  : date.formatDate(message.regDate, 'YY.MM.DD HH:mm')
              }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-slide-transition>
          <div v-show="message.show">
            <q-item
              class="q-pa-lg row items-center"
              :class="
                ['900', '999'].includes(message.msgType) ? '' : 'justify-center'
              "
              style="background-color: var(--q-cloud)"
            >
              <div
                v-if="['900', '999'].includes(message.msgType)"
                class="full-width"
              >
                <div class="text-area">
                  {{ message.msgValue }}
                </div>
                <div
                  v-if="message.msgType === '900'"
                  class="q-mt-xl row justify-end"
                >
                  <q-btn
                    :label="t('contact.answer')"
                    push
                    :aria-label="t('contact.answer')"
                    color="secondary"
                    @click="open(message.msgId)"
                  />
                </div>
              </div>
              <q-item-label v-else>
                <q-btn
                  no-caps
                  unelevated
                  aria-label="Tradurs Go Item Button"
                  color="primary"
                  :to="{
                    name: 'itemInfo',
                    params: { lang: route.params.lang, itemid: message.itemId },
                    state: { offers: true }
                  }"
                >
                  {{ t('btn.gotoItem') }}
                </q-btn>
              </q-item-label>
            </q-item>
          </div>
        </q-slide-transition>
      </template>
      <template
        v-if="loading"
        v-for="c in messages.length || as.messagePage.rows"
        :key="c"
      >
        <q-separator />
        <q-item class="q-py-md">
          <q-item-section side>
            <q-skeleton
              type="rect"
              width="18px"
              height="18px"
              class="q-mx-xs"
            />
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
          <q-item-label class="row justify-center q-pt-md q-pb-xl">{{
            t('messages.noData')
          }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <div class="row justify-between q-mt-md q-px-sm paging">
      <div>{{ t('message.page', { page }) }}</div>
      <div class="row justify-end items-center q-gutter-x-md">
        <q-btn
          flat
          dense
          round
          padding="0"
          aria-label="Tradurs Prev Button"
          :disable="!over || loading"
          :shadow="!$q.dark.isActive"
          @click="move(-1)"
        >
          <img
            src="/images/icons/prev.svg"
            width="24"
            height="24"
            class="icon"
            alt="Tradurs Prev Icon"
          />
        </q-btn>
        <q-btn
          flat
          dense
          round
          padding="0"
          aria-label="Tradurs Next Button"
          :disable="!more || loading"
          :shadow="!$q.dark.isActive"
          @click="move(1)"
        >
          <img
            src="/images/icons/next.svg"
            width="24"
            height="24"
            class="icon"
            alt="Tradurs Next Icon"
          />
        </q-btn>
      </div>
    </div>
    <D4Dialog
      v-model="answer.open"
      @submit="sendAnswer"
      @hide="close"
      :persistent="answer.loading"
    >
      <template #top>
        <div class="q-pa-md text-h6">
          {{ t('contact.answer') }}
        </div>
      </template>
      <template #middle>
        <div class="q-pa-md">
          <q-input
            outlined
            dense
            no-error-icon
            hide-bottom-space
            :disable="answer.loading"
            :autofocus="$q.platform.is.desktop"
            rows="6"
            type="textarea"
            class="col"
            input-class="scroll"
            :label="t('contact.answerContents')"
            v-model="answer.contents"
            :rules="[(val) => (val && val.length > 10) || '']"
            maxlength="500"
            ><template #counter>
              {{ answer.contents ? answer.contents.length : 0 }} / 500
            </template>
          </q-input>
        </div>
      </template>
      <template #bottom>
        <div class="row justify-end q-pa-md q-gutter-sm">
          <D4Btn
            :label="t('btn.cancel')"
            :disable="answer.loading"
            color="rgb(150,150,150)"
            @click="answer.open = false"
          />
          <D4Btn
            :label="t('contact.send')"
            :loading="answer.loading"
            type="submit"
          />
        </div>
      </template>
    </D4Dialog>
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
  opacity: 0.4;
}

.paging:deep(.q-btn.disabled) {
  opacity: 0.2 !important;
}
</style>
