<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar, Screen, QBtnDropdown } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useGlobalStore } from 'src/stores/global-store'
import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'
import { checkName, scrollPosDirect } from 'src/common'

import D4Filter from 'components/D4Filter.vue'
import D4User from 'components/D4User.vue'
import Adsense from 'components/global/Adsense.vue'
import UsefulLinks from 'src/components/global/UsefulLinks.vue'

const props = defineProps<{
  lang: string
}>()

const prod: boolean = import.meta.env.PROD
const version = import.meta.env.VITE_APP_VERSION

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const gs = useGlobalStore()
const as = useAccountStore()
const is = useItemStore()
const { t, locale } = useI18n({ useScope: 'global' })

$q.screen.setSizes({ lg: 1100 })
locale.value = props.lang || 'ko'

const tradurs: string =
  import.meta.env.VITE_APP_TRADURS + `/${props.lang || 'ko'}`
const mainKey = ref<number>(0)
const reloadAdKey = computed(() => gs.reloadAdKey)
const loading = computed(() => gs.loading)
const filterLoading = computed(() => is.filter.loading)
const searchName = computed(() => t('item.name'))
const leftDrawerOpen = ref<boolean>(false)
const rightDrawerOpen = ref<boolean>(false)
const signed = computed<boolean | null>(() => as.signed)
const newMessages = computed<boolean>(
  () => as.newMessages || as.messagePage.unread > 0
)
const screen = computed<Screen>(() => $q.screen)
const asideHeight = computed<string>(
  () => `calc(100vh - ${screen.value.gt.sm ? gs.offsetTop : 0}px)`
)
const asideTop = computed<string>(() => `${gs.offsetTop + 10}px`)
const newAwards = computed(
  () =>
    (is.awards > 0 &&
      new Date().getDay() === 1 &&
      new Date().getHours() >= 9) ||
    new Date().getDay() === 2
)
const isNarrow = computed(() => $q.screen.width <= 1100)
const d4Filter = ref<InstanceType<typeof D4Filter>>()

const myTweak = (offset: number): void => {
  gs.offsetTop = offset ?? 0
}

const info = () => {
  document.location.href = `${tradurs}/info`
}

const progressSign = ref<boolean>(false)
const sign = () => {
  if (!as.signed)
    document.location.href = `${tradurs}/sign?redirect=${encodeURIComponent(
      document.location.href
    )}`
  else {
    progressSign.value = true
    as.sign()
      .then(async (result: boolean) => {
        if (!result) {
          d4Filter.value?.clearFilter()
          await is.getStorage(true)

          if (route.name === 'tradeList') mainKey.value++
          else
            router.push({
              name: 'tradeList',
              params: { lang: route.params.lang }
            })
        }
      })
      .catch(() => {})
      .then(() => {
        progressSign.value = false
      })
  }
}

const setLang = (lang: string) => {
  const url = route.fullPath
    .replace(
      new RegExp(
        `^\/(${gs.localeOptions.map((lo) => lo.value).join('|')})`,
        'i'
      ),
      ''
    )
    .replace(/\/$/, '')
  gs.loading = true
  document.location.replace(`/${lang}${url}`)
}

const setDark = () => {
  $q.dark.set(!$q.dark.isActive)
  $q.cookies.set('d4.dark', $q.dark.isActive.toString(), { path: '/' })
}

