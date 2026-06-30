<script setup lang="ts">
import { ref, computed, reactive, nextTick, watch } from 'vue'
import { useQuasar, QSelect } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useItemStore } from 'stores/item-store'
import { Price } from 'src/types/item'
import { focus } from 'src/common'
import {
  clampGoldPrice,
  formatGold,
  formatGoldCompact,
  isValidGoldPrice,
  normalizeGoldInput
} from 'src/utils/price'

interface IProps {
  data: Price
  offer?: boolean
  editable?: boolean
  disable?: boolean
  progress?: boolean
  fixed?: boolean
  dark?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  offer: false,
  editable: false,
  disable: false,
  progress: false,
  fixed: false,
  dark: undefined
})

const emit = defineEmits(['update'])

// common variable
const $q = useQuasar()
const { t, locale } = useI18n({ useScope: 'global' })
const store = useItemStore()

// variable
const loading = computed(() => props.data.loading || props.progress)
const _price = reactive<Price>(
  new Price(props.data.currency, props.data.currencyValue, props.data.quantity)
)
const _priceError = ref<boolean>(false)
const findType = store.findType
const runes = store.filterRunesByType
const currencies = store.currencies()
const gems = store.gems
const summonings = store.summonings
const isSelectableSummoning = (summoning: (typeof summonings)[number]) =>
  summoning.tradeable !== false &&
  summoning.tradeable !== 0 &&
  summoning.visible !== false &&
  summoning.visible !== 0 &&
  summoning.deprecated !== true &&
  summoning.deprecated !== 1
const summoningOptions = computed(() => summonings.filter(isSelectableSummoning))
const goldLabel = computed(() =>
  formatGoldCompact(_price.currencyValue, locale.value)
)
const formatGoldPrice = (value: unknown) =>
  formatGoldCompact(value, locale.value)
const formatGoldFull = (value: unknown) => formatGold(value, locale.value)
const currencyOptionImg = (currency: string) =>
  currency === 'gem'
    ? `/images/items/inventory/gem/${gems?.[0]?.value ?? 'royal_diamond'}.webp`
    : `/images/items/currencies/${currency}.webp`
const currencyValueImg = computed(() =>
  _price.currency === 'rune'
    ? `/images/items/rune/${
        store.findRune(_price.currencyValue as string)?.type
      }/${_price.currencyValue}.webp`
    : _price.currency === 'gold'
      ? '/images/items/currencies/gold.webp'
      : _price.currency === 'summoning'
        ? `/images/items/consumables/summoning/${_price.currencyValue}.webp`
        : _price.currency === 'gem'
          ? `/images/items/inventory/gem/${_price.currencyValue}.webp`
          : ''
)
const currencyValueName = computed(() =>
  _price.currency === 'rune'
    ? `${store.findRune(_price.currencyValue as string)?.label} ${
        currencies.find((c) => c.value === _price.currency)?.label
      }`
    : _price.currency === 'gold'
      ? currencies.find((c) => c.value === _price.currency)?.label
      : _price.currency === 'summoning'
        ? store.summonings.find((s) => s.value === _price.currencyValue)?.label
        : _price.currency === 'gem'
          ? store.findGem(_price.currencyValue as string)?.label
          : ''
)
const runeLabel = computed(() => {
  const rune = store.findRune(_price.currencyValue as string)

  return rune
    ? `${rune.label} ${findType('rune')?.label}`
    : `${t('item.rune')} ${t('searchOrSelect')}`
})

if (!props.offer)
  currencies.unshift({ value: 'offer', label: t('price.getOffer') })

const syncGoldInput = (value: string | number | null): void => {
  _price.currencyValue = normalizeGoldInput(value)
  _priceError.value = !_price.currencyValue
    ? false
    : !isValidGoldInput(_price.currencyValue)
}

const commitGoldPrice = (): boolean => {
  const clamped = clampGoldPrice(_price.currencyValue)

  _price.currencyValue = clamped
  _priceError.value = !isValidGoldPrice(clamped)

  return !_priceError.value
}

