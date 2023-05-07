<script setup lang="ts">
import { reactive, ref, computed, useSlots, nextTick } from 'vue'
import { QCardSection, useQuasar } from 'quasar'
import type { Quality, RuneType, ItemType } from 'stores/item-store'
import type { Price } from 'src/types/item'
import { useItemStore } from 'stores/item-store'
import { checkName, parse } from 'src/common'
import { icons } from 'src/common/icons'
import D4Price from 'components/D4Price.vue'
import D4Counter from 'components/D4Counter.vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  disable: {
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
const typeAttribute = computed(() => findType(props.data.itemType)?.attribute)
const hasPowers = computed(() => findType(props.data.itemType)?.hasPowers)
const hasProperties = computed(() => findType(props.data.itemType)?.hasProperties)
const hasAffixes = computed(() => findType(props.data.itemType)?.hasAffixes)
const _tradeType = ref<string>(props.data.tradeType)
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
const typeInfo = ref(parse(typeAttribute.value, props.data.itemTypeValues))
const _price = reactive<Price>({
  currency: (props.data.price && props.data.price.currency ? props.data.price.currency : 'offer'),
  currencyValue: (props.data.price && props.data.price.currencyValue ? props.data.price.currencyValue : null),
  quantity: (props.data.price && props.data.price.quantity ? props.data.price.quantity : null)
})
const attributes = computed(() => [
  { label: '능력', value: 'powers', hide: !hasPowers.value },
  { label: '특성', value: 'properties', hide: !hasProperties.value },
  { label: '옵션', value: 'affixes', hide: !hasAffixes.value }
].filter(a => !a.hide))

interface ITradeType {
  label: string,
  value: string
}

const tradeTypes: Array<ITradeType> = [
  { label: '판매', value: 'sell' },
  { label: '구매', value: 'buy' }
]

const updateType = (val: string) => {
  typeInfo.value = parse(findType(val)?.attribute)
  _class.value = classes(val).length > 0 ? classes(val)[0].value : 'axes'
  attribute.value = findType(val)?.hasPowers ? 'powers' : findType(val)?.hasProperties ? 'properties' : 'affixes'
  update()
}

const update = () => {
  emit('update', { tradeType: _tradeType.value, name: _name, itemTypeValues: typeInfo.value?.filter(i => i.type === 'variable').map(i => parseInt(i.value.toString())), quantity: _quantity.value, quality: _quality.value, itemType: _type.value, runeId: _rune.value, equipmentClass: _class.value, price: _price })
}

