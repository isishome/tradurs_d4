<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar, Screen, uid } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useAccountStore } from 'stores/account-store'
import { icons } from 'src/common/icons'

import D4Filter from 'components/D4Filter.vue'

const prod: boolean = import.meta.env.PROD

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const accountStore = useAccountStore()
const { t, locale } = useI18n({ useScope: 'global' })

const leftDrawerOpen = ref<boolean>(false)
const rightDrawerOpen = ref<boolean>(false)
const signed = computed<boolean | null>(() => accountStore.signed)
const screen = computed<Screen>(() => $q.screen)
const offsetTop = ref<number>(0)
const asideHeight = computed<string>(() => `calc(100vh - ${screen.value.gt.sm ? offsetTop.value : 0}px)`)
const asideTop = computed<string>(() => `${offsetTop.value + 10}px`)

const myTweak = (offset: number): void => {
  offsetTop.value = offset || 0
}

const sign = (): void => {
  accountStore.sign().then((result: boolean) => {
    if (!result)
      router.go(0)
  })
}

const localeOptions = [
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어' }
]

const brLoc = localeOptions.map(lo => lo.value).includes($q.lang.getLocale()?.substring(0, 2) || '') ? $q.lang.getLocale()?.substring(0, 2) : 'ko'
const setLang = (lang: string) => {
  $q.cookies.set('d4.lang', lang)
}

const setDark = () => {
  $q.dark.set(!$q.dark.isActive)
  $q.cookies.set('d4.dark', $q.dark.isActive.toString())
}

// socket.io
const badge = computed(() => accountStore.badge)

const key = ref(uid())
const reload = () => {
  key.value = uid()
  nextTick(() => {
    onWindowLoad()
  })
}

watch(() => route.name, (val, old) => {
  if (val && val !== old)
    reload()
})

watch(() => $q.screen.gt.sm, () => {
  rightDrawerOpen.value = false
})

const onWindowLoad = () => {
  const adsbygoogle = window.adsbygoogle || []
  adsbygoogle.push({})
  adsbygoogle.push({})
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
          <D4Filter :disable="$route.name !== 'item-list'" class="q-pa-lg" />
        </q-scroll-area>
      </q-list>
    </q-drawer>
    <q-drawer show-if-above bordered v-model="rightDrawerOpen" side="right" behavior="mobile"
      class="row justify-start scroll" :width="300">
      <q-list class="column full-height" style="width:300px">
        <q-item class="row justify-end q-gutter-sm q-pa-lg">
          <q-select v-model="locale" :options="localeOptions" :label="t('language', 0, { locale: brLoc })" dense outlined
            behavior="menu" emit-value map-options options-dense style="min-width: 150px" @update:model-value="setLang" />
          <q-btn round flat :ripple="!$q.dark.isActive" @click="setDark">
            <img v-show="$q.dark.isActive" class="icon" width="24" :src="icons.light" />
            <img v-show="!$q.dark.isActive" class="icon" width="24" :src="icons.dark" />
          </q-btn>
          <q-btn round flat :ripple="!$q.dark.isActive" @click="sign">
            <img v-if="signed" class="icon" width="24" :src="icons.logout" />
            <img v-else class="icon" width="24" :src="icons.login" />
          </q-btn>
        </q-item>
        <q-separator />
        <q-scroll-area class="col">
          <q-item>
          </q-item>
        </q-scroll-area>
      </q-list>
    </q-drawer>
    <q-header :elevated="!$q.dark.isActive" class="q-py-sm header row justify-center">
      <q-toolbar class="toolbar">
        <div class="col-lg-3 col-4 row items-center">
          <q-btn class="gt-sm no-hover" dense flat padding="0" :ripple="!$q.dark.isActive" :to="{ path: '/' }">
            <img v-show="$q.dark.isActive" src="~assets/logo.webp" height="48" />
            <img v-show="!$q.dark.isActive" src="~assets/logo_light.webp" height="48" />
          </q-btn>
          <q-btn flat round class="lt-md" :ripple="!$q.dark.isActive" @click="leftDrawerOpen = !leftDrawerOpen">
            <img src="~assets/icons/filter.svg" class="icon" width="24" />
          </q-btn>
        </div>
        <div class="col row justify-center">
          <q-btn class="lt-md no-hover" dense flat padding="0" :ripple="!$q.dark.isActive" :to="{ path: '/' }">
            <img v-show="$q.dark.isActive" src="~assets/logo.webp" height="48" />
            <img v-show="!$q.dark.isActive" src="~assets/logo_light.webp" height="48" />
          </q-btn>
          <q-tabs dense no-caps class="gt-sm q-px-md bg-transparent no-hover nav">
            <q-route-tab :ripple="!$q.dark.isActive" :label="t('trade')" :to="{ path: '/' }" />
            <!-- <q-route-tab :ripple="!$q.dark.isActive" :label="t('message')" :to="{ path: '/message' }">
                              <q-badge v-show="badge" floating color="red" rounded />
                            </q-route-tab> -->
          </q-tabs>
        </div>
        <div class="lt-md col-lg-3 col-4 row justify-end q-gutter-sm">
          <q-btn round flat :ripple="!$q.dark.isActive" @click="rightDrawerOpen = !rightDrawerOpen">
            <img class="icon" width="24" :src="icons.morevert" />
          </q-btn>
        </div>
        <div class="gt-sm col-lg-3 col-4 row justify-end q-gutter-sm">
          <q-select v-model="locale" :options="localeOptions" :label="t('language', 0, { locale: brLoc })" dense outlined
            behavior="menu" emit-value map-options options-dense style="min-width: 150px" @update:model-value="setLang" />
          <q-btn round flat :ripple="!$q.dark.isActive" @click="setDark">
            <img v-show="$q.dark.isActive" class="icon" width="24" :src="icons.light" />
            <img v-show="!$q.dark.isActive" class="icon" width="24" :src="icons.dark" />
          </q-btn>
          <q-btn round flat :ripple="!$q.dark.isActive" @click="sign">
            <img v-if="signed" class="icon" width="24" :src="icons.logout" />
            <img v-else class="icon" width="24" :src="icons.login" />
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <q-page :style-fn="myTweak">
        <div class="row justify-center">
          <div :class="screen.lt.sm ? 'q-pa-sm' : 'q-pa-xl'" :style="screen.lt.sm ? 'width:100%' : 'width:830px'">
            <div class="view">
              <RouterView />
              <div class="q-py-xl"></div>
            </div>
            <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-5110777286519562"
              data-ad-slot="8610177982" data-ad-format="auto" data-full-width-responsive="true"
              :data-adtest="prod ? 'off' : 'on'" :key="key"></ins>
            <q-separator />
            <div class="q-pt-lg">
              <div class="row justify-center items-center q-gutter-xs text-caption bottom">
                <div>Copyright</div>
                <div>@</div>
                <div>2022</div>
                <div>SeraSome</div>
              </div>
            </div>
          </div>
          <div class="gt-md col">
            <div class="full-height q-px-lg q-py-xl" :style="`width:280px;height:${asideHeight}`">
              <div :style="`position:sticky;top:${asideTop}`">
                <ins class="adsbygoogle" style="display:inline-block;width:160px;height:600px"
                  data-ad-client="ca-pub-5110777286519562" data-ad-slot="7240136439" :data-adtest="prod ? 'off' : 'on'"
                  :key="key"></ins>
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
  min-height: 200px;
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
}

.body--light ins::after {
  color: var(--q-dark);
}

.nav,
.nav:deep(.q-tab) {
  transition: none !important;
}

.view {
  position: relative;
  min-height: 40vh;
}
</style>