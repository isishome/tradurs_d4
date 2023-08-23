<script setup lang="ts">
import { ref, computed, reactive, nextTick } from 'vue'
import { useItemStore } from 'stores/item-store'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'

import { Price } from 'src/types/item'
import { itemImgs } from 'src/common/items'
import { focus } from 'src/common'

interface IProps {
  data: Price,
  offer?: boolean,
  editable?: boolean,
  disable?: boolean,
  progress?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  offer: false,
  editable: false,
  disable: false,
  progress: false
})

const emit = defineEmits(['update'])

// common variable
const store = useItemStore()
const { t, n } = useI18n({ useScope: 'global' })
const $q = useQuasar()

// variable
const loading = computed(() => props.data.loading || props.progress)
const _price = reactive<Price>(new Price(props.data.currency, props.data.currencyValue, props.data.quantity))
const _priceError = ref<boolean>(false)
const findType = store.findType
const runes = store.filterRunesByType
const currencies = store.currencies()

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
  _price.currencyValue = val === 'rune' ? 'eld' : val === 'gold' ? 100000 : null
  _price.quantity = 1
  update()
}
</script>

<template>
  <div v-if="editable">
    <div class="row justify-end items-center no-wrap q-gutter-sm">
      <div v-show="!$q.screen.lt.sm" class="row items-center">
        <img src="/images/items/inventory/gold.webp" width="24" height="24" alt="icon_price" />
      </div>
      <div>
        <q-select v-model="_price.currency" :disable="disable" outlined dense no-error-icon hide-bottom-space emit-value
          map-options transition-show="none" transition-hide="none" :transition-duration="0" :label="t('price.currency')"
          dropdown-icon="img:/images/icons/dropdown.svg" :options="currencies" popup-content-class="scroll"
          @update:model-value="updateCurrency">
          <template #selected-item="scope">
            <div class="ellipsis">{{ scope.opt.label }}</div>
          </template>
        </q-select>
      </div>
      <div v-if="data.currency === 'rune'" class="col">
        <q-select v-model="_price.currencyValue" :disable="disable" outlined dense no-error-icon hide-bottom-space
          emit-value map-options popup-content-class="scroll" transition-show="none" transition-hide="none"
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
      <div v-else-if="data.currency === 'gold'">
        <q-input :disable="disable" dense no-error-icon hide-bottom-space outlined v-model.number="_price.currencyValue"
          maxlength="11" reverse-fill-mask unmasked-value debounce="500" :error="_priceError" @update:model-value="update"
          @focus="focus" input-class="text-right"
          :label="n(Number.parseFloat(_price.currencyValue ? _price.currencyValue.toString() : '0'), 'decimal', { notation: 'compact' })"
          :rules="[val => Number.isInteger(parseInt(val)) && parseInt(val) % 100000 === 0 || '']">
          <q-tooltip v-model="_priceError" :target="_priceError" no-parent-event transition-show="none"
            transition-hide="none" anchor="top end" self="bottom end" class="bg-negative">
            <div class="tooltip text-caption">{{ t('price.restrictGold') }}</div>
          </q-tooltip>
        </q-input>
      </div>
      <D4Counter v-if="!['offer', 'gold'].includes(data.currency)" v-model="_price.quantity" :disable="disable"
        @update:model-value="update" />
    </div>
  </div>
  <div v-else>
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
      <div v-else class="row items-center q-gutter-xs">
        <template v-if="data.currency === 'rune'">
          <img :src="(runes().find(r => r.value === data.currencyValue) || {}).img" width="24" height="24"
            alt="Tradurs Rune Image" />
          <div class="q-ml-xs">{{ (runes().find(r => r.value === data.currencyValue) || {}).label }}</div>
        </template>
        <template v-else-if="data.currency === 'gold'">
          <img src="/images/items/inventory/gold.webp" width="24" height="24" alt="icon_price" />
          <div class="q-ml-xs">
            {{ n(Number.parseFloat(data.currencyValue ? data.currencyValue.toString() : '0'), 'decimal') }}
          </div>
        </template>
        <template v-else>
          <img :src="itemImgs[data.currency as keyof typeof itemImgs]" width="24" height="24"
            alt="Tradurs Currency Image" />
          <div>{{ findType(data.currency)?.label }}</div>
        </template>
        <template v-if="data.currency !== 'gold'">
          <div>x</div>
          <div>{{ data.quantity }}</div>
        </template>
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