<script setup lang="ts">
import { onMounted, nextTick, onUnmounted } from 'vue'

type Props = {
  dataAdClient: string
  dataAdSlot: string
  dataAdFormat?: string
  dataAdtest?: boolean
  dataFullWidthResponsive?: string
}

const props = withDefaults(defineProps<Props>(), {
  dataAdFormat: undefined,
  dataAdtest: undefined,
  dataFullWidthResponsive: 'false'
})

const prod: boolean = import.meta.env.PROD

const onPush = () => {
  try {
    ;(window.adsbygoogle = window.adsbygoogle || []).push({})
  } catch (e) {
    console.error('Adsense push error:', e)
  }
}

const render = async () => {
  await nextTick()

  if (window.adsenseLoaded) onPush()
  else window.addEventListener('adsense-loaded', onPush)
}

onMounted(async () => {
  if (prod && !(!props.dataAdClient || !props.dataAdSlot)) await render()
})

onUnmounted(() => {
  window.removeEventListener('adsense-loaded', onPush)
})
</script>

<template>
  <ins
    class="adsbygoogle"
    :data-ad-client="dataAdClient"
    :data-ad-slot="dataAdSlot"
    :data-ad-format="dataAdFormat"
    :data-adtest="dataAdtest ? 'on' : null"
    :data-full-width-responsive="dataFullWidthResponsive"
  ></ins>
</template>

<style lang="scss" scoped>
ins.adsbygoogle {
  display: block;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05);
  background-color: rgba(255, 255, 255, 0.05);
  position: relative;
  min-height: 50px;

  &[data-ad-status='filled'] {
    box-shadow: none;
    background-color: transparent;
  }
}

.body--light ins.adsbygoogle {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
  background-color: rgba(0, 0, 0, 0.05);
}

ins.adsbygoogle::after {
  content: 'AD';
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: -1;
  transform: translate(-50%, -50%);
  color: #efefef;
  opacity: 0.2;
}

ins.adsbygoogle[data-ad-status='unfilled'] {
  display: none !important;
}

.body--light ins.adsbygoogle::after {
  color: #1a1a1a;
}
</style>
