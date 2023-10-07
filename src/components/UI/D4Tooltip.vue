<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar, uid, QTooltip } from 'quasar'

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
  transitionHide?: string,
  transitionShow?: string,
  transitionDuration?: string | number,
  offset?: [number, number],
  behavior?: 'desktop' | 'mobile' | 'auto',
  keep?: boolean,
  padding?: string
}

const props = withDefaults(defineProps<IProps>(), {
  anchor: 'center right',
  self: 'center left',
  transitionHide: 'jump-right',
  transitionShow: 'jump-left',
  transitionDuration: 300,
  offset: () => [10, 10],
  behavior: 'auto',
  keep: false,
  padding: 'md'
})

const $q = useQuasar()
const id = uid()
const target = ref<boolean | string>(true)
const tooltipRef = ref<QTooltip>()

const show = () => {
  if (props.keep) {
    tooltipRef.value?.contentEl?.classList.add('keep-tooltip')
    target.value = `div[data-tooltip-id="${id}"]`
  }
}

const beforeHide = () => {
  if (props.keep) {
    tooltipRef.value?.contentEl?.classList.remove('keep-tooltip')
    target.value = true
  }
}
</script>
<template>
  <q-tooltip ref="tooltipRef" v-if="!$q.platform.is.mobile || behavior === 'desktop'" :target="target"
    class="no-padding bg-transparent" :anchor="anchor" :self="self" :offset="offset" :transition-hide="transitionHide"
    :transition-show="transitionShow" :transition-duration="transitionDuration" @show="show" @before-hide="beforeHide">
    <div class="row items-center" :data-tooltip-id="id">
      <div v-show="keep" class="keep-space"></div>
      <div :class="[`q-pa-${padding}`, $q.dark.isActive ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4', { keep }]">
        <slot name="default">
        </slot>
      </div>
    </div>
  </q-tooltip>
  <q-btn class="absolute fit" padding="0" flat v-else @click.stop>
    <q-popup-proxy>
      <div
        :class="[`q-pa-${padding} rounded-borders`, $q.dark.isActive ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4']">
        <slot name="default">
        </slot>
      </div>
    </q-popup-proxy>
  </q-btn>
</template>
<style scoped>
.keep-space {
  width: 30px;
  height: 100%;
}

.keep {
  border-radius: 4px;
}
</style>