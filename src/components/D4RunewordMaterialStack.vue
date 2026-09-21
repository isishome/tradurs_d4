<script setup lang="ts">
import { computed } from 'vue'
import type { RunewordSetRune } from 'stores/item-store'

const props = withDefaults(
  defineProps<{
    runes: RunewordSetRune[]
    size?: number
    overlap?: number
    fill?: boolean
    scaleLegacy?: boolean
  }>(),
  {
    size: 28,
    overlap: 0.7,
    fill: false,
    scaleLegacy: false
  }
)

const legacyRuneImageKeys = new Set(['jah', 'ohm', 'thul', 'vex'])
const runeScale = (rune: RunewordSetRune) =>
  props.scaleLegacy && legacyRuneImageKeys.has(rune.imageKey) ? 0.7 : 1
const step = computed(() => props.size * (1 - props.overlap))
const width = computed(() =>
  props.runes.length > 0
    ? props.size + step.value * (props.runes.length - 1)
    : 0
)
const label = computed(() => props.runes.map((rune) => rune.runeCode).join(' + '))
const naturalWidth = computed(() => !props.fill && props.overlap === 0)
const fillImagePercent = computed(() =>
  props.runes.length > 0
    ? 100 / (1 + (1 - props.overlap) * (props.runes.length - 1))
    : 0
)
</script>

<template>
  <div
    class="runeword-material-stack row no-wrap items-center"
    role="img"
    :aria-label="label"
    :style="
      fill
        ? { width: '100%', height: '100%' }
        : naturalWidth
          ? { width: 'auto', height: `${size}px` }
          : { width: `${width}px`, height: `${size}px` }
    "
  >
    <img
      v-for="(rune, index) in runes"
      :key="`${rune.position}-${rune.value}`"
      class="runeword-material-stack__image"
      :style="{
        width: fill
          ? `${fillImagePercent}%`
          : naturalWidth
            ? 'auto'
            : `${size}px`,
        height: fill
          ? `${fillImagePercent}%`
          : `${size * runeScale(rune)}px`,
        marginLeft:
          index === 0
            ? '0'
            : fill
              ? `-${fillImagePercent * overlap}%`
              : `-${size * overlap}px`,
        transform:
          fill && runeScale(rune) !== 1
            ? `scale(${runeScale(rune)})`
            : undefined,
        zIndex: index + 1
      }"
      :src="`/images/items/rune/${rune.imageType}/${rune.imageKey}.webp`"
      alt=""
    />
  </div>
</template>

<style scoped>
.runeword-material-stack {
  flex: 0 0 auto;
  justify-content: center;
}

.runeword-material-stack__image {
  display: block;
  flex: 0 0 auto;
  object-fit: contain;
  object-position: center;
  transform-origin: center;
}
</style>
