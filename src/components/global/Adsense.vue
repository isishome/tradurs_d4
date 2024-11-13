<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface IProps {
  dataAdClient: string
  dataAdSlot: string
  dataAdFormat?: string
  dataAdtest?: boolean
  dataFullWidthResponsive?: string
}

withDefaults(defineProps<IProps>(), {
  dataAdFormat: undefined,
  dataAdtest: undefined,
  dataFullWidthResponsive: undefined
})

// variable
const insRef = ref<HTMLElement>()

// function
const render = () => {
  requestAnimationFrame(() => {
    ;(window.adsbygoogle || []).push({})
  })
}

// hook
onMounted(() => {
  // if (document.readyState !== 'complete')
  //   window.addEventListener('load', render)
  // else render()
  render()
})
</script>

<template>
  <ins
    ref="insRef"
    class="adsbygoogle ins"
    :data-ad-client="dataAdClient"
    :data-ad-slot="dataAdSlot"
    :data-ad-format="dataAdFormat"
    :data-adtest="dataAdtest ? 'on' : null"
    :data-full-width-responsive="dataFullWidthResponsive"
  ></ins>
</template>

<style scoped>
.ins {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05);
  background-color: rgba(255, 255, 255, 0.05);
  position: relative;
  min-height: 50px;
}

.body--light .ins {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
  background-color: rgba(0, 0, 0, 0.05);
}

.ins[data-ad-status='filled'] {
  background-color: inherit !important;
  box-shadow: none !important;
}

.ins[data-ad-status='filled']::after {
  content: '';
}

.ins::after {
  content: 'AD';
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: -1;
  transform: translate(-50%, -50%);
  color: #efefef;
  opacity: 0.2;
}

.body--light .ins::after {
  color: #1a1a1a;
}
</style>
