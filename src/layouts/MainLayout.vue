<script setup lang="ts">
import { AxiosInstance } from 'axios'
import { ref, computed, reactive, watch, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar, Screen, uid } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'
import { useGlobalStore } from 'stores/global-store'
import { icons } from 'src/common/icons'
import { checkName } from 'src/common'

import D4Filter from 'components/D4Filter.vue'
import D4User from 'components/D4User.vue'
import D4Dialog from 'components/D4Dialog.vue'
import D4Tooltip from 'components/D4Tooltip.vue'

const prod: boolean = import.meta.env.PROD

const api = inject('axios') as AxiosInstance
const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const as = useAccountStore()
const is = useItemStore()
const gs = useGlobalStore()
const { t, locale } = useI18n({ useScope: 'global' })

const filterLoading = computed(() => is.filter.loading)
const leftDrawerOpen = ref<boolean>(false)
const rightDrawerOpen = ref<boolean>(false)
const signed = computed<boolean | null>(() => as.signed)
const screen = computed<Screen>(() => $q.screen)
const offsetTop = ref<number>(0)
const asideHeight = computed<string>(() => `calc(100vh - ${screen.value.gt.sm ? offsetTop.value : 0}px)`)
const asideTop = computed<string>(() => `${offsetTop.value + 10}px`)

const myTweak = (offset: number): void => {
  offsetTop.value = offset || 0
}

