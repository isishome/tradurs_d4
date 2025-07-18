<script setup lang="ts">
import { ref, watch } from 'vue'

interface IProps {
  modelValue: boolean
  noRouteDismiss?: boolean
  position?: 'standard' | 'top' | 'right' | 'left' | 'bottom'
  maximized?: boolean
  persistent?: boolean
  seamless?: boolean
  width?: string | null
  maxWidth?: string | null
  transitionShow?: string
  transitionHide?: string
  transitionDuration?: string | number
}

const props = withDefaults(defineProps<IProps>(), {
  noRouteDismiss: true,
  position: 'standard',
  maximized: false,
  persistent: false,
  seamless: false,
  width: null,
  maxWidth: null,
  transitionShow: 'fade',
  transitionHide: 'fade',
  transitionDuration: 100
})
const emit = defineEmits([
  'update:modelValue',
  'show',
  'hide',
  'before-show',
  'before-hide',
  'submit'
])

const show = ref<boolean>(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    show.value = val
  }
)
</script>

<template>
  <q-dialog
    v-model="show"
    aria-label="Tradurs Dialog"
    @show="emit('show')"
    @hide="emit('hide')"
    @before-show="emit('before-show')"
    @before-hide="emit('before-hide')"
    :position="position"
    :maximized="maximized"
    :persistent="persistent"
    :seamless="seamless"
    :transition-show="transitionShow"
    :transition-hide="transitionHide"
    :transition-duration="transitionDuration"
    :no-route-dismiss="noRouteDismiss"
    @update:model-value="emit('update:modelValue', show)"
    class="shadow-5"
    backdrop-filter="blur(4px)"
  >
    <q-card
      class="card-item normal overflow-hidden"
      :class="position === 'standard' ? 'dialog' : 'on-wall unique'"
      :style="`${width ? `width:${width} !important;` : ''}${
        maxWidth ? `max-width:${maxWidth} !important;` : ''
      }`"
    >
      <q-form
        class="inner"
        :class="{ 'full-height column': maximized }"
        @submit="emit('submit')"
      >
        <slot v-if="$slots.top" name="top"> </slot>
        <q-separator v-if="$slots.top && $slots.middle" />
        <slot v-if="$slots.middle" name="middle"> </slot>
        <q-separator v-if="$slots.bottom" inset />
        <slot v-if="$slots.bottom" name="bottom"> </slot>
      </q-form>
    </q-card>
  </q-dialog>
</template>
