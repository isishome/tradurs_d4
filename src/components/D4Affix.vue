<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar, QInput, uid } from 'quasar'
import { useItemStore } from 'stores/item-store'
import { type Attribute, parseAffix, splitArray, focus } from 'src/common'
import { AffixValue } from 'src/types/item'

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

const $q = useQuasar()
const is = useItemStore()

const findAffix = computed(() => is.findAffix(props.data.affixId))
const affixGreater = computed(() => props.data.affixGreater ?? false)
const _affixGreater = ref<boolean>(props.data.affixGreater ?? false)
const affixInfo = computed(() =>
  parseAffix(findAffix.value?.label, props.data.affixValues)
)
const affixColor = computed(
  () =>
    findAffix.value?.color ||
    (['legendary', 'unique'].includes(findAffix.value?.type as string)
      ? 'stress'
      : findAffix.value?.type === 'socket'
      ? 'text-grey-6'
      : '')
)
const isStandard = computed(() =>
  ['standard'].includes(findAffix.value?.type ?? '')
)
const isToggle = computed(
  () => props.editable && ['standard'].includes(findAffix.value?.type ?? '')
)
const icon = computed(
  () =>
    `img:/images/attribute_types/${
      findAffix.value?.type === 'socket' && findAffix.value?.color
        ? 'socket_malignant'
        : (props.editable || affixGreater.value) &&
          findAffix.value?.type === 'standard' &&
          $q.dark.isActive
        ? 'greater'
        : (props.editable || affixGreater.value) &&
          findAffix.value?.type === 'standard' &&
          !$q.dark.isActive
        ? 'greater_invert'
        : findAffix.value?.type
    }.svg`
)

const update = (): void => {
  const av: {
    valueId: number
    affixGreater: boolean
    affixValues: Array<AffixValue>
  } = {
    valueId: props.data.valueId,
    affixGreater: _affixGreater.value,
    affixValues: []
  }
  const minmax = splitArray(
    affixInfo.value
      .filter((i) => i.type === 'min' || i.type === 'max')
      .map((i) => i.value as number),
    2
  )
  affixInfo.value
    .filter((i) => i.type === 'variable')
    .forEach((attr: Attribute, idx: number) => {
      av.affixValues.push({
        valueRangeId: uid(),
        value: parseFloat(attr.value.toString()) as number,
        min: parseFloat(minmax[idx][0].toString()),
        max: parseFloat(minmax[idx][1].toString())
      })
    })

  emit('update', av)
}

const toggleGreater = () => {
  if (!isToggle.value) return

  _affixGreater.value = !_affixGreater.value
  update()
}

const remove = (): void => {
  emit('remove', { valueId: props.data.valueId })
}
</script>

<template>
  <div
    class="row no-wrap items-baseline q-gutter-xs"
    :class="[disable, affixColor]"
    :data-id="data.valueId"
  >
    <div
      class="text-center"
      :class="{ 'cursor-pointer': isToggle }"
      style="width: 21px"
      @click="toggleGreater"
    >
      <q-icon
        v-show="editable"
        class="icon"
        :class="{ greater: isStandard, active: affixGreater }"
        size="10px"
        :name="icon"
      />
      <q-icon
        v-show="!editable"
        class="icon"
        :class="{ 'rotate-45': isStandard, 'greater active': affixGreater }"
        size="10px"
        :name="icon"
      />
    </div>
    <div class="col">
      <div
        class="row items-center q-gutter-x-xs q-ml-none inline"
        :class="[{ 'filtered': is.filter.affixes.map(a => a.affixId).includes(findAffix?.value as number) }, findAffix?.color, { 'text-shadow': findAffix?.color }]"
      >
        <template v-for="(comp, k) in affixInfo" :key="k">
          <template v-if="comp.type === 'text'">
            <div
              v-for="(word, i) in (comp.value as string).split(/\s+/g).filter(w => w !== '')"
              :key="i"
            >
              {{ word }}
            </div>
          </template>
          <template v-if="!editable">
            <div v-if="comp.type === 'variable'" class="figure">
              {{ comp.value }}
            </div>
            <div
              v-if="
                comp.type === 'min' &&
                Number(comp.value) + Number(affixInfo[k + 1].value) > 0
              "
              class="minmax-text"
            >
              [{{ comp.value }} - {{ affixInfo[k + 1].value }}]
            </div>
          </template>
          <template v-else>
            <q-input
              v-if="comp.type === 'variable'"
              class="var"
              input-class="text-center text-caption no-padding"
              dense
              hide-bottom-space
              hide-hint
              no-error-icon
              outlined
              v-model.number="(comp.value as number)"
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
            <div
              v-else-if="comp.type === 'min'"
              class="minmax row items-center q-gutter-x-xs"
            >
              <div>[</div>
              <q-input
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
              <div>-</div>
              <q-input
                class="var"
                input-class="text-center text-caption no-padding"
                dense
                hide-bottom-space
                hide-hint
                no-error-icon
                outlined
                v-model.number="affixInfo[k + 1].value"
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
              <div>]</div>
            </div>
          </template>
        </template>
        <q-btn
          v-show="editable"
          :disable="disable"
          dense
          unelevated
          flat
          round
          aria-label="Tradurs Editable Button"
          size="xs"
          :tabindex="-1"
          class="q-ml-sm"
          @click="remove"
        >
          <img
            v-show="data.action !== 8"
            class="icon"
            width="13"
            height="13"
            src="/images/icons/close.svg"
            alt="Tradurs Remove Icon"
          />
          <img
            v-show="data.action === 8"
            class="icon flip-horizontal"
            width="13"
            src="/images/icons/restore.svg"
            alt="Tradurs Restore Icon"
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
  opacity: 0.3;
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

.stress:deep(.figure) {
  color: rgb(163, 163, 234);
}

.body--light .stress:deep(.figure) {
  color: rgb(123, 123, 234);
}

.minmax-text {
  color: rgba(200, 220, 255, 0.8);
}

.body--light .minmax-text {
  color: rgba(0, 0, 220, 0.6);
}

.minmax {
  opacity: 0.8;
}

.minmax:deep(.q-field__control::before) {
  background-color: rgba(60, 60, 100, 1);
}

.body--light .minmax:deep(.q-field__control::before) {
  background-color: rgba(45, 0, 150, 0.2);
}

.text-shadow {
  text-shadow: 1px 1px 0 var(--q-dark);
}
</style>
