<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { QList, QSelect } from 'quasar'
import { type Attr, type AttrOption } from 'src/stores/item-store'

import D4Attr from 'components/D4Attr.vue'

interface IProps {
  data?: Array<Attr>
  options?: Array<AttrOption>
  maxValues?: number
  disable?: boolean
  searchMessage?: string
  noMessage?: string
  greatable?: boolean
  noIcon?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  data: () => [],
  options: () => [],
  maxValues: 6,
  disable: false,
  searchMessage: '',
  noMessage: '',
  greatable: false,
  noIcon: false
})

const emit = defineEmits(['update'])

const selectedAttrValues = ref<Array<number | string>>(
  props.data.map((d) => d.value)
)
const selectedAttrs = ref<Array<Attr>>(JSON.parse(JSON.stringify(props.data)))
const attrRef = ref<QSelect | null>(null)
const attrListRef = ref<QList | null>(null)
const attrNeedle = ref<string>()
const filteredOptions = computed(() =>
  !!attrNeedle.value
    ? props.options.filter(
        (o) =>
          o.label.toLowerCase().indexOf(attrNeedle.value ?? '') !== -1 ||
          (o.effect ?? '').toLowerCase().indexOf(attrNeedle.value ?? '') !== -1
      )
    : props.options
)
const findOption = computed(
  () => (val: number | string) => props.options.find((o) => o.value === val)
)

const moveScrollTarget = (listNode: QList | null) => {
  nextTick(() => {
    listNode?.$el?.querySelector('div.q-item:last-child').scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    })
  })
}

const filterAttrs = (e: KeyboardEvent) => {
  const val = (e.target as HTMLInputElement).value.toLowerCase()
  attrRef.value?.showPopup()
  attrRef.value?.updateInputValue(val)
  attrNeedle.value = val
}

const selectAttr = (val: number | string): void => {
  const findIndexAttr = selectedAttrs.value.findIndex((a) => a.value === val)

  if (findIndexAttr === -1) {
    const attr: Attr = {
      value: val,
      minmax: props.options
        .find((o) => o.value === val)
        ?.label.match(/\{x\}/g)
        ?.map(() => ({ min: 0, max: 9999 }))
    }
    if (props.greatable) attr.affixGreater = 0
    selectedAttrs.value.push(attr)
    attrRef.value?.hidePopup()
    attrNeedle.value = undefined
    moveScrollTarget(attrListRef.value)
  } else {
    attrRef.value?.hidePopup()
    removeAttr(val)
  }

  update()
}

const removeAttr = (val?: number | string): void => {
  const findIndexAttr = selectedAttrs.value.findIndex((a) => a.value === val)
  const findIndexSelectedAttr = selectedAttrValues.value.findIndex(
    (sa) => sa === val
  )

  if (findIndexAttr !== -1 && findIndexSelectedAttr !== -1) {
    selectedAttrs.value?.splice(findIndexAttr, 1)
    selectedAttrValues.value?.splice(findIndexSelectedAttr, 1)
    moveScrollTarget(attrListRef.value)

    update()
  }
}

const update = () => {
  emit('update', selectedAttrs.value)
}

watch(
  () => props.data,
  (val) => {
    selectedAttrValues.value = val.map((d) => d.value)
    selectedAttrs.value = [...props.data]
  },
  {
    immediate: true
  }
)
</script>

