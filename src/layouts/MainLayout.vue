<script setup lang="ts">
import { AxiosInstance } from 'axios'
import { ref, computed, watch, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar, Screen, uid } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useGlobalStore } from 'src/stores/global-store'
import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'
import { checkName } from 'src/common'

import D4Filter from 'components/D4Filter.vue'
import D4User from 'components/D4User.vue'

const prod: boolean = import.meta.env.PROD

const api = inject('axios') as AxiosInstance
const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const gs = useGlobalStore()
const as = useAccountStore()
const is = useItemStore()
const { t, locale } = useI18n({ useScope: 'global' })

const filterLoading = computed(() => is.filter.loading)
const leftDrawerOpen = ref<boolean>(false)
const rightDrawerOpen = ref<boolean>(false)
const signed = computed<boolean | null>(() => as.signed)
const newMessages = computed<boolean>(() => route.name !== 'messages' && as.newMessages)
const screen = computed<Screen>(() => $q.screen)
const offsetTop = ref<number>(0)
const asideHeight = computed<string>(() => `calc(100vh - ${screen.value.gt.sm ? offsetTop.value : 0}px)`)
const asideTop = computed<string>(() => `${offsetTop.value + 10}px`)

const myTweak = (offset: number): void => {
  offsetTop.value = offset || 0
}

const info = () => {
  const tradurs: string = import.meta.env.VITE_APP_TRADURS
  document.location.href = `${tradurs}/info`
}

const progressSign = ref<boolean>(false)
const sign = () => {
  progressSign.value = true
  as.sign().then((result: boolean) => {
    if (!result)
      router.go(0)
  }).catch(() => { })
    .then(() => {
      progressSign.value = false
    })
}

const localeOptions = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' }
]

const brLoc = localeOptions.map(lo => lo.value).includes($q.lang.getLocale()?.substring(0, 2) || '') ? $q.lang.getLocale()?.substring(0, 2) : 'ko'
const setLang = (lang: string) => {
  locale.value = lang
  $q.cookies.set('d4.lang', lang)
  api.defaults.headers.common['Accept-Language'] = lang
}

const setDark = () => {
  $q.dark.set(!$q.dark.isActive)
  $q.cookies.set('d4.dark', $q.dark.isActive.toString())
}

