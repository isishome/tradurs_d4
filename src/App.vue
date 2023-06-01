<script lang="ts">
import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'
import { useGlobalStore } from './stores/global-store'

export default {
  preFetch({ store }) {
    const as = useAccountStore(store)
    const is = useItemStore(store)

    return Promise.all([as.checkSign(), as.getEvaluations(), is.getBase(), is.getProperties(), is.getAffixes(), is.getRestrictions()])
  }
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar, useMeta } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const $q = useQuasar()
const as = useAccountStore()
const gs = useGlobalStore()
const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()

const view = ref<boolean>(false)
const isDark = ref($q.cookies.has('d4.dark') ? $q.cookies.get('d4.dark') === 'true' : $q.dark.isActive)
$q.dark.set(isDark.value)
const lang = $q.cookies.has('d4.lang') ? $q.cookies.get('d4.lang') as string : 'ko'
locale.value = lang

const battleTag = ref<string>('')
const showBT = computed(() => (as.signed as boolean && !(as.info.battleTag && as.info.battleTag !== '') && view.value))
const loading = ref<boolean>(false)
const updateBattleTag = () => {
  as.updateBattleTag(battleTag.value)
    .then(() => {
      as.info.battleTag = battleTag.value
    })
}

// about Meta
const titleReactive = computed(() => gs.getTitle(t(`page.${route.name as string}`)))
const descReactive = computed(() => t('seo.desc'))

useMeta(() => {
  return {
    title: titleReactive.value,
    meta: {
      description: { name: 'description', content: descReactive.value },
      equiv: { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
      ogTitle: { property: 'og:title', content: titleReactive.value },
      ogDescription: { property: 'og:description', content: descReactive.value },
      ogUrl: { property: 'og:url', content: 'https://d4.tradurs.com' },
      ogType: { property: 'og:type', content: 'website' },
      ogImage: { property: 'og:image', content: 'https://d4.tradurs.com/images/icon.png' },
      twitterCard: { name: 'twitter:card', content: 'summary' },
      twitterTitle: { name: 'twitter:title', content: titleReactive.value },
      twitterDescription: { name: 'twitter:description', content: descReactive.value },
      twitterUrl: { name: 'twitter:url', content: 'https://d4.tradurs.com' },
      twitterImage: { name: 'twitter:image', content: 'https://d4.tradurs.com/images/icon.png' }
    }
  }
})

onMounted(() => {
  view.value = true
})
</script>

<template>
  <q-dialog v-model="showBT" persistent transition-show="none" transition-hide="none">
    <q-card class="card-item dialog normal">
      <q-form class="inner column full-height" @submit="updateBattleTag">
        <q-card-section>
          <div class="q-pa-md text-h6">{{ t('battlenet.title') }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="q-px-lg" :class="$q.screen.gt.sm ? 'text-body1' : 'text-body2'">
            {{ t('battlenet.msg1') }}
            <strong class="text-amber">Tradurs Diablo IV</strong>
            {{ t('battlenet.msg2') }}
          </div>
        </q-card-section>
        <q-card-section class="text-center">
          <div class="q-px-lg" :class="$q.screen.gt.sm ? 'text-body2' : 'text-caption'">
            {{ t('battlenet.desc') }}
          </div>
        </q-card-section>
        <q-card-section>
          <div class="q-px-lg q-py-md">
            <q-input autofocus v-model="battleTag" label="BattleTag™" :placeholder="t('battlenet.placeholder')" fill-mask
              :disable="loading"
              :rules="[val => val && (/^([ㄱ-ㅎㅏ-ㅣ가-힣]{1}[ㄱ-ㅎㅏ-ㅣ가-힣]{1,7}#[0-9]{4,5}|[a-zA-Z]{1}[a-zA-Z0-9]{2,11}#[0-9]{4,5})$/g).test(val) || '']"
              outlined no-error-icon hide-hint maxlength="17" />
          </div>
        </q-card-section>
        <q-separator inset />
        <q-card-section :class="{ 'col-1': $q.screen.lt.sm }">
          <div class="row justify-end items-center q-gutter-sm q-px-md" :class="{ 'q-pt-lg': $q.screen.lt.sm }">
            <D4Btn :label="t('btn.apply')" :progress="loading" type="submit" />
          </div>
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
  <router-view v-if="!showBT && view" />
</template>