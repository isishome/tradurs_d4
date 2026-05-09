<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script setup lang="ts">
import { reactive, ref, computed, useSlots, nextTick, ComputedRef } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useItemStore } from 'stores/item-store'

import type { Gem, Elixir, Affix } from 'stores/item-store'
import type { QCard, QSelect } from 'quasar'
import { Item, Price } from 'src/types/item'
import { checkName } from 'src/common'
import { itemImgs } from 'src/common/items'

import D4Price from 'components/D4Price.vue'
import D4Separator from 'components/D4Separator.vue'
import D4ItemDisplay from './D4ItemDisplay.vue'

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

const emit = defineEmits([
  'update',
  'apply',
  'copy',
  'favorite',
  'update-only',
  'update:property',
  'update:affix',
  'update:restriction'
])

// common variable
const $q = useQuasar()
const slots: any = useSlots()

const {
  filterClasses,
  filterRunesByType,
  filterAspectByCategory,
  filterTypes,
  filterQuality,
  findType,
  findEquipClass,
  filterFixedItems,
  findSummoning,
  runeTypes,
  aspectCategories,
  gems,
  elixirs,
  summonings,
  tiers,
  storage
} = useItemStore()
const { t } = useI18n({ useScope: 'global' })

// variable
const editWrap = ref<QCard | null>(null)
const _fixedItemId = ref<number>(props.data.fixedItemId)
const _name = ref<string>(props.data.name)
const _quantity = ref<number>(props.data.quantity || 1)
const _tier = ref<string | null>(props.data.tier)
const _quality = ref<string>(props.data.quality || 'rare')
const _type = ref<string>(
  props.data.itemType || (filterTypes()[0].value as string)
)
const _typeValue1 = ref<string>(
  props.data.itemTypeValue1 ||
    (_type.value === 'aspect'
      ? (aspectCategories[0].value as string)
      : (filterClasses(_type.value)[0].value as string))
)

