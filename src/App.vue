<script lang="ts">
import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'

export default {
  async preFetch({ store }) {
    const as = useAccountStore(store)
    const is = useItemStore(store)
    const promises = [
      is.getStorage(),
      is.getBase(),
      is.getProperties(),
      is.getAffixes(),
      is.getRestrictions(),
      as.getEvaluations(),
      as.unreadMessages()
    ]

    return Promise.all(promises)
      .then(() => {})
      .catch(() => {})
  }
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useQuasar, useMeta } from 'quasar'
import {
  useRoute,
  useRouter,
  RouteRecordName,
  RouteParamsRaw
} from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGlobalStore } from 'stores/global-store'
import { useAdBlock } from 'src/composables/adblock'

interface IParagraph {
  type: string
  value?: string
  class?: string
  label?: string
  name?: RouteRecordName
  params?: RouteParamsRaw
}

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const as = useAccountStore()
const gs = useGlobalStore()
const { t, tm, locale } = useI18n({ useScope: 'global' })
const { check } = useAdBlock()

const view = ref<boolean>(false)
const isDark = ref(
  $q.cookies.has('d4.dark')
    ? $q.cookies.get('d4.dark') === 'true'
    : $q.dark.isActive
)
$q.dark.set(isDark.value)

const battleTag = ref<string>('')
const showBT = ref<boolean>(false)
const loading = ref<boolean>(false)
const reloadAdKey = computed(() => gs.reloadAdKey)

const updateBattleTag = () => {
  as.updateBattleTag(battleTag.value).then(() => {
    as.info.battleTag = battleTag.value
    showBT.value = false
  })
}

const lang = (route.params.lang as string) || 'ko'
locale.value = lang

// about Meta
const pageName = computed(() =>
  route.name
    ? `${t(`page.${route.name as string}`, 0, { locale: lang })} - `
    : ''
)
const itemName = computed(() => (gs.itemName ? `${gs.itemName} - ` : ''))
const titleReactive = computed(() =>
  t(
    'seo.title',
    { pageName: pageName.value, itemName: itemName.value },
    { locale: lang }
  )
)
const descReactive = computed(() => t('seo.desc', 0, { locale: lang }))
const keywordsReactive = computed(() => t('seo.keywords', 0, { locale: lang }))

useMeta(() => {
  return {
    title: titleReactive.value,
    meta: {
      description: { name: 'description', content: descReactive.value },
      keywords: { name: 'keywords', content: keywordsReactive.value },
      equiv: {
        'http-equiv': 'Content-Type',
        content: 'text/html; charset=UTF-8'
      },
      ogTitle: { property: 'og:title', content: titleReactive.value },
      ogDescription: {
        property: 'og:description',
        content: descReactive.value
      },
      ogUrl: { property: 'og:url', content: 'https://d4.tradurs.com' },
      ogType: { property: 'og:type', content: 'website' },
      ogImage: {
        property: 'og:image',
        content: 'https://d4.tradurs.com/images/og.png'
      },
      twitterCard: { name: 'twitter:card', content: 'summary' },
      twitterTitle: { name: 'twitter:title', content: titleReactive.value },
      twitterDescription: {
        name: 'twitter:description',
        content: descReactive.value
      },
      twitterUrl: { name: 'twitter:url', content: 'https://d4.tradurs.com' },
      twitterImage: {
        name: 'twitter:image',
        content: 'https://d4.tradurs.com/images/og.png'
      }
    }
  }
})

const notice = reactive<{ open: boolean; close: boolean }>({
  open: false,
  close: false
})

const close = () => {
  $q.cookies.set('d4.update.20240525', 'confirm', { expires: 1, path: '/' })
  notice.open = false
}

const checkAd = () => {
  if (!(route.name === 'support' && route.params.section === 'allow')) {
    check({
      actions: [
        {
          noCaps: true,
          dense: true,
          class: 'no-hover text-underline',
          label: t('btn.allow'),
          color: 'dark',
          handler: () => {
            router.push({
              name: 'support',
              params: { lang: route.params.lang, section: 'allow' }
            })
          }
        }
      ]
    })
  }
}

watch(reloadAdKey, (val, old) => {
  if (val !== old) checkAd()
})

onMounted(() => {
  document.documentElement.setAttribute('lang', locale.value as string)
  view.value = true
  showBT.value = !!as.signed && !(as.info.battleTag && as.info.battleTag !== '')
  notice.open = false // !$q.cookies.has("d4.update.20240525")
  checkAd()
})
</script>

