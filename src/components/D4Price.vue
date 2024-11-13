<script setup lang="ts">
import { ref, computed, reactive, nextTick, watch } from 'vue'
import { useQuasar, QSelect } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useItemStore } from 'stores/item-store'
import { Price } from 'src/types/item'
import { focus } from 'src/common'

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
const { t } = useI18n({ useScope: 'global' })
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
const summonings = store.summonings
const currencyValueImg = computed(() =>
  _price.currency === 'rune'
    ? `/images/items/rune/${
        store.findRune(_price.currencyValue as string)?.type
      }/${_price.currencyValue}.webp`
    : _price.currency === 'gold'
    ? '/images/items/currencies/gold.webp'
    : _price.currency === 'summoning'
    ? `/images/items/consumables/summoning/${_price.currencyValue}.webp`
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
    : ''
)

if (!props.offer)
  currencies.unshift({ value: 'offer', label: t('price.getOffer') })

const update = (): void => {
  nextTick(() => {
    if (_price.currency === 'gold') {
      _priceError.value = false

      if (Number(_price.currencyValue as number) >= 100000)
        _price.currencyValue =
          Math.floor(Number(_price.currencyValue as number) / 100000) * 100000
      else _priceError.value = true
    } else runeRef.value?.blur()

    emit('update', _price)
  })
}

const updateCurrency = (val: string | null): void => {
  _priceError.value = false
  _price.currencyValue =
    val === 'rune'
      ? store.runes?.[0].value
      : val === 'summoning'
      ? summonings?.[0]?.value
      : null
  _price.quantity = 1
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
                  :src="`/images/items/currencies/${scope.opt.value}.webp`"
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
          :options="runes(undefined, needle)"
          dropdown-icon="img:/images/icons/dropdown.svg"
          @update:model-value="update"
          @input.stop="filterRunes"
          @blur="() => (needle = undefined)"
        >
          <template #selected-item="scope">
            <div class="ellipsis">
              {{ scope.opt.label }} {{ findType('rune')?.label }}
            </div>
          </template>
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
      <div v-if="_price.currency === 'gold'" class="col-xs-5 col-sm-3">
        <q-input
          :disable="disable"
          dense
          no-error-icon
          hide-bottom-space
          outlined
          v-model.number="_price.currencyValue"
          maxlength="11"
          reverse-fill-mask
          unmasked-value
          debounce="500"
          :error="_priceError"
          @update:model-value="update"
          @focus="focus"
          @blur="_priceError = false"
          input-class="text-right"
          :label="$n(Number.parseFloat(_price.currencyValue && Number.isInteger(parseInt(_price.currencyValue as string)) ? _price.currencyValue.toString() : '0'), 'decimal', { notation: 'compact' })"
          :rules="[
            (val) =>
              (Number.isInteger(parseInt(val)) &&
                parseInt(val) > 0 &&
                parseInt(val) % 100000 === 0) ||
              ''
          ]"
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
          :options="summonings"
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
        <!-- <template v-if="_price.currency === 'rune'">
          <img :src="(runes().find(r => r.value === _price.currencyValue) || {}).img" width="24" height="24"
            alt="Tradurs Rune Image" />
          <div class="q-ml-xs">{{ (runes().find(r => r.value === _price.currencyValue) || {}).label }}</div>
        </template> -->
        <template v-if="['gold'].includes(data.currency)">
          <img
            :src="currencyValueImg"
            width="24"
            height="24"
            alt="Tradurs Price Icon"
          />
          {{
            $n(
              Number.parseFloat(
                data.currencyValue ? data.currencyValue.toString() : '0'
              ),
              'decimal'
            )
          }}
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
            {{ currencyValueName }}
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
</style>
