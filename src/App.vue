<script lang="ts">
import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'
import { api } from 'src/boot/axios'

export default {
  preFetch({ store, currentRoute }) {
    const as = useAccountStore(store);
    const is = useItemStore(store);

    api.defaults.headers.common['Accept-Language'] = currentRoute.params.lang || 'ko-KR'

    return Promise.all([as.checkSign(), as.getEvaluations(), is.getBase(), is.getProperties(), is.getAffixes(), is.getRestrictions()]);
  }
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useQuasar, useMeta } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGlobalStore } from 'stores/global-store'

const prod: boolean = import.meta.env.PROD

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const as = useAccountStore()
const gs = useGlobalStore()
const { t, locale } = useI18n({ useScope: 'global' })

const view = ref<boolean>(false)
const isDark = ref($q.cookies.has('d4.dark') ? $q.cookies.get('d4.dark') === 'true' : $q.dark.isActive)
$q.dark.set(isDark.value)

const battleTag = ref<string>('')
const showBT = computed(() => (as.signed !== null && as.signed as boolean && !(as.info.battleTag && as.info.battleTag !== '') && view.value))
const loading = ref<boolean>(false)
const updateBattleTag = () => {
  as.updateBattleTag(battleTag.value)
    .then(() => {
      as.info.battleTag = battleTag.value
    })
}

locale.value = route.params.lang || 'ko'

// about Meta
const titleReactive = computed(() => gs.getTitle(route.name ? t(`page.${route.name as string}`) : undefined))
const descReactive = computed(() => t('seo.desc'))
const keywordsReactive = computed(() => t('seo.keywords'))
const recaptchaSrc = computed(() => route.name === 'support' ? 'https://www.google.com/recaptcha/api.js?render=6Lf38rYmAAAAAB-ET1oihMUkcDumRascvVHOyGmg' : '')

useMeta(() => {
  return {
    title: titleReactive.value,
    meta: {
      description: { name: 'description', content: descReactive.value },
      keywords: { name: 'keywords', content: keywordsReactive.value },
      equiv: { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
      ogTitle: { property: 'og:title', content: titleReactive.value },
      ogDescription: { property: 'og:description', content: descReactive.value },
      ogUrl: { property: 'og:url', content: 'https://d4.tradurs.com' },
      ogType: { property: 'og:type', content: 'website' },
      ogImage: { property: 'og:image', content: 'https://d4.tradurs.com/images/og.png' },
      twitterCard: { name: 'twitter:card', content: 'summary' },
      twitterTitle: { name: 'twitter:title', content: titleReactive.value },
      twitterDescription: { name: 'twitter:description', content: descReactive.value },
      twitterUrl: { name: 'twitter:url', content: 'https://d4.tradurs.com' },
      twitterImage: { name: 'twitter:image', content: 'https://d4.tradurs.com/images/og.png' }
    },
    script: { recaptcha: { src: recaptchaSrc.value } }
  }
})

const notice = reactive<{ open: boolean, close: boolean }>({
  open: false,//!$q.cookies.has('d4.notice'),
  close: false
})

const close = () => {
  $q.cookies.set('d4.notice', 'confirm', { expires: 1 })
  notice.open = false
}

const adblock = reactive<{ open: Boolean, close: boolean }>({
  open: false,
  close: false
})

onMounted(() => {
  if (prod) {
    fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js').then(() => {
      view.value = true
    }).catch(() => {
      adblock.open = true
    })
  }
  else
    view.value = true
})
</script>

<template>
  <D4Dialog v-model="adblock.open" persistent>
    <template #top>
      <q-card-section class="row justify-center">
        <div class="row justify-center items-center q-gutter-x-xs">
          <q-avatar>
            <q-img width="50px" src="/images/tradurs.svg" />
          </q-avatar>
          <div class="q-pa-md text-weight-bold" :class="$q.screen.gt.sm ? 'text-h6' : 'text-body1'">{{
            t('adblock.title') }}</div>
        </div>
      </q-card-section>
    </template>
    <template #middle>
      <q-card-section class="d4-scroll" style="max-height:50vh">
        <div class="q-pa-md column q-gutter-y-sm" :class="$q.screen.gt.sm ? 'text-body1' : 'text-caption'">
          <div class="text-area text-weight-bold">{{ t('adblock.contents') }}</div>
        </div>
      </q-card-section>
    </template>
    <template #bottom>
      <q-card-section>
        <div class="q-pa-md text-right">
          <q-btn outline no-caps :label="t('adblock.allow')" @click="() => router.go(0)"
            aria-label="Tradurs Allow Button" />
        </div>
      </q-card-section>
    </template>
  </D4Dialog>
  <D4Dialog v-model="notice.open" persistent>
    <template #top>
      <q-card-section class="row no-wrap items-center justify-between">
        <div>
          <div class="q-pa-md text-body1 text-weight-bold">{{ t('maintenance.title') }}</div>
        </div>
        <q-btn unelevated aria-label="Tradurs Close Button" class="no-hover icon" :ripple="false">
          <img src="/images/icons/close.svg" width="24" height="24" @click="notice.open = false" alt="icon_close" />
        </q-btn>
      </q-card-section>
    </template>
    <template #middle>
      <q-card-section class="d4-scroll" style="max-height:50vh">
        <div class="q-pa-md column q-gutter-y-sm" :class="$q.screen.gt.sm ? 'text-body2' : 'text-caption'">
          <div class="text-area">{{ t('maintenance.top') }}</div>
          <div class="text-area text-weight-bold text-negative">{{ t('maintenance.contents') }}</div>
          <div class="text-area">{{ t('maintenance.bottom') }}</div>
        </div>
      </q-card-section>
    </template>
    <template #bottom>
      <q-card-section>
        <div class="q-pa-md text-right">
          <q-btn outline no-caps :label="t('maintenance.close')" @click="close" aria-label="Tradurs Button" />
        </div>
      </q-card-section>
    </template>
  </D4Dialog>
  <D4Dialog v-model="showBT" persistent @submit="updateBattleTag">
    <template #top>
      <q-card-section>
        <div class="q-pa-md text-h6">{{ t('battlenet.title') }}</div>
      </q-card-section>
    </template>
    <template #middle>
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
            :rules="[val => val && (/^([가-힣ぁ-ゔァ-ヴー々〆〤一-龥]{1}[가-힣ぁ-ゔァ-ヴー々〆〤一-龥0-9]{1,7}#[0-9]{4,}|[a-zA-Z]{1}[a-zA-Z0-9]{2,11}#[0-9]{4,})$/g).test(val) || '']"
            outlined no-error-icon hide-hint maxlength="24" />
        </div>
      </q-card-section>
    </template>
    <template #bottom>
      <q-card-section :class="{ 'col-1': $q.screen.lt.sm }">
        <div class="row justify-end items-center q-gutter-sm q-px-md" :class="{ 'q-pt-lg': $q.screen.lt.sm }">
          <D4Btn :label="t('btn.apply')" :progress="loading" type="submit" />
        </div>
      </q-card-section>
    </template>
  </D4Dialog>
  <router-view v-if="!showBT && view" />
</template>