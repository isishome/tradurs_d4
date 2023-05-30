<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { QInput } from 'quasar'
import { useItemStore, type Restriction } from 'stores/item-store'
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

const store = useItemStore()

const restrictions = computed<Array<Restriction>>(() => store.restrictions.data)
const findRestriction = restrictions.value.find(r => r.value === props.data.restrictId)
const restrictionInfo = ref(parse(findRestriction?.label, props.data.restrictValues))

const update = (): void => {
  emit('update', { valueId: props.data.valueId, restrictValues: restrictionInfo.value.filter(i => i.type === 'variable').map(i => parseInt(i.value.toString())) })
}

const remove = (): void => {
  emit('remove', { valueId: props.data.valueId })
}

watch(() => props.data, (val) => {
  restrictionInfo.value = parse(findRestriction?.label, val.restrictValues)
})
</script>

<template>
  <div class="row items-center">
    <div class="row no-wrap q-gutter-xs" :class="{ disable }" :data-id="data.valueId">
      <div class="row items-center q-gutter-xs">
        <template v-for="comp, k in restrictionInfo" :key="k">
          <template v-if="comp.type === 'text'">
            <div v-for="(word, i) in (comp.value as string).split(/\s+/g).filter(w => w !== '')" :key="i">{{ word }}
            </div>
          </template>
          <div v-else-if="!editable && comp.type === 'variable'">{{ comp.value }}</div>
          <q-input v-else ref="ai" class="var" input-class="text-center text-caption no-padding" dense hide-bottom-space
            hide-hint no-error-icon outlined v-model="comp.value" type="tel" maxlength="3" mask="###" debounce="500"
            :disable="disable" :rules="[val => !disable && Number.isInteger(parseInt(val)) || '']"
            @update:model-value="update" @focus="focus" />
        </template>

      </div>
    </div>
    <q-btn v-show="editable" :disable="disable" dense unelevated flat round size="xs" class="q-ml-sm" @click="remove">
      <img v-show="data.action !== 8" class="icon" width="13" src="~assets/icons/close.svg" />
      <img v-show="data.action === 8" class="icon flip-horizontal" width="13" src="~assets/icons/restore.svg" />
    </q-btn>
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