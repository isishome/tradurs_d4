<script setup>
defineProps({
  head: {
    type: Boolean,
    default: false
  },
  sub: {
    type: Boolean,
    default: false
  },
  minor: {
    type: Boolean,
    default: false
  },
  arrow: {
    type: Boolean,
    default: false
  },
  small: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: 'primary'
  }
})
</script>
<template>
  <div v-if="head" class="text-h3 text-weight-bold q-mb-xl" :class="`text-${color}`">
    <slot></slot>
  </div>
  <template v-else-if="sub">
    <div class="sub text-h4 text-weight-bold q-py-sm" :class="`text-${color}`">
      <slot></slot>
    </div>
  </template>
  <p v-else-if="minor" class="q-mt-xl q-mb-sm q-py-sm text-h5" :class="`text-${color}`">
    <slot></slot>
  </p>
  <div v-else-if="arrow" class="text-h6 q-mt-md q-mb-sm q-py-sm row items-center q-gutter-x-xs no-wrap"
    :class="`text-${color}`">
    <q-icon name="keyboard_double_arrow_right" />
    <div>
      <slot></slot>
    </div>
  </div>
  <div v-else-if="small" class="text-subtitle2 text-white row inline-block q-px-xs q-mt-sm rounded-borders"
    :class="`bg-${color}`">
    <slot></slot>
  </div>
</template>
<style scoped>
.sub {
  margin: 4rem 0 1.5rem;
  border-bottom: solid 1px #dddddd;
}
</style>