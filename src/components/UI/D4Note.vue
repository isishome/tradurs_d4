<script setup lang="ts">
import { colors } from 'quasar'
const { getPaletteColor } = colors

const props = defineProps({
  color: {
    type: String,
    default: 'primary'
  }
})

const hexColor = getPaletteColor(props.color)
</script>
<template>
  <div>
    <div class="note" :style="`--note-color:${hexColor}`">
      <div class="box" :class="`bg-${color}`"></div>
      <div class="box right" :class="`bg-${color}`"></div>
      <div class="inner_note" :class="`bg-${color}`"></div>
      <slot>
      </slot>
    </div>
  </div>
</template>
<style scoped>
.note {
  position: relative;
  margin: 16px 0 22px 0;
  padding: 16px 24px;
}

.note:deep(p) {
  padding-bottom: 8px;
  margin-bottom: 0;
}

.inner_note {
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: .2;
}

.body--light .note:deep(em) {
  background-color: transparent;
  color: inherit;
  position: relative;
}

.body--light .note:deep(em::before) {
  content: '';
  position: absolute;
  z-index: -1;
  background-color: var(--note-color);
  opacity: .5;
  border-radius: 4px;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}


.body--dark .inner_note {
  opacity: 1;
  background-color: rgba(255, 255, 255, .05) !important;
}

.box {
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  opacity: .4;
}

.box.right {
  left: auto;
  right: 0;
}

.body--dark .box {
  opacity: 1;
  background-color: rgba(255, 255, 255, .1) !important;
}
</style>