const isValidGoldInput = (value: string | number | null): boolean => {
  return isValidGoldPrice(normalizeGoldInput(value))
}

const update = (): void => {
  nextTick(() => {
    if (_price.currency === 'rune') runeRef.value?.blur()

    emit('update', _price)
  })
}

const onGoldBlur = () => {
  if (_price.currency !== 'gold') return
  if (!commitGoldPrice()) return

  emit('update', _price)
}

const onGoldInput = (value: string | number | null): void => {
  syncGoldInput(value)
  if (!_price.currencyValue) return
  if (!commitGoldPrice()) return

  emit('update', _price)
}

const updateCurrency = (val: string | null): void => {
  _priceError.value = false
  _price.currencyValue =
    val === 'rune'
      ? store.runes?.[0].value
      : val === 'summoning'
        ? summoningOptions.value?.[0]?.value
        : val === 'gem'
          ? gems?.[0]?.value
          : null
  _price.quantity = 1

  if (val === 'gold') {
    emit('update', _price)
    return
  }

  update()
}

// about filter rune
const runeRef = ref<QSelect>()
const needle = ref<string>()

const filterRunes = (e: KeyboardEvent) => {
  const val = (e.target as HTMLInputElement).value.toLowerCase()
  runeRef.value?.showPopup()
  runeRef.value?.updateInputValue(val)
  needle.value = val
}

watch(
  () => props.data,
  (val) => {
    const price = new Price(val.currency, val.currencyValue, val.quantity)
    Object.assign(_price, price)
  },
  {
    deep: true
  }
)
</script>

