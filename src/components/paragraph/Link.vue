<script setup>
defineProps({
  href: {
    type: String,
    default: null
  },
  to: {
    type: Object,
    default: () => {
      return {}
    }
  },
  color: {
    type: String,
    default: 'primary'
  }
})
</script>
<template>
  <a v-if="href" :href="href" :class="`text-${color}`" target="_blank" rel="noopener noreferrer">
    <div class="row inline items-center">
      <slot></slot>
      <q-icon class="q-ml-xs" name="open_in_new" />
    </div>
  </a>
  <router-link v-else-if="to" :to="to" :class="`text-${color}`">
    <slot></slot>
  </router-link>
</template>
<style scoped>
a {
  font-weight: 500;
  text-decoration: none;
  outline: 0;
  border-bottom: 1px dotted currentColor;
  transition: opacity .2s;
  white-space: nowrap;
}
</style>