<template>
  <D4Dialog v-model="notice.open" persistent>
    <template #top>
      <q-card-section class="row no-wrap items-center justify-between">
        <div>
          <div
            class="text-weight-bold"
            :class="$q.screen.gt.sm ? 'q-pa-md text-h6' : 'q-pa-sm text-body2'"
          >
            {{ t('notice.title') }}
          </div>
        </div>
        <q-btn
          unelevated
          aria-label="Tradurs Close Button"
          class="no-hover icon"
          :ripple="false"
          @click="notice.open = false"
        >
          <img
            src="/images/icons/close.svg"
            width="24"
            height="24"
            alt="Tradurs Close Icon"
          />
        </q-btn>
      </q-card-section>
    </template>
    <template #middle>
      <q-card-section class="scroll notice" style="max-height: 50vh">
        <div
          class="q-pa-md column q-gutter-y-sm"
          :class="$q.screen.gt.sm ? 'text-body2' : 'text-caption'"
        >
          <div class="text-area">{{ t('notice.top') }}</div>
          <div>
            <template
              v-for="(c, i) in (tm('notice.contents') as Array<IParagraph>) "
              :key="i"
            >
              <div
                v-if="c.type === 'head'"
                :class="[
                  'q-pt-md q-pb-sm text-subtitle2 text-primary',
                  c.class
                ]"
              >
                {{ c.value }}
              </div>
              <div v-else-if="c.type === 'list'" :class="['list', c.class]">
                {{ c.value }}
              </div>
              <div v-else-if="c.type === 'image'">
                <img
                  :src="c.value"
                  :class="['image', c.class]"
                  alt="Tradurs Notice Image"
                />
              </div>
              <div v-else-if="c.type === 'link'">
                <q-btn
                  :ripple="false"
                  :label="c.label"
                  :aria-label="c.label"
                  class="link text-underline no-hover"
                  :to="{
                    name: c.name,
                    params: { lang: route.params.lang, ...c.params }
                  }"
                  dense
                  no-caps
                  v-close-popup
                />
              </div>
              <q-space v-else-if="c.type === 'space'" class="space" />
              <q-separator v-else-if="c.type === 'separator'" />
            </template>
          </div>
          <div class="text-area">{{ t('notice.bottom') }}</div>
        </div>
      </q-card-section>
    </template>
    <template #bottom>
      <q-card-section>
        <div class="q-pa-md text-right">
          <q-btn
            :size="$q.screen.gt.sm ? '' : 'sm'"
            outline
            no-caps
            :label="t('notice.close')"
            @click="close"
            :aria-label="t('notice.close')"
          />
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
        <div
          class="q-px-lg"
          :class="$q.screen.gt.sm ? 'text-body1' : 'text-body2'"
        >
          {{ t('battlenet.msg1') }}
          <strong class="text-amber">Tradurs Diablo IV</strong>
          {{ t('battlenet.msg2') }}
        </div>
      </q-card-section>
      <q-card-section class="text-center">
        <div
          class="q-px-lg"
          :class="$q.screen.gt.sm ? 'text-body2' : 'text-caption'"
        >
          {{ t('battlenet.desc') }}
        </div>
      </q-card-section>
      <q-card-section>
        <div class="q-px-lg q-py-md">
          <q-input
            autofocus
            v-model="battleTag"
            label="BattleTag™"
            :placeholder="t('battlenet.placeholder')"
            fill-mask
            :disable="loading"
            :rules="[
              (val) =>
                (val &&
                  /^([가-힣ぁ-ゔァ-ヴー々〆〤一-龥]{1}[가-힣ぁ-ゔァ-ヴー々〆〤一-龥0-9]{1,7}#[0-9]{4,}|[a-zA-Z]{1}[a-zA-Z0-9]{2,11}#[0-9]{4,})$/g.test(
                    val
                  )) ||
                ''
            ]"
            outlined
            no-error-icon
            hide-hint
            maxlength="24"
          />
        </div>
      </q-card-section>
    </template>
    <template #bottom>
      <q-card-section :class="{ 'col-1': $q.screen.lt.sm }">
        <div
          class="row justify-end items-center q-gutter-sm q-px-md"
          :class="{ 'q-pt-lg': $q.screen.lt.sm }"
        >
          <D4Btn :label="t('btn.apply')" :progress="loading" type="submit" />
        </div>
      </q-card-section>
    </template>
  </D4Dialog>
  <router-view v-if="!showBT && view" />
</template>

<style scoped>
.notice:deep(.list) {
  margin-left: 40px;
  display: list-item;
  list-style: disc;
  list-style-position: outside;
}

.notice:deep(.image) {
  margin-left: 20px;
  width: auto;
  max-width: 90%;
  max-height: 90%;
  box-shadow: 0 0 1px 0 currentColor;
  border-radius: 4px;
}

.notice:deep(.link) {
  margin-left: 40px;
}

.notice:deep(.space) {
  padding: 16px;
}
</style>
