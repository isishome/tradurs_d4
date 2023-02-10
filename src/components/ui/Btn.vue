<script setup lang="ts">
import { computed } from 'vue'
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
  loading: {
    type: Boolean,
    default: false
  }
})
const $q = useQuasar()
const bg = computed<string>(() => $q.dark.isActive ? `background: radial-gradient(ellipse at top, ${props.color ? props.color : 'var(--q-primary)'}, 50%, var(--q-dark-page));` : `background-color: ${props.color ? props.color : 'var(--q-primary)'};`)
const tc = computed<string>(() => `color:${props.textColor ? props.textColor : 'var(--q-light-page)'};`)
</script>

<template>
  <div>
    <q-skeleton v-show="loading" rounded type="QBtn" class="skeleton" />
    <div v-show="!loading" class="btn-wrap">
      <button class="btn" :style="`${bg}${tc}`">
        <div class="label">{{ label }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  height: 37px;
  border-radius: 28px;
  padding: 8px 20px;
}

.btn {
  position: relative;
  padding: 8px 20px;
  border: none;
  cursor: pointer;
  transition: filter .3s ease;
  font-weight: 700;
}

.body--light .btn {
  border-radius: 28px;
}

.btn-wrap:active {
  transform: translateY(1px);
}

.btn:hover {
  filter: brightness(150%);
}

.body--light .btn:hover {
  filter: brightness(110%);
}

.btn-wrap {
  position: relative;
  padding: 3px;
  cursor: pointer;
}

.body--dark .btn-wrap::after {
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
  border-image-width: 9px !important;
  border-image: url(@/assets/frames/outer.webp) 30;
  filter: brightness(160%);
  pointer-events: none;
}

.body--light .btn-wrap::after {
  filter: brightness(1);
}

.body--dark .btn-wrap::before {
  box-shadow: none;
  content: '';
  position: absolute;
  z-index: 1;
  top: 4px;
  bottom: 4px;
  left: 4px;
  right: 4px;
  border-style: solid;
  border-image: url(@/assets/frames/inner.webp) 36;
  border-image-width: 30px;
  pointer-events: none;
  filter: invert(50%);
}

.label {
  position: relative;
  z-index: 1;
}
</style>