<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script setup lang="ts">
import {
  reactive,
  ref,
  computed,
  useSlots,
  nextTick,
  onUnmounted,
  ComputedRef,
  onMounted
} from 'vue'
import { QCard, useQuasar, date } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { useAccountStore } from 'stores/account-store'
import { type Gem, type Elixir, useItemStore } from 'stores/item-store'
import { Item, Price } from 'src/types/item'
import { checkName, clipboard } from 'src/common'
import { itemImgs } from 'src/common/items'

import D4Price from 'components/D4Price.vue'
import D4User from 'components/D4User.vue'
import D4Separator from 'components/D4Separator.vue'

interface IProps {
  data: Item
  editable?: boolean
  loading?: boolean
  disable?: boolean
  history?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  editable: false,
  loading: false,
  disable: false,
  history: false
})

const emit = defineEmits(['update', 'apply', 'copy', 'favorite', 'update-only'])

// common variable
const $q = useQuasar()
const slots = useSlots()
const as = useAccountStore()
const store = useItemStore()
const { t } = useI18n({ useScope: 'global' })
const route = useRoute()

// variable
const editWrap = ref<QCard | null>(null)

const filterClasses = store.filterClasses
const runeTypes = store.runeTypes
const filterRunesByType = store.filterRunesByType
const imgSrc = computed(() =>
  props.data.itemType === 'rune'
    ? `/images/items/rune/${props.data.itemTypeValue1}/${props.data.itemTypeValue2}.webp`
    : props.data.itemType === 'aspect'
    ? `/images/items/${props.data.itemType}/${props.data.itemTypeValue1}.webp`
    : ['gem', 'summoning'].includes(props.data.itemTypeValue1)
    ? `/images/items/${props.data.itemType}/${props.data.itemTypeValue1}/${props.data.itemTypeValue2}.webp`
    : props.data.itemTypeValue1 === 'elixir'
    ? `/images/items/${props.data.itemType}/${props.data.itemTypeValue1}/${
        props.data.itemTypeValue2.split('_')[1]
      }.webp`
    : `/images/items/${props.data.itemType}/${props.data.itemTypeValue1}/${props.data.imageId}.webp`
)

const _name = ref<string>(props.data.name)
const _quantity = ref<number>(props.data.quantity || 1)
const selectable = computed(() => props.data.authorized && store.filter.mine)
const greaterCount = computed(
  () => props.data.affixes?.filter((a) => a.affixGreater).length
)
const endDate = new Date(props.data.endDate)
const expDate = new Date(props.data.expDate)
const remainDate = ref<number>(
  date.getDateDiff(
    ['000', '002'].includes(props.data.statusCode) ? endDate : expDate,
    new Date(),
    'seconds'
  )
)
const hour = 60 * 60
const minute = 60
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
let remainInterval: NodeJS.Timeout

const executeInterval = () => {
  remainInterval = setInterval(() => {
    remainDate.value--
  }, 1000)
}

const _tier = ref<string | null>(props.data.tier)
const _quality = ref<string>(props.data.quality || 'rare')
const _type = ref<string>(
  props.data.itemType || (store.filterTypes()[0].value as string)
)
const _typeValue1 = ref<string>(
  props.data.itemTypeValue1 ||
    (_type.value === 'aspect'
      ? (store.aspectCategories[0].value as string)
      : (filterClasses(_type.value)[0].value as string))
)
const _typeValue2 = ref<string>(
  props.data.itemTypeValue2 ||
    (_typeValue1.value === 'gem'
      ? (store.gems[0].value as string)
      : _typeValue1.value === 'elixir'
      ? (store.elixirs[0].value as string)
      : _typeValue1.value === 'summoning'
      ? (store.summonings[0].value as string)
      : '')
)
const _power = ref<number>(props.data.power)
const _upgrade = ref<number>(props.data.upgrade)
const _level = ref<number | null>(
  props.data.level === 0 ? null : props.data.level
)
const _favorite = ref<boolean>(props.data.favorite)

const findRuneType = store.findRuneType
const filterTypes = store.filterTypes
const upgradeLimit = computed(
  () => store.findQuality(props.data.quality)?.upgradeLimit
)
const findTier = store.findTier
const findQuality = store.findQuality
const filterQuality = store.filterQuality
const findStatus = store.findItemStatus
const findRune = store.findRune
const findType = store.findType
const findClass = store.findClass

const hasProperties = computed(
  () => findClass(_typeValue1.value)?.properties.length !== 0
)

const _image = ref<number>(
  props.data.itemId !== ''
    ? props.data.imageId
    : Math.floor(
        Math.random() * itemImgs[_type.value]?.[_typeValue1.value as string]
      ) || 0
)
const _price = reactive<Price>(
  new Price(
    props.data.price && props.data.price.currency
      ? props.data.price.currency
      : 'offer',
    props.data.price && props.data.price.currencyValue
      ? props.data.price.currencyValue
      : null,
    props.data.price && props.data.price.quantity
      ? props.data.price.quantity
      : undefined
  )
)

