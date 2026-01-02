<script setup lang="ts">

defineProps({
  data: {
    type: Object,
    required: true
  }
})

</script>

<template>
  <div class="row no-wrap items-baseline q-gutter-xs">
    <div class="text-center" style="width:21px">
      <q-icon class="icon rotate-45" size="10px" name="img:/images/attribute_types/standard.svg" />
    </div>
    <div class="row items-center q-gutter-x-xs q-ml-none col">
      <div>{{ data.label }}</div>
      <div>x</div>
      <div>{{ data.quantity }}</div>
    </div>
  </div>
</template>