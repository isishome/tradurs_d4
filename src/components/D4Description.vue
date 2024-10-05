<script setup lang="ts">
defineProps({
  item: {
    type: String,
    default: undefined
  },
  desc: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="row no-wrap items-baseline q-gutter-xs">
    <div class="text-center" style="width: 21px">
      <q-icon
        class="icon rotate-45"
        size="10px"
        name="img:/images/attribute_types/standard.svg"
      />
    </div>
    <div class="row items-center q-gutter-x-xs q-ml-none col">
      <template v-if="item">
        <div>{{ item }}</div>
        <div>:</div>
      </template>
      <div>{{ desc }}</div>
    </div>
  </div>
</template>
