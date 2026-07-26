<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Item } from 'src/types/item'
import D4ItemCard from './D4ItemCard.vue'

const props = defineProps<{
  items: Item[]
  loading?: boolean
  label: string
  previousLabel: string
  nextLabel: string
}>()

const scroller = ref<HTMLElement | null>(null)
const canPrevious = ref(false)
const canNext = ref(false)
const scrollbarVisible = ref(false)
const scrollbarHovered = ref(false)
const scrollbarDragging = ref(false)
const thumbWidth = ref(100)
const thumbLeft = ref(0)
let scrollbarTimer: ReturnType<typeof setTimeout> | undefined

const thumbStyle = computed(() => ({
  width: `${thumbWidth.value}%`,
  left: `${thumbLeft.value}%`
}))

const updateControls = () => {
  const el = scroller.value
  if (!el) return
  canPrevious.value = el.scrollLeft > 2
  canNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
  thumbWidth.value = Math.min((el.clientWidth / el.scrollWidth) * 100, 100)
  thumbLeft.value = (el.scrollLeft / el.scrollWidth) * 100
}

const showScrollbar = () => {
  if (scrollbarTimer) clearTimeout(scrollbarTimer)
  scrollbarVisible.value = true
}

const hideScrollbar = (delay = 450) => {
  if (scrollbarTimer) clearTimeout(scrollbarTimer)
  scrollbarTimer = setTimeout(() => {
    scrollbarVisible.value = false
  }, delay)
}

const onScroll = () => {
  updateControls()
  showScrollbar()
  if (!scrollbarHovered.value) hideScrollbar(700)
}

const onMouseEnter = () => {
  scrollbarHovered.value = true
  showScrollbar()
}

const onMouseLeave = () => {
  scrollbarHovered.value = false
  if (!scrollbarDragging.value) hideScrollbar()
}

const scrollFromPointer = (event: PointerEvent) => {
  const el = scroller.value
  const track = event.currentTarget as HTMLElement
  if (!el || el.scrollWidth <= el.clientWidth) return

  const rect = track.getBoundingClientRect()
  const thumbPixels = rect.width * (thumbWidth.value / 100)
  const available = rect.width - thumbPixels
  const pointer = event.clientX - rect.left - thumbPixels / 2
  const ratio = Math.min(Math.max(pointer / available, 0), 1)
  el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth)
}

const onScrollbarPointerDown = (event: PointerEvent) => {
  event.preventDefault()
  scrollbarDragging.value = true
  showScrollbar()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  scrollFromPointer(event)
}

const onScrollbarPointerMove = (event: PointerEvent) => {
  if (scrollbarDragging.value) scrollFromPointer(event)
}

const onScrollbarPointerUp = (event: PointerEvent) => {
  scrollbarDragging.value = false
  const track = event.currentTarget as HTMLElement
  if (track.hasPointerCapture(event.pointerId))
    track.releasePointerCapture(event.pointerId)
  if (!scrollbarHovered.value) hideScrollbar()
}

const move = (direction: -1 | 1) => {
  const el = scroller.value
  const cards = Array.from(
    el?.querySelectorAll<HTMLElement>('.related-card') ?? []
  )
  if (!el || cards.length === 0) return

  const center = el.scrollLeft + el.clientWidth / 2
  const currentIndex = cards.reduce(
    (nearest, card, index) =>
      Math.abs(card.offsetLeft + card.offsetWidth / 2 - center) <
      Math.abs(
        cards[nearest].offsetLeft + cards[nearest].offsetWidth / 2 - center
      )
        ? index
        : nearest,
    0
  )
  const targetIndex = Math.min(
    Math.max(currentIndex + direction, 0),
    cards.length - 1
  )

  const target = cards[targetIndex]
  el.scrollTo({
    left: target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2,
    behavior: 'smooth'
  })
}

watch(
  () => props.items,
  () => nextTick(updateControls),
  { deep: true }
)