<template>
  <q-item :disable="disable">
    <q-item-section class="no-wrap">
      <q-select
        ref="attrRef"
        v-model="selectedAttrValues"
        class="col"
        :disable="disable || selectedAttrValues.length === maxValues"
        :max-values="maxValues"
        outlined
        dense
        no-error-icon
        use-input
        hide-bottom-space
        hide-selected
        emit-value
        map-options
        multiple
        transition-show="none"
        transition-hide="none"
        :transition-duration="0"
        :label="searchMessage"
        :options="filteredOptions"
        dropdown-icon="img:/images/icons/dropdown.svg"
        popup-content-class="scroll bordered limit-select"
        @input.stop="filterAttrs"
        @blur="() => (attrNeedle = undefined)"
      >
        <template #option="scope">
          <q-item v-bind="scope.itemProps" @click="selectAttr(scope.opt.value)">
            <q-item-section v-if="!noIcon" side>
              <q-img
                v-if="scope.opt.effect"
                :src="`/images/items/rune/${scope.opt.type}/${scope.opt.value}.webp`"
                width="16px"
                no-spinner
                no-transition
              />
              <q-icon
                v-else
                class="icon"
                :class="{ 'rotate-45': ['standard'].includes(scope.opt.type as string) }"
                size="8px"
                :name="`img:/images/attribute_types/${
                  scope.opt.type || 'standard'
                }.svg`"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label
                v-for="(l, idx) in (scope.opt.effect ?? scope.opt.label).split(
                  '|'
                )"
                :key="idx"
                :class="scope.opt.color"
                >{{ l }}</q-item-label
              >
            </q-item-section>
          </q-item>
        </template>

        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">
              {{ noMessage }}
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </q-item-section>
  </q-item>
  <q-list
    ref="attrListRef"
    dense
    class="attr q-mx-md scroll"
    v-if="selectedAttrs.length > 0"
  >
    <template v-for="(sa, idx) in selectedAttrs" :key="idx">
      <q-separator v-show="idx !== 0" inset />
      <q-item :disable="disable" class="q-mx-sm q-my-xs">
        <q-item-section side>
          <q-img
            v-if="typeof sa.value === 'string' && !noIcon"
            :src="`/images/items/rune/${findOption(sa.value)?.type}/${
              sa.value
            }.webp`"
            width="16px"
          />
          <template v-else-if="!noIcon">
            <q-rating
              v-if="
                findOption(sa.value)?.type === 'standard' &&
                typeof sa.value === 'number' &&
                greatable
              "
              v-model="sa.affixGreater as number"
              :disable="disable"
              class="outline"
              size="12px"
              max="1"
              icon="img:/images/attribute_types/greater_invert.svg"
            />
            <q-icon
              v-else
              class="icon"
              :class="{
                'rotate-45': findOption(sa.value)?.type === 'standard'
              }"
              size="8px"
              :name="`img:/images/attribute_types/${
                findOption(sa.value)?.type || 'standard'
              }.svg`"
            />
          </template>
        </q-item-section>
        <q-item-section>
          <D4Attr
            :data="sa"
            :label="findOption(sa.value)?.effect ?? findOption(sa.value)?.label"
            :disable="disable"
            @update="(mm) => (sa.minmax = mm)"
          />
        </q-item-section>
        <q-item-section side>
          <q-btn
            :disable="disable"
            dense
            unelevated
            flat
            round
            aria-label="Tradurs Close Button"
            size="xs"
            :tabindex="-1"
            class="q-ml-sm"
            @click="removeAttr(sa.value)"
          >
            <img
              class="icon"
              width="13"
              height="13"
              src="/images/icons/close.svg"
              alt="Tradurs Close Icon"
            />
          </q-btn>
        </q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<style scoped>
.attr {
  margin-top: -10px;
  margin-bottom: 10px;
  background-color: var(--q-half);
  border-radius: 0 0 4px 4px;
  max-height: 18vh;
}

.attr:deep(.q-item) {
  margin: 0;
}

.attr:deep(.q-item .q-item__section:first-child) {
  width: 20px;
  padding-right: 8px;
  flex-direction: row;
  align-items: center;
}

.attr:deep(.q-item .q-item__section:last-child) {
  padding-left: 0;
}

.attr:deep(.q-item .q-item__section .q-item__label) {
  line-height: 1.7 !important;
  padding: 4px 0;
}

.outline {
  box-shadow: inset 0 0 0 1px rgba(150, 150, 150, 0.4);
  border-radius: 4px;
  padding: 2px;
}
</style>
