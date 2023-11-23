<script setup lang="ts">
import { ref, computed, reactive, nextTick } from 'vue'
import { useItemStore } from 'stores/item-store'
import { useI18n } from 'vue-i18n'

import { Price } from 'src/types/item'
import { focus } from 'src/common'

interface IProps {
  data: Price,
  offer?: boolean,
  editable?: boolean,
  disable?: boolean,
  progress?: boolean,
  fixed?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  offer: false,
  editable: false,
  disable: false,
  progress: false,
  fixed: false
})

const emit = defineEmits(['update'])

// common variable
const store = useItemStore()
const { t, n } = useI18n({ useScope: 'global' })

// variable
const loading = computed(() => props.data.loading || props.progress)
const _price = reactive<Price>(new Price(props.data.currency, props.data.currencyValue, props.data.quantity))
const _priceError = ref<boolean>(false)
const runes = store.filterRunesByType
const currencies = store.currencies()
const summonings = store.summonings
const currencyValueImg = computed(() => props.data.currency === 'gold' ? '/images/items/currencies/gold.webp' : props.data.currency === 'summoning' ? `/images/items/consumables/summoning/${props.data.currencyValue}.webp` : '')
const currencyValueName = computed(() => props.data.currency === 'gold' ? currencies.find(c => c.value === props.data.currency)?.label : props.data.currency === 'summoning' ? store.summonings.find(s => s.value === props.data.currencyValue)?.label : '')

if (!props.offer)
  currencies.unshift({ value: 'offer', label: t('price.getOffer') })

const update = (): void => {
  nextTick(() => {
    if (_price.currency === 'gold') {
      _priceError.value = false

      if (Number(_price.currencyValue as number) >= 100000)
        _price.currencyValue = Math.floor(Number(_price.currencyValue as number) / 100000) * 100000
      else
        _priceError.value = true
    }

    emit('update', _price)
  })
}

const updateCurrency = (val: string | null): void => {
  _priceError.value = false
  _price.currencyValue = val === 'rune' ? 'eld' : val === 'summoning' ? summonings?.[0]?.value : null
  _price.quantity = 1
  update()
}
</script>

<template>
  <div v-if="editable">
    <div class="row justify-end items-center q-gutter-sm">
      <div style="min-width:30px">
        {{ t('price.title') }}
      </div>
      <div class="col-xs-3">
        <q-select v-model="_price.currency" :disable="disable || fixed" outlined dense no-error-icon hide-bottom-space
          emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
          :label="t('price.currency')" dropdown-icon="img:/images/icons/dropdown.svg" :options="currencies"
          popup-content-class="scroll bordered limit-select" @update:model-value="updateCurrency">
          <template #selected-item="scope">
            <div class="ellipsis">{{ scope.opt.label }}</div>
          </template>
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <img :src="`/images/items/currencies/${scope.opt.value}.webp`" width="24" height="24"
                  alt="Tradurs Gold Icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div v-show="data.currency === 'rune'">
        <q-select v-model="_price.currencyValue" :disable="disable" outlined dense no-error-icon hide-bottom-space
          emit-value map-options popup-content-class="scroll bordered" transition-show="none" transition-hide="none"
          :transition-duration="0" :options="runes()" dropdown-icon="img:/images/icons/dropdown.svg"
          @update:model-value="update">
          <template #selected-item="scope">
            <div class="ellipsis">{{ scope.opt.label }}</div>
          </template>
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <img :src="scope.opt.img" width="24" height="24" alt="Tradurs Rune Image" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div v-if="data.currency === 'gold'" class="col-xs-5 col-sm-3">
        <q-input :disable="disable" dense no-error-icon hide-bottom-space outlined v-model.number="_price.currencyValue"
          maxlength="11" reverse-fill-mask unmasked-value debounce="500" :error="_priceError" @update:model-value="update"
          @focus="focus" @blur="_priceError = false" input-class="text-right"
          :label="$n(Number.parseFloat(_price.currencyValue && Number.isInteger(parseInt(_price.currencyValue as string)) ? _price.currencyValue.toString() : '0'), 'decimal', { notation: 'compact' })"
          :rules="[val => Number.isInteger(parseInt(val)) && parseInt(val) > 0 && parseInt(val) % 100000 === 0 || '']">
          <q-tooltip v-model="_priceError" :target="_priceError" no-parent-event transition-show="none"
            transition-hide="none" anchor="top end" self="bottom end" class="bg-negative">
            <div class="tooltip text-caption">{{ t('price.restrictGold') }}</div>
          </q-tooltip>
        </q-input>
      </div>
      <div v-else-if="data.currency === 'summoning'" class="col-xs-3">
        <q-select v-model="_price.currencyValue" :disable="disable || fixed" outlined dense no-error-icon
          hide-bottom-space emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
          :label="t('item.selectSummoning')" dropdown-icon="img:/images/icons/dropdown.svg" :options="summonings"
          popup-content-class="scroll bordered limit-select" options-dense @update:model-value="update">
          <template #selected-item="scope">
            <div class="ellipsis">{{ scope.opt.label }}</div>
          </template>
          <template #option="scope">
            <q-item clickable v-bind="scope.itemProps">
              <q-item-section avatar>
                <img height="36" :src="`/images/items/consumables/summoning/${scope.opt.value}.webp`"
                  alt="Tradurs Summoning Images" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <D4Counter v-if="!['offer', 'gold'].includes(data.currency)" v-model="_price.quantity" :disable="disable"
        @update:model-value="update" />
    </div>
  </div>
  <div v-else class="row cursor-default">
    <q-item v-show="loading" style="padding:0;min-height:10px">
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
        <!-- <template v-if="data.currency === 'rune'">
          <img :src="(runes().find(r => r.value === data.currencyValue) || {}).img" width="24" height="24"
            alt="Tradurs Rune Image" />
          <div class="q-ml-xs">{{ (runes().find(r => r.value === data.currencyValue) || {}).label }}</div>
        </template> -->
        <template v-if="data.currency === 'gold'">
          <img :src="currencyValueImg" width="24" height="24" alt="Tradurs Price Icon" />
          <div>
            {{ n(Number.parseFloat(data.currencyValue ? data.currencyValue.toString() : '0'), 'decimal') }}
          </div>
        </template>
        <template v-else>
          <img :src="currencyValueImg" width="24" height="24" alt="Tradurs Currency Image" />
          <div>x</div>
          <div>{{ data.quantity }}</div>
        </template>
        <D4Tooltip padding="sm">
          <div class="break-keep text-caption" style="max-width:160px;">
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