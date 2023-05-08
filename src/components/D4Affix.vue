<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { QInput } from 'quasar'
import type { Affix } from 'stores/item-store'
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

const affixes = computed<Array<Affix>>(() => store.affixes.data)
const findAffix = affixes.value.find(a => a.value === props.data.affixId)
const affixType = findAffix ? findAffix.type : ''
const affixInfo = ref(parse(findAffix?.label, props.data.affixValues))

const update = (): void => {
  emit('update', { valueId: props.data.valueId, affixValues: affixInfo.value.filter(i => i.type === 'variable').map(i => parseInt(i.value.toString())) })
}

const remove = (): void => {
  emit('remove', { valueId: props.data.valueId })
}

const focus = (evt: Event) => {
  const el: HTMLInputElement | null = (evt.target as Element)?.closest('input')

  if (el)
    el.select()
}

watch(() => props.data, (val) => {
  affixInfo.value = parse(findAffix?.label, val.affixValues)
})
</script>

<template>
  <div class="row items-center"
    :class="affixType === 'unique' ? 'unique' : affixType === 'socket' ? 'text-grey-6' : ''">
    <div class="row no-wrap q-gutter-x-xs" :class="disable ? 'disable' : ''" :data-id="data.valueId">
      <div>
        <q-icon class="icon"
          :class="['regular', 'offensive', 'defensive', 'utility'].includes(affixType) ? 'rotate-45' : ''" size="13px"
          :name="`img:${icons[affixType as keyof typeof icons]}`" />
      </div>
      <div class="row items-center q-gutter-x-xs">
        <template v-for="(comp, k) in affixInfo" :key="k">
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