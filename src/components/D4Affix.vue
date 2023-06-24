<script setup lang="ts">
import { computed } from 'vue'
import { QInput } from 'quasar'
import { useItemStore } from 'stores/item-store'
import { icons } from 'src/common/icons'
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

const findAffix = computed(() => is.findAffix(props.data.affixId))
const affixInfo = computed(() => parse(findAffix.value?.label, props.data.affixValues))

const update = (): void => {
  emit('update', { valueId: props.data.valueId, affixValues: affixInfo.value.filter(i => i.type === 'variable').map(i => parseFloat(i.value.toString())) })
}

const remove = (): void => {
  emit('remove', { valueId: props.data.valueId })
}
</script>

<template>
  <div class="row no-wrap items-baseline q-gutter-xs"
    :class="{ disable, 'stress': ['legendary', 'unique'].includes(findAffix?.type as string), 'text-grey-6': findAffix?.type === 'socket' }"
    :data-id="data.valueId">
    <div>
      <q-icon class="icon" :class="{ 'rotate-45': ['standard'].includes(findAffix?.type as string) }" size="13px"
        :name="`img:${icons[findAffix?.type as keyof typeof icons]}`" />
    </div>
    <div class="row items-center q-gutter-x-xs">
      <template v-for="(comp, k) in affixInfo" :key="k">
        <template v-if="comp.type === 'text'">
          <div v-for="(word, i) in (comp.value as string).split(/\s+/g).filter(w => w !== '')" :key="i">{{ word }}
          </div>
        </template>
        <div v-else-if="!editable && comp.type === 'variable'" class="figure">{{ comp.value }}</div>
        <q-input v-else ref="ai" class="var" input-class="text-center text-caption no-padding" dense hide-bottom-space
          hide-hint no-error-icon outlined v-model.number="comp.value" maxlength="6" debounce="500" :disable="disable"
          :rules="[val => !disable && (parseFloat(val) % 1 !== 0 || parseInt(val) % 1 === 0) || '']"
          @update:model-value="update" @focus="focus" />
      </template>
      <q-btn v-show="editable" :disable="disable" dense unelevated flat round aria-label="Tradurs Editable Button"
        size="xs" :tabindex="-1" class="q-ml-sm" @click="remove">
        <img v-show="data.action !== 8" class="icon" width="13" height="13" :src="icons.close" alt="icon_close" />
        <img v-show="data.action === 8" class="icon flip-horizontal" width="13" :src="icons.refresh" alt="icon_restore" />
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