<script setup lang="ts">
import { reactive } from 'vue'
import { useItemStore } from 'stores/item-store'
import { useI18n } from 'vue-i18n'

import { Price } from 'src/types/item'
import { icons } from 'src/common/icons'
import { itemImgs } from 'src/common/items'

import D4Counter from 'components/D4Counter.vue'

interface IProps {
  data: Price,
  offer?: boolean,
  editable?: boolean,
  disable?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  offer: false,
  editable: false,
  disable: false
})

const emit = defineEmits(['update'])

// common variable
const store = useItemStore()
const { t } = useI18n({ useScope: 'global' })

// variable
const _price = reactive<Price>(new Price(props.data.currency, props.data.currencyValue, props.data.quantity))
const findType = store.findType
const runes = store.filterRunes
const currencies = store.currencies()

if (!props.offer)
  currencies.unshift({ value: 'offer', label: t('price.getOffer') })

const update = (): void => {
  emit('update', _price)
}

const updateCurrency = (val: string | null): void => {
  _price.currencyValue = val === 'rune' ? 'eld' : null
  _price.quantity = 1
  update()
}
</script>

<template>
  <div v-if="editable">
    <div class="row items-center q-gutter-x-sm">
      <div>
        <q-icon class="coin" size="18px" :name="`img:${icons.price}`" />
      </div>
      <q-select v-model="_price.currency" class="col" :disable="disable" outlined dense no-error-icon hide-bottom-space
        emit-value map-options transition-show="none" transition-hide="none" :label="t('price.currency')"
        :dropdown-icon="`img:${icons.dropdown}`" :options="currencies" @update:model-value="updateCurrency">
        <template #selected-item="scope">
          <div class="ellipsis">{{ scope.opt.label }}</div>
        </template>
      </q-select>
      <q-select v-if="data.currency === 'rune'" v-model="_price.currencyValue" class="col" :disable="disable" outlined
        dense no-error-icon hide-bottom-space emit-value map-options transition-show="none" transition-hide="none"
        :options="runes()" :dropdown-icon="`img:${icons.dropdown}`" @update:model-value="update">
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section avatar>
              <img :src="scope.opt.img" width="24" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ scope.opt.label }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <D4Counter v-if="data.currency !== 'offer'" v-model="_price.quantity" :disable="disable"
        @update:model-value="update" />
    </div>
  </div>
  <div v-else>
    <q-item v-show="data.loading" style="padding:0;min-height:10px">
      <q-item-section side class="q-pr-sm">
        <q-skeleton type="circle" size="24px" />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          <q-skeleton width="60px" height="24px" />
        </q-item-label>
      </q-item-section>
    </q-item>
    <div v-show="!data.loading" class="price">
      <div v-if="data.currency === 'offer'">
        <div>{{ t('offer.title') }}</div>
      </div>
      <div v-else class="row items-center q-gutter-x-xs">
        <template v-if="data.currency !== 'rune'">
          <img :src="itemImgs[data.currency as keyof typeof itemImgs]" width="24" />
          <div>{{ findType(data.currency)?.label }}</div>
        </template>
        <template v-else>
          <img :src="(runes().find(r => r.value === data.currencyValue) || {}).img" width="24" />
          <div class="q-ml-xs">{{ (runes().find(r => r.value === data.currencyValue) || {}).label }}</div>
        </template>
        <div>x</div>
        <div>{{ data.quantity }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.coin {
  filter: invert(65%) sepia(69%) saturate(606%) hue-rotate(3deg) brightness(110%) contrast(102%);
}
</style>