const updatePrice = (price: Price) => {
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
const powerRef = ref<HTMLDivElement | null>(null)
const propertyRef = ref<HTMLDivElement | null>(null)
const affixRef = ref<HTMLDivElement | null>(null)
const scrollEnd = (pType: string) => {
  nextTick(() => {
    if (pType === 'powers' && powerRef.value)
      powerRef.value.scrollTop = powerRef.value.scrollHeight
    else if (pType === 'properties' && propertyRef.value)
      propertyRef.value.scrollTop = propertyRef.value.scrollHeight
    else if (pType === 'affixes' && affixRef.value)
      affixRef.value.scrollTop = affixRef.value.scrollHeight
  })
}
const apply = () => {
  emit('apply')
}

// attribute tabs
const attribute = ref<string>(hasPowers.value ? 'powers' : hasProperties.value ? 'properties' : 'affixes')

defineExpose({ scrollEnd })
</script>

<template>
  <q-card v-if="editable" class="card-item non-selectable no-scroll editable" :class="data.quality">
    <q-form class="inner column no-wrap" :class="$q.platform.is.mobile ? '' : 'justify-between'" @submit="apply"
      :style="$q.platform.is.mobile ? 'height:100%' : 'max-height:90vh'">
      <q-card-section>
        <div class="column items-start q-gutter-y-sm">
          <div class="row items-center justify-between full-width q-gutter-sm">
            <div>
              <div class="row items-center q-gutter-sm quality">
                <q-btn :ripple="!$q.dark.isActive" v-for="q in quality" :key="q.value" :disable="disable" round
                  unelevated :class="['text-weight-bold', _quality === q.value ? 'active' : '']" :label="q.label"
                  @click="_quality = q.value; update()" />
              </div>
            </div>
            <div>
              <q-toggle v-model="_tradeType" :disable="disable" true-value="sell" false-value="buy" class="trade-type"
                color="primary" :unchecked-icon="`img:${icons.buy}`" :checked-icon="`img:${icons.sell}`" size="lg"
                :label="tradeTypes.find((t: ITradeType) => t.value === _tradeType)?.label" dense
                @update:model-value="update" />
            </div>
          </div>
          <div class="full-width">
            <div class="row items-center q-col-gutter-sm">
              <div class="col">
                <q-select v-model="_type" :disable="disable" outlined dense no-error-icon hide-bottom-space emit-value
                  map-options transition-show="none" transition-hide="none" label="아이템 유형"
                  :dropdown-icon="`img:${icons.dropdown}`" :options="types" @update:model-value="updateType">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                </q-select>
              </div>
              <div class="col" v-show="classes(data.itemType).length > 0">
                <q-select v-model="_class" :disable="disable" outlined dense no-error-icon hide-bottom-space emit-value
                  map-options transition-show="none" transition-hide="none" label="장비 클래스"
                  :dropdown-icon="`img:${icons.dropdown}`" :options="classes(data.itemType)"
                  @update:model-value="update">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                </q-select>
              </div>
              <div class="col" v-show="data.itemType === 'rune'">
                <q-select v-model="_rune" :disable="disable" outlined dense no-error-icon hide-bottom-space emit-value
                  map-options transition-show="none" transition-hide="none" label="룬 선택" :options="runes()"
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
              <D4Counter v-model="_quantity" :disable="disable" @update:model-value="update" />
            </div>
          </div>
        </div>
      </q-card-section>
      <q-separator v-show="data.itemType !== 'rune'" />
      <q-card-section v-show="data.itemType !== 'rune'">
        <q-input v-show="data.itemType !== 'rune'" :disable="disable" dense no-error-icon hide-bottom-space autofocus
          v-model="_name" outlined class="col-10" label="아이템 명" @update:model-value="update"
          :rules="[val => checkName(val) || '']" />
      </q-card-section>
      <q-separator v-show="data.itemType === 'rune'" />
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
      </q-card-section>
      <q-separator v-if="typeAttribute" />
      <q-card-section v-if="typeAttribute">
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
        <div v-show="!loading" class="row items-center q-gutter-x-xs">
          <template v-for="( comp, k ) in  typeInfo" :key="k">
            <template v-if="comp.type === 'text'">
              <div class="q-ml-xs"
                v-for="( word, i ) in comp.value.toString().split(/\s+/g).filter((w: string) => w !== '')" :key="i">
                {{ word }}</div>
            </template>
            <q-input v-else class="var" input-class="text-center text-caption no-padding" :disable="disable" dense
              hide-bottom-space hide-hint no-error-icon outlined v-model="comp.value" type="tel" maxlength="4"
              mask="####" debounce="500" :rules="[val => Number.isInteger(parseInt(val)) || '']"
              @update:model-value="update" @focus="focus" />
          </template>
        </div>
      </q-card-section>
      <q-card-section v-if="hasPowers || hasProperties || hasAffixes" class="col column no-wrap" style="padding-top:0">
        <div class="attribute column">
          <div class="row justify-center">
            <q-btn-toggle v-model="attribute" square flat :ripple="false"
              :color="$q.dark.isActive ? 'grey-5' : 'grey-8'" toggle-color="transparent toggle" :options="attributes" />
          </div>
          <q-tab-panels v-model="attribute" class="q-pa-xs bg-transparent col">
            <q-tab-panel v-if="hasPowers" name="powers" class="column q-gutter-y-xs no-padding">
              <div v-if="slots['add-power']">
                <slot name="add-power"></slot>
              </div>
              <div ref="powerRef" class="col scroll">
                <q-item v-show="loading" v-for="c in 2" :key="c" style="min-height:10px;padding:3px">
                  <q-item-section>
                    <q-item-label>
                      <q-skeleton type="text" width="65%" />
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <div v-if="slots.powers && !loading" class="list column no-wrap q-gutter-y-xs q-pa-sm">
                  <slot name="powers">
                  </slot>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel v-if="hasProperties" name="properties" class="column q-gutter-y-xs no-padding">
              <div v-if="slots['add-property']">
                <slot name="add-property"></slot>
              </div>
              <div ref="propertyRef" class="col scroll">
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
                <div v-if="slots.properties && !loading" class="list column q-gutter-y-xs">
                  <slot name="properties">
                  </slot>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel v-if="hasAffixes" name="affixes" class="column q-gutter-y-xs no-padding">
              <div v-if="slots['add-affix']">
                <slot name="add-affix"></slot>
              </div>
              <div ref="affixRef" class="col scroll">
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
                <div v-if="slots.affixes && !loading" class="list column q-gutter-y-sm">
                  <slot name="affixes">
                  </slot>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-card-section>
      <q-separator v-if="!hasPowers && !hasProperties && !hasAffixes" />
      <q-card-section>
        <D4Price :data="data.price" :editable="editable" :loading="loading" :disable="disable" @update="updatePrice" />
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
    <div class="trade-type-chip" :class="data.tradeType === 'buy' ? 'bg-red' : 'bg-primary'"></div>
    <div class="inner" :style="$q.platform.is.mobile ? 'height:100%' : ''">
      <q-card-section>
        <div class="row justify-beween q-pl-sm">
          <div class="col" :class="$q.platform.is.mobile ? 'q-gutter-y-xs' : 'q-gutter-y-sm q-py-sm'">
            <div>
              <q-skeleton v-show="loading" width="50%" height="24px" />
              <div v-show="!loading" class="col-10 col-sm-9 row no-wrap items-center q-col-gutter-x-xs">
                <div v-show="data.itemType === 'rune'" class="row items-center">
                  <div class="name">{{ (runes().find(r => r.value === data.runeId) || {}).label }}</div>
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
            </div>
            <div>
              <q-skeleton v-show="loading" width="20%" :height="$q.platform.is.mobile ? '18px' : '21px'" />
              <div v-if="!loading" style="opacity:.5">
                <!-- {{ data.user }} -->
                판매 또는 구매자
              </div>
            </div>
            <div v-if="slots.powers && !loading && data.powers.length > 0" class="column q-gutter-y-xs">
              <slot name="powers">
              </slot>
            </div>
          </div>
          <div class="column justify-center items-end q-gutter-x-sm">
            <div v-if="slots['top-right']">
              <slot name="top-right"></slot>
            </div>
            <D4Price :data="data.price" :editable="editable" :loading="loading" />
          </div>
        </div>
      </q-card-section>
      <q-separator style="width:50%" />
      <q-card-section v-show="data.itemType === 'rune'" class="col">
        <div class="q-pa-sm">
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
        </div>
      </q-card-section>
      <q-card-section v-show="loading || hasProperties">
        <div class="q-pa-sm">
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
            <div class="row items-center q-gutter-x-xs">
              <template v-for="comp in parse(typeAttribute, data.itemTypeValues)">
                {{ comp.value }}
              </template>
            </div>
          </div>
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
        </div>
      </q-card-section>
      <q-separator v-show="loading || typeAttribute || hasProperties" />
      <q-card-section v-show="loading || hasAffixes">
        <div class="q-pl-sm">
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
.quality:deep(.q-btn) {
  font-size: inherit;
}

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

.trade-type:deep(.q-toggle__inner) {
  color: var(--q-secondary);
}

.trade-type:deep(.q-toggle__thumb:before) {
  display: none;
}

.trade-type:deep(.q-toggle__inner:not(.q-toggle__inner--truthy) .q-toggle__thumb:after) {
  background: var(--q-secondary);
}

.trade-type:deep(.q-toggle__thumb .q-icon) {
  filter: invert(100%);
  opacity: 1;
  padding: 10px;
}

.trade-type-chip {
  position: absolute;
  left: 4px;
  top: 4px;
  padding: 0;
  width: 8px;
  height: 3px;
  border-radius: 0 !important;
  z-index: 5000;
}

.trade-type-chip::after {
  content: '';
  position: absolute;
  top: 0;
  width: 3px;
  height: 8px;
  background-color: inherit;
}

.attribute {
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(125, 125, 125, .1);
  height: 100%;
}

.attribute:deep(.q-btn-group .toggle) {
  font-weight: 700;
  color: inherit !important;
  background-color: rgba(125, 125, 125, .2);
  border-radius: 4px;
}

.attribute:deep(.q-panel) {
  overflow: hidden;
}

.attribute:deep(.list) {
  max-height: 30vh;
}
</style>