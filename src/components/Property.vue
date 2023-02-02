<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import type { Property } from '@/stores/item'
import { useItemStore } from '@/stores/item'
import { icons } from '@/common/icons'
import { parse } from '@/common'

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => { }
  },
  editable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update', 'remove'])

const $q = useQuasar()
const store = useItemStore()

const properties = computed<Array<Property>>(() => store.properties.data)
const findProperty = properties.value.find(p => p.value === props.data.propertyId)
const propertyInfo = ref(parse(findProperty?.label, props.data.propertyValues))
const update = (): void => {
  emit('update', { valueId: props.data.valueId, propertyValues: propertyInfo.value.filter(i => i.type === 'variable').map(i => parseInt(i.value.toString())) })
}

const remove = () => {
  emit('remove', { valueId: props.data.valueId })
}

watch(() => props.data, (val) => {
  propertyInfo.value = parse(findProperty?.label, props.data.propertyValues)
})
</script>

<template>
  <div class="row items-center">
    <div class="row no-wrap q-gutter-x-xs" :class="data.disable ? 'disable' : ''">
      <div>
        <q-icon class="icon" :class="findProperty?.type === 'regular' ? 'rotate-45' : ''" size="13px"
          :name="`img:${icons[findProperty?.type || '']}`" />
      </div>
      <div class="row items-center q-gutter-x-xs">
        <template v-for="(comp, k) in propertyInfo" :key="k">
          <template v-if="comp.type === 'text'">
            <div v-for="(word, i) in (comp.value as string).split(/\s+/g).filter(w => w !== '')" :key="i">{{ word }}
            </div>
          </template>
          <div v-else-if="!editable && comp.type === 'variable'">{{ comp.value }}</div>
          <q-input v-else class="var" input-class="text-center text-caption no-padding" dense hide-bottom-space
            hide-hint no-error-icon outlined v-model="comp.value" type="tel" maxlength="3" mask="###" debounce="500"
            :disable="data.disable"
            :rules="[val => !data.disable && Number.isInteger(parseInt(val)) && parseInt(val) !== 0 || '']"
            @update:model-value="update" @focus="evt => (evt.target as HTMLInputElement).select()" />
        </template>
      </div>
    </div>
    <q-btn v-show="editable" dense unelevated flat round size="xs" class="q-ml-sm" @click="remove">
      <img v-show="data.action !== 8" class="icon" width="13" src="@/assets/icons/close.svg" />
      <img v-show="data.action === 8" class="icon flip-horizontal" width="13" src="@/assets/icons/restore.svg" />
    </q-btn>
  </div>
</template>
<style scoped>
.disable {
  user-select: none;
  pointer-events: none;
  opacity: .5;
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