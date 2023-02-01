<script setup>
import { ref, onMounted } from 'vue'
const props = defineProps({
  options: {
    type: Array,
    default: () => {
      return []
    }
  },
  nonCode: {
    type: Boolean,
    default: false
  }
})

const tab = ref('')
const panel = ref(null)
const hideCode = ref(true)

const setMaxHeight = () => {
  const pres = panel.value.$el.querySelectorAll('.pre-wrap pre')
  pres.forEach(p => {
    if (p.closest('.pre-wrap'))
      p.closest('.pre-wrap').style.maxHeight = `${p.offsetHeight + 10}px`
  })
}

onMounted(() => {
  setTimeout(() => {
    tab.value = props.options.length > 0 ? props.options[0].value : ''
  }, 100)
})

</script>

<template>
  <div class="practice">
    <div class="q-pa-sm">
      <div class="row justify-between items-center">
        <q-option-group v-model="tab" inline size="xs" :options="options" class="q-mb-sm col">
          <template #label="opt">
            <div class="col-12">
              <div v-if="nonCode">{{ opt.label }}</div>
              <code v-else>{{ opt.label }}</code>
            </div>
          </template>
        </q-option-group>
        <div>
          <q-btn dense round flat size="sm" padding="4px" icon="code" @click="hideCode = !hideCode" />
        </div>
      </div>
    </div>
    <q-separator />
    <q-tab-panels ref="panel" class="panel q-px-sm q-pb-sm" :class="hideCode ? 'hide' : ''" v-model="tab"
      @transition="setMaxHeight" animated transition-prev="jump-down" transition-next="jump-up">
      <q-tab-panel v-for="o in options" :key="o.value" :name="o.value">
        <slot :name="o.value"></slot>
      </q-tab-panel>
    </q-tab-panels>
    <slot name="result"></slot>
  </div>
</template>
<style scoped>
.practice {
  margin-bottom: 2rem;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .2);
  border-radius: 8px;
}

.body--dark .practice {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, .1);
}

.q-tab-panels {
  background-color: transparent;
}

.q-tab-panel {
  padding: 0;
  margin: 0 !important;
  overflow: hidden;
}

.panel:deep(.info) {
  background-color: transparent !important;
  padding: 0;
}

.panel:deep(.outer) {
  margin-top: 10px;
  margin-bottom: 0;
  background-color: transparent !important;
}

@media (max-width: 480px) {
  .panel:deep(.pre-wrap) {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}

.og:deep(.q-radio__inner) {
  font-size: 2em;
  height: 1em;
}

.panel:deep(.pre-wrap) {
  margin-top: 10px;
}

.panel.hide:deep(.pre-wrap) {
  margin-top: 0 !important;
  max-height: 0 !important;
}
</style>