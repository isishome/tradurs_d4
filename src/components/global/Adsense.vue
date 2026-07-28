<script setup lang="ts">
import { onMounted, nextTick, onUnmounted, ref } from 'vue'

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
  dataFullWidthResponsive: undefined
})

const prod: boolean = import.meta.env.PROD
const adElement = ref<HTMLElement>()
let active = false
let pushRequested = false
let pushed = false
let renderTimer: number | undefined
let resizeObserver: ResizeObserver | undefined

const onPush = () => {
  if (!active || !pushRequested || pushed || !window.adsenseLoaded) return

  const element = adElement.value
  if (!element?.isConnected) return

  const { width, height } = element.getBoundingClientRect()
  if (width <= 0 || height <= 0) return

  pushed = true

  try {
    ;(window.adsbygoogle = window.adsbygoogle || []).push({})
  } catch (e) {
    console.error('Adsense push error:', e)
  }
}

const render = async () => {
  await nextTick()

  renderTimer = window.setTimeout(() => {
    pushRequested = true

    if (window.adsenseLoaded) onPush()
    else window.addEventListener('adsense-loaded', onPush, { once: true })
  }, 100)
}

onMounted(async () => {
  active = true

  if (prod && props.dataAdClient && props.dataAdSlot) {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(onPush)
      if (adElement.value) resizeObserver.observe(adElement.value)
    }

    await render()
  }
})

onUnmounted(() => {
  active = false
  if (renderTimer !== undefined) window.clearTimeout(renderTimer)
  resizeObserver?.disconnect()
  window.removeEventListener('adsense-loaded', onPush)
})
</script>

<template>
  <ins
    ref="adElement"
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
  opacity: 0.35;
}

.body--light ins.adsbygoogle::after {
  color: #1a1a1a;
}
</style>
