<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { focus } from 'src/common'

interface IProps {
  modelValue: number | string | null,
  label?: string | null,
  maxWidth?: string,
  max?: number,
  allowZero?: boolean,
  allowNull?: boolean,
  noButton?: boolean,
  debounce?: string | number,
  disable?: boolean,
  hideLabel?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  label: null,
  maxWidth: '50px',
  max: 999,
  allowZero: false,
  allowNull: false,
  noButton: false,
  debounce: 500,
  disable: false,
  hideLabel: false
})

const emit = defineEmits(['update:modelValue'])

// common variable
const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })

// variable
const _quantity = ref<number | string>(typeof (props.modelValue) === 'number' ? props.modelValue : '')

// methods
const counting = (stat: string): void => {
  if (typeof (_quantity.value) === 'number') {
    const q = _quantity.value + (stat === 'inc' ? 1 : -1) as number
    emit('update:modelValue', q)
  }
}

const validate = (n: string | number) => {
  let q: number | string = n

  if (q !== '') {
    q = parseInt(n.toString())
    q = (q === 0 && !props.allowZero ? 1 : q > props.max ? props.max : q)
  }

  return q
}

const update = (val: string | number | null) => {
  emit('update:modelValue', val)
}

watch(() => props.modelValue, (val: number | string | null) => {
  const q = validate(typeof (val) === 'number' ? val : '')

  nextTick(() => {
    _quantity.value = q
  })

  if ((val || '') !== q)
    emit('update:modelValue', q)
})
</script>

<template>
  <div class="no-wrap row items-center">
    <q-btn v-show="!$q.screen.lt.sm && !noButton" size="sm" flat dense round aria-label="Tradurs Remove Button"
      :disable="disable || (!allowNull && parseInt((_quantity || '0').toString()) < (allowZero ? 1 : 2))"
      @click="counting('dec')">
      <img class="icon" width="17" height="17" src="/images/icons/remove.svg" alt="icon_remove" />
    </q-btn>
    <q-input v-model.number="_quantity" :label="hideLabel ? undefined : label || t('price.quantity')"
      :style="`max-width:${maxWidth}`" input-class="text-center" :disable="disable" dense hide-bottom-space hide-hint
      no-error-icon outlined :maxlength="max.toString().length" :mask="''.padStart(max.toString().length, '#')"
      :debounce="debounce"
      :rules="[(val: number | string) => ((typeof (val) === 'number' && (val > 0 || allowZero)) || (allowNull && val === '')) || '']"
      @update:model-value="update" @focus="focus" />
    <q-btn v-show="!$q.screen.lt.sm && !noButton" size="sm" flat dense round aria-label="Tradurs Add Button"
      :disable="disable || (!allowNull && parseInt((_quantity || '0').toString()) > (max - 1))" @click="counting('inc')">
      <img class="icon" width="17" height="17" src="/images/icons/add.svg" alt="icon_add" />
    </q-btn>
  </div>
</template>

<style scoped></style>