<script setup lang="ts">
import { date } from 'quasar'
import { ref, reactive, computed } from 'vue'
import { useAccountStore } from 'src/stores/account-store'
import { useI18n } from 'vue-i18n'

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

const as = useAccountStore()
const { t, n } = useI18n({ useScope: 'global' })

const messages = reactive<Array<Message>>([])
const selected = ref<boolean>(false)
const disable = computed(() => messages.filter(m => !m.readYn).length === 0)

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

as.getMessages()
  .then((result) => {
    Object.assign(messages, result)
  })
</script>

<template>
  <div class="q-pa-md q-gutter-md">
    <q-list bordered class="rounded-borders">
      <q-item>
        <q-item-section side>
          <q-checkbox size="xs" color="grey-10" v-model="selected" :disable="disable"
            @update:model-value="val => messages.filter(m => !m.readYn).forEach(m => m.selected = val)" />
        </q-item-section>
        <q-item-section></q-item-section>
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
          <q-item-section avatar>
            <q-avatar size="md" color="grey-4 text-dark">
              D4
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold" lines="1">{{ message.msgType === '999' ? 'Tradurs' : message.itemName
            }}</q-item-label>
            <q-item-label caption lines="2">{{ t(`messages.title${message.msgType}`) }}</q-item-label>
            <q-item-label caption lines="2" v-if="message.currency === 'gold'">{{ `${t('item.gold')} :
                          ${n(Number.parseFloat(message.currencyValue as string))}` }}</q-item-label>
          </q-item-section>
          <q-item-section side top>
            <q-item-label lines="2">
              {{ date.isSameDate(message.regDate, Date.now(), 'date') ? date.formatDate(message.regDate, 'HH:mm') :
                date.formatDate(message.regDate, 'YY.MM.DD HH:mm') }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-slide-transition>
          <div v-show="message.show">
            <q-item class="q-pa-lg row justify-center items-center" style="background-color: var(--q-cloud);">
              <q-item-label>
                <div v-if="message.msgType === '900'" style="line-height: 1.6;">{{
                  message.msgValue }}
                </div>
                <div v-else-if="message.msgType === '999'" style="line-height: 1.6;"
                  v-html="message.msgValue.replace(/\n/g, '<br />')"></div>
                <q-btn v-else no-caps unelevated aria-label="Tradurs Go Item Button" color="primary"
                  :to="{ name: 'itemInfo', params: { itemid: message.itemId }, state: { offers: true } }">
                  {{ t('btn.gotoItem') }}
                </q-btn>
              </q-item-label>
            </q-item>
          </div>
        </q-slide-transition>
      </template>
      <q-item v-show="messages.length === 0">
        <q-item-section>
          <q-item-label class="row justify-center q-pt-md q-pb-xl">{{ t('messages.noData') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
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
</style>