<script setup lang="ts">
import { useQuasar } from 'quasar'
import { reactive, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlobalStore } from 'stores/global-store'
import { icons } from 'src/common/icons'

import D4Dialog from 'components/D4Dialog.vue'

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

const $q = useQuasar()
const { t, tm } = useI18n({ useScope: 'global' })
const gs = useGlobalStore()

const support: Array<Support> = reactive(tm('support'))
const contact = reactive<{ show: boolean, contents: string | null, disable: boolean }>({
  show: false,
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
                icon: `img:${icons.check}`,
                color: 'positive',
                classes: '',
                message: t('contact.success')
              })
              contact.show = false
            })
            .catch(() => { })
            .then(() => {
              contact.disable = false
            })
        })
        .catch(() => { })
        .then(() => {
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

onUnmounted(() => {
  support.forEach((s: Support) => {
    s.show = false
  })
})
</script>

<template>
  <q-list bordered class="rounded-borders max-width">
    <template v-for="s, idx in  (support as Array<Support>) " :key="idx">
      <q-separator v-show="idx !== 0" />
      <q-item clickable v-ripple class="bg-primary text-white" @click="s.show = !s.show">
        <q-item-section>
          <q-item-label class="text-weight-bold" lines="3">
            {{ s.question }}
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-slide-transition>
        <div v-show="s.show">
          <q-item class="row justify-center items-center" :class="$q.screen.lt.sm ? 'q-px-md' : 'q-px-xl'"
            style="background-color: var(--q-cloud);">
            <q-item-label>
              <q-intersection v-for="a, aIdx in s.answer" :key="aIdx" transition="fade" class="answer text-center"
                ssr-prerender once>
                <img v-if="a.type === 'image'" :src="`images/help/${s.id}/${a.contents}.png`" />
                <div v-else-if="a.type === 'text'" class="text-area">
                  {{ a.contents }}
                </div>
              </q-intersection>
              <div class="q-py-xl q-my-xl"></div>
            </q-item-label>
          </q-item>
        </div>
      </q-slide-transition>
    </template>
  </q-list>
  <div class="row justify-end items-center max-width q-mt-md">
    <q-btn class="text-center" color="secondary" push :label="t('contact.title')" @click="contact.show = true" />
  </div>
  <D4Dialog v-model="contact.show" @submit="send" @hide="close" :persistent="contact.disable">
    <template #top>
      <div class="q-pa-md text-h6">
        {{ t('contact.title') }}
      </div>
    </template>
    <template #middle>
      <div class="q-pa-md">
        <q-input outlined dense no-error-icon hide-bottom-space :disable="contact.disable"
          :autofocus="$q.platform.is.desktop" rows="10" type="textarea" input-class="d4-scroll"
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
          @click="contact.show = false" />
        <D4Btn :label="t('contact.send')" :loading="contact.disable" type="submit" />
      </div>
    </template>
  </D4Dialog>
</template>
<style scoped>
.answer:deep(img) {
  min-height: 10px;
}

.answer:deep(.text-area) {
  min-height: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: keep-all;
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