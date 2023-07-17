<script setup lang="ts">
import { ref, watch } from 'vue'

interface IProps {
  modelValue: boolean,
  noRouteDismiss?: boolean,
  maximized?: boolean,
  persistent?: boolean,
  width?: string | null,
  maxWidth?: string | null
}

const props = withDefaults(defineProps<IProps>(), {
  noRouteDismiss: true,
  maximized: false,
  persistent: false,
  width: null,
  maxWidth: null
})
const emit = defineEmits(['update:modelValue', 'hide', 'before-hide', 'submit'])

const show = ref<boolean>(props.modelValue)

watch(() => props.modelValue, (val) => {
  show.value = val
})
</script>

<template>
  <q-dialog v-model="show" @hide="emit('hide')" @before-hide="emit('before-hide')" :maximized="maximized"
    :persistent="persistent" transition-show="none" transition-hide="none" :transition-duration="0"
    :no-route-dismiss="noRouteDismiss" @update:model-value="emit('update:modelValue', show)">
    <q-card class="card-item dialog normal overflow-hidden"
      :style="`${width ? `width:${width} !important;` : ''}${maxWidth ? `max-width:${maxWidth} !important;` : ''}`">
      <q-form class="inner column" :class="{ 'full-height': maximized }" @submit="emit('submit')">
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