<template>
  <div v-if="editable">
    <div class="row justify-end items-center q-gutter-sm no-wrap">
      <div style="min-width: 30px">
        {{ t('price.title') }}
      </div>
      <div class="col-xs-3">
        <q-select
          data-cy="price-currency-select"
          v-model="_price.currency"
          :disable="disable || fixed"
          outlined
          dense
          no-error-icon
          hide-bottom-space
          emit-value
          map-options
          transition-show="none"
          transition-hide="none"
          :transition-duration="0"
          :label="t('price.currency')"
          dropdown-icon="img:/images/icons/dropdown.svg"
          :options="currencies"
          popup-content-class="scroll bordered limit-select"
          @update:model-value="updateCurrency"
        >
          <template #selected-item="scope">
            <div class="ellipsis">{{ scope.opt.label }}</div>
          </template>
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <img
                  :src="currencyOptionImg(scope.opt.value)"
                  width="24"
                  height="24"
                  alt="Tradurs Gold Icon"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div v-show="_price.currency === 'rune'" style="max-width: 120px">
        <q-select
          ref="runeRef"
          class="price-rune-select"
          v-model="_price.currencyValue"
          :disable="disable || fixed"
          outlined
          dense
          no-error-icon
          use-input
          hide-bottom-space
          emit-value
          map-options
          popup-content-class="scroll bordered"
          transition-show="none"
          transition-hide="none"
          :transition-duration="0"
          :label="runeLabel"
          display-value=""
          hide-selected
          :options="runes(undefined, needle)"
          dropdown-icon="img:/images/icons/dropdown.svg"
          @update:model-value="update"
          @input.stop="filterRunes"
          @blur="() => (needle = undefined)"
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <img
                  :src="`/images/items/rune/${scope.opt.type}/${scope.opt.value}.webp`"
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
      <div
        v-if="_price.currency === 'gold'"
        data-cy="price-gold-input"
        class="col-xs-5 col-sm-3"
      >
        <q-input
          :disable="disable"
          dense
          no-error-icon
          hide-bottom-space
          outlined
          v-model="_price.currencyValue"
          maxlength="12"
          inputmode="numeric"
          pattern="[0-9]*"
          debounce="500"
          :error="_priceError"
          @update:model-value="onGoldInput"
          @focus="focus"
          @blur="onGoldBlur"
          input-class="text-right price-gold-input"
          :label="goldLabel"
          :rules="[(val: string | number | null) => isValidGoldInput(val) || '']"
        >
          <q-tooltip
            v-model="_priceError"
            :target="_priceError"
            no-parent-event
            transition-show="none"
            transition-hide="none"
            anchor="top end"
            self="bottom end"
            class="bg-negative"
          >
            <div class="tooltip text-caption">
              {{ t('price.restrictGold') }}
            </div>
          </q-tooltip>
        </q-input>
      </div>
      <div v-else-if="_price.currency === 'summoning'" class="col-xs-3">
        <q-select
          v-model="_price.currencyValue"
          :disable="disable || fixed"
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
          :options="summoningOptions"
          popup-content-class="scroll bordered limit-select"
          options-dense
          @update:model-value="update"
        >
          <template #selected-item="scope">
            <div class="ellipsis">{{ scope.opt.label }}</div>
          </template>
          <template #option="scope">
            <q-item clickable v-bind="scope.itemProps">
              <q-item-section avatar>
                <img
                  height="36"
                  :src="`/images/items/consumables/summoning/${scope.opt.value}.webp`"
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
      <div v-else-if="_price.currency === 'gem'" class="col-xs-3">
        <q-select
          v-model="_price.currencyValue"
          :disable="disable || fixed"
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
          @update:model-value="update"
        >
          <template #selected-item="scope">
            <div class="ellipsis">{{ scope.opt.label }}</div>
          </template>
          <template #option="scope">
            <q-item clickable v-bind="scope.itemProps">
              <q-item-section avatar>
                <img
                  height="36"
                  :src="`/images/items/inventory/gem/${scope.opt.value}.webp`"
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
      <D4Counter
        v-if="!['offer', 'gold'].includes(_price.currency)"
        v-model="_price.quantity"
        :disable="disable"
        @update:model-value="update"
        :no-button="$q.screen.lt.sm"
      />
    </div>
  </div>
  <div v-else class="row cursor-default">
    <q-item v-show="loading" style="padding: 0; min-height: 10px">
      <q-item-section side class="q-pr-sm">
        <q-skeleton type="circle" size="24px" />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          <q-skeleton width="60px" height="24px" />
        </q-item-label>
      </q-item-section>
    </q-item>
    <div v-show="!loading" class="price">
      <div v-if="data.currency === 'offer'">
        <div>{{ t('offer.title') }}</div>
      </div>
      <div v-else class="row items-center q-gutter-xs relative-position">
        <template v-if="['gold'].includes(data.currency)">
          <img
            :src="currencyValueImg"
            width="24"
            height="24"
            alt="Tradurs Price Icon"
          />
          <span class="price-gold-text">
            {{ formatGoldPrice(data.currencyValue) }}
          </span>
        </template>
        <template v-else>
          <img
            :src="currencyValueImg"
            width="24"
            height="24"
            alt="Tradurs Currency Image"
          />
          <div>x</div>
          <div>{{ data.quantity }}</div>
        </template>
        <D4Tooltip padding="sm" :dark="dark">
          <div class="break-keep text-caption" style="max-width: 160px">
            <div class="column no-wrap items-center">
              <div>
                {{ currencyValueName }}
              </div>
              <div v-if="data.currency === 'gold'" class="price-gold-tooltip">
                {{ formatGoldFull(data.currencyValue) }}
              </div>
              <div v-else>x {{ data.quantity }}</div>
            </div>
          </div>
        </D4Tooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tooltip {
  max-width: 200px;
}

.tooltip::after {
  content: '';
  position: fixed;
  width: 16px;
  height: 16px;
  transform: translate(-20px, 14px) rotate(45deg);
  z-index: -1;
  background-color: var(--q-negative);
}

.price-rune-select :deep(.q-field__control),
.price-rune-select :deep(.q-field__marginal) {
  height: 40px;
  min-height: 40px;
}

.price-rune-select :deep(.q-field__native) {
  min-height: 40px;
  padding-top: 0;
  padding-bottom: 0;
}

.price {
  min-width: 0;
}

.price-gold-input {
  font-variant-numeric: tabular-nums;
}

.price-gold-text,
.price-gold-tooltip {
  font-variant-numeric: tabular-nums;
  max-width: min(180px, 42vw);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
