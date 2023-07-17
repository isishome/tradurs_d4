<script setup lang="ts">
import { QPopupProxy, useQuasar } from 'quasar'

interface IProps {
  anchor?: 'top left'
  | 'top middle'
  | 'top right'
  | 'top start'
  | 'top end'
  | 'center left'
  | 'center middle'
  | 'center right'
  | 'center start'
  | 'center end'
  | 'bottom left'
  | 'bottom middle'
  | 'bottom right'
  | 'bottom start'
  | 'bottom end'
  | undefined,
  self?: 'top left'
  | 'top middle'
  | 'top right'
  | 'top start'
  | 'top end'
  | 'center left'
  | 'center middle'
  | 'center right'
  | 'center start'
  | 'center end'
  | 'bottom left'
  | 'bottom middle'
  | 'bottom right'
  | 'bottom start'
  | 'bottom end'
  | undefined,
  transitionHide?: string | undefined,
  transitionShow?: string | undefined,
  offset?: [number, number],
  behavior?: 'desktop' | 'mobile' | 'auto'
}

withDefaults(defineProps<IProps>(), {
  anchor: 'center right',
  self: 'center left',
  transitionHide: 'jump-right',
  transitionShow: 'jump-left',
  offset: () => [10, 10],
  behavior: 'auto'
})

const $q = useQuasar()
</script>
<template>
  <q-tooltip v-if="!$q.platform.is.mobile || behavior === 'desktop'"
    :class="['q-pa-md', $q.dark.isActive ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4']" :anchor="anchor"
    :self="self" :offset="offset" :transition-hide="transitionHide" :transition-show="transitionShow">
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