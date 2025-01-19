<script setup lang="ts">
import { useScript } from 'src/composables/script'

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

useScript(
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5110777286519562',
  () => {
    ;(window.adsbygoogle || []).push({})
  },
  { async: true, crossOrigin: 'anonymous' }
)
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
