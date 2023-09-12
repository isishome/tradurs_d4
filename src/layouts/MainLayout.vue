<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar, Screen } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useGlobalStore } from 'src/stores/global-store'
import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'
import { checkName, scrollPosDirect } from 'src/common'

import D4Filter from 'components/D4Filter.vue'
import D4User from 'components/D4User.vue'

const props = defineProps<{
  lang: string
}>()

const prod: boolean = import.meta.env.PROD

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const gs = useGlobalStore()
const as = useAccountStore()
const is = useItemStore()
const { t, locale } = useI18n({ useScope: 'global' })

locale.value = props.lang || 'ko'

const tradurs: string = import.meta.env.VITE_APP_TRADURS + (`/${props.lang || 'ko'}`)
const mainKey = ref<number>(0)
const filterLoading = computed(() => is.filter.loading)
const leftDrawerOpen = ref<boolean>(false)
const rightDrawerOpen = ref<boolean>(false)
const signed = computed<boolean | null>(() => as.signed)
const newMessages = computed<boolean>(() => as.newMessages || as.messagePage.unread > 0)
const screen = computed<Screen>(() => $q.screen)
const offsetTop = ref<number>(0)
const asideHeight = computed<string>(() => `calc(100vh - ${screen.value.gt.sm ? offsetTop.value : 0}px)`)
const asideTop = computed<string>(() => `${offsetTop.value + 10}px`)
const newAwards = computed(() => ((new Date()).getDay() === 1 && (new Date()).getHours() >= 9) || (new Date()).getDay() === 2)

const myTweak = (offset: number): void => {
  offsetTop.value = offset || 0
}

const info = () => {
  document.location.href = `${tradurs}/info`
}

const progressSign = ref<boolean>(false)
const sign = () => {
  if (!as.signed) {
    document.location.href = `${tradurs}/sign?redirect=${encodeURIComponent(document.location.href)}`
  }
  else {
    progressSign.value = true
    as.sign().then((result: boolean) => {
      if (!result) {
        is.clearFilter()
        mainKey.value++
        reload()
      }
    }).catch(() => { })
      .then(() => {
        progressSign.value = false
      })
  }
}

const brLoc = gs.localeOptions.map(lo => lo.value).includes($q.lang.getLocale()?.substring(0, 2) || '') ? $q.lang.getLocale()?.substring(0, 2) : 'ko'
const setLang = (lang: string) => {
  const params: { lang?: string, section?: string } = { lang }

  if (route.params.section)
    params.section = route.params.section as string

  router.replace({ name: route.name as string, params })
    .catch(() => { })
    .then(() => {
      router.go(0)
    })
}

const setDark = () => {
  $q.dark.set(!$q.dark.isActive)
  $q.cookies.set('d4.dark', $q.dark.isActive.toString(), { path: '/' })
}

const reload = () => {
  nextTick(() => {
    onWindowLoad()
  })
}

const _name = ref<string>('')
const search = () => {
  if (checkName(_name.value)) {
    is.filter.name = _name.value
    is.filter.request++
  }
}
const clear = () => {
  _name.value = ''
  if (is.filter.name !== '') {
    is.filter.name = _name.value
    is.filter.request++
  }
}

const page = computed(() => route.query.page ? Number.parseInt(route.query.page.toString()) : 1)
const main = () => {
  if (route.name === 'tradeList' && page.value === 1) {
    is.clearFilter()
    mainKey.value++
    reload()
  }
  else
    router.push({ name: 'tradeList', params: { lang: route.params.lang } })
}

const beforeShow = () => {
  if ($q.platform.is.mobile)
    scrollPosDirect()
}

// about screen size
const size = computed(() => $q.screen.width < 728 ? 'width:320px;max-height:100px;' : 'width:728px;height:90px;')

watch([size, () => $q.screen.gt.md], ([new1, new2], [old1, old2]) => {
  if (new1 !== old1 || new2 !== old2)
    reload()
})

watch(() => route.name, (val, old) => {
  if (val && val !== old)
    reload()
})

watch(() => gs.reloadAdKey, (val, old) => {
  if (val && val !== old)
    reload()
})

watch(() => $q.screen.gt.sm, (val) => {
  if (val)
    rightDrawerOpen.value = false
})

watch(() => is.filter.name, (val) => {
  if (val === '')
    _name.value = ''
})

