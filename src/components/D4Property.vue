<script setup lang="ts">
import { computed } from 'vue'
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

const findProperty = computed(() => is.findProperty(props.data.propertyId))
const propertyInfo = computed(() =>
  parse(findProperty.value?.label, props.data.propertyValues)
)
const isStandard = computed(() =>
  ['standard'].includes(findProperty.value?.type ?? '')
)
const update = (): void => {
  emit('update', {
    valueId: props.data.valueId,
    propertyValues: propertyInfo.value
      .filter((i) => i.type === 'variable')
      .map((i) => parseFloat(i.value.toString()))
  })
}

const remove = () => {
  emit('remove', { valueId: props.data.valueId })
}
</script>

<template>
  <div
    class="row no-wrap items-baseline q-gutter-xs"
    :class="{ disable }"
    :data-id="data.valueId"
  >
    <div class="text-center" style="width: 21px">
      <q-icon
        class="icon"
        :class="{ 'rotate-45': isStandard }"
        :size="isStandard ? '8px' : '10px'"
        :name="`img:/images/attribute_types/${
          findProperty?.type || 'standard'
        }.svg`"
      />
    </div>
    <div class="col">
      <div
        class="row items-center q-gutter-x-xs inline"
        :class="{ 'filtered': is.filter.properties.includes(findProperty?.value as number) }"
      >
        <template v-for="(comp, k) in propertyInfo" :key="k">
          <template v-if="comp.type === 'text'">
            <div
              v-for="(word, i) in (comp.value as string).split(/\s+/g).filter(w => w !== '')"
              :key="i"
            >
              {{ word }}
            </div>
          </template>
          <div v-else-if="!editable && comp.type === 'variable'" class="figure">
            {{ comp.value }}
          </div>
          <q-input
            v-else-if="comp.type === 'variable'"
            class="var"
            input-class="text-center text-caption no-padding"
            dense
            hide-bottom-space
            hide-hint
            no-error-icon
            outlined
            v-model.number="comp.value"
            maxlength="6"
            debounce="500"
            :disable="disable"
            :rules="[
              (val) =>
                (!disable &&
                  (parseFloat(val) % 1 !== 0 || parseInt(val) % 1 === 0)) ||
                ''
            ]"
            @update:model-value="update"
            @focus="focus"
          />
        </template>
        <q-btn
          v-show="editable"
          :disable="disable"
          dense
          unelevated
          flat
          round
          aria-label="Tradurs Remove Button"
          size="xs"
          :tabindex="-1"
          class="q-ml-sm"
          @click="remove"
        >
          <img
            class="icon"
            width="13"
            height="13"
            src="/images/icons/close.svg"
            alt="Tradurs Remove Icon"
          />
        </q-btn>
      </div>
    </div>
  </div>
</template>
<style scoped>
.disable {
  user-select: none;
  pointer-events: none;
  opacity: 0.5;
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
