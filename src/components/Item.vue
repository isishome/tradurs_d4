<script setup lang="ts">
import { reactive, ref, computed, useSlots, nextTick } from 'vue'
import { QCardSection, useQuasar } from 'quasar'
import type { Quality, RuneType, ItemType } from '@/stores/item'
import type { Price } from '@/types/item'
import { useItemStore } from '@/stores/item'
import { checkName, parse } from '@/common'
import { icons } from '@/common/icons'
import PriceComp from '@/components/Price.vue'
import Counter from '@/components/Counter.vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => { }
  },
  editable: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update', 'apply'])

// common variable
const $q = useQuasar()
const slots = useSlots()
const store = useItemStore()

// variable
const _name = ref<string>(props.data.name)
const _quantity = ref<number>(props.data.quantity || 1)
const quality = computed<Array<Quality>>(() => store.quality)
const _quality = ref<string>(props.data.quality || 'regular')
const types = computed<Array<ItemType>>(() => store.types)
const _type = ref<string>(props.data.itemType || 'weapons')
const runeTypes = computed<Array<RuneType>>(() => store.runeTypes)
const runes = store.filterRunes
const _rune = ref<string>(props.data.runeId || 'eld')
const findRune = store.findRune
const findType = store.findType
const classes = store.filterClasses
const _class = ref<string>(props.data.equipmentClass || 'axes')
const typeInfo = ref(parse(findType(props.data.itemType)?.attribute, props.data.itemTypeValues))
const _price = reactive<Price>({
  currency: (props.data.price && props.data.price.currency ? props.data.price.currency : 'offer'),
  currencyValue: (props.data.price && props.data.price.currencyValue ? props.data.price.currencyValue : null),
  quantity: (props.data.price && props.data.price.quantity ? props.data.price.quantity : null)
})

const updateType = (val: string): void => {
  typeInfo.value = parse(findType(val)?.attribute)
  _class.value = classes(val).length > 0 ? classes(val)[0].value : 'axes'
  update()
}

const update = (): void => {
  emit('update', { name: _name, itemTypeValues: typeInfo.value?.filter(i => i.type === 'variable').map(i => parseInt(i.value.toString())), quantity: _quantity.value, quality: _quality.value, itemType: _type.value, runeId: _rune.value, equipmentClass: _class.value, price: _price })
}

const updatePrice = (price: Price): void => {
  _price.currency = price.currency
  _price.currencyValue = price.currencyValue
  _price.quantity = price.quantity
  update()
}

const focus = (evt: Event) => {
  const el: HTMLInputElement | null = (evt.target as Element)?.closest('input')

  if (el)
    el.select()
}

// control scroll
const propertyRef = ref<QCardSection | null>(null)
const affixRef = ref<QCardSection | null>(null)
const scrollEnd = (pType: string): void => {
  nextTick(() => {
    if (pType === 'properties' && propertyRef.value && propertyRef.value.$el) {
      propertyRef.value.$el.scrollTop = propertyRef.value.$el.scrollHeight
    }
    else if (pType === 'affixes' && affixRef.value && affixRef.value.$el)
      affixRef.value.$el.scrollTop = affixRef.value.$el.scrollHeight
  })
}
const apply = (): void => {
  emit('apply')
}

defineExpose({ scrollEnd })
</script>

