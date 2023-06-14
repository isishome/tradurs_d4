<script setup lang="ts">
import { date } from 'quasar'
import { ref, reactive } from 'vue'
import { useAccountStore } from 'src/stores/account-store'
import { useI18n } from 'vue-i18n'

interface Message {
  msgId: number,
  msgType: string,
  msgValue: string,
  regDate: string,
  readYn: boolean,
  show: boolean,
  selected: boolean
}

const as = useAccountStore()
const { t } = useI18n({ useScope: 'global' })

const messages = reactive<Array<Message>>([])
const selected = ref<boolean>(false)

const read = (message: Message) => {
  if (!message.readYn && !message.show) {
    as.readMessage(message.msgId)
      .then(() => {
        message.readYn = true
        message.show = true
        message.selected = false
      })
  }
  else
    message.show = !message.show
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
          <q-checkbox size="xs" color="grey-10" dense v-model="selected"
            :disable="messages.filter(m => !m.readYn).length === 0"
            @update:model-value="val => messages.forEach(m => m.selected = val)" />
        </q-item-section>
      </q-item>
      <template v-for="message in messages" :key="message.msgId">
        <q-separator />
        <q-item clickable v-ripple @click="read(message)" :class="{ 'read': message.readYn }">
          <q-item-section side>
            <q-checkbox size="xs" color="grey-10" dense v-model="message.selected" :disable="message.readYn" />
          </q-item-section>
          <q-item-section avatar>
            <q-avatar color="grey-4 text-dark">
              D4
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label lines="1">{{ t(`messages.title${message.msgType}`) }}</q-item-label>
          </q-item-section>
          <q-item-section side top>
            {{ date.isSameDate(message.regDate, Date.now(), 'date') ? date.formatDate(message.regDate, 'HH:mm') :
              date.formatDate(message.regDate, 'YY.MM.DD HH:mm') }}
          </q-item-section>
        </q-item>
        <q-slide-transition>
          <div v-show="message.show">
            <q-item class="q-pa-lg row justify-center items-center">
              <q-item-label>
                <q-btn no-caps unelevated color="primary"
                  :to="{ name: 'itemInfo', params: { itemid: message.msgValue }, state: { offers: true } }">
                  {{ t('btn.gotoItem') }}
                </q-btn>
              </q-item-label>
            </q-item>
          </div>
        </q-slide-transition>
      </template>
      <q-item>
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