<script setup lang="ts">
import { reactive, computed } from 'vue'
import type { ItemType } from 'stores/item-store'
import type { Price } from 'src/types/item'
import { Offer } from 'src/types/item'
import type { Rune } from 'stores/item-store'
import { useItemStore } from 'stores/item-store'
import { icons } from 'src/common/icons'
import { itemImgs } from 'src/common/items'
import D4Counter from 'components/D4Counter.vue'

interface IProps {
  offer?: boolean,
  data: Offer,
  editable?: boolean,
  loading?: boolean,
  disable?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  offer: false,
  editable: false,
  loading: false,
  disable: false
})

const emit = defineEmits(['update'])

// common variable
const store = useItemStore()

// variable
const _price = reactive<Price>({ currency: props.data.currency, currencyValue: props.data.currencyValue, quantity: props.data.quantity })
const findType = store.findType
const runes = store.filterRunes
const currencies = computed<Array<ItemType>>(() => store.currencies)

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
        emit-value map-options transition-show="none" transition-hide="none" label="화폐 유형"
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
      <D4Counter v-if="data.currency !== 'offer'" v-model="_price.quantity" :disable="disable" class="col"
        @update:model-value="update" />
    </div>
  </div>
  <template v-else-if="offer">
    <q-item>
      <slot name="user"></slot>
      <q-item-section v-if="loading">
        <q-item-label>
          <div class="row q-gutter-x-xs items-center">
            <q-skeleton width="24px" height="24px" />
            <q-skeleton type="rect" width="40px" height="12px" />
          </div>
        </q-item-label>
      </q-item-section>
      <q-item-section v-else>
        <q-item-label>
          <div v-if="data.currency === 'offer'">가격 제안</div>
          <div v-else class="row items-center q-gutter-x-xs">
            <template v-if="data.currency !== 'rune'">
              <img :src="itemImgs[data.currency as keyof typeof itemImgs]" width="24" />
              <div>{{ findType(data.currency)?.label }}</div>
            </template>
            <template v-else>
              <img :src="(runes().find((r: Rune) => r.value === data.currencyValue) || {}).img" width="24" />
              <div class="q-ml-xs">{{ (runes().find((r: Rune) => r.value === data.currencyValue) ||
                {}).label
              }}
              </div>
            </template>
            <div>x</div>
            <div>{{ data.quantity }}</div>
          </div>
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <D4Btn label="수락" color="var(--q-secondary)" :loading="loading" :disable="disable || data.accepted" />
      </q-item-section>
    </q-item>
  </template>
  <div v-else>
    <q-item v-show="loading" style="min-height:10px;padding:3px">
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
      <div v-if="data.currency === 'offer'">가격 제안</div>
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