<template>
  <q-card v-if="editable" class="card-item non-selectable no-scroll editable" :class="data.quality">
    <q-form class="inner column no-wrap" :class="$q.platform.is.mobile ? '' : 'justify-between'" @submit="apply"
      :style="$q.platform.is.mobile ? 'height:100%' : 'max-height:90vh'">
      <q-card-section>
        <div class="column items-start q-gutter-y-sm">
          <div class="row items-center q-gutter-sm quality">
            <q-btn :ripple="false" v-for="q in quality" :key="q.value" round size="13px" unelevated
              :class="['text-weight-bold', _quality === q.value ? 'active' : '']" :label="q.label"
              @click="_quality = q.value; update()" />
          </div>
          <div class="full-width">
            <div class="row items-center q-col-gutter-sm">
              <div class="col">
                <q-select v-model="_type" outlined dense no-error-icon hide-bottom-space emit-value map-options
                  transition-show="none" transition-hide="none" label="아이템 유형" :dropdown-icon="`img:${icons.dropdown}`"
                  :options="types" @update:model-value="updateType">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                </q-select>
              </div>
              <div class="col" v-show="classes(data.itemType).length > 0">
                <q-select v-model="_class" outlined dense no-error-icon hide-bottom-space emit-value map-options
                  transition-show="none" transition-hide="none" label="장비 클래스" :dropdown-icon="`img:${icons.dropdown}`"
                  :options="classes(data.itemType)" @update:model-value="update">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                </q-select>
              </div>
              <div class="col" v-show="data.itemType === 'rune'">
                <q-select v-model="_rune" outlined dense no-error-icon hide-bottom-space emit-value map-options
                  transition-show="none" transition-hide="none" label="룬 선택" :options="runes()"
                  :dropdown-icon="`img:${icons.dropdown}`" @update:model-value="update">
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <img :src="scope.opt.img" width="24" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <Counter v-model="_quantity" @update:model-value="update" />
            </div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section v-show="data.itemType !== 'rune'">
        <q-input v-show="data.itemType !== 'rune'" dense no-error-icon hide-bottom-space autofocus v-model="_name"
          outlined class="col-10" label="아이템 명" @update:model-value="update" :rules="[val => checkName(val) || '']" />
      </q-card-section>
      <q-separator v-show="data.itemType === 'rune'" class="q-mx-xs" />
      <q-card-section v-show="data.itemType === 'rune'" class="col">
        <q-item v-show="loading" style="min-height:10px;padding:3px">
          <q-item-section side class="q-pr-sm">
            <q-skeleton type="circle" width="10px" height="10px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" width="20%" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-show="!loading" class="row no-wrap items-baseline q-gutter-x-xs">
          <q-icon class="icon rotate-45" size="13px" :name="`img:${icons.regular}`" />
          <div>{{ (runes().find(r => r.value === data.runeId) || {}).attribute }}
          </div>
        </div>
      </q-card-section>
      <q-separator v-show="findType(data.itemType)?.attribute || findType(data.itemType)?.hasProperties"
        class="q-mx-xs" />
      <q-card-section v-if="findType(data.itemType)?.attribute">
        <q-item v-show="loading" style="min-height:10px;padding:3px">
          <q-item-section side class="q-pr-sm">
            <q-skeleton type="circle" width="10px" height="10px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" width="20%" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-show="!loading" class="row no-wrap items-center q-gutter-x-xs">
          <q-icon class="icon" size="18px" :name="`img:${data.itemType === 'armor' ? icons.defense : icons.attack}`" />
          <div class="row items-center q-gutter-x-xs">
            <template v-for="(comp, k) in typeInfo" :key="k">
              <template v-if="comp.type === 'text'">
                <div class="q-ml-xs"
                  v-for="(word, i) in comp.value.toString().split(/\s+/g).filter((w: string) => w !== '')" :key="i">
                  {{ word }}</div>
              </template>
              <q-input v-else class="var" input-class="text-center text-caption no-padding" dense hide-bottom-space
                hide-hint no-error-icon outlined v-model="comp.value" type="tel" maxlength="4" mask="####"
                debounce="500" :rules="[val => Number.isInteger(parseInt(val)) && parseInt(val) !== 0 || '']"
                @update:model-value="update" @focus="focus" />
            </template>
          </div>
        </div>
      </q-card-section>
      <q-card-section v-if="slots['add-property'] && findType(data.itemType)?.hasProperties">
        <slot name="add-property"></slot>
      </q-card-section>
      <q-card-section ref="propertyRef" v-show="findType(data.itemType)?.hasProperties" class="col scroll">
        <q-item v-show="loading" v-for="c in 2" :key="c" style="min-height:10px;padding:3px">
          <q-item-section side class="q-pr-sm">
            <q-skeleton type="circle" width="10px" height="10px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" width="65%" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-if="slots.properties && !loading" class="column q-gutter-y-xs" style="min-height:25px;">
          <slot name="properties">
          </slot>
        </div>
      </q-card-section>
      <q-separator v-show="findType(data.itemType)?.attribute || findType(data.itemType)?.hasAffixes" class="q-mx-xs" />
      <q-card-section v-if="slots['add-affix'] && findType(data.itemType)?.hasAffixes">
        <slot name="add-affix"></slot>
      </q-card-section>
      <q-card-section ref="affixRef" v-show="findType(data.itemType)?.hasAffixes" class="col scroll">
        <q-item v-show="loading" v-for="c in 3" :key="c" style="min-height:10px;padding:3px">
          <q-item-section side class="q-pr-sm">
            <q-skeleton type="circle" width="10px" height="10px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" width="65%" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-if="slots.affixes && !loading" class="column q-gutter-y-sm" style="min-height:25px;">
          <slot name="affixes">
          </slot>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <PriceComp :data="data.price" :editable="editable" @update="updatePrice" />
      </q-card-section>
      <q-separator v-if="slots.actions" />
      <q-card-section v-if="slots.actions">
        <slot name="actions"></slot>
      </q-card-section>
    </q-form>
    <slot name="more" :loading="loading"></slot>
  </q-card>
  <q-card v-else class="card-item non-selectable no-scroll full-height overflow-hidden"
    :class="[data.expanded ? 'expanded' : '', data.quality]">
    <div class="inner" :style="$q.platform.is.mobile ? 'height:100%' : ''">
      <q-card-section>
        <div :class="$q.platform.is.mobile ? 'q-pl-sm q-gutter-y-xs' : 'q-gutter-y-sm q-py-sm q-pl-sm'">
          <div class="row no-wrap justify-between items-center full-height">
            <q-skeleton v-show="loading" width="50%" height="24px" />
            <div v-show="!loading" class="col-11 col-sm-10 row no-wrap items-center q-col-gutter-x-xs">
              <div v-show="data.itemType === 'rune'" class="row items-center">
                <div class="name">{{(runes().find(r => r.value === data.runeId) || {}).label}}</div>
                <div class="q-ml-xs">{{ (runeTypes.find(rt => rt.value === (findRune(data.runeId) || {}).type) ||
                {}).label }}
                </div>
              </div>
              <div v-show="data.itemType !== 'rune'" class="name ellipsis-2-lines">
                {{ data.name }}
              </div>
              <div v-if="data.quantity > 1" class="col-3 col-sm-2 price row items-center q-gutter-x-xs">
                <div class="text-lowercase">x</div>
                <div>{{ data.quantity }}</div>
              </div>
            </div>
            <div v-if="!loading && slots['top-right']" class="row items-center q-gutter-x-sm">
              <slot name="top-right"></slot>
            </div>
          </div>
          <div>
            <div v-show="loading">
              <q-skeleton v-show="loading" width="20%" :height="$q.platform.is.mobile ? '18px' : '21px'" />
            </div>
            <div v-if="!loading" style="opacity:.5">
              {{ data.user }}
            </div>
          </div>
          <PriceComp :data="data.price" :editable="editable" :loading="loading" />
        </div>
      </q-card-section>
      <q-separator v-show="data.itemType === 'rune'" class="q-mx-xs" />
      <q-card-section v-show="data.itemType === 'rune'" class="col">
        <q-item v-show="loading" style="min-height:10px;padding:3px">
          <q-item-section side class="q-pr-sm">
            <q-skeleton type="circle" size="24px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" width="20%" height="24px" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-show="!loading" class="row no-wrap items-baseline q-gutter-x-xs">
          <q-icon class="icon rotate-45" size="13px" :name="`img:${icons.regular}`" />
          <div>{{ (runes().find(r => r.value === data.runeId) || {}).attribute }}
          </div>
        </div>
      </q-card-section>
      <q-separator v-show="loading || findType(data.itemType)?.attribute || findType(data.itemType)?.hasProperties"
        class="q-mx-xs" />
      <q-card-section v-if="loading || findType(data.itemType)?.attribute">
        <q-item v-show="loading" style="min-height:10px;padding:3px">
          <q-item-section side class="q-pr-sm">
            <q-skeleton type="circle" width="10px" height="10px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" width="20%" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-show="!loading" class="row no-wrap items-center q-gutter-x-xs">
          <q-icon class="icon" size="18px" :name="`img:${data.itemType === 'armor' ? icons.defense : icons.attack}`" />
          <div class="row items-center q-gutter-x-xs">
            <template v-for="comp in parse(findType(data.itemType)?.attribute, data.itemTypeValues)">
              {{ comp.value }}
            </template>
          </div>
        </div>
      </q-card-section>
      <q-card-section v-show="loading || findType(data.itemType)?.hasProperties">
        <q-item v-show="loading" v-for="c in 2" :key="c" style="min-height:10px;padding:3px">
          <q-item-section side class="q-pr-sm">
            <q-skeleton type="circle" width="10px" height="10px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" width="65%" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-if="slots.properties && !loading" class="column q-gutter-y-xs" style="min-height:25px;">
          <slot name="properties">
          </slot>
        </div>
      </q-card-section>
      <q-separator v-show="loading || findType(data.itemType)?.attribute || findType(data.itemType)?.hasAffixes"
        class="q-mx-xs" />
      <q-card-section v-show="loading || findType(data.itemType)?.hasAffixes">
        <q-item v-show="loading" v-for="c in 3" :key="c" style="min-height:10px;padding:3px">
          <q-item-section side class="q-pr-sm">
            <q-skeleton type="circle" width="10px" height="10px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" width="65%" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-if="slots.affixes && !loading" class="column q-gutter-y-sm" style="min-height:25px;">
          <slot name="affixes">
          </slot>
        </div>
      </q-card-section>
      <q-separator v-if="slots.actions" />
      <q-card-section v-if="slots.actions">
        <slot v-if="!loading" name="actions"></slot>
      </q-card-section>
    </div>
    <slot name="more" :loading="loading"></slot>
  </q-card>
</template>
<style scoped>
.quality:deep(.q-btn:before) {
  box-shadow: inset 0 0 0 4px rgba(0, 0, 0, .2);
}

.body--dark .quality:deep(.q-btn:before) {
  box-shadow: inset 0 0 0 4px rgba(255, 255, 255, .2);
}

.quality:deep(.q-btn.active) {
  background-color: var(--q-dark-page);
  color: var(--q-light-page);
}

.body--dark .quality:deep(.q-btn.active) {
  background-color: var(--q-light-page);
  color: var(--q-dark-page);
}
</style>