const _typeValue2 = ref<string>(
  props.data.itemTypeValue2 ||
    (_typeValue1.value === 'gem'
      ? (gems[0].value as string)
      : _typeValue1.value === 'elixir'
        ? (elixirs[0].value as string)
        : _typeValue1.value === 'summoning'
          ? (summonings[0].value as string)
          : '')
)
const _power = ref<number>(props.data.power)
const _upgrade = ref<number>(props.data.upgrade)
const _level = ref<number | null>(
  props.data.level === 0 ? null : props.data.level
)
const _favorite = ref<boolean>(props.data.favorite)
const typeValue2Ref = ref<QSelect | null>(null)
const typeValue2Needle = ref<string>()
const hasProperties = computed(
  () => findEquipClass(_typeValue1.value)?.properties.length !== 0
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
const propertyRef = ref<HTMLDivElement | null>(null)
const affixRef = ref<HTMLDivElement | null>(null)
const restrictionRef = ref<HTMLDivElement | null>(null)
const showItemImages = ref<boolean>(false)
const attribute = ref<string>('affixes')
const attrMobile = reactive<{ is: ComputedRef<boolean>; show: boolean }>({
  is: computed(() => $q.screen.lt.md),
  show: false
})
const fixed = computed(
  () =>
    ['unique', 'mythic', 'set'].includes(_quality.value) &&
    fixedItems.value.length > 1
)
const tierable = computed(
  () =>
    !(
      ['inventory'].includes(_type.value) && ['gem'].includes(_typeValue1.value)
    ) && !['rune', 'consumables'].includes(_type.value)
)
const qualifiable = computed(
  () =>
    !(
      ['inventory'].includes(_type.value) && ['gem'].includes(_typeValue1.value)
    ) && !['rune', 'aspect', 'consumables'].includes(_type.value)
)
const noLevel = computed(() => ['summoning'].includes(_typeValue1.value))
const powerful = computed(
  () => !['rune', 'inventory', 'consumables'].includes(_type.value)
)
const attributes = computed(() =>
  [
    { label: t('properties'), value: 'properties', hide: !hasProperties.value },
    { label: t('affixes'), value: 'affixes' },
    { label: t('restrictions'), value: 'restrictions' }
  ].filter((a) => !a.hide)
)
const fixedItems = computed(() => [
  { value: 0, label: t('item.manualInput') },
  ...filterFixedItems(_quality.value, _typeValue1.value)
])

const updateTier = (val: string) => {
  _tier.value = _tier.value === val ? null : val
  _level.value = null
  update()
}

const updateQuality = (val: string) => {
  _quality.value = val
  _power.value = 0
  _upgrade.value = 0
  _fixedItemId.value = 0
  update()
}

const updateType = (val: string) => {
  if (!tierable.value) {
    _tier.value = ''
    _name.value = ''
  }

  _quality.value =
    val === 'aspect'
      ? 'legendary'
      : !qualifiable.value
        ? 'normal'
        : _quality.value

  _typeValue1.value =
    val === 'rune'
      ? (runeTypes?.[0].value as string)
      : val === 'aspect'
        ? (aspectCategories[0].value as string)
        : (filterClasses(val)[0].value as string)

  attribute.value = val === 'aspect' ? 'affixes' : attribute.value

  updateTypeValue1(_typeValue1.value)
}

const updateTypeValue1 = (val: string) => {
  _image.value =
    Math.floor(
      Math.random() * itemImgs[_type.value]?.[_typeValue1.value as string]
    ) || 0
  attribute.value = 'affixes'
  _typeValue2.value =
    _type.value === 'rune'
      ? (filterRunesByType(val)?.[0]?.value as string)
      : _type.value === 'aspect'
        ? `${filterAspectByCategory(val)?.[0]?.value}`
        : val === 'gem'
          ? (gems[0].value as string)
          : val === 'elixir'
            ? (elixirs[0].value as string)
            : val === 'summoning'
              ? (summonings[0].value as string)
              : ''
  _quality.value = ['gem'].includes(_typeValue1.value)
    ? 'normal'
    : _quality.value
  updateTypeValue2(_typeValue2.value)
}

const updateTypeValue2 = (val: string) => {
  _fixedItemId.value = 0
  const selectedRune =
    _type.value === 'rune'
      ? filterRunesByType(_typeValue1.value)?.find((r) => r.value === val)
      : undefined

  const selectedSummoning = findSummoning(val)

  _quality.value =
    selectedRune?.quality ?? selectedSummoning?.quality ?? 'normal'

  _level.value =
    _typeValue1.value === 'gem'
      ? gems.find((g: Gem) => g.value === val)?.level || null
      : _typeValue1.value === 'elixir'
        ? elixirs.find((e: Elixir) => e.value === val)?.level || null
        : (selectedRune?.level ?? null)

  update()
}

const updateFixedItem = () => {
  _name.value = ''
  _quantity.value = 1

  update()

  const findFixedItem = fixedItems.value.find(
    (fi) => fi.value === _fixedItemId.value
  )

  if (findFixedItem) {
    const properties = props.data.properties.map((p) => p.propertyId as number)
    const affixes = props.data.affixes.map((a) => a.affixId as number)
    const restrictions = props.data.restrictions.map(
      (r) => r.restrictId as number
    )
    ;(findFixedItem.properties ?? [])
      .filter((fip) => !properties.includes(fip))
      .forEach((fip) => {
        emit('update:property', fip)
      })
    ;(findFixedItem.affixes ?? [])
      .filter((fia) => !affixes.includes(fia))
      .forEach((fia) => {
        emit('update:affix', fia)
      })
    ;(findFixedItem.restrictions ?? [])
      .filter((fir) => !restrictions.includes(fir))
      .forEach((fir) => {
        emit('update:restriction', fir)
      })
  }
}

const update = () => {
  emit('update', {
    fixedItemId: _fixedItemId.value,
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

const filterTypeValue = (e: KeyboardEvent) => {
  const val = (e.target as HTMLInputElement).value.toLowerCase()
  typeValue2Ref.value?.showPopup()
  typeValue2Ref.value?.updateInputValue(val)
  typeValue2Needle.value = val
}

const updatePrice = (price: Price) => {
  _price.currency = price.currency
  _price.currencyValue = price.currencyValue
  _price.quantity = price.quantity
  update()
}

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
                  v-for="t in tiers"
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
                  :data-cy="`item-quality-${q.value}`"
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
              data-cy="item-type-select"
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
              <template #selected-item="scope">
                <div class="ellipsis">{{ scope.opt.label }}</div>
              </template>
            </q-select>
          </div>
          <!-- Item Type Value Place ----------------------------------------------------------------------------------->
          <template v-if="_type === 'rune'">
            <div class="col">
              <q-select
                data-cy="item-subtype-select"
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
                ref="typeValue2Ref"
                v-model="_typeValue2"
                :disable="disable"
                outlined
                dense
                no-error-icon
                use-input
                hide-bottom-space
                emit-value
                map-options
                transition-show="none"
                transition-hide="none"
                :transition-duration="0"
                :label="`${t('item.rune')} ${t('searchOrSelect')}`"
                :options="filterRunesByType(_typeValue1, typeValue2Needle)"
                dropdown-icon="img:/images/icons/dropdown.svg"
                popup-content-class="scroll bordered limit-select"
                @update:model-value="updateTypeValue2"
                @input.stop="filterTypeValue"
                @blur="() => (typeValue2Needle = undefined)"
              >
                <template #selected-item="scope">
                  <div class="ellipsis">
                    {{ scope.opt.label }}
                    {{ findType('rune')?.label }}
                  </div>
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
                      <q-item-label
                        >{{ scope.opt.label }}
                        {{ findType('rune')?.label }}</q-item-label
                      >
                    </q-item-section>
                  </q-item>
                </template>
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      {{ t('noMessage', { attr: findType('rune')?.label }) }}
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </template>
          <template class="col" v-else-if="_type === 'aspect'">
            <div class="col">
              <q-select
                data-cy="item-subtype-select"
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
                :options="aspectCategories"
                popup-content-class="scroll bordered limit-select"
                @update:model-value="updateTypeValue1"
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
            <div class="col">
              <q-select
                ref="typeValue2Ref"
                v-model="_typeValue2"
                :disable="disable"
                outlined
                dense
                no-error-icon
                use-input
                hide-bottom-space
                emit-value
                map-options
                transition-show="none"
                transition-hide="none"
                :transition-duration="0"
                :label="`${t('item.aspect')} ${t('searchOrSelect')}`"
                :options="
                  filterAspectByCategory(_typeValue1, typeValue2Needle).map(
                    (a: Affix) => ({ ...a, value: a.value.toString() })
                  )
                "
                dropdown-icon="img:/images/icons/dropdown.svg"
                popup-content-class="scroll bordered limit-select"
                @update:model-value="updateTypeValue2"
                @input.stop="filterTypeValue"
                @blur="() => (typeValue2Needle = undefined)"
              >
                <template #selected-item="scope">
                  <div class="ellipsis">
                    {{ scope.opt.aspectName }}
                  </div>
                </template>
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <img
                        :src="`/images/items/aspect/legendary/${scope.opt.value}.webp`"
                        width="24"
                        height="24"
                        alt="Tradurs Aspect Image"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.aspectName }} </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      {{ t('noMessage', { attr: t('item.aspect') }) }}
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </template>
          <template v-else>
            <div class="col">
              <q-select
                data-cy="item-subtype-select"
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
                :options="gems"
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
                :options="elixirs"
                popup-content-class="scroll bordered limit-select"
                options-dense
                @update:model-value="updateTypeValue2"
              >
                <template #selected-item="scope">
                  <div class="ellipsis">{{ scope.opt.label }}</div>
                </template>
                <template #option="scope">
                  <q-item
                    :disable="scope.opt.onlyHardcore && !storage.data.hardcore"
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
                :options="summonings"
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
            <template v-else>
              <div v-show="fixed">
                <q-select
                  v-model="_fixedItemId"
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
                      type: findEquipClass(_typeValue1)?.label
                    })
                  "
                  dropdown-icon="img:/images/icons/dropdown.svg"
                  :options="fixedItems"
                  popup-content-class="scroll bordered limit-select"
                  options-dense
                  @update:model-value="updateFixedItem"
                >
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                  <template #option="scope">
                    <q-item clickable v-bind="scope.itemProps">
                      <q-item-section v-if="scope.opt.quality" avatar>
                        <img
                          height="36"
                          :src="`/images/items/fixed/${scope.opt.quality}-${scope.opt.sort}.webp`"
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
              <div v-show="!_fixedItemId || _fixedItemId === 0">
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
                                findEquipClass(data.itemTypeValue1)?.label ||
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
                      <q-card-section
                        class="scroll q-ma-lg"
                        style="height: 50vh"
                      >
                        <div class="row q-col-gutter-md">
                          <div
                            v-for="(i, idx) in itemImgs[_type][
                              _typeValue1 as string
                            ]"
                            :key="idx"
                            class="col-4 col-md-3 cursor-pointer"
                            @click="
                              () => {
                                _image = idx as number
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
      <q-card-section v-if="qualifiable && _fixedItemId === 0">
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
          :rules="[(val: string) => checkName(val) || '']"
        />
      </q-card-section>
      <q-card-section
        class="q-col-gutter-x-sm"
        :class="
          qualifiable || data.itemType === 'aspect'
            ? 'row justify-between items-center'
            : 'col'
        "
      >
        <div
          v-show="powerful"
          data-cy="item-power-input"
          class="row items-center q-gutter-x-sm"
        >
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
        </div>
        <D4Counter
          data-cy="item-level-input"
          v-show="!noLevel"
          v-model="_level"
          class="col row justify-end"
          :label="t('item.level')"
          max-width="110px"
          :max="999"
          no-button
          :disable="
            disable || !(qualifiable || data.itemType === 'aspect') || noLevel
          "
          @update:model-value="update"
        />
      </q-card-section>
      <template v-if="qualifiable || data.itemType === 'aspect'">
        <template v-if="slots['base-end']">
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
            :disable="data.itemType === 'aspect'"
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
                <div v-if="slots['add-affix'] && data.itemType !== 'aspect'">
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
              :disable="data.itemType === 'aspect'"
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
                  <div v-if="slots['add-affix'] && data.itemType !== 'aspect'">
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
  <D4ItemDisplay
    v-else
    :data="data"
    :loading="loading"
    :disable="disable"
    :history="history"
    @favorite="() => emit('favorite', data.itemId, !data.favorite)"
    @copy="() => emit('copy', data.itemId)"
    @update-only="(val: string) => emit('update-only', val)"
  >
    <template v-for="(_, slotName) in slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps || {}"></slot>
    </template>
  </D4ItemDisplay>
</template>
<style lang="scss" scoped>
@use '/src/css/card-item' as *;

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
