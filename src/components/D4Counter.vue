<script setup lang="ts">
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { icons } from 'src/common/icons'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 1
  },
  disable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// common variable
const $q = useQuasar()

// variable
const _quantity = ref<number>(props.modelValue || 1)

// methods
const counting = (stat: string): void => {
  _quantity.value = _quantity.value + (stat === 'inc' ? 1 : -1) as number
  emit('update:modelValue', _quantity.value)
}

const update = (val: string | number | null) => {
  _quantity.value = parseInt(val ? val.toString() : '1')
  emit('update:modelValue', _quantity.value)
}

const focus = (evt: Event) => {
  const el: HTMLInputElement | null = (evt.target as Element)?.closest('input')
  el?.select()
}

watch(() => props.modelValue, (val) => {
  _quantity.value = val
})
</script>

<template>
  <div class="col no-wrap row items-center">
    <q-btn v-show="!$q.screen.lt.sm" size="sm" flat dense round :disable="disable || parseInt(_quantity.toString()) < 2"
      @click="counting('dec')">
      <img class="icon" width="17" :src="icons.remove" />
    </q-btn>
    <q-input v-model="_quantity" label="수량" style="max-width:50px" input-class="text-center" :disable="disable" dense
      hide-bottom-space hide-hint no-error-icon outlined type="tel" maxlength="3" mask="###" debounce="500"
      :rules="[(val: number) => (Number.isInteger(val) && val !== 0) || '']" @update:model-value="update"
      @focus="focus" />
    <q-btn v-show="!$q.screen.lt.sm" size="sm" flat dense round :disable="disable || parseInt(_quantity.toString()) > 998"
      @click="counting('inc')">
      <img class="icon" width="17" :src="icons.add" />
    </q-btn>
  </div>
</template>

<style scoped></style>