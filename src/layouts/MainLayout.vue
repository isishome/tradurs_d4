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
  if (!as.signed)
    document.location.href = `${tradurs}/sign?redirect=${encodeURIComponent(document.location.href)}`
  else {
    progressSign.value = true
    as.sign().then((result: boolean) => {
      if (!result) {
        is.clearFilter()

        if (route.name === 'tradeList') {
          mainKey.value++
          gs.reloadAdKey++
        }
        else
          router.push({ name: 'tradeList', params: { lang: route.params.lang } })
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

const main = () => {
  if (route.name === 'tradeList') {
    is.clearFilter()
    mainKey.value++
    gs.reloadAdKey++
  }
  else
    router.push({ name: 'tradeList', params: { lang: route.params.lang } })
}

const beforeShow = () => {
  if ($q.platform.is.mobile)
    scrollPosDirect()
}

// drawer expansion item
const expanded = ref<boolean>(false)
const isMySpace = computed(() => ['messages', 'blocks', 'history'].includes(route.name as string))

// about screen size
const size = computed(() => $q.screen.width < 728 ? 'width:320px;max-height:100px;' : 'width:728px;height:90px;')
const size2 = computed(() => $q.screen.width < 300 ? 'width:250px;height:250px;' : $q.screen.width < 336 ? 'width:300px;height:250px;' : $q.screen.width < 728 ? 'width:336px;height:280px;' : 'width:728px;height:90px;')

watch([size, () => $q.screen.gt.md], ([new1, new2], [old1, old2]) => {
  if (new1 !== old1 || new2 !== old2)
    gs.reloadAdKey++
})

watch(() => route.name, (val, old) => {
  if (val && val !== old)
    gs.reloadAdKey++
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
    <div v-show="['tradeList', 'itemInfo'].includes(route.name as string) && is.storage.data.ladder" class="bg-season"
      :style="`--tradurs-season-image:url('${t('season.bg')}');`">
    </div>
    <q-drawer show-if-above no-swipe-open no-swipe-close no-swipe-backdrop bordered v-model="leftDrawerOpen" side="left"
      :behavior="screen.lt.md ? 'default' : 'desktop'" class="row justify-end" @before-show="beforeShow" :width="300">
      <D4Filter :disable="route.name !== 'tradeList'" class="q-pa-lg" style="width:300px" />
    </q-drawer>
    <q-drawer show-if-above no-swipe-open no-swipe-close no-swipe-backdrop bordered v-model="rightDrawerOpen" side="right"
      behavior="mobile" class="row justify-start no-scroll" :width="300">
      <div class="column fit">
        <q-item class="row justify-between q-gutter-xs q-py-lg">
          <q-select v-model="locale" :options="gs.localeOptions" :label="t('language', 0, { locale: brLoc })" outlined
            dense emit-value map-options style="min-width: 120px" dropdown-icon="img:/images/icons/dropdown.svg"
            popup-content-class="scroll bordered" @update:model-value="setLang" />
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
        <div class="col scroll">
          <q-list class="q-pa-md page">
            <q-item v-ripple clickable :to="{ name: 'tradeList', params: { lang: route.params.lang } }" exact
              active-class="active">
              <q-item-section side>
                <q-item-label>
                  {{ t('page.tradeList') }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-ripple clickable :to="{ name: 'awards', params: { lang: route.params.lang } }" exact
              active-class="active">
              <q-item-section side>
                <q-item-label>
                  {{ t('page.awards') }}
                </q-item-label>
                <q-badge v-show="newAwards" floating label="N" color="orange-8" class="new-badge2" />
              </q-item-section>
            </q-item>
            <q-expansion-item v-if="as.signed" v-model="expanded" :label="t('page.mySpace')"
              expand-icon="img:/images/icons/dropdown.svg" :default-opened="isMySpace"
              :class="expanded ? 'expanded rounded-borders' : ''">
              <q-list bordered class="sub rounded-borders">
                <q-item :inset-level=".4" v-ripple clickable
                  :to="{ name: 'messages', params: { lang: route.params.lang } }" exact active-class="active">
                  <q-item-section side>
                    <q-item-label>
                      {{ t('page.messages') }}
                    </q-item-label>
                    <div v-show="newMessages" class="alert"></div>
                  </q-item-section>
                </q-item>
                <q-item :inset-level=".4" v-ripple clickable :to="{ name: 'blocks', params: { lang: route.params.lang } }"
                  exact active-class="active">
                  <q-item-section side>
                    <q-item-label>
                      {{ t('page.blocks') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item :inset-level=".4" v-ripple clickable
                  :to="{ name: 'history', params: { lang: route.params.lang } }" exact active-class="active">
                  <q-item-section side>
                    <q-item-label>
                      {{ t('page.history') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </q-list>
          <q-separator />
          <q-list class="q-mx-md q-py-xl q-mt-xl text-overline useful" dense>
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
          <div class="column q-mt-lg q-mb-xl q-ml-lg q-pl-sm text-caption">
            <div>
              {{ t('contact.inquiries') }}
            </div>
            <div>
              <q-btn flat no-caps padding="0" :ripple="false" color="primary" class="no-hover" type="a" size="12px"
                href="mailto:serasomething@gmail.com" label="serasomething@gmail.com" />
            </div>
          </div>
        </div>
      </div>
    </q-drawer>
    <q-header :elevated="!$q.dark.isActive" class="q-py-sm header row justify-center">
      <q-toolbar class="toolbar">
        <div :style="$q.screen.gt.sm ? 'min-width:120px' : ''">
          <q-btn class="gt-sm no-hover q-ml-lg" dense flat aria-label="Tradurs Home Button" padding="0"
            :ripple="!$q.dark.isActive" @click="main">
            <h1 class="h1">
              <img v-show="$q.dark.isActive" src="/images/logo.webp" width="48" height="48" alt="Tradurs Logo Image" />
              <img v-show="!$q.dark.isActive" src="/images/logo_light.webp" width="48" height="48"
                alt="Tradurs Light Logo Image" />
              <span class="blind">{{ t('seo.title') }}</span>
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
            <q-toolbar class="gt-sm nav">
              <q-btn flat no-caps type="a" :ripple="false" class="no-hover"
                :class="{ 'active': route.name === 'tradeList' }" :label="t('page.tradeList')"
                :to="{ name: 'tradeList', params: { lang: route.params.lang } }" />
              <q-btn flat no-caps type="a" :ripple="false" class="no-hover" :class="{ 'active': route.name === 'awards' }"
                :to="{ name: 'awards', params: { lang: route.params.lang } }">
                <div class="relative-position">
                  {{ t('page.awards') }}
                  <q-badge v-show="newAwards" floating label="N" color="orange-8" class="new-badge2" style="top:-4px" />
                </div>
              </q-btn>
              <q-btn-dropdown v-if="as.signed" flat content-class="no-shadow" no-caps :ripple="false"
                :label="t('page.mySpace')" class="no-hover" transition-show="none" transition-hide="none"
                transition-duration="0" dropdown-icon="img:/images/icons/dropdown.svg">
                <q-list bordered class="page rounded-borders shadow-3">
                  <q-item v-ripple clickable :to="{ name: 'messages', params: { lang: route.params.lang } }" exact
                    active-class="active">
                    <q-item-section side>
                      <q-item-label>
                        {{ t('page.messages') }}
                      </q-item-label>
                      <div v-show="newMessages" class="alert"></div>
                    </q-item-section>
                  </q-item>
                  <q-item v-ripple clickable :to="{ name: 'blocks', params: { lang: route.params.lang } }" exact
                    active-class="active">
                    <q-item-section side>
                      <q-item-label>
                        {{ t('page.blocks') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-ripple clickable :to="{ name: 'history', params: { lang: route.params.lang } }" exact
                    active-class="active">
                    <q-item-section side>
                      <q-item-label>
                        {{ t('page.history') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </q-toolbar>
            <!--
            <q-tabs dense no-caps narrow-indicator class="gt-sm q-px-xs bg-transparent no-hover nav">
              <q-route-tab :ripple="!$q.dark.isActive" :label="t('page.tradeList')"
                :to="{ name: 'tradeList', params: { lang: route.params.lang } }" exact />

              <q-route-tab :ripple="!$q.dark.isActive" :label="t('page.awards')"
                :to="{ name: 'awards', params: { lang: route.params.lang } }" exact>
                <q-badge v-show="newAwards" floating label="N" color="orange-8" class="new-badge2" />
              </q-route-tab>
              <q-tab label="내 정보">
                <q-tabs>
                  <q-route-tab v-if="as.signed" :ripple="!$q.dark.isActive" :label="t('page.messages')"
                    class="relative-position" :to="{ name: 'messages', params: { lang: route.params.lang } }"
                    :alert="newMessages ? 'negative' : 'transparent'" exact />
                  <q-route-tab v-if="as.signed" :ripple="!$q.dark.isActive" :label="t('page.history')"
                    class="relative-position" :to="{ name: 'history', params: { lang: route.params.lang } }" exact />
                </q-tabs>
              </q-tab>
            </q-tabs>
            -->
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
                <q-item v-for="lang in gs.localeOptions" :key="lang.value" :clickable="lang.value !== locale"
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
            <div class="row justify-center">
              <ins v-if="route.name !== 'tradeList' && $q.screen.lt.lg" class="adsbygoogle"
                :style="`display:inline-block;${size2}`" data-ad-client="ca-pub-5110777286519562"
                data-ad-slot="6163086381" :data-adtest="prod ? 'off' : 'on'" :key="`bottom-${gs.reloadAdKey}`"></ins>
            </div>
            <div class="q-py-md"></div>
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
                <div class="column q-py-xl q-pr-xl text-caption">
                  <div>
                    {{ t('contact.inquiries') }}
                  </div>
                  <div>
                    <q-btn flat no-caps padding="0" :ripple="false" color="primary" class="no-hover" type="a" size="12px"
                      href="mailto:serasomething@gmail.com" label="serasomething@gmail.com" />
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

.nav:deep(.q-btn) {
  opacity: .6;
  transition: opacity .3s ease-in-out;
}

.nav:deep(.q-btn .q-btn__content) {
  transition: border .3s ease-in-out;
  border-bottom: solid 2px transparent;
}

.nav:deep(.q-btn.active) {
  opacity: 1;
}

.nav:deep(.q-btn.active .q-btn__content) {
  border-bottom-color: currentColor;
}

.view {
  position: relative;
  min-height: 40vh;
}

.page:deep(.sub) {
  background-color: var(--q-cloud);
  border-top: none;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.page:deep(.q-expansion-item>div>.q-item:first-child) {
  transition: box-shadow .3s ease;
}

.page:deep(.expanded>div>.q-item:first-child) {
  border-radius: 4px 4px 0 0;
  box-shadow: inset 0 0 0 1px rgba(100, 100, 100, 1);
  opacity: 1;
}

.page:deep(.q-item__section--side) {
  color: currentColor;
}

.page:deep(.q-item) {
  opacity: .6;
}

.page:deep(.q-item__section) {
  position: relative;
  padding-right: 0;
}

.page:deep(.q-item__label) {
  border-bottom: solid 2px transparent;
}

.page:deep(.q-item.active) {
  opacity: 1;
}

.page:deep(.active .q-item__label) {
  border-bottom-color: currentColor;
}

.alert {
  position: absolute;
  top: 0;
  right: -9px;
  border-radius: 40px;
  width: 10px;
  height: 10px;
  background-color: var(--q-negative);
}

.new-badge2 {
  top: 0;
  right: -10px;
  padding: 1px 2px;
  border-radius: 40px;
  font-size: 10px;
  line-height: 10px;
  color: var(--q-dark);
  font-weight: 700;
}

.body--light .new-badge2 {
  color: var(--q-light-page);
  font-weight: 500;
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
  opacity: .3;
  width: 100vw;
  height: 100vh;
  background-image: var(--tradurs-season-image);
  background-repeat: no-repeat;
  background-position: center 40%;
}

.body--light .bg-season::before {
  filter: grayscale(1);
}

.h1 {
  font-size: inherit;
  line-height: inherit;
  margin: 0;
  padding: 0;
  display: inline-flex;
}

.blind {
  position: absolute;
  clip: rect(0 0 0 0);
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
}
</style>