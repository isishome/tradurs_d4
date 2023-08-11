<script setup lang="ts">
import { useQuasar } from 'quasar'
import { reactive, onUnmounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlobalStore } from 'stores/global-store'

interface Answer {
  type: string,
  contents: string
}

interface Support {
  id: string,
  question: string,
  answer: Array<Answer>,
  show: boolean
}

const props = defineProps<{
  section?: string
}>()


const $q = useQuasar()
const { t, tm } = useI18n({ useScope: 'global' })
const gs = useGlobalStore()

const support = computed(() => tm('support') as Array<Support>)
const findSection = support.value.find(s => s.id === (props.section || 'qna'))
if (findSection)
  findSection.show = true

const contact = reactive<{ show: boolean, open: boolean, contents: string | null, disable: boolean }>({
  show: true,
  open: false,
  contents: null,
  disable: false
})

const send = () => {
  contact.disable = true
  if (window?.grecaptcha) {
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute('6Lf38rYmAAAAAB-ET1oihMUkcDumRascvVHOyGmg', { action: 'submit' })
        .then((token: string) => {
          gs.contactUs(token, contact.contents)
            .then(() => {
              $q.notify({
                icon: 'img:/images/icons/check.svg',
                color: 'positive',
                classes: '',
                message: t('contact.success')
              })
              contact.open = false
            })
            .catch(() => { })
            .then(() => {
              contact.disable = false
            })
        })
        .catch(() => {
          contact.disable = false
        })
    })
  }
  else
    contact.disable = false
}

const close = () => {
  contact.contents = null
  contact.disable = false
}
</script>

<template>
  <div>
    <q-list bordered class="rounded-borders">
      <template v-for="s, idx in (support as Array<Support>)" :key="idx">
        <q-separator v-show="idx !== 0" />
        <q-expansion-item v-model="s.show" :class="{ 'no-hover': s.show }" expand-icon="img:/images/icons/dropdown.svg"
          :label="s.question">
          <q-item class="row justify-center items-center" :class="$q.screen.lt.sm ? 'q-px-md' : 'q-px-xl'"
            style="background-color: var(--q-cloud);">
            <q-item-label>
              <q-intersection v-for="a, aIdx in  s.answer " :key="aIdx" transition="fade" class="answer text-center"
                :class="a.type" ssr-prerender once>
                <img v-if="a.type === 'image'" :src="`/images/help/${s.id}/${a.contents}.webp`" />
                <div v-else-if="a.type === 'text'" class="text-area">
                  {{ a.contents }}
                </div>
                <div v-else-if="a.type === 'question'"
                  class="text-area text-subtitle1 q-mt-lg text-left text-primary text-weight-bold">
                  {{ a.contents }}
                </div>
                <div v-else-if="a.type === 'answer'" class="text-area text-body2 q-ma-sm text-left">
                  {{ a.contents }}
                </div>
              </q-intersection>
              <div class="q-py-lg q-my-lg"></div>
            </q-item-label>
          </q-item>
        </q-expansion-item>
      </template>
      <q-separator />
      <q-expansion-item v-model="contact.show" :class="{ 'no-hover': contact.show }"
        expand-icon="img:/images/icons/dropdown.svg" :label="t('contact.question')">
        <q-item class="row justify-center items-center q-py-xl" style="background-color: var(--q-cloud);">
          <q-btn no-caps class="text-center" color="secondary" aria-label="Tradurs Contact Us Button" push
            :label="t('contact.title')" @click="contact.open = true" />
        </q-item>
      </q-expansion-item>
    </q-list>
    <D4Dialog v-model="contact.open" @submit="send" @hide="close" :persistent="contact.disable">
      <template #top>
        <div class="q-pa-md text-h6">
          {{ t('contact.title') }}
        </div>
      </template>
      <template #middle>
        <div class="q-pa-md">
          <q-input outlined dense no-error-icon hide-bottom-space :disable="contact.disable"
            :autofocus="$q.platform.is.desktop" rows="10" type="textarea" input-class="scroll"
            :label="t('contact.contents')" v-model="contact.contents" :rules="[val => val && val.length > 10 || '']"
            maxlength="500">
            <template #counter>
              {{ contact.contents ? contact.contents.length : 0 }} / 500
            </template>
          </q-input>
        </div>
      </template>
      <template #bottom>
        <div class="row justify-end q-pa-md q-gutter-sm">
          <D4Btn :label="t('btn.cancel')" :disable="contact.disable" color="rgb(150,150,150)"
            @click="contact.open = false" />
          <D4Btn :label="t('contact.send')" :loading="contact.disable" type="submit" />
        </div>
      </template>
    </D4Dialog>
  </div>
</template>
<style scoped>
.answer.text {
  min-height: 22px;
}

.answer.image {
  min-height: 60px;
}

.answer:deep(.text-area) {
  min-height: 14px;
}

.answer:deep(img) {
  margin-top: 72px;
  margin-bottom: 10px;
  max-width: 100%;
  object-fit: cover;
  object-position: 0;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 0 1px 1px currentColor;
}
</style>