const tierable = computed(
  () => !['rune', 'aspect', 'inventory', 'consumables'].includes(_type.value)
)
const qualifiable = computed(
  () => !['rune', 'inventory', 'consumables'].includes(_type.value)
)
const descriptable = computed(
  () =>
    store.filterMaterials(props.data.itemTypeValue2).length > 0 ||
    ['rune'].includes(_type.value)
)

const noLevel = computed(() => ['summoning'].includes(_typeValue1.value))

const attributes = computed(() =>
  [
    { label: t('properties'), value: 'properties', hide: !hasProperties.value },
    { label: t('affixes'), value: 'affixes' },
    { label: t('restrictions'), value: 'restrictions' }
  ].filter((a) => !a.hide)
)

const copy = () => {
  clipboard(
    `${document.location.origin}/${route.params.lang || 'ko'}/item/${
      props.data.itemId
    }`,
    t('item.url')
  )
}

const updateTier = (val: string) => {
  _tier.value = _tier.value === val ? null : val
  _level.value = null
  update()
}

const updateQuality = (val: string) => {
  _quality.value = val
  _power.value = 0
  _upgrade.value = 0
  update()
}

const updateType = (val: string) => {
  if (!tierable.value) {
    _tier.value = ''
    _name.value = ''
  }

  if (!qualifiable.value) _quality.value = 'normal'

  _typeValue1.value =
    val === 'rune'
      ? (store.runeTypes?.[0].value as string)
      : val === 'aspect'
      ? (store.aspectCategories[0].value as string)
      : (filterClasses(val)[0].value as string)

  updateTypeValue1(_typeValue1.value)
}

const updateTypeValue1 = (val: string) => {
  _image.value =
    Math.floor(
      Math.random() * itemImgs[_type.value]?.[_typeValue1.value as string]
    ) || 0
  attribute.value =
    findClass(val)?.properties.length !== 0 ? 'properties' : 'affixes'
  _typeValue2.value =
    _type.value === 'rune'
      ? (filterRunesByType(val)?.[0]?.value as string)
      : val === 'gem'
      ? (store.gems[0].value as string)
      : val === 'elixir'
      ? (store.elixirs[0].value as string)
      : val === 'summoning'
      ? (store.summonings[0].value as string)
      : ''
  updateTypeValue2(_typeValue2.value)
}

const updateTypeValue2 = (val: string) => {
  const selectedRune =
    _type.value === 'rune'
      ? filterRunesByType(_typeValue1.value)?.find((r) => r.value === val)
      : undefined

  _quality.value = selectedRune?.quality ?? _quality.value

  _level.value =
    _typeValue1.value === 'gem'
      ? store.gems.find((g: Gem) => g.value === val)?.level || null
      : _typeValue1.value === 'elixir'
      ? store.elixirs.find((e: Elixir) => e.value === val)?.level || null
      : selectedRune?.level ?? null
  update()
}

const update = () => {
  emit('update', {
    name: _name,
    quantity: _quantity.value,
    tier: _tier.value,
    quality: _quality.value,
    itemType: _type.value,
    itemTypeValue1: _typeValue1.value,
    itemTypeValue2: _typeValue2.value,
    imageId: _image,
    power: _power.value,
    upgrade: _upgrade.value,
    level: _level.value,
    price: _price,
    favorite: _favorite
  })
}

const updatePrice = (price: Price) => {
  _price.currency = price.currency
  _price.currencyValue = price.currencyValue
  _price.quantity = price.quantity
  update()
}

// control scroll
const propertyRef = ref<HTMLDivElement | null>(null)
const affixRef = ref<HTMLDivElement | null>(null)
const restrictionRef = ref<HTMLDivElement | null>(null)
const scrollEnd = (pType: string, valueId: string) => {
  nextTick(() => {
    if (pType === 'properties' && propertyRef.value) {
      const findValue = propertyRef.value.querySelector(
        `div[data-id="${valueId}"] input`
      ) as HTMLInputElement
      findValue?.focus()
    } else if (pType === 'affixes' && affixRef.value) {
      const findValue = affixRef.value.querySelector(
        `div[data-id="${valueId}"] input`
      ) as HTMLInputElement
      findValue?.focus()
    } else if (pType === 'restrictions' && restrictionRef.value) {
      const findValue = restrictionRef.value.querySelector(
        `div[data-id="${valueId}"] input`
      ) as HTMLInputElement
      findValue?.focus()
    }
  })
}
const apply = () => {
  emit('apply')
}

// item images
const showItemImages = ref<boolean>(false)

// attribute tabs
const attribute = ref<string>('affixes')

// attribute mobile
const attrMobile = reactive<{ is: ComputedRef<boolean>; show: boolean }>({
  is: computed(() => $q.screen.lt.md),
  show: false
})

onMounted(() => {
  if (['000', '002', '003'].includes(props.data.statusCode)) executeInterval()
})

onUnmounted(() => {
  clearInterval(remainInterval)
})

defineExpose({ scrollEnd })
</script>

