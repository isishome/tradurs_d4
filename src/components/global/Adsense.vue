<script setup lang="ts">
import { onMounted, nextTick, onUnmounted } from 'vue'

interface IProps {
  dataAdClient?: string
  dataAdSlot: string
  dataAdFormat?: string
  dataAdtest?: boolean
  dataFullWidthResponsive?: string
}

withDefaults(defineProps<IProps>(), {
  dataAdClient: 'ca-pub-5110777286519562',
  dataAdFormat: undefined,
  dataAdtest: undefined,
  dataFullWidthResponsive: undefined
})

const prod: boolean = import.meta.env.PROD

const pushAdsense = () => {
  try {
    ;(window.adsbygoogle = window.adsbygoogle || []).push({})
  } catch (e) {
    console.error('Adsense push error:', e)
  }
}

const render = () => {
  void nextTick(() => {
    setTimeout(() => {
      if (window.adsenseLoaded) pushAdsense()
      else window.addEventListener('adsense-loaded', pushAdsense)
    }, 100)
  })
}

onMounted(() => {
  if (prod) render()
})

onUnmounted(() => {
  window.removeEventListener('adsense-loaded', pushAdsense)
})
</script>

<template>
  <ins
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
