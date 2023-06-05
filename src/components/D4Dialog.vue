<script setup lang="ts">
import { ref, watch } from 'vue'

interface IProps {
  modelValue: boolean,
  noRouteDismiss?: boolean,
  maximized?: boolean,
  persistent?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  noRouteDismiss: true,
  maximized: false,
  persistent: false
})
const emit = defineEmits(['update:modelValue', 'hide', 'submit'])

const show = ref<boolean>(props.modelValue)

watch(() => props.modelValue, (val) => {
  show.value = val
})
</script>

<template>
  <q-dialog v-model="show" @hide="emit('hide')" :maximized="maximized" :persistent="persistent" transition-show="none"
    transition-hide="none" :transition-duration="0" :no-route-dismiss="noRouteDismiss"
    @update:model-value="emit('update:modelValue', show)">
    <q-card class="card-item dialog normal overflow-hidden">
      <q-form class="inner column" @submit="emit('submit')">
        <slot v-if="$slots.top" name="top">
        </slot>
        <q-separator v-if="$slots.top" />
        <slot v-if="$slots.middle" name="middle">
        </slot>
        <q-separator v-if="$slots.bottom" inset />
        <slot v-if="$slots.bottom" name="bottom">
        </slot>
      </q-form>
    </q-card>
  </q-dialog>
</template>