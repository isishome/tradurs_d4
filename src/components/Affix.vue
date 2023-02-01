<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useItemStore } from '@/stores/item'
import regular from '@/assets/attribute_types/regular.svg'
import legendary from '@/assets/attribute_types/legendary.svg'
import unique from '@/assets/attribute_types/unique.svg'
import socket from '@/assets/attribute_types/socket.svg'

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

const icons = {
  regular,
  legendary,
  unique,
  socket
}
const $q = useQuasar()
const store = useItemStore()
const affixes = computed(() => store.affixes.data)
const findAffix = affixes.value ? affixes.value.find(a => a.value === props.data.affix_id) : null
const affixType = findAffix ? findAffix.type : ''
const affixInfo = ref(findAffix ? findAffix.label.split(/\{x\}/g).reduce((acc, e, i) => {
  if (i === 0)
    return [{ type: 'text', value: e }]
  return [...acc, { type: 'variable', value: props.data.affix_values[i - 1] || 0 }, { type: 'text', value: e }]
}, []) : [])

const update = () => {
  emit('update', { valueId: props.data.value_id, affixValues: affixInfo.value.filter(i => i.type === 'variable').map(i => parseInt(i.value)) })
}

const remove = () => {
  emit('remove', { valueId: props.data.value_id })
}

watch(() => props.data, (val) => {
  affixInfo.value = findAffix.label.split(/\{x\}/g).reduce((acc, e, i) => {
    if (i === 0)
      return [{ type: 'text', value: e }]
    return [...acc, { type: 'variable', value: val.affix_values[i - 1] || 0 }, { type: 'text', value: e }]
  }, [])
})
</script>

<template>
  <div class="row items-center"
    :class="affixType === 'unique' ? 'unique' : affixType === 'socket' ? 'text-grey-7' : ''">
    <div class="row no-wrap q-gutter-x-xs" :class="data.disable ? 'disable' : ''">
      <div>
        <q-icon class="icon" :class="affixType === 'regular' ? 'rotate-45' : ''" size="13px"
          :name="`img:${icons[affixType]}`" />
      </div>
      <div class="row items-center q-gutter-x-xs">
        <template v-for="(comp, k) in affixInfo" :key="k">
          <template v-if="comp.type === 'text'">
            <div v-for="(word, i) in comp.value.split(/\s+/g).filter(w => w !== '')" :key="i">{{ word }}
            </div>
          </template>
          <div v-else-if="!editable && comp.type === 'variable'">{{ comp.value }}</div>
          <q-input v-else class="var" input-class="text-center text-caption no-padding" dense hide-bottom-space
            hide-hint no-error-icon outlined v-model="comp.value" type="tel" maxlength="3" mask="###" debounce="500"
            :disable="data.disable"
            :rules="[val => !data.disable && Number.isInteger(parseInt(val)) && parseInt(val) !== 0 || '']"
            @update:model-value="update" @focus="evt => evt.target.select()" />
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