const _name = ref<string>('')
const search = () => {
  if (!!!_name.value || checkName(_name.value)) {
    const filter = is.filter
    filter.name = _name.value
    filter.request++
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
  clear()
  d4Filter.value?.clearFilter()
  is.sort = 'date_desc'
  router.push({
    name: 'tradeList',
    params: { lang: route.params.lang },
    query: { page: (route.query.page as string) === '1' ? undefined : 1 }
  })
}

const beforeShow = () => {
  if ($q.platform.is.mobile) scrollPosDirect()
}

const onScroll = (details: {
  position: number
  direction: 'up' | 'down'
  directionChanged: boolean
  delta: number
  inflectionPoint: number
}) => {
  gs.scrollTop = details.position
}

// drawer expansion item
const expanded = ref<boolean>(false)
const expandedMobile = ref<boolean>(false)
const isMySpace = computed(() =>
  ['messages', 'blocks', 'history'].includes(route.name as string)
)
const expandedAdmin = ref<boolean>(false)
const isAdmin = computed(() =>
  ['adminUser', 'adminItem', 'adminAffix'].includes(route.name as string)
)

watch(
  () => $q.screen.gt.sm,
  (val) => {
    if (val) rightDrawerOpen.value = false
  }
)

watch(
  () => is.filter.name,
  (val) => {
    if (!!!val) _name.value = ''
  }
)
</script>

<template>
  <q-layout view="hHh lpR lFf" :key="mainKey" @scroll="onScroll">
    <div
      v-show="
        ['tradeList', 'itemInfo'].includes(route.name as string) &&
        is.storage.data.ladder
      "
      class="bg-season"
      :style="`--tradurs-season-image:url('${t('season.bg')}');`"
    ></div>
    <q-drawer
      show-if-above
      no-swipe-open
      no-swipe-close
      no-swipe-backdrop
      bordered
      v-model="leftDrawerOpen"
      side="left"
      :behavior="screen.gt.md ? 'desktop' : 'mobile'"
      class="row justify-end"
      style="overflow-x: hidden"
      @before-show="beforeShow"
    >
      <D4Filter
        ref="d4Filter"
        :disable="route.name !== 'tradeList'"
        class="q-pa-lg"
        style="width: 300px"
      />
    </q-drawer>
    <q-drawer
      show-if-above
      no-swipe-open
      no-swipe-close
      no-swipe-backdrop
      bordered
      v-model="rightDrawerOpen"
      side="right"
      behavior="mobile"
      class="row justify-start no-scroll"
      style="overflow-x: hidden"
    >
      <div class="column fit">
        <q-item
          class="row justify-center items-center q-py-lg q-gutter-x-sm icons"
        >
          <q-btn
            round
            dense
            flat
            aria-label="Tradurs Discord Button"
            :ripple="!$q.dark.isActive"
            tag="a"
            href="https://discord.gg/dwRuWq4enx"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              class="icon"
              width="24"
              height="24"
              style="padding: 1px"
              src="/images/icons/discord.svg"
              alt="Discord Icon"
            />
          </q-btn>
          <q-btn
            round
            dense
            flat
            aria-label="Tradurs Support Button"
            :ripple="!$q.dark.isActive"
            :to="{ name: 'support', params: { lang: route.params.lang } }"
          >
            <img
              class="icon"
              width="24"
              height="24"
              src="/images/icons/help.svg"
              alt="Tradurs Help Icon"
            />
            <!-- <q-badge floating label="N" color="negative" class="new-badge" /> -->
          </q-btn>
          <q-btn
            round
            dense
            flat
            aria-label="Tradurs Language Button"
            :ripple="!$q.dark.isActive"
          >
            <img
              class="icon"
              width="24"
              height="24"
              src="/images/icons/language.svg"
              alt="Tradurs Language Icon"
            />
            <q-menu
              auto-close
              class="no-shadow"
              anchor="bottom end"
              self="top end"
              transition-show="none"
              transition-hide="none"
              :transition-duration="0"
            >
              <q-list bordered class="rounded-borders">
                <q-item
                  v-for="lang in gs.localeOptions"
                  :key="lang.value"
                  :clickable="lang.value !== locale"
                  :active="lang.value === locale"
                  @click="setLang(lang.value)"
                >
                  <q-item-section>
                    {{ lang.label }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn
            round
            dense
            flat
            aria-label="Tradurs Font Button"
            :ripple="!$q.dark.isActive"
          >
            <img
              class="icon"
              width="24"
              height="24"
              src="/images/icons/font.svg"
              alt="Tradurs Font Icon"
            />
            <q-menu
              auto-close
              class="no-shadow"
              anchor="bottom end"
              self="top end"
              transition-show="none"
              transition-hide="none"
              :transition-duration="0"
            >
              <q-list bordered class="rounded-borders">
                <q-item
                  v-for="font in gs.fontOptions"
                  :key="font.value"
                  :clickable="font.value !== gs.font"
                  :active="font.value === gs.font"
                  @click="() => gs.setFont(font.value)"
                >
                  <q-item-section>
                    {{ font.label }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn
            round
            flat
            dense
            aria-label="Tradurs Theme Button"
            :ripple="!$q.dark.isActive"
            @click="setDark"
          >
            <img
              v-show="$q.dark.isActive"
              class="icon"
              width="24"
              height="24"
              src="/images/icons/light.svg"
              alt="Tradurs Light Icon"
            />
            <img
              v-show="!$q.dark.isActive"
              class="icon"
              width="24"
              height="24"
              src="/images/icons/dark.svg"
              alt="Tradurs Dark Icon"
            />
          </q-btn>
          <q-btn
            v-if="signed"
            dense
            round
            flat
            aria-label="Tradurs User Info Button"
            :ripple="!$q.dark.isActive"
          >
            <img
              class="icon"
              width="24"
              height="24"
              src="/images/icons/user.svg"
              alt="Tradurs User Icon"
            />
            <q-menu
              anchor="bottom end"
              self="top end"
              transition-show="none"
              transition-hide="none"
              :transition-duration="0"
              style="min-width: 260px"
            >
              <D4User :data="as.info" :storage="is.storage.data" info>
                <template #actions>
                  <q-btn
                    no-caps
                    unelevated
                    :disable="progressSign"
                    aria-label="Tradurs Info Button"
                    color="grey-9"
                    :label="t('user.info')"
                    @click="info"
                    v-close-popup
                  />
                  <q-btn
                    no-caps
                    unelevated
                    :loading="progressSign"
                    aria-label="Tradurs Signout Button"
                    color="secondary"
                    :label="t('user.signout')"
                    @click="sign"
                    v-close-popup
                  />
                </template>
              </D4User>
            </q-menu>
          </q-btn>
          <q-btn
            v-else
            round
            flat
            dense
            aria-label="Tradurs Login Button"
            :ripple="!$q.dark.isActive"
            @click="sign"
          >
            <img
              class="icon"
              width="24"
              height="24"
              src="/images/icons/login.svg"
              alt="Tradurs Signin Icon"
            />
          </q-btn>
        </q-item>
        <q-separator />
        <div class="col scroll">
          <q-list class="q-pa-md page q-gutter-y-sm">
            <q-item
              v-ripple
              clickable
              :to="{ name: 'tradeList', params: { lang: route.params.lang } }"
              exact-active-class="active"
            >
              <q-item-section side>
                <q-item-label>
                  {{ t('page.tradeList') }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              v-ripple
              clickable
              :to="{ name: 'awards', params: { lang: route.params.lang } }"
              exact-active-class="active"
            >
              <q-item-section side>
                <q-item-label>
                  {{ t('page.awards') }}
                </q-item-label>
                <q-badge
                  v-show="newAwards"
                  floating
                  label="N"
                  color="orange-8"
                  class="new-badge2"
                />
              </q-item-section>
            </q-item>
            <q-expansion-item
              v-if="as.signed"
              v-model="expanded"
              expand-icon="img:/images/icons/dropdown.svg"
              :default-opened="isMySpace"
              :header-class="{ active: isMySpace }"
              :class="expanded ? 'expanded rounded-borders' : ''"
            >
              <template #header>
                <q-item-section>
                  <div>
                    <span class="relative-position"
                      >{{ t('page.mySpace') }}
                      <div
                        v-show="newMessages && !expanded"
                        class="alert"
                        style="top: -6px"
                      ></div>
                    </span>
                  </div>
                </q-item-section>
              </template>
              <q-list bordered class="sub rounded-borders">
                <q-item
                  :inset-level="0.4"
                  v-ripple
                  clickable
                  :to="{
                    name: 'messages',
                    params: { lang: route.params.lang }
                  }"
                  active-class="active"
                >
                  <q-item-section side>
                    <q-item-label>
                      {{ t('page.messages') }}
                    </q-item-label>
                    <div v-show="newMessages" class="alert"></div>
                  </q-item-section>
                </q-item>
                <q-item
                  :inset-level="0.4"
                  v-ripple
                  clickable
                  :to="{ name: 'blocks', params: { lang: route.params.lang } }"
                  active-class="active"
                >
                  <q-item-section side>
                    <q-item-label>
                      {{ t('page.blocks') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item
                  :inset-level="0.4"
                  v-ripple
                  clickable
                  :to="{ name: 'history', params: { lang: route.params.lang } }"
                  active-class="active"
                >
                  <q-item-section side>
                    <q-item-label>
                      {{ t('page.history') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
            <q-expansion-item
              v-if="as.signed && !!as.info.isAdmin"
              v-model="expandedAdmin"
              expand-icon="img:/images/icons/dropdown.svg"
              :default-opened="isAdmin"
              :header-class="{ active: isAdmin }"
              :class="expandedAdmin ? 'expanded rounded-borders' : ''"
            >
              <template #header>
                <q-item-section>
                  {{ t('page.admin') }}
                </q-item-section>
              </template>
              <q-list bordered class="sub rounded-borders">
                <q-item
                  :inset-level="0.4"
                  v-ripple
                  clickable
                  :to="{
                    name: 'adminUser',
                    params: { lang: route.params.lang }
                  }"
                  active-class="active"
                >
                  <q-item-section side>
                    <q-item-label>
                      {{ t('page.adminUser') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item
                  :inset-level="0.4"
                  v-ripple
                  clickable
                  :to="{
                    name: 'adminItem',
                    params: { lang: route.params.lang }
                  }"
                  active-class="active"
                >
                  <q-item-section side>
                    <q-item-label>
                      {{ t('page.adminItem') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item
                  :inset-level="0.4"
                  v-ripple
                  clickable
                  :to="{
                    name: 'adminAffix',
                    params: { lang: route.params.lang }
                  }"
                  active-class="active"
                >
                  <q-item-section side>
                    <q-item-label>
                      {{ t('page.adminAffix') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item
                  :inset-level="0.4"
                  v-ripple
                  clickable
                  :to="{
                    name: 'adminNotice',
                    params: { lang: route.params.lang }
                  }"
                  active-class="active"
                >
                  <q-item-section side>
                    <q-item-label>
                      {{ t('page.adminNotice') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </q-list>
          <q-separator />
          <UsefulLinks mode="listitem" />
          <div class="column q-mt-lg q-mb-xl q-ml-lg q-pl-sm text-caption">
            <div>
              {{ t('contact.inquiries') }}
            </div>
            <div>
              <q-btn
                flat
                no-caps
                padding="0"
                :ripple="false"
                color="primary"
                class="no-hover"
                type="a"
                size="12px"
                href="mailto:serasomething@gmail.com"
                label="serasomething@gmail.com"
              />
            </div>
          </div>
        </div>
      </div>
    </q-drawer>
    <q-header
      :elevated="!$q.dark.isActive"
      class="q-py-sm header row justify-center"
    >
      <q-toolbar class="toolbar">
        <div :style="$q.screen.gt.sm ? 'min-width:120px' : ''">
          <q-btn
            v-if="!isNarrow"
            class="no-hover q-ml-lg"
            dense
            flat
            aria-label="Tradurs Home Button"
            padding="0"
            :ripple="!$q.dark.isActive"
            @click="main"
          >
            <h1 class="h1">
              <img
                v-show="$q.dark.isActive"
                :src="`/images/logo.webp?v=${version}`"
                width="48"
                height="48"
                alt="Tradurs Logo Image"
              />
              <img
                v-show="!$q.dark.isActive"
                :src="`/images/logo_light.webp?v=${version}`"
                width="48"
                height="48"
                alt="Tradurs Light Logo Image"
              />
              <span class="blind">{{ t('seo.title') }}</span>
            </h1>
          </q-btn>
          <q-btn
            v-show="isNarrow"
            flat
            round
            aria-label="Tradurs Filter Button"
            :ripple="!$q.dark.isActive"
            @click="leftDrawerOpen = !leftDrawerOpen"
          >
            <img
              src="/images/icons/filter.svg"
              class="icon"
              width="24"
              height="24"
              alt="Tradurs Filter Icon"
            />
          </q-btn>
        </div>
        <div
          class="col row items-center"
          :class="isNarrow ? 'justify-center' : 'justify-between'"
        >
          <div
            :class="isNarrow ? 'col-9' : 'col-5'"
            class="row no-wrap items-center q-gutter-md"
          >
            <q-btn
              v-if="isNarrow"
              flat
              padding="0"
              :ripple="false"
              class="no-hover"
              @click="main"
            >
              <h1 class="h1">
                <img
                  v-show="$q.dark.isActive"
                  src="/images/logo.webp?season=7"
                  width="36"
                  height="36"
                  alt="Tradurs Logo Image"
                />
                <img
                  v-show="!$q.dark.isActive"
                  src="/images/logo_light.webp?season=7"
                  width="36"
                  height="36"
                  alt="Tradurs Light Logo Image"
                />
              </h1>
            </q-btn>
            <q-input
              outlined
              dense
              no-error-icon
              hide-bottom-space
              class="col"
              v-model="_name"
              :label="searchName"
              :disable="
                filterLoading || !['tradeList'].includes(route.name as string)
              "
              :rules="[(val: string) => !!!val || checkName(val) || '']"
              @keyup.enter="search()"
            >
              <template #append>
                <div style="width: 24px">
                  <q-btn
                    v-show="_name && _name !== ''"
                    flat
                    dense
                    aria-label="Tradurs Clear Button"
                    size="xs"
                    :ripple="false"
                    class="no-hover"
                    :disable="filterLoading"
                    @click="clear"
                  >
                    <q-icon
                      class="icon"
                      :name="'img:/images/icons/close.svg'"
                      size="xs"
                    />
                  </q-btn>
                </div>
              </template>
            </q-input>
          </div>
          <div>
            <q-toolbar v-show="!isNarrow" class="nav">
              <q-btn
                flat
                no-caps
                type="a"
                :ripple="false"
                class="no-hover"
                :class="{ active: route.name === 'tradeList' }"
                :label="t('page.tradeList')"
                :to="{ name: 'tradeList', params: { lang: route.params.lang } }"
              />
              <q-btn
                flat
                no-caps
                type="a"
                :ripple="false"
                class="no-hover"
                :class="{ active: route.name === 'awards' }"
                :to="{ name: 'awards', params: { lang: route.params.lang } }"
              >
                <div class="relative-position">
                  {{ t('page.awards') }}
                  <q-badge
                    v-show="newAwards"
                    floating
                    label="N"
                    color="orange-8"
                    class="new-badge2"
                    style="top: -4px"
                  />
                </div>
              </q-btn>
              <q-btn-dropdown
                v-if="as.signed"
                v-model="expandedMobile"
                flat
                content-class="no-shadow"
                no-caps
                :ripple="false"
                class="no-hover"
                :class="{ active: isMySpace }"
                transition-show="none"
                transition-hide="none"
                transition-duration="0"
                dropdown-icon="img:/images/icons/dropdown.svg"
              >
                <template #label>
                  <div class="relative-position">
                    {{ t('page.mySpace') }}
                    <div
                      v-show="newMessages && !expandedMobile"
                      class="alert"
                      style="top: -2px"
                    ></div>
                  </div>
                </template>
                <q-list bordered class="page rounded-borders">
                  <q-item
                    v-ripple
                    clickable
                    :to="{
                      name: 'messages',
                      params: { lang: route.params.lang }
                    }"
                    active-class="active"
                  >
                    <q-item-section side>
                      <q-item-label>
                        {{ t('page.messages') }}
                      </q-item-label>
                      <div v-show="newMessages" class="alert"></div>
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-ripple
                    clickable
                    :to="{
                      name: 'blocks',
                      params: { lang: route.params.lang }
                    }"
                    active-class="active"
                  >
                    <q-item-section side>
                      <q-item-label>
                        {{ t('page.blocks') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-ripple
                    clickable
                    :to="{
                      name: 'history',
                      params: { lang: route.params.lang }
                    }"
                    active-class="active"
                  >
                    <q-item-section side>
                      <q-item-label>
                        {{ t('page.history') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
              <q-btn-dropdown
                v-if="as.signed && !!as.info.isAdmin"
                flat
                content-class="no-shadow"
                no-caps
                :ripple="false"
                class="no-hover"
                :class="{ active: isAdmin }"
                transition-show="none"
                transition-hide="none"
                transition-duration="0"
                dropdown-icon="img:/images/icons/dropdown.svg"
              >
                <template #label>
                  {{ t('page.admin') }}
                </template>
                <q-list bordered class="page rounded-borders">
                  <q-item
                    v-ripple
                    clickable
                    :to="{
                      name: 'adminUser',
                      params: { lang: route.params.lang }
                    }"
                    active-class="active"
                  >
                    <q-item-section side>
                      <q-item-label>
                        {{ t('page.adminUser') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-ripple
                    clickable
                    :to="{
                      name: 'adminItem',
                      params: { lang: route.params.lang }
                    }"
                    active-class="active"
                  >
                    <q-item-section side>
                      <q-item-label>
                        {{ t('page.adminItem') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-ripple
                    clickable
                    :to="{
                      name: 'adminAffix',
                      params: { lang: route.params.lang }
                    }"
                    active-class="active"
                  >
                    <q-item-section side>
                      <q-item-label>
                        {{ t('page.adminAffix') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-ripple
                    clickable
                    :to="{
                      name: 'adminNotice',
                      params: { lang: route.params.lang }
                    }"
                    active-class="active"
                  >
                    <q-item-section side>
                      <q-item-label>
                        {{ t('page.adminNotice') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </q-toolbar>
          </div>
        </div>
        <div
          v-show="isNarrow"
          class="col-1 col-lg-3 row justify-end q-gutter-sm"
        >
          <q-btn
            round
            flat
            aria-label="Tradurs Morevert Button"
            :ripple="!$q.dark.isActive"
            @click="rightDrawerOpen = !rightDrawerOpen"
          >
            <img
              class="icon"
              width="24"
              height="24"
              src="/images/icons/morevert.svg"
              alt="Tradurs More Vertical Icon"
            />
          </q-btn>
        </div>
        <div
          v-show="!isNarrow"
          class="col-3 row justify-end items-center q-gutter-xs"
        >
          <q-btn
            round
            dense
            flat
            aria-label="Tradurs Discord Button"
            :ripple="!$q.dark.isActive"
            tag="a"
            href="https://discord.gg/dwRuWq4enx"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              class="icon"
              width="24"
              height="24"
              style="padding: 1px"
              src="/images/icons/discord.svg"
              alt="Discord Icon"
            />
          </q-btn>
          <q-btn
            round
            dense
            flat
            aria-label="Tradurs Support Button"
            :ripple="!$q.dark.isActive"
            :to="{ name: 'support', params: { lang: route.params.lang } }"
          >
            <img
              class="icon"
              width="24"
              height="24"
              src="/images/icons/help.svg"
              alt="Tradurs Help Icon"
            />
            <!-- <q-badge floating label="N" color="negative" class="new-badge" /> -->
          </q-btn>
          <q-btn
            round
            dense
            flat
            aria-label="Tradurs Language Button"
            :ripple="!$q.dark.isActive"
          >
            <img
              class="icon"
              width="24"
              height="24"
              src="/images/icons/language.svg"
              alt="Tradurs Language Icon"
            />
            <q-menu
              auto-close
              class="no-shadow"
              anchor="bottom end"
              self="top end"
              transition-show="none"
              transition-hide="none"
              :transition-duration="0"
            >
              <q-list bordered class="rounded-borders">
                <q-item
                  v-for="lang in gs.localeOptions"
                  :key="lang.value"
                  :clickable="lang.value !== locale"
                  :active="lang.value === locale"
                  @click="setLang(lang.value)"
                >
                  <q-item-section>
                    {{ lang.label }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn
            round
            dense
            flat
            aria-label="Tradurs Font Button"
            :ripple="!$q.dark.isActive"
          >
            <img
              class="icon"
              width="24"
              height="24"
              src="/images/icons/font.svg"
              alt="Tradurs Font Icon"
            />
            <q-menu
              auto-close
              class="no-shadow"
              anchor="bottom end"
              self="top end"
              transition-show="none"
              transition-hide="none"
              :transition-duration="0"
            >
              <q-list bordered class="rounded-borders">
                <q-item
                  v-for="font in gs.fontOptions"
                  :key="font.value"
                  :clickable="font.value !== gs.font"
                  :active="font.value === gs.font"
                  @click="() => gs.setFont(font.value)"
                >
                  <q-item-section>{{ font.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn
            round
            dense
            flat
            aria-label="Tradurs Theme Button"
            :ripple="!$q.dark.isActive"
            @click="setDark"
          >
            <img
              v-show="$q.dark.isActive"
              class="icon"
              width="24"
              height="24"
              src="/images/icons/light.svg"
              alt="Tradurs Light Icon"
            />
            <img
              v-show="!$q.dark.isActive"
              class="icon"
              width="24"
              height="24"
              src="/images/icons/dark.svg"
              alt="Tradurs Dark Icon"
            />
          </q-btn>
          <q-btn
            v-if="signed"
            round
            flat
            dense
            aria-label="Tradurs User Info Button"
            :ripple="!$q.dark.isActive"
          >
            <img
              class="icon"
              width="24"
              height="24"
              src="/images/icons/user.svg"
              alt="Tradurs User Icon"
            />
            <q-menu
              anchor="bottom end"
              self="top end"
              transition-show="none"
              transition-hide="none"
              :transition-duration="0"
              style="min-width: 280px"
            >
              <D4User :data="as.info" :storage="is.storage.data" info>
                <template #actions>
                  <q-btn
                    no-caps
                    unelevated
                    :disable="progressSign"
                    aria-label="Tradurs Info Button"
                    color="grey-9"
                    :label="t('user.info')"
                    @click="info"
                    v-close-popup
                  />
                  <q-btn
                    no-caps
                    unelevated
                    :loading="progressSign"
                    aria-label="Tradurs Signout Button"
                    color="secondary"
                    :label="t('user.signout')"
                    @click="sign"
                    v-close-popup
                  />
                </template>
              </D4User>
            </q-menu>
          </q-btn>
          <q-btn
            v-else
            round
            dense
            flat
            aria-label="Tradurs Login Button"
            :ripple="!$q.dark.isActive"
            @click="sign"
          >
            <img
              class="icon"
              width="24"
              height="24"
              src="/images/icons/login.svg"
              alt="Tradurs Signin Icon"
            />
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <q-page :style-fn="myTweak">
        <q-inner-loading
          :showing="loading"
          class="fixed"
          color="primary"
          size="50px"
          style="z-index: 9999; position: fixed"
        />
        <div class="row justify-center">
          <div
            :class="screen.lt.sm ? 'q-pa-sm' : 'q-pa-xl'"
            :style="screen.lt.sm ? 'width:100%' : 'width:830px'"
          >
            <div class="view max-width">
              <div class="row justify-center top-ads">
                <Adsense
                  class="ad-top"
                  data-ad-client="ca-pub-5110777286519562"
                  data-ad-slot="6532261129"
                  data-ad-format="horizontal"
                  :data-adtest="!prod"
                  :key="`top-${reloadAdKey}`"
                />
              </div>
              <RouterView :filter="d4Filter" />
            </div>
            <div class="q-py-xl"></div>
            <div v-if="$q.screen.width <= 1439" class="row justify-center">
              <Adsense
                class="ad-right"
                data-ad-client="ca-pub-5110777286519562"
                data-ad-slot="9284600281"
                :data-adtest="!prod"
                data-ad-format="auto"
                data-full-width-responsive="true"
                :key="`bottom-${reloadAdKey}`"
              />
            </div>
            <div class="q-py-md"></div>
            <q-separator />
            <div class="q-pt-lg">
              <div
                class="row justify-center items-center q-gutter-xs text-caption bottom"
              >
                <div>Copyright</div>
                <div>@</div>
                <div>2025</div>
                <q-btn
                  class="no-hover"
                  no-caps
                  flat
                  dense
                  aria-label="Serasome Home Button"
                  padding="0"
                  :ripple="false"
                  href="https://serasome.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  >SeraSome</q-btn
                >
              </div>
            </div>
          </div>
          <div class="gt-md col">
            <div
              class="full-height q-px-lg q-py-xl"
              :style="`width:280px;height:${asideHeight}`"
            >
              <div :style="`position:sticky;top:${asideTop}`" class="column">
                <Adsense
                  v-if="$q.screen.width > 1439"
                  class="ad-right"
                  data-ad-client="ca-pub-5110777286519562"
                  data-ad-slot="6574447551"
                  :data-adtest="!prod"
                  :key="`right-${reloadAdKey}`"
                />
                <div class="q-mt-xl">
                  <UsefulLinks />
                </div>
                <div class="column q-py-xl q-pr-xl text-caption">
                  <div>
                    {{ t('contact.inquiries') }}
                  </div>
                  <div>
                    <q-btn
                      flat
                      no-caps
                      padding="0"
                      :ripple="false"
                      color="primary"
                      class="no-hover"
                      type="a"
                      size="12px"
                      href="mailto:serasomething@gmail.com"
                      label="serasomething@gmail.com"
                    />
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

.header:deep(.q-btn .icon),
.icons:deep(.q-btn .icon) {
  filter: contrast(0%);
}

.toolbar {
  min-height: inherit;
  width: 100vw;
  max-width: 1400px;
}

.nav:deep(.q-btn) {
  opacity: 0.6;
  transition: opacity 0.3s ease-in-out;
}

.nav:deep(.q-btn .q-btn__content) {
  transition: border 0.3s ease-in-out;
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
  background-color: var(--q-dark);
  border-top: none;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.body--light .page:deep(.sub) {
  background-color: var(--q-light-page);
}

.page:deep(.q-expansion-item > div > .q-item:first-child) {
  transition: box-shadow 0.3s ease;
  border-radius: 4px 4px 0 0;
}

.page:deep(.expanded > div > .q-item:first-child) {
  box-shadow: inset 0 0 0 1px rgba(100, 100, 100, 1);
}

.page:deep(.expanded > div > .q-item:first-child.active) {
  opacity: 1;
}

.page:deep(.q-item__section--side) {
  color: currentColor;
}

.page:deep(.q-item) {
  opacity: 0.6;
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
  color: currentColor;
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
  margin-bottom: 24px;
}

@media (max-width: 600px) {
  .top-ads {
    margin: 28px 0 10px 0;
  }
}

.bg-season::before {
  content: '';
  position: fixed;
  z-index: -1;
  opacity: 0.3;
  width: 100vw;
  height: 100vh;
  background-image: var(--tradurs-season-image);
  background-repeat: no-repeat;
  background-position: 49.5% 40%;
  transform: translate(0, 0);
}

@media (max-width: 1439px) {
  .bg-season::before {
    background-position: calc(49% + 150px) 40%;
  }
}

@media (max-width: 1079px) {
  .bg-season::before {
    background-position: 48.5% 40%;
  }
}

.body--light .bg-season::before {
  filter: invert(1) grayscale(1) brightness(0.7);
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

.ad-top {
  display: block;
  width: 100%;
  max-width: 728px;
  height: 90px;
}

@media (max-width: 600px) {
  .ad-top {
    height: auto;
    min-height: 50px;
    max-height: 100px;
    overflow: hidden;
  }
}

.ad-bottom {
  display: block;
  width: 100%;
}

.ad-right {
  display: inline-block;
  width: 160px;
  height: 600px;
}
</style>
