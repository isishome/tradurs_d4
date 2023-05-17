<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Property } from 'stores/item-store'
import { useItemStore } from 'stores/item-store'
import { icons } from 'src/common/icons'
import { parse } from 'src/common'

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

const properties = computed<Array<Property>>(() => store.properties.data)
const findProperty = properties.value.find(p => p.value === props.data.propertyId)
const propertyInfo = ref(parse(findProperty?.label, props.data.propertyValues))
const update = (): void => {
  emit('update', { valueId: props.data.valueId, propertyValues: propertyInfo.value.filter(i => i.type === 'variable').map(i => parseInt(i.value.toString())) })
}

const remove = () => {
  emit('remove', { valueId: props.data.valueId })
}

const focus = (evt: Event) => {
  const el: HTMLInputElement | null = (evt.target as Element)?.closest('input')
  el?.select()
}

watch(() => props.data, () => {
  propertyInfo.value = parse(findProperty?.label, props.data.propertyValues)
})
</script>

<template>
  <div class="row items-center">
    <div class="row no-wrap q-gutter-x-xs" :class="disable ? 'disable' : ''" :data-id="data.valueId">
      <div>
        <q-icon class="icon"
          :class="['regular', 'offensive', 'defensive', 'utility', 'resistance'].includes(findProperty?.type as string) ? 'rotate-45' : ''"
          size="13px" :name="`img:${icons[findProperty?.type as keyof typeof icons || 'regular']}`" />
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