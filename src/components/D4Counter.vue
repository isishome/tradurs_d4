<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { icons } from 'src/common/icons'
import { focus } from 'src/common'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 1
  },
  label: {
    type: String,
    default: null
  },
  maxWidth: {
    type: String,
    default: '50px'
  },
  max: {
    type: Number,
    default: 999
  },
  allowZero: {
    type: Boolean,
    default: false
  },
  noButton: {
    type: Boolean,
    default: false
  },
  disable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// common variable
const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })

// variable
const _quantity = ref<number>(props.modelValue || (props.allowZero ? 0 : 1))

// methods
const counting = (stat: string): void => {
  _quantity.value = _quantity.value + (stat === 'inc' ? 1 : -1) as number
  emit('update:modelValue', _quantity.value)
}

const update = (val: string | number | null) => {
  let q = parseInt(val ? val.toString() : props.allowZero ? '0' : '1')
  q = q > props.max ? props.max : q

  emit('update:modelValue', q)

  nextTick(() => {
    _quantity.value = q
  })
}

watch(() => props.modelValue, (val: number) => {
  _quantity.value = val
})
</script>

<template>
  <div class="no-wrap row items-center">
    <q-btn v-show="!$q.screen.lt.sm && !noButton" size="sm" flat dense round aria-label="Tradurs Remove Button"
      :disable="disable || parseInt(_quantity.toString()) < (allowZero ? 1 : 2)" @click="counting('dec')">
      <img class="icon" width="17" :src="icons.remove" alt="icon_remove" />
    </q-btn>
    <q-input v-model="_quantity" :label="label || t('price.quantity')" :style="`max-width:${maxWidth}`"
      input-class="text-center" :disable="disable" dense hide-bottom-space hide-hint no-error-icon outlined type="tel"
      :maxlength="max.toString().length" :mask="''.padStart(max.toString().length, '#')" debounce="500"
      :rules="[(val: number) => (Number.isInteger(val) && (allowZero || val !== 0)) || '']" @update:model-value="update"
      @focus="focus" />
    <q-btn v-show="!$q.screen.lt.sm && !noButton" size="sm" flat dense round aria-label="Tradurs Add Button"
      :disable="disable || parseInt(_quantity.toString()) > (max - 1)" @click="counting('inc')">
      <img class="icon" width="17" :src="icons.add" alt="icon_add" />
    </q-btn>
  </div>
</template>

<style scoped></style>