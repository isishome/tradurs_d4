<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const props = defineProps({
  label: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: null
  },
  textColor: {
    type: String,
    default: null
  },
  round: {
    type: Boolean,
    default: false
  },
  shadow: {
    type: Boolean,
    default: false
  },
  to: {
    type: Object,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  disable: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const router = useRouter()
const $q = useQuasar()
const textWidth = computed(() => $q.screen.width > 600 ? 32 : 24)
const textHeight = computed(() => $q.screen.width > 600 ? 37 : 30)
const bg = computed<string>(() => $q.dark.isActive ? `background: radial-gradient(ellipse at top, ${props.color ? props.color : 'var(--q-primary)'}, 20%, var(--q-dark-page));` : `background-color: ${props.color ? props.color : 'var(--q-primary)'};`)
const tc = computed<string>(() => `color:${props.textColor ? props.textColor : 'var(--q-light-page)'};`)

const click = () => {
  if (props.loading || props.disable || props.progress)
    return
  else if (props.to.name || props.to.path)
    router.push(props.to)
  else
    emit('click')
}
</script>

<template>
  <div :class="disable ? 'disable' : ''" class="no-pointer-events inline-block">
    <q-skeleton v-show="loading" :type="$q.dark.isActive ? 'rect' : 'QChip'"
      :width="`${label ? label.length * textWidth : 0}px`" :height="`${textHeight}px`" class="btn all-pointer-events" />
    <div v-show="!loading" class="btn-wrap" :class="round ? '' : 'frame'">
      <button class="btn row items-center all-pointer-events"
        :class="[round ? 'round' : '', shadow ? 'shadow' : '', props.progress ? 'progress' : 'cursor-pointer']"
        :style="`${bg}${tc}`" @click="click">
        <div class="label relative-position">
          <div v-show="progress" class="fit absolute-center" :style="`z-index: 1;`">
            <q-spinner />
          </div>
          <div :class="progress ? 'text-transparent' : ''">
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
  opacity: .6;
  position: relative;
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
  border-radius: 28px;
  padding: 8px 20px;
}

.btn {
  position: relative;
  padding: 8px 20px;
  border: none;
  transition: filter .3s ease;
  font-weight: 700;
  outline: 0;
}

.btn.non-label {
  padding: inherit !important;
}

@media (max-width:600px) {
  .btn {
    padding: 4px 10px;
  }

  .body--dark .frame::after {
    border-image-width: 2px !important;
    border-image-slice: 10 !important;
  }
}

.body--light .btn,
.round.btn {
  border-radius: 28px;
}

.btn-wrap:active:deep(.btn:not(.progress)) {
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

.round {
  padding: 10px !important;
}

.body--light .shadow {
  box-shadow: rgb(38, 57, 77) 0px 20px 30px 0;
}


.body--dark .round::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 2px var(--q-dark), inset 0 0 0 3px var(--q-primary);
  border: double 3px var(--q-dark-normal);
}


.label {
  position: relative;
  z-index: 1;
}
</style>