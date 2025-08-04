<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface IProps {
  dataAdClient?: string
  dataAdSlot: string
  dataAdFormat?: string
  dataAdtest?: boolean
  dataFullWidthResponsive?: string
  repeat?: number
}

const props = withDefaults(defineProps<IProps>(), {
  dataAdClient: 'ca-pub-5110777286519562',
  dataAdFormat: undefined,
  dataAdtest: undefined,
  dataFullWidthResponsive: undefined,
  repeat: 5
})

const prod: boolean = import.meta.env.PROD
let timer: NodeJS.Timeout
const currentRepeat = ref(0)

const render = () => {
  currentRepeat.value++
  if (currentRepeat.value > props.repeat) clearTimeout(timer)
  else if (!!window?.adsbygoogle) (window.adsbygoogle || []).push({})
  else timer = setTimeout(render, 400)
}

const load = () => {
  const adURL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${props.dataAdClient}`
  const script = document.createElement('script')
  script.src = adURL

  script.async = true
  script.crossOrigin = 'anonymous'

  if (!document.head.querySelector(`script[src="${adURL}"]`)) {
    script.onload = () => {
      render()
    }

    document.head.appendChild(script)
  } else render()
}

onMounted(() => {
  if (prod) load()
})

onUnmounted(() => {
  clearTimeout(timer)
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
