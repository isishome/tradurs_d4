<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar, Screen, uid } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'
import { icons } from 'src/common/icons'
import { checkName } from 'src/common'

import D4Filter from 'components/D4Filter.vue'

const prod: boolean = import.meta.env.PROD

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const as = useAccountStore()
const is = useItemStore()
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
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어' }
]

const brLoc = localeOptions.map(lo => lo.value).includes($q.lang.getLocale()?.substring(0, 2) || '') ? $q.lang.getLocale()?.substring(0, 2) : 'ko'
const setLang = (lang: string) => {
  locale.value = lang
  $q.cookies.set('d4.lang', lang)
}

const setDark = () => {
  $q.dark.set(!$q.dark.isActive)
  $q.cookies.set('d4.dark', $q.dark.isActive.toString())
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
          <D4Filter :disable="$route.name !== 'tradeList'" class="q-pa-lg" />
        </q-scroll-area>
      </q-list>
    </q-drawer>
    <q-drawer show-if-above bordered v-model="rightDrawerOpen" side="right" behavior="mobile"
      class="row justify-start scroll" :width="300">
      <q-list class="column full-height" style="width:300px">
        <q-item class="row justify-end q-gutter-sm q-pa-lg">
          <q-select v-model="locale" :options="localeOptions" :label="t('language', 0, { locale: brLoc })" dense outlined
            behavior="menu" emit-value map-options options-dense style="min-width: 150px"
            :dropdown-icon="`img:${icons.dropdown}`" popup-content-class="d4-scroll" @update:model-value="setLang" />
          <q-btn round flat :ripple="!$q.dark.isActive" @click="setDark">
            <img v-show="$q.dark.isActive" class="icon" width="24" :src="icons.light" />
            <img v-show="!$q.dark.isActive" class="icon" width="24" :src="icons.dark" />
          </q-btn>
          <q-btn v-if="signed" round flat :ripple="!$q.dark.isActive">
            <img class="icon" width="24" :src="icons.user" />
            <q-menu anchor="bottom end" self="top end" transition-show="none" transition-hide="none"
              :transition-duration="0">
              <q-list :bordered="$q.dark.isActive" class="rounded-borders relative-position">
                <q-item class="bg-primary text-dark" style="padding-bottom:30px">
                  <q-item-section>
                    <q-item-label class="text-center text-subtitle1 text-weight-bold">{{ as.info.battleTag
                    }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item class="avatar">
                  <q-item-section>
                    <q-avatar>
                      <img src="https://cdn.quasar.dev/img/boy-avatar.png">
                    </q-avatar>
                  </q-item-section>
                </q-item>
                <q-item class="row items-center justify-between" style="padding-top:30px">
                  <div class="col text-center">
                    <div class="text-caption ellipsis">
                      <!-- <img width="24" src="~assets/tradurs.svg" /> -->
                      {{ t('user.yolk') }}
                    </div>
                    <div class="text-weight-bold text-amber-10 text-body2">{{ as.info.yolk }}</div>
                  </div>
                  <div class="col text-center">
                    <div class="text-caption ellipsis">
                      <!-- <img width="24" src="~assets/tradurs.svg" /> -->
                      {{ t('user.temperature') }}
                    </div>
                    <div class="text-weight-bold text-body2">{{ as.info.temperature }}&#8451</div>
                  </div>
                </q-item>
                <q-separator />
                <q-item class="q-pa-md row justify-center">
                  <q-btn rounded color="secondary" :label="t('user.signout')" @click="sign" v-close-popup />
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn v-else round flat :ripple="!$q.dark.isActive" @click="sign">
            <img class="icon" width="24" :src="icons.login" />
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
        <div class="col-4 col-lg-3 row items-center">
          <q-btn class="gt-sm no-hover" dense flat padding="0" :ripple="!$q.dark.isActive" :to="{ path: '/' }">
          <img v-show="$q.dark.isActive" src="~assets/logo.webp" height="48" />
          <img v-show="!$q.dark.isActive" src="~assets/logo_light.webp" height="48" />
          </q-btn>
          <q-btn flat round class="lt-md" :ripple="!$q.dark.isActive" @click="leftDrawerOpen = !leftDrawerOpen">
            <img src="~assets/icons/filter.svg" class="icon" width="24" />
          </q-btn>
        </div>
        <div class="col row justify-between" :class="{ 'justify-center': $q.screen.lt.md }">
          <div class="col-12 col-md-6">
            <q-input outlined dense no-error-icon v-model="_name" :label="t('item.name')"
              :disable="filterLoading || $route.name !== 'tradeList'" :rules="[val => checkName(val) || '']"
              @keyup.enter="search()">
              <template v-if="$q.screen.lt.md" #prepend>
                <q-icon>
                  <img v-show="$q.dark.isActive" src="~assets/logo.webp" height="24" />
                  <img v-show="!$q.dark.isActive" src="~assets/logo_light.webp" height="24" />
                </q-icon>
              </template>
            <template #append>
              <q-btn flat dense size="xs" :ripple="false" class="no-hover" :disable="filterLoading" @click="search()">
                  <q-icon class="icon" :name="`img:${icons.search}`" size="xs" />
                </q-btn>
              </template>
            </q-input>
          </div>
          <div>
            <q-tabs dense no-caps class="gt-sm q-px-md bg-transparent no-hover nav">
              <q-route-tab :ripple="!$q.dark.isActive" :label="t('page.tradeList')" :to="{ name: 'tradeList' }" />
            </q-tabs>
          </div>
        </div>
        <div class="lt-md col-2 col-sm-3 row justify-end q-gutter-sm">
          <q-btn round flat :ripple="!$q.dark.isActive" @click="rightDrawerOpen = !rightDrawerOpen">
            <img class="icon" width="24" :src="icons.morevert" />
          </q-btn>
        </div>
        <div class="gt-sm col-4 col-lg-3 row justify-end items-center q-gutter-sm">
          <q-btn round flat :ripple="!$q.dark.isActive">
            <img class="icon" width="24" :src="icons.language" />
            <q-menu auto-close class="no-shadow" anchor="bottom end" self="top end" transition-show="none"
              transition-hide="none" :transition-duration="0">
              <q-list bordered class="rounded-borders">
                <q-item v-for="lang in localeOptions" :key="lang.value" clickable :active="lang.value === locale"
                  @click="setLang(lang.value)">
                  {{ lang.label }}</q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn round flat :ripple="!$q.dark.isActive" @click="setDark">
            <img v-show="$q.dark.isActive" class="icon" width="24" :src="icons.light" />
            <img v-show="!$q.dark.isActive" class="icon" width="24" :src="icons.dark" />
          </q-btn>
          <q-btn v-if="signed" round flat :ripple="!$q.dark.isActive">
            <img class="icon" width="24" :src="icons.user" />
            <q-menu anchor="bottom end" self="top end" transition-show="none" transition-hide="none"
              :transition-duration="0" style="min-width:280px">
              <q-list :bordered="$q.dark.isActive" class="rounded-borders relative-position">
                <q-item class="bg-primary text-dark" style="padding-bottom:30px">
                  <q-item-section>
                    <q-item-label class="text-center text-subtitle1 text-weight-bold">{{ as.info.battleTag
                    }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item class="avatar">
                  <q-item-section>
                    <q-avatar>
                      <img src="https://cdn.quasar.dev/img/boy-avatar.png">
                    </q-avatar>
                  </q-item-section>
                </q-item>
                <q-item class="row items-center justify-between" style="padding-top:30px">
                  <div class="col text-center">
                    <div class="text-caption ellipsis">
                      <!-- <img width="24" src="~assets/tradurs.svg" /> -->
                      {{ t('user.yolk') }}
                    </div>
                    <div class="text-weight-bold text-amber-10 text-body2">{{ as.info.yolk }}</div>
                  </div>
                  <div class="col text-center">
                    <div class="text-caption ellipsis">
                      <!-- <img width="24" src="~assets/tradurs.svg" /> -->
                      {{ t('user.temperature') }}
                    </div>
                    <div class="text-weight-bold text-body2">{{ as.info.temperature }}&#8451</div>
                  </div>
                </q-item>
                <q-separator />
                <q-item class="q-pa-md row justify-center">
                  <q-btn rounded color="secondary" :label="t('user.signout')" @click="sign" v-close-popup />
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn v-else round flat :ripple="!$q.dark.isActive" @click="sign">
            <img class="icon" width="24" :src="icons.login" />
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
                <q-btn class="no-hover" no-caps flat dense padding="0" :ripple="false" href="https://serasome.com"
                  target="_blank" rel="noopener noreferrer">SeraSome</q-btn>
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

.avatar {
  padding: 0;
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
}

.avatar:deep(.q-avatar) {
  box-shadow: 0 0 0 3px var(--q-dark);
}

.body--light .avatar:deep(.q-avatar) {
  box-shadow: 0 0 0 3px var(--q-light-page);
}
</style>