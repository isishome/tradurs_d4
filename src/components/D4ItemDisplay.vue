<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useSlots } from 'vue'
import { date } from 'quasar'

import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAccountStore } from 'src/stores/account-store'
import { FixedItem, useItemStore } from 'src/stores/item-store'

import { Item } from 'src/types/item'
import { clipboard } from 'src/common'

import D4Price from './D4Price.vue'
import D4Separator from './D4Separator.vue'
import D4User from './D4User.vue'
import { setgroups } from 'process'

type Props = {
  data: Item
  loading?: boolean
  disable?: boolean
  history?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disable: false,
  history: false
})
const emit = defineEmits(['copy', 'favorite', 'update-only'])

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const as = useAccountStore()
const {
  findRuneType,
  findTier,
  findQuality,
  findEquipClass,
  findItemStatus: findStatus,
  findRune,
  findType,
  filterTypes,
  filterMaterials,
  findAspect,
  filterFixedItems,
  findSetGroup,
  findAffix,
  gems,
  elixirs,
  summonings,
  filter
} = useItemStore()

const slots = useSlots()

const hour = 60 * 60
const minute = 60
const endDate = new Date(props.data.endDate)
const expDate = new Date(props.data.expDate)
const remainDate = ref<number>(
  date.getDateDiff(
    ['000', '002'].includes(props.data.statusCode) ? endDate : expDate,
    new Date(),
    'seconds'
  )
)
let remainInterval: NodeJS.Timeout

const executeInterval = () => {
  remainInterval = setInterval(() => {
    remainDate.value--
  }, 1000)
}
const remainHours = computed(() =>
  Math.floor(Math.max(remainDate.value / hour, 0))
    .toString()
    .padStart(2, '0')
)
const remainMinutes = computed(() =>
  Math.floor(Math.max((remainDate.value % hour) / minute, 0))
    .toString()
    .padStart(2, '0')
)
const remainSeconds = computed(() =>
  Math.floor(Math.max((remainDate.value % hour) % minute, 0))
    .toString()
    .padStart(2, '0')
)
const remainColor = computed(() =>
  remainDate.value < hour ? `text-red-6` : ''
)
const fixedItem = computed(() =>
  filterFixedItems(props.data.quality, props.data.itemTypeValue1).find(
    (fi) => fi.value === props.data.fixedItemId
  )
)
const setGroup = computed(() => {
  const findSet = findSetGroup(fixedItem.value?.setGroups?.[0] ?? 0)

  if (findSet) {
    findSet.fixedItems = filterFixedItems(
      props.data.quality,
      props.data.itemTypeValue1
    ).filter((fi) => findSet.fixedItemIds?.includes(fi.value as number))
  }

  return findSet
})
const imgSrc = computed(() =>
  props.data.itemType === 'rune'
    ? `/images/items/rune/${props.data.itemTypeValue1}/${props.data.itemTypeValue2}.webp`
    : props.data.itemType === 'aspect'
      ? `/images/items/aspect/legendary/${props.data.itemTypeValue2}.webp`
      : ['gem', 'summoning'].includes(props.data.itemTypeValue1)
        ? `/images/items/${props.data.itemType}/${props.data.itemTypeValue1}/${props.data.itemTypeValue2}.webp`
        : props.data.itemTypeValue1 === 'elixir'
          ? `/images/items/${props.data.itemType}/${props.data.itemTypeValue1}/${
              props.data.itemTypeValue2.split('_')[1]
            }.webp`
          : !!props.data.fixedItemId && fixedItem.value
            ? `/images/items/fixed/${fixedItem.value.quality}-${fixedItem.value.sort}.webp`
            : `/images/items/${props.data.itemType}/${props.data.itemTypeValue1}/${props.data.imageId}.webp`
)
const greaterCount = computed(
  () => props.data.affixes?.filter((a) => a.affixGreater).length
)
const selectable = computed(() => props.data.authorized && filter.mine)
const itemType = computed(
  () => props.data.itemType || (filterTypes()[0].value as string)
)
const qualifiable = computed(
  () =>
    !(
      ['inventory'].includes(itemType.value) &&
      ['gem'].includes(props.data.itemTypeValue1)
    ) && !['rune', 'aspect', 'consumables'].includes(itemType.value)
)
const descriptable = computed(
  () =>
    filterMaterials(props.data.itemTypeValue2).length > 0 ||
    ['rune', 'aspect'].includes(itemType.value)
)
const noLevel = computed(() =>
  ['summoning'].includes(props.data.itemTypeValue1)
)
const itemName = computed(
  () =>
    ((props.data.itemType === 'rune'
      ? `${findRune(props.data.itemTypeValue2)?.label} ${
          findType('rune')?.label
        }`
      : props.data.itemType === 'aspect'
        ? findAspect(Number(props.data.itemTypeValue2))?.aspectName
        : !!props.data.fixedItemId && fixedItem.value
          ? fixedItem.value.label
          : qualifiable.value
            ? props.data.name
            : props.data.itemTypeValue1 === 'gem'
              ? gems.find((g) => g.value === props.data.itemTypeValue2)?.label
              : props.data.itemTypeValue1 === 'elixir'
                ? elixirs.find((e) => e.value === props.data.itemTypeValue2)
                    ?.label
                : props.data.itemTypeValue1 === 'summoning'
                  ? summonings.find(
                      (s) => s.value === props.data.itemTypeValue2
                    )?.label
                  : undefined) ?? t('item.unknown')) as string
)
const isList = computed(() => route.name === 'tradeList')
const setBonusAffixLabel = computed(
  () => (label?: string) =>
    (label ?? '')
      .replace(
        /(\{x\}%?|\d+%?)/g,
        '<span class="text-weight-bold" style="color: var(--q-unique)">$1</span>'
      )
      .replace(
        /(\[x\])/g,
        '<span class="text-weight-bold text-grey-6">$1</span>'
      )
)

