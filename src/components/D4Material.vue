<script setup lang="ts">
const legacyRuneImageKeys = new Set(['jah', 'ohm', 'thul', 'vex'])
const runeImageSize = (imageKey?: string) =>
  imageKey && legacyRuneImageKeys.has(imageKey) ? 28 : 40

defineProps({
  data: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="row no-wrap items-center q-gutter-x-xs attr-area">
    <div
      class="row items-center justify-center no-wrap"
      :style="{
        width: data.imageType && data.imageKey ? '42px' : '21px',
        height: data.imageType && data.imageKey ? '42px' : '21px'
      }"
    >
      <img
        v-if="data.imageType && data.imageKey"
        :src="`/images/items/rune/${data.imageType}/${data.imageKey}.webp`"
        :width="runeImageSize(data.imageKey)"
        :height="runeImageSize(data.imageKey)"
        style="display: block; object-fit: contain; object-position: center"
        :alt="`${data.runeCode || data.label} Rune`"
      />
      <q-icon
        v-else
        class="icon rotate-45"
        size="10px"
        name="img:/images/attribute_types/standard.svg"
      />
    </div>
    <div class="row items-center q-gutter-x-xs q-ml-none col">
      <div>{{ data.label }}</div>
      <div v-if="data.runeCode" class="text-grey-6">
        ({{ data.runeCode }})
      </div>
      <div>x</div>
      <div>{{ data.quantity }}</div>
    </div>
  </div>
</template>
