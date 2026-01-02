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
  padding?: string,
  dark?: boolean
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
  padding: 'md',
  dark: undefined
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
    {{dark}}
    <div :data-tooltip-id="id" class="relative-position"
      :class="[`q-pa-${padding}`, ($q.dark.isActive && typeof (dark) === 'undefined') || !!dark ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4', { keep }]">
      <div v-show="keep" class="keep-absolute">
        <div class="keep-fixed"></div>
      </div>
      <slot name="default">
      </slot>
      <div v-show="keep" class="keep-absolute right">
        <div class="keep-fixed right"></div>
      </div>
    </div>
  </q-tooltip>
  <q-btn class="absolute fit" aria-label="Tradurs Tooltip Button" padding="0" flat v-else @click.stop>
    <q-popup-proxy>
      <div
        :class="[`q-pa-${padding} rounded-borders`, ($q.dark.isActive && typeof (dark) === 'undefined') || !!dark ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4']">
        <slot name="default">
        </slot>
      </div>
    </q-popup-proxy>
  </q-btn>
</template>
<style scoped>
.keep-absolute {
  position: absolute;
  left: 0;
  top: 50%;
}

.keep-absolute.right {
  left: inherit;
  right: 0;
}

.keep-fixed {
  position: fixed;
  width: 30px;
  height: 50px;
  transform: translate(-100%, -50%);
}

.keep-fixed.right {
  transform: translate(0, -50%);
}

.keep {
  border-radius: 4px;
}
</style>