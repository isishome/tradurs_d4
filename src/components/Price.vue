<script setup lang="ts">
import { reactive, computed, useSlots } from 'vue'
import { useQuasar } from 'quasar'
import type { ItemType } from '@/stores/item'
import { Price } from '@/types/item'
import { useItemStore } from '@/stores/item'
import { icons } from '@/common/icons'
import { itemImgs } from '@/common/items'

const props = defineProps({
    offer: {
        type: Boolean,
        default: false
    },
    data: {
        type: Object,
        default: () => { }
    },
    editable: {
        type: Boolean,
        default: false
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update'])

// common variable
const $q = useQuasar()
const slots = useSlots()
const store = useItemStore()

// variable
const _price = reactive<Price>(new Price(props.data.currency, props.data.currencyValue, props.data.quantity))
const findType = store.findType
const runes = store.filterRunes
const currencies = computed<Array<ItemType>>(() => store.currencies)

const update = (): void => {
    emit('update', _price)
}

const updateCurrency = (val: string | null): void => {
    _price.currencyValue = val === 'rune' ? 'eld' : null
    _price.quantity = val === 'offer' ? null : 1
    update()
}

const updatePriceQuantity = (stat: string): void => {
    if (_price.quantity) {
        _price.quantity = _price.quantity + (stat === 'inc' ? 1 : -1) as number
        update()
    }
}
</script>

<template>
    <div v-if="editable">
        <div class="row items-center q-gutter-x-sm">
            <div>
                <q-icon class="coin" size="18px" :name="`img:${icons.price}`" />
            </div>
            <q-select v-model="_price.currency" outlined dense no-error-icon hide-bottom-space emit-value map-options
                transition-show="none" transition-hide="none" label="화폐 유형" :dropdown-icon="`img:${icons.dropdown}`"
                :options="currencies" @update:model-value="updateCurrency">
                <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                </template>
            </q-select>
            <q-select v-if="data.currency === 'rune'" v-model="_price.currencyValue" style="min-width:100px" outlined
                dense no-error-icon hide-bottom-space emit-value map-options transition-show="none"
                transition-hide="none" :options="runes()" :dropdown-icon="`img:${icons.dropdown}`"
                @update:model-value="update">
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
            <div v-if="data.currency !== 'offer'" class="row no-wrap items-center">
                <q-btn v-show="!$q.platform.is.mobile" size="sm" flat dense round
                    :disable="!_price.quantity || parseInt(_price.quantity.toString()) < 2"
                    @click="updatePriceQuantity('dec')">
                    <img class="icon" width="17" src="@/assets/icons/remove.svg" />
                </q-btn>
                <q-input v-model="_price.quantity" label="수량" style="max-width:50px" input-class="text-center" dense
                    hide-bottom-space hide-hint no-error-icon outlined type="tel" maxlength="3" mask="###"
                    debounce="500" :rules="[val => Number.isInteger(parseInt(val)) && parseInt(val) !== 0 || '']"
                    @update:model-value="update" @focus="evt => (evt.target as HTMLInputElement).select()" />
                <q-btn v-show="!$q.platform.is.mobile" size="sm" flat dense round
                    :disable="!_price.quantity || parseInt(_price.quantity.toString()) > 998"
                    @click="updatePriceQuantity('inc')">
                    <img class="icon" width="17" src="@/assets/icons/add.svg" />
                </q-btn>
            </div>
        </div>
    </div>
    <div v-else>
        <q-item v-show="loading" style="min-height:10px;padding:3px">
            <q-item-section side class="q-pr-sm">
                <q-skeleton type="circle" size="24px" />
            </q-item-section>
            <q-item-section>
                <q-item-label>
                    <q-skeleton width="20%" height="24px" />
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
                    <div class="q-ml-xs">{{(runes().find(r => r.value === data.currencyValue) || {}).label}}</div>
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