const key = ref(uid())
const reload = () => {
  key.value = uid()
  nextTick(() => {
    setTimeout(() => {
      onWindowLoad()
    }, 0)
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
  if (route.name === 'tradeList' && page.value === 1)
    router.go(0)
  else
    router.push({ name: 'tradeList' })
}

watch(() => route.name, (val, old) => {
  if (val && val !== old)
    reload()
})

watch(() => gs.refresh, (val, old) => {
  if (val && val !== old)
    reload()
})

watch(() => $q.screen.gt.sm, () => {
  rightDrawerOpen.value = false
})

watch(() => is.filter.request, (val) => {
  if (val === 0)
    _name.value = ''
})

const size = computed(() => $q.screen.width < 728 ? 'width:320px;max-height:100px;' : 'width:728px;height:90px;')

const onWindowLoad = () => {
  const adsbygoogle = window.adsbygoogle || []
  adsbygoogle.push({})
  adsbygoogle.push({})
  //adsbygoogle.push({})
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
  <q-layout view="hHh lpR lFf">
    <q-drawer show-if-above bordered v-model="leftDrawerOpen" side="left" :behavior="screen.lt.md ? 'mobile' : 'desktop'"
      class="row justify-end no-scroll" :width="300">
      <q-list class="column full-height" style="width:300px">
        <q-scroll-area class="col">
          <D4Filter :disable="$route.name !== 'tradeList'" class="q-px-md q-pt-lg" />
        </q-scroll-area>
      </q-list>
    </q-drawer>
    <q-drawer show-if-above bordered v-model="rightDrawerOpen" side="right" behavior="mobile"
      class="row justify-start scroll" :width="300">
      <q-list class="column full-height" style="width:300px">
        <q-item class="row justify-between q-gutter-xs q-py-lg">
          <q-select v-model="locale" :options="localeOptions" :label="t('language', 0, { locale: brLoc })" dense outlined
            behavior="menu" emit-value map-options options-dense style="min-width: 120px"
            dropdown-icon="img:/images/icons/dropdown.svg" popup-content-class="d4-scroll"
            @update:model-value="setLang" />
          <div>
            <q-btn round dense flat aria-label="Tradurs Support Button" :ripple="!$q.dark.isActive"
              :to="{ name: 'support' }">
              <img class="icon" width="24" height="24" src="/images/icons/help.svg" alt="icon_support" />
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
            <q-item v-ripple clickable :to="{ name: 'tradeList' }" exact active-class="active">
              <q-item-section>
                <q-item-label>
                  {{ t('page.tradeList') }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="as.signed" v-ripple clickable :to="{ name: 'messages' }" exact active-class="active">
              <q-item-section>
                <q-item-label>
                  {{ t('page.messages') }}
                </q-item-label>
              </q-item-section>
              <q-item-section v-show="newMessages" side>
                <q-badge rounded color="secondary"></q-badge>
              </q-item-section>
            </q-item>
            <q-item v-if="as.signed" v-ripple clickable :to="{ name: 'awards' }" exact active-class="active">
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
          </q-list>
        </q-scroll-area>
      </q-list>
    </q-drawer>
    <q-header :elevated="!$q.dark.isActive" class="q-py-sm header row justify-center">
      <q-toolbar class="toolbar">
        <div class="row items-center" :style="$q.screen.gt.sm ? 'min-width:300px' : ''">
          <q-btn class="gt-sm no-hover q-ml-lg" dense flat aria-label="Tradurs Home Button" padding="0"
            :ripple="!$q.dark.isActive" @click="main">
            <img v-show="$q.dark.isActive" src="/images/logo.webp" width="48" height="48" alt="Tradurs Logo Image" />
            <img v-show="!$q.dark.isActive" src="/images/logo_light.webp" width="48" height="48"
              alt="Tradurs Light Logo Image" />
          </q-btn>
          <q-btn flat round aria-label="Tradurs Filter Button" class="lt-md" :ripple="!$q.dark.isActive"
            @click="leftDrawerOpen = !leftDrawerOpen">
            <img src="/images/icons/filter.svg" class="icon" width="24" height="24" alt="icon_filter" />
          </q-btn>
        </div>
        <div class="col row items-center" :class="$q.screen.lt.md ? 'justify-center' : 'justify-between'">
          <div class="col-9 col-md-6 row no-wrap items-center q-gutter-md">
            <q-btn v-if="$q.screen.lt.md" flat padding="0" :ripple="false" @click="main">
              <img v-show="$q.dark.isActive" src="/images/logo.webp" width="36" height="36" alt="Tradurs Logo Image" />
              <img v-show="!$q.dark.isActive" src="/images/logo_light.webp" width="36" height="36"
                alt="Tradurs Light Logo Image" />
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
            <q-tabs dense no-caps narrow-indicator class="gt-sm q-px-sm bg-transparent no-hover nav">
              <q-route-tab :ripple="!$q.dark.isActive" :label="t('page.tradeList')" :to="{ name: 'tradeList' }" exact />
              <q-route-tab v-if="as.signed" :ripple="!$q.dark.isActive" :label="t('page.messages')"
                class="relative-position" :to="{ name: 'messages' }" :alert="newMessages ? 'secondary' : 'transparent'"
                exact />
              <q-route-tab v-if="as.signed" :ripple="!$q.dark.isActive" :label="t('page.awards')" :to="{ name: 'awards' }"
                exact />
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
            :to="{ name: 'support' }">
            <img class="icon" width="24" height="24" src="/images/icons/help.svg" alt="icon_support" />
          </q-btn>
          <q-btn round dense flat aria-label="Tradurs Language Button" :ripple="!$q.dark.isActive">
            <img class="icon" width="24" height="24" src="/images/icons/language.svg" alt="icon_language" />
            <q-menu auto-close class="no-shadow" anchor="bottom end" self="top end" transition-show="none"
              transition-hide="none" :transition-duration="0">
              <q-list bordered class="rounded-borders">
                <q-item v-for="lang in localeOptions" :key="lang.value" clickable :active="lang.value === locale"
                  @click="setLang(lang.value)">
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
              <div class="row justify-center" :class="$q.screen.width < 728 ? 'q-mb-sm' : 'q-mb-md'">
                <ins class="adsbygoogle" :style="`display:inline-block;${size}`" data-ad-client="ca-pub-5110777286519562"
                  data-ad-slot="7137983054" :data-adtest="prod ? 'off' : 'on'" :key="`top-${key}`"></ins>
              </div>
              <RouterView />
            </div>
            <div class="q-py-xl"></div>
            <!-- <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-5110777286519562"
              data-ad-slot="6163086381" data-ad-format="auto" data-full-width-responsive="true"
              :data-adtest="prod ? 'off' : 'on'" :key="key"></ins> -->
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
                  :key="`right-${key}`"></ins>
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

ins {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, .05);
  background-color: rgba(255, 255, 255, .05);
  position: relative;
  min-height: 50px;
}

.body--light ins {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .05);
  background-color: rgba(0, 0, 0, .05);
}

ins::after {
  content: 'AD';
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: -1;
  transform: translate(-50%, -50%);
  color: var(--q-light);
  opacity: .2;
}

.body--light ins::after {
  color: var(--q-dark);
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
</style>