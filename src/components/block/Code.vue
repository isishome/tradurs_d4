<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  language: {
    type: String,
    default: 'html'
  },
  intersection: {
    type: Boolean,
    default: false
  },
  convert: {
    type: Object,
    default: () => {
      return {}
    }
  }
})

const $q = useQuasar()
const touch = computed(() => $q.platform.has.touch)
const lang = computed(() => props.convert[props.language] || props.language)
const Prism = window.Prism
Prism.disableWorkerMessageHandler = true

onMounted(() => {
  if (code.value)
    Prism.highlightElement(code.value)
})

const code = ref(null)
const onIntersection = (entry) => {
  if (!$q.platform.has.touch && props.intersection && entry.isIntersecting)
    Prism.highlightElement(code.value)
}

</script>

<template>
  <div v-if="touch" class="pre-wrap" :data-language="lang">
    <pre><code ref="code" :class="`language-${language}`">{{ $slots.default()[0].children.replace(/^[\r\n\s]{0,}/, '').replace(/[\r\n\s]{0,}$/, '') }}</code></pre>
  </div>
  <div v-else v-intersection.once="onIntersection" class="pre-wrap" :data-language="lang">
    <pre><code ref="code" :class="`language-${language}`">{{ $slots.default()[0].children.replace(/^[\r\n\s]{0,}/, '').replace(/[\r\n\s]{0,}$/, '') }}</code></pre>
  </div>
</template>

<style scoped>
.pre-wrap {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: #202030;
  transition: background-color .3s ease, max-height .6s ease, margin-top .6s ease;
}

.body--dark .pre-wrap {
  background-color: #242424;
}

.pre-wrap::before {
  content: attr(data-language);
  position: absolute;
  z-index: 2;
  color: rgba(255, 255, 255, .3);
  top: 4px;
  right: 10px;
  font-weight: 500;
  letter-spacing: .5px;
  font-size: 12px;
}

@media (max-width: 480px) {
  .pre-wrap {
    border-radius: 0;
    margin-left: -16px;
    margin-right: -16px;
  }

  .pre-wrap::before {
    top: 1px;
    right: 5px;
    font-size: 11px;
  }
}

.pre-wrap:deep(pre[class*=language-]) {
  background-color: transparent;
  padding: 1em 1.6em;
}

.pre-wrap:deep(code[class*=language-]) {
  font-size: 14px !important;
  background-color: transparent;
}
</style>