<template>
  <q-card
    v-if="editable"
    ref="editWrap"
    class="card-item non-selectable scroll editable"
    :class="data.quality"
  >
    <q-form
      class="inner"
      :class="$q.screen.lt.sm ? 'column full-height' : 'justify-between'"
      @submit="apply"
    >
      <q-card-section>
        <div class="column items-start q-gutter-y-sm">
          <div
            class="row items-center no-wrap justify-between q-col-gutter-sm full-width q-pt-sm"
          >
            <div>
              <div class="row no-wrap items-center q-gutter-xs quality">
                <q-btn
                  :ripple="!$q.dark.isActive"
                  v-for="t in store.tiers"
                  :key="t.value"
                  :disable="disable || !tierable"
                  round
                  :size="$q.screen.lt.sm ? 'sm' : 'md'"
                  unelevated
                  aria-label="Tradurs Tier Button"
                  :class="['text-weight-bold', { active: _tier === t.value }]"
                  :label="t.label"
                  @click="updateTier(t.value as string)"
                />
              </div>
            </div>
            <div>
              <div class="row no-wrap items-center q-gutter-xs quality">
                <q-btn
                  :ripple="!$q.dark.isActive"
                  v-for="q in filterQuality()"
                  :key="q.value"
                  :disable="disable || !qualifiable"
                  round
                  :size="$q.screen.lt.sm ? 'sm' : 'md'"
                  unelevated
                  aria-label="Tradurs Quality Button"
                  :class="[
                    'text-weight-bold',
                    { active: _quality === q.value }
                  ]"
                  :label="q.label"
                  @click="updateQuality(q.value as string)"
                />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
      <D4Separator />
      <q-card-section>
        <div class="row items-center q-col-gutter-sm">
          <div class="col">
            <q-select
              v-model="_type"
              :disable="disable"
              outlined
              dense
              no-error-icon
              hide-bottom-space
              emit-value
              map-options
              transition-show="none"
              transition-hide="none"
              :transition-duration="0"
              :label="t('item.selectType')"
              dropdown-icon="img:/images/icons/dropdown.svg"
              :options="filterTypes()"
              popup-content-class="scroll bordered limit-select"
              @update:model-value="updateType"
            >
              <!-- Season 1 accessory notify -->
              <!-- <template v-if="store.storage.data.ladder && _type === 'accessory'" #prepend>
                    <q-icon class="caution" size="19px">
                      <q-spinner-puff :color="$q.dark.isActive ? 'yellow-6' : 'black'" />
                      <D4Tooltip>
                        <div style="max-width:140px" class="text-caption break-keep">
                          {{ t('season.first.socket') }}
                        </div>
                      </D4Tooltip>
                    </q-icon>
                  </template> -->
              <template #selected-item="scope">
                <div class="ellipsis">{{ scope.opt.label }}</div>
              </template>
            </q-select>
          </div>
          <!-- Item Type Value Place ----------------------------------------------------------------------------------->
          <template v-if="_type === 'rune'">
            <div class="col">
              <q-select
                v-model="_typeValue1"
                :disable="disable"
                outlined
                dense
                no-error-icon
                hide-bottom-space
                emit-value
                map-options
                transition-show="none"
                transition-hide="none"
                :transition-duration="0"
                :label="t('item.selectRuneType')"
                :options="runeTypes"
                dropdown-icon="img:/images/icons/dropdown.svg"
                popup-content-class="scroll bordered limit-select"
                @update:model-value="updateTypeValue1"
              >
                <template #selected-item="scope">
                  <div class="ellipsis">{{ scope.opt.label }}</div>
                </template>
              </q-select>
            </div>
            <div class="col">
              <q-select
                v-model="_typeValue2"
                :disable="disable"
                outlined
                dense
                no-error-icon
                hide-bottom-space
                emit-value
                map-options
                transition-show="none"
                transition-hide="none"
                :transition-duration="0"
                :label="t('item.selectRune')"
                :options="filterRunesByType(_typeValue1)"
                dropdown-icon="img:/images/icons/dropdown.svg"
                popup-content-class="scroll bordered limit-select"
                @update:model-value="updateTypeValue2"
              >
                <template #selected-item="scope">
                  <div class="ellipsis">{{ scope.opt.label }}</div>
                </template>
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <img
                        :src="`/images/items/rune/${_typeValue1}/${scope.opt.value}.webp`"
                        width="24"
                        height="24"
                        alt="Tradurs Rune Image"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </template>
          <div class="col" v-else-if="_type === 'aspect'">
            <q-select
              v-model="_typeValue1"
              :disable="disable"
              outlined
              dense
              no-error-icon
              hide-bottom-space
              emit-value
              map-options
              transition-show="none"
              transition-hide="none"
              :transition-duration="0"
              :label="t('item.selectAspectCategory')"
              dropdown-icon="img:/images/icons/dropdown.svg"
              :options="store.aspectCategories"
              popup-content-class="scroll bordered limit-select"
              @update:model-value="update"
            >
              <template #selected-item="scope">
                <div class="ellipsis">{{ scope.opt.label }}</div>
              </template>
              <template #option="scope">
                <q-item clickable v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <img
                      height="48"
                      :src="`/images/items/${_type}/${scope.opt.value}.webp`"
                      alt="Tradurs Aspect Image"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
          <template v-else>
            <div class="col">
              <q-select
                v-model="_typeValue1"
                :disable="disable"
                outlined
                dense
                no-error-icon
                hide-bottom-space
                emit-value
                map-options
                transition-show="none"
                transition-hide="none"
                :transition-duration="0"
                :label="
                  t('item.selectClass', {
                    type: findType(data.itemType)?.label
                  })
                "
                dropdown-icon="img:/images/icons/dropdown.svg"
                :options="filterClasses(_type)"
                popup-content-class="scroll bordered limit-select"
                @update:model-value="updateTypeValue1"
              >
                <template #selected-item="scope">
                  <div class="ellipsis">{{ scope.opt.label }}</div>
                </template>
              </q-select>
            </div>
            <div class="col" v-if="_typeValue1 === 'gem'">
              <q-select
                v-model="_typeValue2"
                :disable="disable"
                outlined
                dense
                no-error-icon
                hide-bottom-space
                emit-value
                map-options
                transition-show="none"
                transition-hide="none"
                :transition-duration="0"
                :label="t('item.selectGem')"
                dropdown-icon="img:/images/icons/dropdown.svg"
                :options="store.gems"
                popup-content-class="scroll bordered limit-select"
                options-dense
                @update:model-value="updateTypeValue2"
                exact-active
              >
                <template #selected-item="scope">
                  <q-item-section>
                    <q-item-label class="ellipsis">{{
                      scope.opt.label
                    }}</q-item-label>
                  </q-item-section>
                </template>
                <template #option="scope">
                  <q-item clickable v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <img
                        height="36"
                        :src="`/images/items/${_type}/${_typeValue1}/${scope.opt.value}.webp`"
                        alt="Tradurs Gem Images"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div class="col" v-else-if="_typeValue1 === 'elixir'">
              <q-select
                v-model="_typeValue2"
                :disable="disable"
                outlined
                dense
                no-error-icon
                hide-bottom-space
                emit-value
                map-options
                transition-show="none"
                transition-hide="none"
                :transition-duration="0"
                :label="t('item.selectElixir')"
                dropdown-icon="img:/images/icons/dropdown.svg"
                :options="store.elixirs"
                popup-content-class="scroll bordered limit-select"
                options-dense
                @update:model-value="updateTypeValue2"
              >
                <template #selected-item="scope">
                  <div class="ellipsis">{{ scope.opt.label }}</div>
                </template>
                <template #option="scope">
                  <q-item
                    :disable="
                      scope.opt.onlyHardcore && !store.storage.data.hardcore
                    "
                    clickable
                    v-bind="scope.itemProps"
                  >
                    <q-item-section avatar>
                      <img
                        height="36"
                        :src="`/images/items/${_type}/${_typeValue1}/${scope.opt.elixir}.webp`"
                        alt="Tradurs Elixir Images"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div class="col" v-else-if="_typeValue1 === 'summoning'">
              <q-select
                v-model="_typeValue2"
                :disable="disable"
                outlined
                dense
                no-error-icon
                hide-bottom-space
                emit-value
                map-options
                transition-show="none"
                transition-hide="none"
                :transition-duration="0"
                :label="t('item.selectSummoning')"
                dropdown-icon="img:/images/icons/dropdown.svg"
                :options="store.summonings"
                popup-content-class="scroll bordered limit-select"
                options-dense
                @update:model-value="updateTypeValue2"
              >
                <template #selected-item="scope">
                  <div class="ellipsis">{{ scope.opt.label }}</div>
                </template>
                <template #option="scope">
                  <q-item clickable v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <img
                        height="36"
                        :src="`/images/items/${_type}/${_typeValue1}/${scope.opt.value}.webp`"
                        alt="Tradurs Summoning Images"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div v-else>
              <q-btn
                dense
                glossy
                outline
                aria-label="Tradurs Thumbnail Button"
                padding="4px 8px"
                color="primary"
                :ripple="false"
                class="no-hover rounded-borders"
                @click="showItemImages = true"
              >
                <img
                  height="32"
                  :src="`/images/items/${_type}/${_typeValue1}/${_image}.webp`"
                  alt="Tradurs Item Thumbnail Image"
                />
                <D4Dialog v-model="showItemImages" :no-route-dismiss="false">
                  <template #top>
                    <q-card-section
                      class="row justify-between items-center q-ml-md"
                    >
                      <div class="name">
                        {{
                          t('item.selectImage', {
                            tv:
                              findClass(data.itemTypeValue1)?.label ||
                              findType(data.itemType)?.label
                          })
                        }}
                      </div>
                      <q-btn
                        unelevated
                        aria-label="Tradurs Close Button"
                        class="no-hover icon"
                        :ripple="false"
                      >
                        <img
                          src="/images/icons/close.svg"
                          width="24"
                          height="24"
                          @click="showItemImages = false"
                          alt="Tradurs Close Icon"
                        />
                      </q-btn>
                    </q-card-section>
                  </template>
                  <template #middle>
                    <q-card-section class="scroll q-ma-lg" style="height: 50vh">
                      <div class="row q-col-gutter-md">
                        <div
                          v-for="i, idx in itemImgs[_type][_typeValue1 as string]"
                          :key="idx"
                          class="col-4 col-md-3 cursor-pointer"
                          @click="
                            () => {
                              _image = idx
                              update()
                            }
                          "
                          v-close-popup
                        >
                          <q-card
                            flat
                            bordered
                            class="item-image-card"
                            :class="{ 'bg-primary-cloud': idx === _image }"
                          >
                            <q-card-section class="text-center no-padding">
                              <q-img
                                style="width: 90%"
                                :src="`/images/items/${_type}/${_typeValue1}/${idx}.webp`"
                                alt="Tradurs Item Image"
                              />
                            </q-card-section>
                          </q-card>
                        </div>
                      </div>
                    </q-card-section>
                  </template>
                </D4Dialog>
              </q-btn>
            </div>
          </template>
          <!-- Item Type Value Place ----------------------------------------------------------------------------------->
          <D4Counter
            v-model="_quantity"
            :disable="disable"
            @update:model-value="update"
            :no-button="$q.screen.lt.sm"
          />
        </div>
      </q-card-section>
      <q-card-section v-if="qualifiable">
        <q-input
          :disable="disable"
          dense
          no-error-icon
          hide-bottom-space
          autofocus
          v-model="_name"
          outlined
          class="col-10"
          :label="t('item.name')"
          @update:model-value="update"
          maxlength="256"
          :rules="[(val) => checkName(val) || '']"
        />
      </q-card-section>
      <q-card-section
        class="q-col-gutter-x-sm"
        :class="qualifiable ? 'row justify-between items-center' : 'col'"
      >
        <div v-show="tierable" class="row items-center q-gutter-x-sm">
          <D4Counter
            v-model="_power"
            :label="t('item.power')"
            :max="9999"
            max-width="110px"
            allow-zero
            no-button
            :disable="disable"
            @update:model-value="update"
          />
          <!-- <D4Counter v-if="upgradeLimit" v-model="_upgrade"
            :label="t('item.upgrade', { u: _upgrade, ul: upgradeLimit })" max-width="110px" :max="upgradeLimit"
            allow-zero :no-button="$q.screen.lt.sm" :disable="disable" @update:model-value="update" /> -->
        </div>
        <D4Counter
          v-show="!noLevel"
          v-model="_level"
          class="col row justify-end"
          :label="t('item.level')"
          max-width="110px"
          :max="999"
          no-button
          :disable="disable || !qualifiable || noLevel"
          @update:model-value="update"
        />
      </q-card-section>
      <template v-if="qualifiable">
        <template v-if="$slots['base-end']">
          <D4Separator />
          <q-card-section>
            <slot name="base-end"></slot>
          </q-card-section>
          <D4Separator />
        </template>
        <q-card-section
          v-if="attrMobile.is && !attrMobile.show"
          class="col row justify-center items-center"
        >
          <q-btn
            no-caps
            :label="t('attribute.open')"
            :aria-label="t('attribute.open')"
            class="attribute full-width"
            size="lg"
            padding="xl"
            @click="attrMobile.show = true"
          >
            <img
              width="24"
              height="24"
              class="icon q-ml-sm rotate-45"
              src="/images/icons/expand.svg"
              alt="Tradurs Expand Icon"
            />
          </q-btn>
        </q-card-section>
        <q-card-section
          v-if="!attrMobile.is || attrMobile.show"
          class="tab row justify-end items-center"
        >
          <q-btn-toggle
            v-model="attribute"
            square
            flat
            no-caps
            aria-label="Tradurs Attribute Button"
            :ripple="false"
            :color="$q.dark.isActive ? 'grey-5' : 'grey-8'"
            toggle-color="transparent toggle"
            :options="attributes"
          />
        </q-card-section>
        <q-card-section v-if="!attrMobile.is" style="padding-top: 0">
          <div class="attribute">
            <q-tab-panels v-model="attribute" class="q-pa-xs bg-transparent">
              <q-tab-panel
                v-if="hasProperties"
                name="properties"
                class="q-gutter-y-xs no-padding column no-wrap"
                style="max-height: 30vh"
              >
                <div v-if="slots['add-property']">
                  <slot name="add-property" :wrap="editWrap"></slot>
                </div>
                <div ref="propertyRef" class="col scroll">
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
                    v-if="slots.properties && !loading"
                    class="q-gutter-y-xs"
                  >
                    <slot name="properties"> </slot>
                  </div>
                </div>
              </q-tab-panel>
              <q-tab-panel
                name="affixes"
                class="q-gutter-y-xs no-padding column"
              >
                <div v-if="slots['add-affix']">
                  <slot name="add-affix" :wrap="editWrap"></slot>
                </div>
                <div ref="affixRef" class="col scroll">
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
                  <div v-if="slots.affixes && !loading" class="q-gutter-y-xs">
                    <slot name="affixes"> </slot>
                  </div>
                </div>
              </q-tab-panel>
              <q-tab-panel
                name="restrictions"
                class="q-gutter-y-xs no-padding column"
              >
                <div v-if="slots['add-restriction']">
                  <slot name="add-restriction" :wrap="editWrap"></slot>
                </div>
                <div ref="restrictionRef" class="col scroll">
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
                    v-if="slots.restrictions && !loading"
                    class="q-gutter-y-xs"
                  >
                    <slot name="restrictions"> </slot>
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>
          </div>
        </q-card-section>
        <q-card
          flat
          v-if="attrMobile.is && attrMobile.show"
          class="col fullscreen column"
        >
          <q-card-section class="tab row justify-end items-center">
            <q-btn-toggle
              v-model="attribute"
              square
              flat
              no-caps
              size="md"
              aria-label="Tradurs Attribute Button"
              :ripple="false"
              :color="$q.dark.isActive ? 'grey-5' : 'grey-8'"
              toggle-color="transparent toggle"
              :options="attributes"
            />
          </q-card-section>
          <q-card-section style="padding-top: 0" class="col">
            <div class="attribute">
              <q-tab-panels
                v-model="attribute"
                class="q-pa-xs bg-transparent full-height"
              >
                <q-tab-panel
                  v-if="hasProperties"
                  name="properties"
                  class="q-gutter-y-xs no-padding column"
                >
                  <div v-if="slots['add-property']">
                    <slot name="add-property" :wrap="editWrap"></slot>
                  </div>
                  <div class="col scroll">
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
                      v-if="slots.properties && !loading"
                      class="q-gutter-y-xs"
                    >
                      <slot name="properties"> </slot>
                    </div>
                  </div>
                </q-tab-panel>
                <q-tab-panel
                  name="affixes"
                  class="q-gutter-y-xs no-padding column"
                >
                  <div v-if="slots['add-affix']">
                    <slot name="add-affix" :wrap="editWrap"></slot>
                  </div>
                  <div class="col scroll">
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
                    <div v-if="slots.affixes && !loading" class="q-gutter-y-xs">
                      <slot name="affixes"> </slot>
                    </div>
                  </div>
                </q-tab-panel>
                <q-tab-panel
                  name="restrictions"
                  class="q-gutter-y-xs no-padding column"
                >
                  <div v-if="slots['add-restriction']">
                    <slot name="add-restriction" :wrap="editWrap"></slot>
                  </div>
                  <div class="col scroll">
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
                      v-if="slots.restrictions && !loading"
                      class="q-gutter-y-xs"
                    >
                      <slot name="restrictions"> </slot>
                    </div>
                  </div>
                </q-tab-panel>
              </q-tab-panels>
            </div>
          </q-card-section>
          <q-card-section v-if="attrMobile.show">
            <q-btn
              no-caps
              :label="t('attribute.close')"
              :aria-label="t('attribute.close')"
              class="lt-md attribute full-width"
              size="lg"
              @click="attrMobile.show = false"
            >
              <img
                width="24"
                height="24"
                class="icon q-ml-sm"
                src="/images/icons/shrink.svg"
                alt="Tradurs Expand Icon"
              />
            </q-btn>
          </q-card-section>
        </q-card>
      </template>
      <D4Separator />
      <q-card-section>
        <D4Price
          :data="data.price"
          :editable="editable"
          :disable="disable"
          :progress="loading"
          @update="updatePrice"
        />
      </q-card-section>
      <D4Separator v-if="slots.actions" />
      <q-card-section v-if="slots.actions">
        <slot name="actions"></slot>
      </q-card-section>
    </q-form>
    <slot name="more" :loading="loading"></slot>
  </q-card>
  <template v-else>
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
                :class="{ larger: data.itemTypeValue2.includes('_set') }"
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
                @update="emit('update-only', data.itemId)"
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
                >
                  <div
                    v-show="data.itemTypeValue1 === 'rune'"
                    class="row items-center q-gutter-sm"
                  >
                    <div class="name">
                      {{
                        (
                          filterRunesByType().find(
                            (r) => r.value === data.itemTypeValue1
                          ) || {}
                        ).label
                      }}
                    </div>
                    <div>
                      {{
                        findRuneType(findRune(data.itemTypeValue1)?.type)?.label
                      }}
                    </div>
                  </div>
                  <div class="name stress ellipsis-2-lines">
                    <span v-show="qualifiable">
                      {{ data.name }}
                    </span>
                    <span v-show="data.itemTypeValue1 === 'gem'">
                      {{
                        store.gems.find((g) => g.value === data.itemTypeValue2)
                          ?.label
                      }}
                    </span>
                    <span v-show="data.itemTypeValue1 === 'elixir'">
                      {{
                        store.elixirs.find(
                          (e) => e.value === data.itemTypeValue2
                        )?.label
                      }}
                    </span>
                    <span v-show="data.itemTypeValue1 === 'summoning'">
                      {{
                        store.summonings.find(
                          (s) => s.value === data.itemTypeValue2
                        )?.label
                      }}
                    </span>
                  </div>
                </q-checkbox>
                <template v-else>
                  <div
                    v-show="data.itemTypeValue1 === 'rune'"
                    class="row items-center q-gutter-sm"
                  >
                    <div class="name">
                      {{
                        (
                          filterRunesByType().find(
                            (r) => r.value === data.itemTypeValue1
                          ) || {}
                        ).label
                      }}
                    </div>
                    <div>
                      {{
                        findRuneType(findRune(data.itemTypeValue1)?.type)?.label
                      }}
                    </div>
                  </div>
                  <div class="name stress ellipsis-2-lines">
                    <span v-show="qualifiable">
                      {{ data.name }}
                    </span>
                    <span v-show="data.itemType === 'rune'">
                      {{ store.findRune(data.itemTypeValue2)?.label }}
                    </span>
                    <span v-show="data.itemTypeValue1 === 'gem'">
                      {{
                        store.gems.find((g) => g.value === data.itemTypeValue2)
                          ?.label
                      }}
                    </span>
                    <span v-show="data.itemTypeValue1 === 'elixir'">
                      {{
                        store.elixirs.find(
                          (e) => e.value === data.itemTypeValue2
                        )?.label
                      }}
                    </span>
                    <span v-show="data.itemTypeValue1 === 'summoning'">
                      {{
                        store.summonings.find(
                          (s) => s.value === data.itemTypeValue2
                        )?.label
                      }}
                    </span>
                  </div>
                </template>
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
                        @click="$emit('favorite', data.itemId, !data.favorite)"
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
                          data.favorite
                            ? t('btn.unfavorite')
                            : t('btn.favorite')
                        }}</q-item-section>
                      </q-item>
                      <q-item
                        v-if="as.signed"
                        :class="[
                          $q.dark.isActive ? 'text-grey-9' : 'text-grey-4'
                        ]"
                        :dense="$q.screen.lt.sm"
                        clickable
                        @click="$emit('copy', data.itemId)"
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
                        @click="copy"
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
              v-show="!loading && qualifiable"
              class="stress"
              style="opacity: 0.6"
            >
              {{ findTier(data.tier)?.fullName }}
              {{ findQuality(data.quality)?.fullName }}
              {{
                findClass(data.itemTypeValue1)?.label ||
                findType(data.itemType)?.label
              }}
            </div>
            <div
              v-show="!loading && data.itemType === 'rune'"
              class="stress"
              style="opacity: 0.6"
            >
              {{ findQuality(data.quality)?.fullName }}
              {{
                store.findRuneType(store.findRune(data.itemTypeValue2)?.type)
                  ?.label
              }}
            </div>

            <div v-show="data.power > 0">
              {{
                t('item.power', {
                  p: data.power,
                  u: data.upgrade ? ` + ${data.upgrade * 5}` : ''
                })
              }}
            </div>
            <!-- <div v-show="data.upgrade > 0" class="stress">
            {{ t('item.upgrade', { u: data.upgrade, ul: upgradeLimit }) }}
          </div> -->
            <div v-show="loading">
              <q-skeleton
                width="130px"
                :height="$q.screen.lt.sm ? '16px' : '18px'"
              />
            </div>
          </div>
        </q-card-section>
        <D4Separator v-show="qualifiable || descriptable" type="left" />
        <!-- D4 season2
        <q-card-section
        v-if="store.storage.data.ladder && data.itemType === 'armor' && !history && Object.values(data.pacts).reduce((a: number, b: number) => a + b, 0) > 0">
        <div class="row justify-start items-center" :class="!$q.screen.lt.sm ? 'q-gutter-x-xl' : 'q-gutter-x-md'">
          <div v-show="data.pacts.ferocity" class="row items-center q-gutter-x-sm">
            <q-icon name="img:/images/season/002/ferocity.webp" :size="!$q.screen.lt.sm ? '48px' : '40px'">
              <D4Tooltip anchor="top middle" self="top middle" :offset="[14, 28]" padding="xs" transition-show="jump-up"
                transition-hide="jump-down">
                <div style="max-width:140px" class="text-caption break-keep">
                  {{ t('season.second.ferocity') }}
                </div>
              </D4Tooltip>
            </q-icon>
            <div>{{ data.pacts.ferocity }}</div>
          </div>
          <div v-show="data.pacts.divinity" class="row items-center  q-gutter-x-sm">
            <q-icon name="img:/images/season/002/divinity.webp" :size="!$q.screen.lt.sm ? '48px' : '36px'">
              <D4Tooltip anchor="top middle" self="top middle" :offset="[14, 28]" padding="xs" transition-show="jump-up"
                transition-hide="jump-down">
                <div style="max-width:140px" class="text-caption break-keep">
                  {{ t('season.second.divinity') }}
                </div>
              </D4Tooltip>
            </q-icon>
            <div>{{ data.pacts.divinity }}</div>
          </div>
          <div v-show="data.pacts.eternity" class="row items-center  q-gutter-x-sm">
            <q-icon name="img:/images/season/002/eternity.webp" :size="!$q.screen.lt.sm ? '48px' : '36px'">
              <D4Tooltip anchor="top middle" self="top middle" :offset="[14, 28]" padding="xs" transition-show="jump-up"
                transition-hide="jump-down">
                <div style="max-width:140px" class="text-caption break-keep">
                  {{ t('season.second.eternity') }}
                </div>
              </D4Tooltip>
            </q-icon>
            <div>{{ data.pacts.eternity }}</div>
          </div>
        </div>
      </q-card-section> -->
        <q-card-section
          v-show="
            loading ||
            (!loading &&
              (data.itemType === 'rune' ||
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
          :class="
            $q.screen.lt.sm ? '' : $q.screen.lt.md ? 'q-my-md' : 'q-my-lg'
          "
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
</template>
<style scoped>
.date {
  font-family: monospace;
  font-size: 11px;
  line-height: 12px;
}

.complete {
  color: var(--q-legendary);
}

.name-place {
  width: 60%;
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

.card-item.legendary:deep(.stress) {
  font-weight: 700;
}

.card-item.unique:deep(.stress) {
  font-weight: 700;
}

.body--dark .card-item.magic:deep(.stress),
.body--dark .card-item.consumables:deep(.stress) {
  color: #60c3f1;
}

.body--dark .card-item.rare:deep(.stress) {
  color: var(--q-rare);
}

.body--dark .card-item.legendary:deep(.stress) {
  color: var(--q-legendary);
}

.body--dark .card-item.unique:deep(.stress) {
  color: var(--q-unique);
}

.body--dark .card-item.mythic:deep(.stress) {
  color: var(--q-mythic);
}

.card-item.legendary:deep(.stress .icon) {
  filter: var(--q-filter-legendary) !important;
}

.card-item.unique:deep(.stress .icon) {
  filter: var(--q-filter-unique) !important;
}

.card-item.mythic:deep(.stress .icon) {
  filter: var(--q-filter-mythic) !important;
}

.body--dark .card-item.magic .unique {
  font-weight: 600;
  color: var(--q-magic);
}

.body--dark .card-item.rare .unique {
  font-weight: 600;
  color: var(--q-rare);
}

.body--dark .card-item.set .unique {
  font-weight: 600;
  color: var(--q-set);
}

.body--dark .card-item.legendary .unique {
  font-weight: 600;
  color: var(--q-legendary);
}

.body--dark .card-item.unique .unique {
  font-weight: 600;
  color: var(--q-unique);
}

.body--dark .card-item.magic .unique .icon {
  filter: var(--q-filter-magic) !important;
}

.body--dark .card-item.rare .unique .icon {
  filter: var(--q-filter-rare) !important;
}

.body--dark .card-item.set .unique .icon {
  filter: var(--q-filter-set) !important;
}

.body--dark .card-item.legendary .unique .icon {
  filter: var(--q-filter-legendary) !important;
}

.body--dark .card-item.unique .unique .icon {
  filter: var(--q-filter-unique) !important;
}

.no-expanded::after {
  content: '';
  position: absolute;
  top: 82%;
  bottom: -16%;
  left: 0;
  right: 0;
  border-radius: 2px;
  filter: blur(10px);
  transform: scale(200%, 200%);
  background-color: var(--q-light);
}

.body--dark .no-expanded::after {
  background-color: var(--q-dark-page);
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

.quality:deep(.q-btn) {
  font-size: inherit;
}

.quality:deep(.q-btn:before) {
  box-shadow: inset 0 0 0 4px rgba(0, 0, 0, 0.2);
}

.body--dark .quality:deep(.q-btn:before) {
  box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.2);
}

.quality:deep(.q-btn.active) {
  background-color: var(--q-dark-page);
  color: var(--q-light-page);
}

.body--dark .quality:deep(.q-btn.active) {
  background-color: var(--q-light-page);
  color: var(--q-dark-page);
}

.attribute {
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(250, 250, 250, 0.1);
  height: 100%;
}

.body--light .attribute {
  background-color: rgba(125, 125, 125, 0.1);
}

.tab {
  padding-bottom: 0 !important;
}

.tab:deep(.q-btn-group .toggle) {
  font-weight: 700;
  color: inherit !important;
  background-color: rgba(250, 250, 250, 0.1);
  border-radius: 4px 4px 0 0;
}

.body--light .tab:deep(.q-btn-group .toggle) {
  background-color: rgba(125, 125, 125, 0.1);
}

.attribute:deep(.q-panel) {
  overflow: hidden;
}

.toggles:deep(.q-toggle__thumb::before) {
  display: none !important;
}

.item-image-card {
  background-color: var(--q-dark-page);
}

.body--light .item-image-card {
  background-color: var(--q-light);
}

.bg-primary-cloud {
  background-color: var(--q-primary-cloud) !important;
}
</style>