const onWindowLoad = () => {
  if (prod) {
    const adsbygoogle = window.adsbygoogle || []
    const ads: NodeListOf<Element> = document.querySelectorAll('ins.adsbygoogle')
    ads.forEach((a: Element) => {
      if (a.clientWidth + a.clientHeight > 0)
        adsbygoogle.push({})
    })
  }
}

onMounted(() => {
  if (document.readyState !== 'complete')
    window.addEventListener('load', onWindowLoad)
  else {
    nextTick(() => {
      onWindowLoad()
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('load', onWindowLoad)
})
</script>
<template>
  <q-layout view="hHh lpR lFf" :key="mainKey">
    <div v-show="['tradeList', 'itemInfo'].includes(route.name as string) && is.fixedFilter.ladder" class="bg-season"
      :style="`--tradurs-season-image:url('${t('season.bg')}');`">
    </div>
    <q-drawer show-if-above no-swipe-open no-swipe-close no-swipe-backdrop bordered v-model="leftDrawerOpen" side="left"
      :behavior="screen.lt.md ? 'mobile' : 'desktop'" class="row justify-end no-scroll" :width="300"
      @before-show="beforeShow">
      <q-list ref="leftDrawerList" class="column full-height" style="width:300px">
        <q-scroll-area class="col">
          <D4Filter :disable="route.name !== 'tradeList'" class="q-px-md"
            :class="$q.screen.lt.sm ? 'q-pt-lg' : 'q-pt-lg'" />
        </q-scroll-area>
      </q-list>
    </q-drawer>
    <q-drawer show-if-above no-swipe-open no-swipe-close no-swipe-backdrop bordered v-model="rightDrawerOpen" side="right"
      behavior="mobile" class="row justify-start scroll" :width="300">
      <q-list class="column full-height" style="width:300px">
        <q-item class="row justify-between q-gutter-xs q-py-lg">
          <q-select v-model="locale" :options="gs.localeOptions" :label="t('language', 0, { locale: brLoc })" outlined
            dense emit-value map-options style="min-width: 120px" dropdown-icon="img:/images/icons/dropdown.svg"
            popup-content-class="scroll" @update:model-value="setLang" />
          <div>
            <q-btn round dense flat aria-label="Tradurs Support Button" :ripple="!$q.dark.isActive"
              :to="{ name: 'support', params: { lang: route.params.lang } }">
              <img class="icon" width="24" height="24" src="/images/icons/help.svg" alt="icon_support" />
              <!-- <q-badge floating label="N" color="negative" class="new-badge" /> -->
            </q-btn>
            <q-btn round flat aria-label="Tradurs Theme Button" :ripple="!$q.dark.isActive" @click="setDark">
              <img v-show="$q.dark.isActive" class="icon" width="24" height="24" src="/images/icons/light.svg"
                alt="icon_light" />
              <img v-show="!$q.dark.isActive" class="icon" width="24" height="24" src="/images/icons/dark.svg"
                alt="icon_dark" />
            </q-btn>
            <q-btn v-if="signed" round flat aria-label="Tradurs User Info Button" :ripple="!$q.dark.isActive">
              <img class="icon" width="24" height="24" src="/images/icons/user.svg" alt="icon_user" />
              <q-menu anchor="bottom end" self="top end" transition-show="none" transition-hide="none"
                :transition-duration="0" style="min-width:260px">
                <D4User :data="as.info" info>
                  <template #actions>
                    <q-btn no-caps unelevated :disable="progressSign" aria-label="Tradurs Info Button" color="grey-9"
                      :label="t('user.info')" @click="info" v-close-popup />
                    <q-btn no-caps unelevated :loading="progressSign" aria-label="Tradurs Signout Button"
                      color="secondary" :label="t('user.signout')" @click="sign" v-close-popup />
                  </template>
                </D4User>
              </q-menu>
            </q-btn>
            <q-btn v-else round flat aria-label="Tradurs Login Button" :ripple="!$q.dark.isActive" @click="sign">
              <img class="icon" width="24" height="24" src="/images/icons/login.svg" alt="icon_login" />
            </q-btn>
          </div>
        </q-item>
        <q-separator />
        <q-scroll-area class="col text-body2">
          <q-list class="q-pa-md page">
            <q-item v-ripple clickable :to="{ name: 'tradeList', params: { lang: route.params.lang } }" exact
              active-class="active">
              <q-item-section>
                <q-item-label>
                  {{ t('page.tradeList') }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="as.signed" v-ripple clickable :to="{ name: 'messages', params: { lang: route.params.lang } }"
              exact active-class="active">
              <q-item-section>
                <q-item-label>
                  {{ t('page.messages') }}
                </q-item-label>
              </q-item-section>
              <q-item-section v-show="newMessages" side>
                <q-badge rounded color="negative"></q-badge>
              </q-item-section>
            </q-item>
            <q-item v-ripple clickable :to="{ name: 'awards', params: { lang: route.params.lang } }" exact
              active-class="active">
              <q-item-section v-show="newAwards" side class="q-pr-xs">
                <q-badge label="N" color="orange-8" class="new-badge2" />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ t('page.awards') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <q-separator />
          <q-list class="q-mx-md q-py-xl text-overline useful" dense>
            <q-item clickable class="no-margin" tag="a" href="https://diablo4.cc" target="_blank"
              rel="noopener noreferrer">
              <q-item-section>
                <q-item-label>
                  Diablo.cc
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable class="no-margin" tag="a" href="https://d4armory.fly.dev/map" target="_blank"
              rel="noopener noreferrer">
              <q-item-section>
                <q-item-label>
                  D4 Armory
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable class="no-margin" tag="a" href="https://d4builds.gg/build-planner" target="_blank"
              rel="noopener noreferrer">
              <q-item-section>
                <q-item-label>
                  D4Builds.gg
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable class="no-margin" tag="a" href="https://maxroll.gg/d4" target="_blank"
              rel="noopener noreferrer">
              <q-item-section>
                <q-item-label>
                  maxroll Diablo IV
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable class="no-margin" tag="a" href="https://aziraell3.github.io/GAME/D4/?job=dru"
              target="_blank" rel="noopener noreferrer">
              <q-item-section>
                <q-item-label>
                  Aspect Simulator
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </q-list>
    </q-drawer>
    <q-header :elevated="!$q.dark.isActive" class="q-py-sm header row justify-center">
      <q-toolbar class="toolbar">
        <div :style="$q.screen.gt.sm ? 'min-width:300px' : ''">
          <q-btn class="gt-sm no-hover q-ml-lg" dense flat aria-label="Tradurs Home Button" padding="0"
            :ripple="!$q.dark.isActive" @click="main">
            <h1 class="h1">
              <img v-show="$q.dark.isActive" src="/images/logo.webp" width="48" height="48" alt="Tradurs Logo Image" />
              <img v-show="!$q.dark.isActive" src="/images/logo_light.webp" width="48" height="48"
                alt="Tradurs Light Logo Image" />
            </h1>
          </q-btn>
          <q-btn flat round aria-label="Tradurs Filter Button" class="lt-md" :ripple="!$q.dark.isActive"
            @click="leftDrawerOpen = !leftDrawerOpen">
            <img src="/images/icons/filter.svg" class="icon" width="24" height="24" alt="icon_filter" />
          </q-btn>
        </div>
        <div class="col row items-center" :class="$q.screen.lt.md ? 'justify-center' : 'justify-between'">
          <div class="col-9 col-md-5 row no-wrap items-center q-gutter-md">
            <q-btn v-if="$q.screen.lt.md" flat padding="0" :ripple="false" @click="main">
              <h1 class="h1">
                <img v-show="$q.dark.isActive" src="/images/logo.webp" width="36" height="36" alt="Tradurs Logo Image" />
                <img v-show="!$q.dark.isActive" src="/images/logo_light.webp" width="36" height="36"
                  alt="Tradurs Light Logo Image" />
              </h1>
            </q-btn>
            <q-input outlined dense no-error-icon hide-bottom-space class="col" v-model="_name" :label="t('item.name')"
              :disable="filterLoading || $route.name !== 'tradeList'" :rules="[val => checkName(val) || '']"
              @keyup.enter="search()">
              <template #append>
                <div style="width:24px">
                  <q-btn v-show="_name && _name !== ''" flat dense aria-label="Tradurs Clear Button" size="xs"
                    :ripple="false" class="no-hover" :disable="filterLoading" @click="clear">
                    <q-icon class="icon" :name="'img:/images/icons/close.svg'" size="xs" />
                  </q-btn>
                </div>
              </template>
            </q-input>
          </div>
          <div>
            <q-tabs dense no-caps narrow-indicator class="gt-sm q-px-xs bg-transparent no-hover nav">
              <q-route-tab :ripple="!$q.dark.isActive" :label="t('page.tradeList')"
                :to="{ name: 'tradeList', params: { lang: route.params.lang } }" exact />
              <q-route-tab v-if="as.signed" :ripple="!$q.dark.isActive" :label="t('page.messages')"
                class="relative-position" :to="{ name: 'messages', params: { lang: route.params.lang } }"
                :alert="newMessages ? 'negative' : 'transparent'" exact />
              <q-route-tab :ripple="!$q.dark.isActive" :label="t('page.awards')"
                :to="{ name: 'awards', params: { lang: route.params.lang } }" exact>
                <q-badge v-show="newAwards" floating label="N" color="orange-8" class="new-badge2" />
              </q-route-tab>
            </q-tabs>
          </div>
        </div>
        <div class="lt-md col-1 col-md-3 row justify-end q-gutter-sm">
          <q-btn round flat aria-label="Tradurs Morevert Button" :ripple="!$q.dark.isActive"
            @click="rightDrawerOpen = !rightDrawerOpen">
            <img class="icon" width="24" height="24" src="/images/icons/morevert.svg" alt="icon_morevert" />
          </q-btn>
        </div>
        <div class="gt-sm col-3 row justify-end items-center q-gutter-xs">
          <q-btn round dense flat aria-label="Tradurs Support Button" :ripple="!$q.dark.isActive"
            :to="{ name: 'support', params: { lang: route.params.lang } }">
            <img class="icon" width="24" height="24" src="/images/icons/help.svg" alt="icon_support" />
            <!-- <q-badge floating label="N" color="negative" class="new-badge" /> -->
          </q-btn>
          <q-btn round dense flat aria-label="Tradurs Language Button" :ripple="!$q.dark.isActive">
            <img class="icon" width="24" height="24" src="/images/icons/language.svg" alt="icon_language" />
            <q-menu auto-close class="no-shadow" anchor="bottom end" self="top end" transition-show="none"
              transition-hide="none" :transition-duration="0">
              <q-list bordered class="rounded-borders">
                <q-item v-for="lang in gs.localeOptions " :key="lang.value" :clickable="lang.value !== locale"
                  :active="lang.value === locale" @click="setLang(lang.value)">
                  {{ lang.label }}</q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn round dense flat aria-label="Tradurs Theme Button" :ripple="!$q.dark.isActive" @click="setDark">
            <img v-show="$q.dark.isActive" class="icon" width="24" height="24" src="/images/icons/light.svg"
              alt="icon_light" />
            <img v-show="!$q.dark.isActive" class="icon" width="24" height="24" src="/images/icons/dark.svg"
              alt="icon_dark" />
          </q-btn>
          <q-btn v-if="signed" round flat aria-label="Tradurs User Info Button" :ripple="!$q.dark.isActive">
            <img class="icon" width="24" height="24" src="/images/icons/user.svg" alt="icon_user" />
            <q-menu anchor="bottom end" self="top end" transition-show="none" transition-hide="none"
              :transition-duration="0" style="min-width:280px">
              <D4User :data="as.info" info>
                <template #actions>
                  <q-btn no-caps unelevated :disable="progressSign" aria-label="Tradurs Info Button" color="grey-9"
                    :label="t('user.info')" @click="info" v-close-popup />
                  <q-btn no-caps unelevated :loading="progressSign" aria-label="Tradurs Signout Button" color="secondary"
                    :label="t('user.signout')" @click="sign" v-close-popup />
                </template>
              </D4User>
            </q-menu>
          </q-btn>
          <q-btn v-else round dense flat aria-label="Tradurs Login Button" :ripple="!$q.dark.isActive" @click="sign">
            <img class="icon" width="24" height="24" src="/images/icons/login.svg" alt="icon_login" />
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <q-page :style-fn="myTweak">
        <div class="row justify-center">
          <div :class="screen.lt.sm ? 'q-pa-sm' : 'q-pa-xl'" :style="screen.lt.sm ? 'width:100%' : 'width:830px'">
            <div class="view max-width">
              <div class="row justify-center top-ads">
                <ins class="adsbygoogle" :style="`display:inline-block;${size}`" data-ad-client="ca-pub-5110777286519562"
                  data-ad-slot="7137983054" :data-adtest="prod ? 'off' : 'on'" :key="`top-${gs.reloadAdKey}`"></ins>
              </div>
              <RouterView />
            </div>
            <div class="q-py-xl"></div>
            <q-separator />
            <div class="q-pt-lg">
              <div class="row justify-center items-center q-gutter-xs text-caption bottom">
                <div>Copyright</div>
                <div>@</div>
                <div>2023</div>
                <q-btn class="no-hover" no-caps flat dense aria-label="Serasome Home Button" padding="0" :ripple="false"
                  href="https://serasome.com" target="_blank" rel="noopener noreferrer">SeraSome</q-btn>
              </div>
            </div>
          </div>
          <div class="gt-md col">
            <div class="full-height q-px-lg q-py-xl" :style="`width:280px;height:${asideHeight}`">
              <div :style="`position:sticky;top:${asideTop}`" class="column">
                <ins class="adsbygoogle" style="display:inline-block;width:160px;height:600px"
                  data-ad-client="ca-pub-5110777286519562" data-ad-slot="6751896285" :data-adtest="prod ? 'off' : 'on'"
                  :key="`right-${gs.reloadAdKey}`"></ins>
                <div class="q-mt-xl">
                  <div class="column items-start useful">
                    <q-btn flat no-caps padding="0" :ripple="false" class="text-overline no-hover" type="a"
                      href="https://diablo4.cc" label="Diablo.cc" target="_blank" rel="noopener noreferrer" />
                    <q-btn flat no-caps padding="0" :ripple="false" class="text-overline no-hover" type="a"
                      href="https://d4armory.fly.dev/map" label="D4 Armory" target="_blank" rel="noopener noreferrer" />
                    <q-btn flat no-caps padding="0" :ripple="false" class="text-overline no-hover" type="a"
                      href="https://d4builds.gg/build-planner" label="D4Builds.gg" target="_blank"
                      rel="noopener noreferrer" />
                    <q-btn flat no-caps padding="0" :ripple="false" class="text-overline no-hover" type="a"
                      href="https://maxroll.gg/d4" label="maxroll Diablo IV" target="_blank" rel="noopener noreferrer" />
                    <q-btn flat no-caps padding="0" :ripple="false" class="text-overline no-hover" type="a"
                      href="https://aziraell3.github.io/GAME/D4/?job=dru" label="Aspect Simulator" target="_blank"
                      rel="noopener noreferrer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
<style scoped>
.header {
  background-color: var(--q-dark);
  color: var(--q-light);
  box-shadow: inset 0 -1px 0 0 var(--q-dark-border);
}

.body--light .header {
  box-shadow: inset 0 -1px 0 0 var(--q-light-border);
  background-color: var(--q-light);
  color: var(--q-dark);
}

.header:deep(.q-btn .icon) {
  filter: contrast(0%);
}

.toolbar {
  min-height: inherit;
  width: 100vw;
  max-width: 1400px;
}

.nav,
.nav:deep(.q-tab) {
  transition: none !important;
}

.nav:deep(.q-tab__alert) {
  top: 3px;
}

.view {
  position: relative;
  min-height: 40vh;
}

.page:deep(.q-item__label) {
  opacity: .4;
}

.page:deep(.active .q-item__label) {
  opacity: 1;
}

.new-badge {
  top: 0;
  right: 0;
  padding: 2px 3px;
  border-radius: 40px;
  font-size: 10px;
  line-height: 10px;
}

.new-badge2 {
  top: 0;
  right: -10px;
  padding: 2px 3px;
  border-radius: 40px;
  font-size: 10px;
  line-height: 10px;
}

.top-ads {
  margin-bottom: 48px;
}

@media (max-width:600px) {
  .top-ads {
    margin: 12px 0 18px 0;
  }
}

.useful {
  color: currentColor;
}

.useful a {
  text-decoration: underline;
  text-underline-offset: 3px;
  border-radius: 0;
  line-height: 1rem;
  margin-bottom: 10px;
  opacity: .5;
}

.useful a:hover {
  opacity: 1;
}

.bg-season::before {
  content: '';
  position: fixed;
  z-index: -1;
  opacity: .2;
  width: 100vw;
  height: 100vh;
  background-image: var(--tradurs-season-image);
  background-repeat: no-repeat;
  background-position: center 40%;
}

.body--light .bg-season::before {
  opacity: .3;
  filter: grayscale(1);
}

.h1 {
  font-size: inherit;
  line-height: inherit;
  margin: 0;
  padding: 0;
  display: inline-flex;
}

kbd {
  font-family: Arial;
  font-size: 12px;
  line-height: 12px;
  padding: 4px 8px 8px;
  color: #616161;
  background: linear-gradient(-225deg, #d5dbe4, #f8f8f8);
  border-radius: 4px;
  box-shadow: inset 0 -4px 0 0 #cdcde6, inset 0 0 2px 2px #fff, 0 2px 4px 2px rgba(30, 35, 90, 0.4);
}
</style>