const onClickUser = (identity: string | null) => {
  if (as.info.isAdmin) router.push({ name: 'adminUser', params: { identity } })
}

const goItemDetail = () => {
  if (isList.value)
    router.push({
      name: 'itemInfo',
      params: { itemid: props.data.itemId, lang: route.params.lang ?? 'ko' }
    })
}

const onCopy = () => {
  clipboard(
    `${document.location.origin}/${route.params.lang || 'ko'}/item/${
      props.data.itemId
    }`,
    t('item.url')
  )
}

onMounted(() => {
  if (['000', '002', '003'].includes(props.data.statusCode)) executeInterval()
})

onUnmounted(() => {
  clearInterval(remainInterval)
})
</script>

<template>
  <div v-show="greaterCount > 0" class="greater-mark">
    <div class="row items-center q-gutter-xs">
      <q-icon
        v-for="(gc, idx) in greaterCount"
        :key="idx"
        class="icon greater active q-ml-xs"
        :name="`img:/images/attribute_types/${
          $q.dark.isActive ? 'greater' : 'greater_invert'
        }.svg`"
      />
    </div>
  </div>
  <q-card
    class="card-item non-selectable no-scroll full-height overflow-hidden"
    :class="[
      data.expanded ? 'expanded' : 'no-expanded',
      data.quality,
      data.itemType,
      `status-${data.statusCode}`
    ]"
    v-bind="$attrs"
  >
    <div class="inner">
      <q-card-section>
        <div class="user-area row justify-end">
          <div class="item-image">
            <q-img
              v-show="!loading"
              class="item-image"
              :src="imgSrc"
              alt="Tradurs Item Image"
            />
          </div>
          <div
            class="column justify-center items-end"
            :class="{ 'q-gutter-xs': !$q.screen.lt.sm || loading }"
          >
            <q-skeleton
              v-show="loading"
              width="40px"
              :height="$q.screen.lt.sm ? '16px' : '18px'"
            />
            <div v-show="!loading" class="row items-center q-gutter-x-sm">
              <template v-if="!data.forDisplay && !history">
                <div
                  v-if="['000', '002', '003'].includes(data.statusCode)"
                  class="date"
                  :class="remainColor"
                >
                  {{ remainHours }}:{{ remainMinutes }}:{{ remainSeconds }}
                </div>
                <div
                  v-else-if="data.statusCode === '001'"
                  class="date complete"
                >
                  {{ date.formatDate(data.updDate, 'YY.MM.DD') }}
                </div>
                <div>
                  {{ findStatus(data.statusCode)?.label }}
                </div>
              </template>
              <div v-else-if="data.forDisplay">
                {{ t('item.forDisplay') }}
              </div>
            </div>
            <div v-if="slots['top-right']">
              <slot name="top-right"></slot>
            </div>
            <D4Price :data="data.price" :progress="loading" />
            <D4User
              v-if="!data.forDisplay && !history"
              :data="data.user"
              :label="t('seller')"
              :disable="disable"
              :progress="loading"
              :authorized="data.authorized"
              @update="() => emit('update-only', data.itemId)"
              @click="onClickUser(data.user.id)"
            />
          </div>
        </div>
        <div
          class="column items-start q-pa-sm relative-position"
          :class="{ 'q-gutter-xs': !$q.screen.lt.sm || loading }"
        >
          <div v-show="loading">
            <q-skeleton
              width="100px"
              :height="$q.screen.lt.sm ? '10px' : '16px'"
            />
          </div>
          <div>
            <div
              v-show="!loading"
              class="row items-center q-gutter-x-xs text-overline no-wrap"
              style="line-height: 1.6"
            >
              <div :class="[data.hardcore ? 'text-red-8' : 'text-blue-6']">
                {{ data.hardcore ? t('item.hardcore') : t('item.softcore') }}
              </div>
              <div>:</div>
              <div class="text-primary">
                {{ data.ladder ? t('item.seasonal') : t('item.eternal') }}
              </div>
            </div>
          </div>
          <div v-show="loading">
            <q-skeleton
              width="150px"
              :height="$q.screen.lt.sm ? '16px' : '24px'"
            />
          </div>
          <div class="name-place">
            <div
              v-show="!loading"
              class="row items-center q-gutter-xs q-mb-xs no-wrap"
            >
              <q-checkbox
                v-if="selectable"
                v-model="data.selected"
                dense
                size="xs"
                class="text-caption"
                :title="itemName"
              >
                <div class="name stress ellipsis-2-lines">
                  {{ itemName }}
                </div>
              </q-checkbox>
              <div
                v-else
                class="name stress"
                :title="itemName"
                :class="[
                  { 'cursor-pointer': isList },
                  { 'ellipsis-2-lines': route.name !== 'itemInfo' }
                ]"
                @click="goItemDetail"
              >
                {{ itemName }}
              </div>
              <div
                v-if="data.quantity > 1"
                class="row items-center q-gutter-x-xs no-wrap"
              >
                <div class="text-lowercase">x</div>
                <div>{{ data.quantity }}</div>
              </div>
              <div v-if="!history" class="more-action">
                <q-btn
                  dense
                  flat
                  aria-label="Tradurs More Button"
                  :ripple="false"
                  class="no-hover"
                  padding="0"
                >
                  <img
                    class="icon"
                    src="/images/icons/morevert.svg"
                    :width="$q.screen.lt.sm ? 16 : 22"
                    :height="$q.screen.lt.sm ? 16 : 22"
                    alt="Tradurs More Icon"
                  />
                  <q-menu
                    auto-close
                    class="no-shadow"
                    anchor="top end"
                    self="bottom start"
                    :class="[$q.dark.isActive ? 'bg-grey-4' : 'bg-grey-9']"
                  >
                    <q-item
                      v-if="as.signed"
                      :class="[
                        $q.dark.isActive ? 'text-grey-9' : 'text-grey-4'
                      ]"
                      :dense="$q.screen.lt.sm"
                      clickable
                      @click="
                        () => emit('favorite', data.itemId, !data.favorite)
                      "
                    >
                      <q-item-section side>
                        <img
                          :class="{ invert: !$q.dark.isActive }"
                          :src="
                            data.favorite
                              ? '/images/icons/unfavorite.svg'
                              : '/images/icons/favorite.svg'
                          "
                          width="24"
                          height="24"
                          alt="Tradurs Favorite Icon"
                        />
                      </q-item-section>
                      <q-item-section>{{
                        data.favorite ? t('btn.unfavorite') : t('btn.favorite')
                      }}</q-item-section>
                    </q-item>
                    <q-item
                      v-if="as.signed"
                      :class="[
                        $q.dark.isActive ? 'text-grey-9' : 'text-grey-4'
                      ]"
                      :dense="$q.screen.lt.sm"
                      clickable
                      @click="() => emit('copy', data.itemId)"
                    >
                      <q-item-section side>
                        <img
                          :class="{ invert: !$q.dark.isActive }"
                          src="/images/icons/copy.svg"
                          width="24"
                          height="24"
                          alt="Tradurs Copy Icon"
                        />
                      </q-item-section>
                      <q-item-section>{{ t('btn.copy') }}</q-item-section>
                    </q-item>
                    <q-item
                      :class="[
                        $q.dark.isActive ? 'text-grey-9' : 'text-grey-4'
                      ]"
                      :dense="$q.screen.lt.sm"
                      clickable
                      @click="onCopy"
                    >
                      <q-item-section side>
                        <img
                          :class="{ invert: !$q.dark.isActive }"
                          src="/images/icons/share.svg"
                          width="24"
                          height="24"
                          alt="Tradurs Share Icon"
                        />
                      </q-item-section>
                      <q-item-section>{{ t('btn.share') }}</q-item-section>
                    </q-item>
                  </q-menu>
                </q-btn>
              </div>
            </div>
          </div>
          <div v-show="loading">
            <q-skeleton
              width="100px"
              :height="$q.screen.lt.sm ? '16px' : '18px'"
            />
          </div>
          <div
            v-show="
              !loading && (qualifiable || ['aspect'].includes(data.itemType))
            "
            class="stress"
            style="opacity: 0.6"
          >
            {{ findTier(data.tier)?.fullName }}
            {{ findQuality(data.quality)?.fullName }}
            {{
              findEquipClass(data.itemTypeValue1)?.label ||
              findType(data.itemType)?.label
            }}
          </div>
          <div
            v-show="!loading && ['rune'].includes(data.itemType)"
            class="stress"
            style="opacity: 0.6"
          >
            {{ findQuality(data.quality)?.fullName }}
            {{ findRuneType(findRune(data.itemTypeValue2)?.type)?.label }}
          </div>
          <div v-show="data.power > 0">
            {{
              t('item.power', {
                p: data.power,
                u: data.upgrade ? ` + ${data.upgrade * 5}` : ''
              })
            }}
          </div>
          <div v-show="loading">
            <q-skeleton
              width="130px"
              :height="$q.screen.lt.sm ? '16px' : '18px'"
            />
          </div>
        </div>
      </q-card-section>
      <D4Separator v-show="qualifiable || descriptable" type="left" />
      <q-card-section v-if="setGroup" class="set-description">
        <div>{{ setGroup?.label }}</div>
        <ul class="group-list">
          <li
            v-for="fi in setGroup?.fixedItems"
            :key="fi.value"
            :class="[fixedItem?.value === fi.value ? 'stress' : 'text-grey']"
          >
            {{ fi.label }}
          </li>
        </ul>
        <div class="stress">
          {{ setGroup?.label }} {{ `(1/${setGroup?.fixedItemIds?.length})` }}
        </div>
        <div
          v-show="setGroup.bonusAffixes && setGroup.bonusAffixes.length > 0"
          class="stress q-mt-xs q-px-sm"
        >
          <div class="column no-wrap q-gutter-sm">
            <div v-for="bonus in setGroup.bonusAffixes" :key="bonus.affix">
              <div>{{ `(${bonus.setCount}) ${data.quality}` }}</div>
              <ul class="bonus-list">
                <li
                  v-for="(ba, idx) in (
                    findAffix(bonus.affix)?.label ?? ''
                  ).split(/\n/)"
                  :key="idx"
                  class="q-px-sm"
                  v-html="setBonusAffixLabel(ba)"
                ></li>
              </ul>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-section
        v-show="
          loading ||
          (!loading &&
            (['rune', 'aspect'].includes(data.itemType) ||
              data.properties?.length > 0 ||
              data.itemTypeValue1 === 'summoning'))
        "
      >
        <div class="q-px-sm">
          <q-item
            v-show="loading"
            v-for="c in 2"
            :key="c"
            style="min-height: 10px; padding: 3px"
          >
            <q-item-section side class="q-pr-sm">
              <q-skeleton type="circle" width="10px" height="10px" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                <q-skeleton
                  type="rect"
                  width="65%"
                  :height="$q.screen.lt.sm ? '14px' : '18px'"
                />
              </q-item-label>
            </q-item-section>
          </q-item>
          <div
            v-if="(slots.properties || slots.description) && !loading"
            class="column"
            :class="{ 'q-gutter-y-xs': !$q.screen.lt.sm }"
            style="min-height: 25px"
          >
            <slot name="properties"> </slot>
            <slot name="description"> </slot>
          </div>
        </div>
      </q-card-section>
      <D4Separator
        v-show="
          loading ||
          (!loading &&
            (data.properties?.length > 0 || !!slots.description) &&
            data.affixes?.length > 0)
        "
      />
      <q-card-section
        v-show="loading || (!loading && data.affixes?.length > 0)"
      >
        <div class="q-px-sm">
          <q-item
            v-show="loading"
            v-for="c in 3"
            :key="c"
            style="min-height: 10px; padding: 3px"
          >
            <q-item-section side class="q-pr-sm">
              <q-skeleton type="circle" width="10px" height="10px" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                <q-skeleton
                  type="rect"
                  width="65%"
                  :height="$q.screen.lt.sm ? '14px' : '18px'"
                />
              </q-item-label>
            </q-item-section>
          </q-item>
          <div
            v-if="slots.affixes && !loading"
            class="column"
            :class="{ 'q-gutter-y-xs': !$q.screen.lt.sm }"
            style="min-height: 25px"
          >
            <slot name="affixes"> </slot>
          </div>
        </div>
      </q-card-section>
      <q-card-section
        v-show="
          !loading &&
          data.properties?.length === 0 &&
          data.affixes?.length === 0 &&
          !!!slots.description
        "
        :class="$q.screen.lt.sm ? '' : $q.screen.lt.md ? 'q-my-md' : 'q-my-lg'"
      ></q-card-section>
      <q-card-section class="row justify-end">
        <div class="q-px-sm">
          <q-item
            v-show="loading"
            v-for="c in 2"
            :key="c"
            style="min-height: 10px; padding: 3px"
          >
            <q-item-section>
              <q-item-label class="row justify-end">
                <q-skeleton
                  type="rect"
                  width="85%"
                  :height="$q.screen.lt.sm ? '14px' : '18px'"
                />
              </q-item-label>
            </q-item-section>
          </q-item>
          <div
            v-show="data.itemTypeValue1 !== 'summoning'"
            class="column"
            :class="{ 'q-gutter-y-xs': !$q.screen.lt.sm }"
          >
            <div class="text-right q-pt-sm">
              <template v-if="!loading">
                {{ t('item.level') }}: {{ data.level }}
              </template>
              <q-skeleton
                v-else
                type="rect"
                width="100px"
                :height="$q.screen.lt.sm ? '14px' : '18px'"
              />
            </div>
            <slot
              v-if="
                slots.restrictions && !loading && data.restrictions.length > 0
              "
              name="restrictions"
            >
            </slot>
          </div>
        </div>
      </q-card-section>
      <q-card-section
        v-if="history"
        :class="{ 'q-my-md': $q.screen.gt.sm && noLevel }"
      >
        <div :class="{ 'q-py-md': $q.screen.gt.sm && noLevel }"></div>
      </q-card-section>
      <D4Separator v-show="slots.actions" />
      <q-card-section v-if="slots.actions">
        <slot name="actions"></slot>
      </q-card-section>
    </div>
    <slot name="more" :loading="loading"></slot>
  </q-card>
</template>

<style lang="scss" scoped>
@use '/src/css/card-item' as *;

.date {
  font-family: monospace;
  font-size: 11px;
  line-height: 12px;
  letter-spacing: 0;
}

.complete {
  color: var(--q-legendary);
}

.name-place {
  width: 60%;
}

.card-item.set .name-place .stress {
  color: var(--q-light-legendary);
}

.more-action {
  position: relative;
  z-index: 3;
  line-height: 24px;
  padding: 0;
  margin: 0 0 0 4px;
  visibility: hidden;
}

.card-item:hover:deep(.more-action) {
  visibility: visible;
}

@media (max-width: 600px) {
  .name-place {
    width: 48%;
  }

  .card-item:deep(.more-action) {
    line-height: 18px;
    visibility: visible !important;
  }
}

.status-002 {
  filter: grayscale(1) opacity(0.5);
}

.user-area {
  position: relative;
  width: 35%;
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1;
}

.item-image {
  position: absolute;
  top: 0;
  right: 48%;
  width: 90px;
  max-width: 80%;
  z-index: 2;
}

.set-description {
  & .group-list {
    margin-top: 0.5em;
    padding-left: 20px;

    & li {
      position: relative;
      list-style: none;
      padding-left: 20px;

      &::before {
        content: '→';
        position: absolute;
        left: 0;
      }
    }
  }

  & .bonus-list {
    margin-top: 0.5em;
    padding-left: 10px;

    & li {
      padding-left: 0;
    }
  }
}

@media (max-width: 724px) {
  .user-area {
    width: 50%;
    right: 10px;
  }

  .item-image {
    right: 40%;
    max-width: 50%;
  }
}

@media (max-width: 400px) {
  .item-image {
    display: none;
  }
}
</style>