const sign = (): void => {
  as.sign().then((result: boolean) => {
    if (!result)
      router.go(0)
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

const contact = reactive<{ show: boolean, contents: string | null, disable: boolean }>({
  show: false,
  contents: null,
  disable: false
})
const send = () => {
  if (window?.grecaptcha) {
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute('6Lf38rYmAAAAAB-ET1oihMUkcDumRascvVHOyGmg', { action: 'submit' })
        .then((token: string) => {
          gs.contactUs(token, contact.contents)
            .then(() => {
              $q.notify({
                icon: `img:${icons.check}`,
                color: 'positive',
                message: t('contact.success')
              })
              contact.show = false
            })
        })
    })
  }
}

const close = () => {
  contact.contents = null
  contact.disable = false
}

const key = ref(uid())
const reload = () => {
  key.value = uid()
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

const page = computed(() => route.query.page ? Number.parseInt(route.query.page.toString()) : 1)
const main = () => {
  if (route.name === 'tradeList' && page.value === 1)
    router.go(0)
  else
    router.push({ name: 'tradeList', query: { page: 1 } })
}

watch(() => route.name, (val, old) => {
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
          <D4Filter :disable="$route.name !== 'tradeList'" class="q-pl-lg q-pt-lg" />
        </q-scroll-area>
      </q-list>
    </q-drawer>
    <q-drawer show-if-above bordered v-model="rightDrawerOpen" side="right" behavior="mobile"
      class="row justify-start scroll" :width="300">
      <q-list class="column full-height" style="width:300px">
        <q-item class="row justify-end q-gutter-xs q-py-lg">
          <q-select v-model="locale" :options="localeOptions" :label="t('language', 0, { locale: brLoc })" dense outlined
            behavior="menu" emit-value map-options options-dense style="min-width: 120px"
            :dropdown-icon="`img:${icons.dropdown}`" popup-content-class="d4-scroll" @update:model-value="setLang" />
          <q-btn round flat aria-label="Tradurs Support Button" :ripple="!$q.dark.isActive" type="a"
            href="mailto:serasomething@gmail.com">
            <img class="icon" width="24" height="24" :src="icons.help" alt="icon_support" />
            <D4Tooltip anchor="bottom middle" self="top middle" transition-show="jump-down" transition-hide="jump-up"
              :offset="[0, 10]" desktop>
              <div class="text-caption break-keep" style="max-width:200px">
                {{ t('contactUs') }}
              </div>
            </D4Tooltip>
          </q-btn>
          <q-btn round flat aria-label="Tradurs Theme Button" :ripple="!$q.dark.isActive" @click="setDark">
            <img v-show="$q.dark.isActive" class="icon" width="24" height="24" :src="icons.light" alt="icon_light" />
            <img v-show="!$q.dark.isActive" class="icon" width="24" height="24" :src="icons.dark" alt="icon_dark" />
          </q-btn>
          <q-btn v-if="signed" round flat aria-label="Tradurs User Info Button" :ripple="!$q.dark.isActive">
            <img class="icon" width="24" height="24" :src="icons.user" alt="icon_user" />
            <q-menu anchor="bottom end" self="top end" transition-show="none" transition-hide="none"
              :transition-duration="0" style="min-width:260px">
              <D4User :data="as.info" info>
                <template #actions>
                  <q-btn rounded aria-label="Tradurs Signout Button" color="secondary" :label="t('user.signout')"
                    @click="sign" v-close-popup />
                </template>
              </D4User>
            </q-menu>
          </q-btn>
          <q-btn v-else round flat aria-label="Tradurs Login Button" :ripple="!$q.dark.isActive" @click="sign">
            <img class="icon" width="24" height="24" :src="icons.login" alt="icon_login" />
          </q-btn>
        </q-item>
        <q-separator />
        <q-scroll-area class="col q-pa-md text-body2">
          <q-item v-ripple clickable :to="{ name: 'tradeList' }" exact>
            <q-item-section>
              <q-item-label>
                {{ t('page.tradeList') }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="as.signed" v-ripple clickable :to="{ name: 'messages' }" exact>
            <q-item-section>
              <q-item-label>
                {{ t('page.messages') }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-scroll-area>
      </q-list>
    </q-drawer>
    <q-header :elevated="!$q.dark.isActive" class="q-py-sm header row justify-center">
      <q-toolbar class="toolbar">
        <div class="col-2 col-lg-3 row items-center">
          <q-btn class="gt-sm no-hover" dense flat aria-label="Tradurs Home Button" padding="0"
            :ripple="!$q.dark.isActive" @click="main">
            <img v-show="$q.dark.isActive" src="~assets/logo.webp" width="48" height="48" alt="Tradurs Logo Image" />
            <img v-show="!$q.dark.isActive" src="~assets/logo_light.webp" width="48" height="48"
              alt="Tradurs Light Logo Image" />
          </q-btn>
          <q-btn flat round aria-label="Tradurs Filter Button" class="lt-md" :ripple="!$q.dark.isActive"
            @click="leftDrawerOpen = !leftDrawerOpen">
            <img :src="icons.filter" class="icon" width="24" height="24" alt="icon_filter" />
          </q-btn>
        </div>
        <div class="col row items-center justify-between" :class="{ 'justify-center': $q.screen.lt.md }">
          <div class="col-12 col-md-6">
            <q-input outlined dense no-error-icon hide-bottom-space v-model="_name" :label="t('item.name')"
              :disable="filterLoading || $route.name !== 'tradeList'" :rules="[val => checkName(val) || '']"
              @keyup.enter="search()">
              <template v-if="$q.screen.lt.md" #prepend>
                <q-icon>
                  <img v-show="$q.dark.isActive" src="~assets/logo.webp" width="24" height="24"
                    alt="Tradurs Logo Image" />
                  <img v-show="!$q.dark.isActive" src="~assets/logo_light.webp" width="24" height="24"
                    alt="Tradurs Light Logo Image" />
                </q-icon>
              </template>
              <template #append>
                <q-btn flat dense aria-label="Tradurs Search Button" size="xs" :ripple="false" class="no-hover"
                  :disable="filterLoading" @click="search()">
                  <q-icon class="icon" :name="`img:${icons.search}`" size="xs" />
                </q-btn>
              </template>
            </q-input>
          </div>
          <div>
            <q-tabs dense no-caps class="gt-sm q-px-md bg-transparent no-hover nav">
              <q-route-tab :ripple="!$q.dark.isActive" :label="t('page.tradeList')" :to="{ name: 'tradeList' }" />
              <q-route-tab v-if="as.signed" :ripple="!$q.dark.isActive" :label="t('page.messages')"
                :to="{ name: 'messages' }" />
            </q-tabs>
          </div>
        </div>
        <div class="lt-md col-2 col-sm-3 row justify-end q-gutter-sm">
          <q-btn round flat aria-label="Tradurs Morevert Button" :ripple="!$q.dark.isActive"
            @click="rightDrawerOpen = !rightDrawerOpen">
            <img class="icon" width="24" height="24" :src="icons.morevert" alt="icon_morevert" />
          </q-btn>
        </div>
        <div class="gt-sm col-4 col-lg-3 row justify-end items-center q-gutter-xs">
          <q-btn round flat aria-label="Tradurs Support Button" :ripple="!$q.dark.isActive" @click="contact.show = true">
            <img class="icon" width="24" height="24" :src="icons.help" alt="icon_support" />
            <D4Tooltip anchor="bottom middle" self="top middle" transition-show="jump-down" transition-hide="jump-up"
              :offset="[0, 10]" behavior="desktop">
              <div class="text-caption break-keep" style="max-width:200px">
                {{ t('contact.title') }}
              </div>
            </D4Tooltip>
          </q-btn>
          <q-btn round flat aria-label="Tradurs Language Button" :ripple="!$q.dark.isActive">
            <img class="icon" width="24" height="24" :src="icons.language" alt="icon_language" />
            <q-menu auto-close class="no-shadow" anchor="bottom end" self="top end" transition-show="none"
              transition-hide="none" :transition-duration="0">
              <q-list bordered class="rounded-borders">
                <q-item v-for="lang in localeOptions" :key="lang.value" clickable :active="lang.value === locale"
                  @click="setLang(lang.value)">
                  {{ lang.label }}</q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn round flat aria-label="Tradurs Theme Button" :ripple="!$q.dark.isActive" @click="setDark">
            <img v-show="$q.dark.isActive" class="icon" width="24" height="24" :src="icons.light" alt="icon_light" />
            <img v-show="!$q.dark.isActive" class="icon" width="24" height="24" :src="icons.dark" alt="icon_dark" />
          </q-btn>
          <q-btn v-if="signed" round flat aria-label="Tradurs User Info Button" :ripple="!$q.dark.isActive">
            <img class="icon" width="24" height="24" :src="icons.user" alt="icon_user" />
            <q-menu anchor="bottom end" self="top end" transition-show="none" transition-hide="none"
              :transition-duration="0" style="min-width:280px">
              <D4User :data="as.info" info>
                <template #actions>
                  <q-btn rounded aria-label="Tradurs Signout Button" color="secondary" :label="t('user.signout')"
                    @click="sign" v-close-popup />
                </template>
              </D4User>
            </q-menu>
          </q-btn>
          <q-btn v-else round flat aria-label="Tradurs Login Button" :ripple="!$q.dark.isActive" @click="sign">
            <img class="icon" width="24" height="24" :src="icons.login" alt="icon_login" />
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
            <!-- <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-5110777286519562"
              data-ad-slot="8610177982" data-ad-format="auto" data-full-width-responsive="true"
              :data-adtest="prod ? 'off' : 'on'" :key="key"></ins> -->
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
              <div :style="`position:sticky;top:${asideTop}`">
                <!-- <ins class="adsbygoogle" style="display:inline-block;width:160px;height:600px"
                  data-ad-client="ca-pub-5110777286519562" data-ad-slot="7240136439" :data-adtest="prod ? 'off' : 'on'"
                  :key="key"></ins> -->
              </div>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
  <D4Dialog v-model="contact.show" @submit="send" @hide="close">
    <template #top>
      <div class="q-pa-md text-h6">
        {{ t('contact.title') }}
      </div>
    </template>
    <template #middle>
      <div class="q-pa-md">
        <q-input outlined dense no-error-icon hide-bottom-space :autofocus="$q.platform.is.desktop" rows="20"
          type="textarea" input-class="d4-scroll" :label="t('contact.contents')" v-model="contact.contents"
          :rules="[val => val && val.length > 10 || '']" maxlength="500">
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
        <D4Btn :label="t('contact.send')" type="submit" />
      </div>
    </template>
  </D4Dialog>
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