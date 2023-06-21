<script setup lang="ts">
import { computed } from 'vue'
import { RouteLocationRaw, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

interface IProps {
  type?: 'button' | 'submit' | 'reset',
  label?: string,
  color?: string,
  textColor?: string,
  round?: boolean,
  shadow?: boolean,
  shadowDepth?: number,
  to?: RouteLocationRaw,
  loading?: boolean,
  disable?: boolean,
  progress?: boolean,
  noCaps?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  type: 'button',
  shadowDepth: 5,
  loading: false,
  disable: false,
  progress: false,
  noCaps: false
})

const emit = defineEmits(['click'])

const router = useRouter()
const $q = useQuasar()
const { locale } = useI18n({ useScope: 'global' })
const fontWidthGt = computed(() => locale.value === 'ko' ? 14 : 8)
const fontWidthLt = computed(() => locale.value === 'ko' ? 12 : 7)
const padding = computed(() => $q.screen.width > 600 ? 40 : 20)
const textWidth = computed(() => $q.screen.width > 600 ? fontWidthGt.value : fontWidthLt.value)
const textHeight = computed(() => $q.screen.width > 600 ? 37 : 30)
const bg = computed<string>(() => $q.dark.isActive ? `background: radial-gradient(ellipse at top, ${props.color ? props.color : 'var(--q-primary)'}, 30%, var(--q-dark-page));` : `background-color: ${props.color ? props.color : 'var(--q-primary)'};`)
const tc = computed<string>(() => `color:${props.textColor ? props.textColor : 'var(--q-light-page)'};`)

const click = () => {
  if (props.loading || props.disable || props.progress)
    return
  else if (props.to)
    router.push(props.to)
  else
    emit('click')
}
</script>

<template>
  <div :class="{ disable }" class="no-pointer-events inline-block">
    <q-skeleton v-show="loading" :type="$q.dark.isActive ? 'rect' : 'QChip'"
      :width="`${label ? label.length * textWidth + padding : 0}px`" :height="`${textHeight}px`"
      class="btn all-pointer-events" :class="{ round }" />
    <div v-show="!loading" class="btn-wrap" :class="{ 'frame': !round }">
      <button :type="type" aria-label="Tradurs Button" class="btn row items-center no-wrap all-pointer-events"
        :class="[{ round }, shadow ? `shadow-depth-${shadowDepth}` : '', props.progress ? 'progress' : 'cursor-pointer']"
        :style="`${bg}${tc}`" @click="click">
        <div class="label relative-position">
          <div v-show="progress" class="fit absolute-center" :style="`z-index: 1;`">
            <q-spinner />
          </div>
          <div :class="{ 'text-transparent': progress, 'text-uppercase': !noCaps }">
            {{ label }}
          </div>
        </div>
        <slot name="default"></slot>
      </button>
    </div>
  </div>
</template>

<style scoped>
.disable {
  user-select: none;
  pointer-events: none;
  position: relative;
  filter: contrast(40%);
}

.progress {
  cursor: wait;
}

.disable::after {
  content: '';
  position: absolute;
  z-index: 1;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  cursor: not-allowed;
  pointer-events: fill;
}

.skeleton {
  height: 37px;
  border-radius: 4px;
  padding: 8px 20px;
}

.btn {
  position: relative;
  padding: 8px 20px;
  border: none;
  transition: filter .3s ease;
  font-weight: 500;
  outline: 0;
  width: 100%;
}

.body--dark .btn {
  filter: brightness(140%);
}

.btn.non-label {
  padding: inherit !important;
}

.round {
  padding: 10px !important;
}

@media (max-width:600px) {
  .btn {
    padding: 4px 10px;
  }

  .body--dark .frame::after {
    border-image-width: 2px !important;
    border-image-slice: 10 !important;
  }

  .round {
    padding: 6px !important;
  }
}

.body--light .btn {
  border-radius: 4px;
}

.round.btn {
  border-radius: 28px;
}

.btn-wrap:active:has(.btn:not(.progress)) {
  transform: translateY(1px);
}

@media (hover: hover) {
  .btn:hover {
    filter: brightness(150%);
  }

  .body--light .btn:hover {
    filter: brightness(110%);
  }
}

.btn-wrap {
  position: relative;
  padding: 3px;
  cursor: pointer;
}

.body--dark .frame::after {
  content: '';
  max-height: 100%;
  box-sizing: border-box;
  position: absolute;
  z-index: 0;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-style: solid;
  border-image-width: 9px;
  border-image: url(assets/frames/outer.webp) 30;
  filter: brightness(160%);
  pointer-events: none;
}

.body--light .btn-wrap::after {
  filter: brightness(1);
}

.body--dark .frame::before {
  box-shadow: none;
  content: '';
  position: absolute;
  z-index: 1;
  top: 4px;
  bottom: 4px;
  left: 4px;
  right: 4px;
  border-style: solid;
  border-image: url(assets/frames/inner.webp) 36;
  border-image-width: 30px;
  pointer-events: none;
  filter: invert(50%);
}

.body--light .shadow-depth-5 {
  box-shadow: rgb(38, 57, 77) 0px 20px 30px 0;
}

.body--light .shadow-depth-1 {
  box-shadow: rgb(38, 57, 77) 0px 4px 6px 0;
}

.body--dark .round::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px var(--q-dark), inset 0 0 0 2px var(--q-dark-normal);
  border: double 2px var(--q-dark-normal);
}


.label {
  width: 100%;
  position: relative;
  z-index: 1;
}
</style>