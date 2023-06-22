<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { icons } from 'src/common/icons'
import { focus } from 'src/common'

interface IProps {
  modelValue: number | null,
  label?: string | null,
  maxWidth?: string,
  max?: number,
  allowZero?: boolean,
  allowNull?: boolean,
  noButton?: boolean,
  disable?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  label: null,
  maxWidth: '50px',
  max: 999,
  allowZero: false,
  allowNull: false,
  noButton: false,
  disable: false
})

const emit = defineEmits(['update:modelValue'])

// common variable
const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })

// variable
const _quantity = ref<number | null>(props.modelValue || (props.allowZero ? 0 : props.allowNull ? null : 1))

// methods
const counting = (stat: string): void => {
  if (typeof (_quantity.value) === 'number') {
    _quantity.value = _quantity.value + (stat === 'inc' ? 1 : -1) as number
    emit('update:modelValue', _quantity.value)
  }
}

const update = (val: string | number | null) => {
  let q = parseInt(val ? val.toString() : props.allowZero ? '0' : '1')
  q = q > props.max ? props.max : q

  emit('update:modelValue', q)

  nextTick(() => {
    _quantity.value = q
  })
}

watch(() => props.modelValue, (val: number | null) => {
  _quantity.value = val
})
</script>

<template>
  <div class="no-wrap row items-center">
    <q-btn v-show="!$q.screen.lt.sm && !noButton" size="sm" flat dense round aria-label="Tradurs Remove Button"
      :disable="disable || (!allowNull && parseInt((_quantity || '0').toString()) < (allowZero ? 1 : 2))"
      @click="counting('dec')">
      <img class="icon" width="17" height="17" :src="icons.remove" alt="icon_remove" />
    </q-btn>
    <q-input v-model="_quantity" :label="label || t('price.quantity')" :style="`max-width:${maxWidth}`"
      input-class="text-center" :disable="disable" dense hide-bottom-space hide-hint no-error-icon outlined type="tel"
      :maxlength="max.toString().length" :mask="''.padStart(max.toString().length, '#')" debounce="500"
      :rules="[(val: number) => (Number.isInteger(val) && (allowZero || val !== 0)) || '']" @update:model-value="update"
      @focus="focus" />
    <q-btn v-show="!$q.screen.lt.sm && !noButton" size="sm" flat dense round aria-label="Tradurs Add Button"
      :disable="disable || (!allowNull && parseInt((_quantity || '0').toString()) > (max - 1))" @click="counting('inc')">
      <img class="icon" width="17" height="17" :src="icons.add" alt="icon_add" />
    </q-btn>
  </div>
</template>

<style scoped></style>