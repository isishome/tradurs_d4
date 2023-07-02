<script setup lang="ts">
import { computed } from 'vue'
import { QInput } from 'quasar'
import { useItemStore } from 'stores/item-store'
import { parse, focus } from 'src/common'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  },
  disable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update', 'remove'])

const is = useItemStore()

const findRestriction = computed(() => is.findRestriction(props.data.restrictId))
const restrictionInfo = computed(() => parse(findRestriction.value?.label, props.data.restrictValues))

const update = (): void => {
  emit('update', { valueId: props.data.valueId, restrictValues: restrictionInfo.value.filter(i => i.type === 'variable').map(i => parseFloat(i.value.toString())) })
}

const remove = (): void => {
  emit('remove', { valueId: props.data.valueId })
}
</script>

<template>
  <div class="row no-wrap items-baseline q-gutter-xs" :class="{ disable, 'justify-end': !editable }"
    :data-id="data.valueId">
    <div class="row items-center q-gutter-x-xs">
      <template v-for="comp, k in restrictionInfo" :key="k">
        <template v-if="comp.type === 'text'">
          <div v-for="(word, i) in (comp.value as string).split(/\s+/g).filter(w => w !== '')" :key="i">{{ word }}
          </div>
        </template>
        <div v-else-if="!editable && comp.type === 'variable'">{{ comp.value }}</div>
        <q-input v-else class="var" input-class="text-center text-caption no-padding" dense hide-bottom-space hide-hint
          no-error-icon outlined v-model.number="comp.value" maxlength="6" debounce="500" :disable="disable"
          :rules="[val => !disable && (parseFloat(val) % 1 !== 0 || parseInt(val) % 1 === 0) || '']"
          @update:model-value="update" @focus="focus" />
      </template>
      <q-btn v-show="editable" :disable="disable" dense unelevated flat round aria-label="Tradurs Remove/Restore Button"
        size="xs" :tabindex="-1" class="q-ml-sm" @click="remove">
        <img v-show="data.action !== 8" class="icon" width="13" height="13" src="/images/icons/close.svg"
          alt="icon_close" />
        <img v-show="data.action === 8" class="icon flip-horizontal" width="13" height="13"
          src="/images/icons/restore.svg" alt="icon_restore" />
      </q-btn>
    </div>
  </div>
</template>
<style scoped>
.disable {
  user-select: none;
  pointer-events: none;
  opacity: .3;
  position: relative;
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
</style>