<script setup lang="ts">
import { useQuasar } from 'quasar'

const $q = useQuasar()
</script>
<template>
  <q-tooltip v-if="!$q.platform.is.mobile"
    :class="['q-pa-md', $q.dark.isActive ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4']" anchor="center right"
    self="center left" :offset="[10, 0]" transition-hide="jump-right" transition-show="jump-left">
    <slot name="default">
    </slot>
  </q-tooltip>
  <q-popup-proxy v-else>
    <div :class="['q-pa-md rounded-borders', $q.dark.isActive ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4']">
      <slot name="default">
      </slot>
    </div>
  </q-popup-proxy>
</template>