onMounted(updateControls)
onUnmounted(() => {
  if (scrollbarTimer) clearTimeout(scrollbarTimer)
})
</script>

<template>
  <section v-if="loading || items.length > 0" class="related-slider">
    <div class="row items-center justify-between q-mb-sm">
      <div class="text-h6">{{ label }}</div>
      <div class="slider-controls row no-wrap">
        <q-btn
          flat
          dense
          round
          padding="0"
          :aria-label="previousLabel"
          :disable="!canPrevious"
          @click="move(-1)"
        >
          <img
            src="/images/icons/prev.svg"
            width="24"
            height="24"
            class="icon"
            alt=""
          />
        </q-btn>
        <q-btn
          flat
          dense
          round
          padding="0"
          :aria-label="nextLabel"
          :disable="!canNext"
          @click="move(1)"
        >
          <img
            src="/images/icons/next.svg"
            width="24"
            height="24"
            class="icon"
            alt=""
          />
        </q-btn>
      </div>
    </div>
    <div
      class="scroller-wrap"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <div
        ref="scroller"
        class="related-scroller"
        :class="{
          'fade-previous': canPrevious,
          'fade-next': canNext
        }"
        @scroll.passive="onScroll"
      >
        <div
          v-for="item in items"
          :key="item.itemId"
          class="related-card"
        >
          <D4ItemCard :item="item" />
        </div>
        <q-skeleton
          v-if="loading && items.length === 0"
          class="related-card"
          height="420px"
          type="rect"
        />
      </div>
      <div
        class="slider-scrollbar"
        :class="{ visible: scrollbarVisible && thumbWidth < 100 }"
        @pointerdown="onScrollbarPointerDown"
        @pointermove="onScrollbarPointerMove"
        @pointerup="onScrollbarPointerUp"
        @pointercancel="onScrollbarPointerUp"
      >
        <div class="slider-scrollbar-thumb" :style="thumbStyle"></div>
      </div>
    </div>
    <q-resize-observer @resize="updateControls" />
  </section>
</template>

<style scoped>
.related-slider {
  width: min(100%, 820px);
  margin: 0 auto;
}

.scroller-wrap {
  position: relative;
  padding-bottom: 8px;
}

.related-scroller {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding: 2px 7% 8px;
}

.related-scroller::-webkit-scrollbar {
  display: none;
}

.related-scroller.fade-next:not(.fade-previous) {
  -webkit-mask-image: linear-gradient(
    to right,
    #000 0,
    #000 calc(100% - 72px),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    #000 0,
    #000 calc(100% - 72px),
    transparent 100%
  );
}

.related-scroller.fade-previous:not(.fade-next) {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 72px,
    #000 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 72px,
    #000 100%
  );
}

.related-scroller.fade-previous.fade-next {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 72px,
    #000 calc(100% - 72px),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 72px,
    #000 calc(100% - 72px),
    transparent 100%
  );
}

.slider-scrollbar {
  position: absolute;
  right: 7%;
  bottom: 0;
  left: 7%;
  height: 4px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  opacity: 0;
  transition: opacity 220ms ease;
  pointer-events: none;
  cursor: pointer;
  touch-action: none;
}

.slider-scrollbar.visible {
  opacity: 1;
  pointer-events: auto;
}

.slider-scrollbar-thumb {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.28);
  transition:
    left 80ms linear,
    width 160ms ease;
  cursor: grab;
}

.body--light .slider-scrollbar {
  background: rgba(0, 0, 0, 0.06);
}

.body--light .slider-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.24);
}

.related-card {
  width: min(728px, 86%);
  min-width: min(728px, 86%);
  flex: 0 0 auto;
  scroll-snap-align: center;
}

@media (max-width: 600px) {
  .slider-controls {
    display: none;
  }

  .related-scroller {
    gap: 12px;
    padding-inline: 7%;
  }

  .related-card {
    width: 86%;
    min-width: 86%;
  }
}
</style>
