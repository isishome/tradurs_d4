<script setup>
import { reactive, ref, computed, useSlots } from 'vue'
import { useQuasar } from 'quasar'
import { useItemStore } from '@/stores/item.js'
import { checkName } from '@/common'
import attack from '@/assets/types/attack.svg'
import defense from '@/assets/types/defense.svg'
import regular from '@/assets/attribute_types/regular.svg'
import dropdown from '@/assets/icons/dropdown.svg'

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

// loading variable
const loadingBase = computed(() => store.base.loading)
const loadingAffixes = computed(() => store.affixes.loading)
const loadingProperties = computed(() => store.properties.loading)
const globalLoading = computed(() => props.loading || loadingBase.value || loadingProperties.value || loadingAffixes.value)

// variable
const _name = ref(props.data.name)
const quality = computed(() => store.quality)
const _quality = ref(props.data.quality || 'regular')
const types = computed(() => store.types)
const _type = ref(props.data.item_type || 'weapons')
const runeTypes = computed(() => store.runeTypes)
const runes = store.filterRunes
const _rune = ref(props.data.rune_id || 'amn')
const findRune = store.findRune
const hasProperties = computed(() => types.value.find(t => t.value === props.data.item_type) ? types.value.find(t => t.value === props.data.item_type).has_properties : 0)
const hasAffixes = computed(() => types.value.find(t => t.value === props.data.item_type) ? types.value.find(t => t.value === props.data.item_type).has_affixes : 0)
const classes = store.filterClasses
const _class = ref(props.data.equipment_class || 'axes')
const findType = store.findType
const typeInfo = ref(findType(props.data.item_type) && findType(props.data.item_type).attribute ? findType(props.data.item_type).attribute.split(/\{x\}/g).flatMap((s, i) => [{ type: 'text', value: s }, { type: 'variable', value: props.data.item_type_values[i] || 0 }]).slice(0, -1) : [])
const _price = reactive({
  currency: props.data.price && props.data.price.currency ? props.data.price.currency : 'amn',
  quantity: props.data.price && props.data.price.quantity ? props.data.price.quantity : 1
})

const updateType = (val) => {
  typeInfo.value = findType(val) && findType(val).attribute ? findType(val).attribute.split(/\{x\}/g).flatMap((s, i) => [{ type: 'text', value: s }, { type: 'variable', value: 0 }]).slice(0, -1) : []
  _class.value = classes(val)[0]
  update()
}

const update = () => {
  emit('update', { name: _name, values: typeInfo.value.filter(i => i.type === 'variable').map(i => parseInt(i.value)), quality: _quality.value, type: _type.value, rune: _rune.value, eClass: _class.value, price: _price })
}

const apply = () => {
  emit('apply')
}
</script>

<template>
  <q-card class="card-item non-selectable no-scroll"
    :class="[data.expanded ? 'expanded' : '', editable ? 'editable' : 'full-height overflow-hidden', data.quality]">
    <q-form class="inner column no-wrap" :class="$q.platform.is.mobile ? '' : 'justify-between'" @submit="apply"
      :style="`${$q.platform.is.mobile ? 'height:100%' : editable ? 'max-height:90vh' : ''}`">
      <template v-if="editable">
        <q-card-section>
          <div class="column items-start q-gutter-y-sm">
            <div>
              <q-option-group dense v-model="_quality" :options="quality" size="xs" inline
                @update:model-value="update" />
            </div>
            <div class="full-width">
              <div class="row items-center q-col-gutter-sm">
                <div class="col">
                  <q-select v-model="_type" outlined dense no-error-icon hide-bottom-space emit-value map-options
                    transition-show="none" transition-hide="none" label="아이템 유형" :dropdown-icon="`img:${dropdown}`"
                    :options="types" @update:model-value="updateType" />
                </div>
                <div class="col">
                  <q-select v-show="classes(data.item_type).length > 0" v-model="_class" outlined dense no-error-icon
                    hide-bottom-space emit-value map-options transition-show="none" transition-hide="none"
                    label="장비 클래스" :dropdown-icon="`img:${dropdown}`" :options="classes(data.item_type)"
                    @update:model-value="update" />
                  <q-select v-show="data.item_type === 'rune'" v-model="_rune" outlined dense no-error-icon
                    hide-bottom-space emit-value map-options transition-show="none" transition-hide="none" label="룬 선택"
                    :options="runes()" :dropdown-icon="`img:${dropdown}`" @update:model-value="update">
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <!-- <q-item-section avatar>
                          <img :src="scope.opt.img" width="24" />
                        </q-item-section> -->
                        <q-item-section>
                          <q-item-label>{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-separator class="q-mx-xs" />
      </template>
      <q-card-section v-if="editable" class="row items-center">
        <div v-show="data.item_type === 'rune'" class="row items-center q-gutter-x-sm">
          <div class="kodia name">{{(runes().find(r => r.value === data.rune_id) ||
          {}).label}}</div>
          <div>{{ (runeTypes.find(rt => rt.value === (findRune(props.data.rune_id) || {}).type) || {}).label }}</div>
        </div>
        <q-input v-show="data.item_type !== 'rune'" dense no-error-icon hide-bottom-space autofocus v-model="_name"
          outlined class="col-12" label="아이템 명" @update:model-value="update" :rules="[val => checkName(val) || '']" />
      </q-card-section>
      <q-card-section v-else>
        <div class="column" :class="$q.platform.is.mobile ? 'q-pl-sm q-gutter-y-xs' : 'q-gutter-y-sm q-py-md q-pl-md'">
          <div class="row no-wrap justify-between items-center full-height">
            <q-skeleton v-show="globalLoading" width="50%" :height="$q.platform.is.mobile ? '16px' : '20px'" />
            <div v-show="!globalLoading">
              <div v-show="data.item_type === 'rune'" class="row items-center q-gutter-x-sm">
                <div class="kodia name">{{(runes().find(r => r.value === data.rune_id) ||
                {}).label}}</div>
                <div>{{ (runeTypes.find(rt => rt.value === (findRune(props.data.rune_id) || {}).type) || {}).label }}
                </div>
              </div>
              <div v-show="data.item_type !== 'rune'">
                <div v-show="!editable && data.item_type !== 'rune'" class="kodia name ellipsis-2-lines">
                  {{ data.name }}
                </div>
              </div>
            </div>
            <div v-show="globalLoading" class="row no-wrap justify-end items-center q-gutter-x-sm">
              <q-skeleton v-for="c in 2" :key="c" width="24px" height="24px" />
            </div>
            <div v-if="!globalLoading && slots['top-right']" class="rounded-borders">
              <slot name="top-right"></slot>
            </div>
          </div>
          <q-item v-show="globalLoading" style="min-height:10px;padding:3px">
            <q-item-section side class="q-pr-sm">
              <q-skeleton type="circle" :width="$q.platform.is.mobile ? '24px' : '36px'"
                :height="$q.platform.is.mobile ? '24px' : '36px'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                <q-skeleton v-show="globalLoading" width="20%" :height="$q.platform.is.mobile ? '21px' : '28px'" />
              </q-item-label>
            </q-item-section>
          </q-item>
          <div v-if="data.price && !globalLoading" class="price row items-center q-gutter-x-xs">
            <!-- <div>
              <img :src="(runes().find(r => r.value === data.price.currency) || {}).img"
                :width="$q.platform.is.mobile ? '24' : '36'" />
            </div> -->
            <div>{{(runes().find(r => r.value === data.price.currency) || {}).label}}</div>
            <div>x</div>
            <div class="text-red">{{ data.price.quantity }}</div>
          </div>
        </div>
      </q-card-section>
      <q-separator v-show="data.item_type === 'rune'" class="q-mx-xs" />
      <q-card-section v-show="data.item_type === 'rune'" class="col">
        <q-item v-show="globalLoading" style="min-height:10px;padding:3px">
          <q-item-section side class="q-pr-sm">
            <q-skeleton type="circle" width="10px" height="10px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" width="20%" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-show="!globalLoading" class="row no-wrap items-baseline q-gutter-x-xs">
          <q-icon class="icon rotate-45" size="13px" :name="`img:${regular}`" />
          <div>{{ (runes().find(r => r.value === data.rune_id) || {}).attribute }}
          </div>
        </div>
      </q-card-section>
      <q-separator v-show="findType(data.item_type).attribute || hasProperties" class="q-mx-xs" />
      <q-card-section v-if="findType(data.item_type).attribute">
        <q-item v-show="globalLoading" style="min-height:10px;padding:3px">
          <q-item-section side class="q-pr-sm">
            <q-skeleton type="circle" width="10px" height="10px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" width="20%" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-show="!globalLoading" class="row no-wrap items-center q-gutter-x-xs">
          <q-icon class="icon" size="18px" :name="`img:${data.item_type === 'armor' ? defense : attack}`" />
          <div v-if="editable" class="row items-center q-gutter-x-xs">
            <template v-for="(comp, k) in typeInfo" :key="k">
              <template v-if="comp.type === 'text'">
                <div class="q-ml-xs" v-for="(word, i) in comp.value.split(/\s+/g).filter(w => w !== '')" :key="i">
                  {{ word }}</div>
              </template>
              <div v-else-if="!editable && comp.type === 'variable'">{{ comp.value }}</div>
              <q-input v-else class="var" input-class="text-center text-caption no-padding" dense hide-bottom-space
                hide-hint no-error-icon outlined v-model="comp.value" type="tel" maxlength="4" mask="####"
                debounce="500" :rules="[val => Number.isInteger(parseInt(val)) && parseInt(val) !== 0 || '']"
                @update:model-value="update" @focus="evt => evt.target.select()" />
            </template>
          </div>
          <div v-else class="row items-center q-gutter-x-xs">
            <template
              v-for="word in store.findType(props.data.item_type).attribute.split(/\{x\}/g).flatMap((s, i) => [s, props.data.item_type_values[i]]).slice(0, -1)">
              {{ word }}
            </template>
          </div>
        </div>
      </q-card-section>
      <q-card-section v-if="slots['add-property'] && editable && hasProperties">
        <slot name="add-property"></slot>
      </q-card-section>
      <q-card-section v-show="hasProperties" :class="editable ? 'scroll col' : ''">
        <q-item v-show="globalLoading" v-for="c in 2" :key="c" style="min-height:10px;padding:3px">
          <q-item-section side class="q-pr-sm">
            <q-skeleton type="circle" width="10px" height="10px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" width="65%" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-if="slots.properties && !globalLoading" class="column q-gutter-y-xs" style="min-height:25px;">
          <slot name="properties">
          </slot>
        </div>
      </q-card-section>
      <q-separator v-show="findType(data.item_type).attribute || hasAffixes" class="q-mx-xs" />
      <q-card-section v-if="slots['add-affix'] && editable && hasAffixes">
        <slot name="add-affix"></slot>
      </q-card-section>
      <q-card-section v-show="hasAffixes" :class="editable ? 'scroll col' : ''">
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
        <div v-if="slots.affixes && !globalLoading" class="column q-gutter-y-sm" style="min-height:25px;">
          <slot name="affixes">
          </slot>
        </div>
      </q-card-section>
      <q-separator v-if="editable" class="q-mx-xs" />
      <q-card-section v-if="editable">
        <div class="row justify-end items-center q-gutter-x-sm">
          <div>가격</div>
          <q-select v-model="_price.currency" style="min-width:100px" outlined dense no-error-icon hide-bottom-space
            emit-value map-options transition-show="none" transition-hide="none" :options="runes()"
            :dropdown-icon="`img:${dropdown}`" @update:model-value="update">
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <!-- <q-item-section avatar>
                  <img :src="scope.opt.img" width="24" />
                </q-item-section> -->
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <div class="row items-center">
            <q-btn size="sm" unelevated flat dense round :disable="parseInt(_price.quantity) < 2"
              @click="_price.quantity--; update()">
              <img class="icon" width="17" src="@/assets/icons/remove.svg" />
            </q-btn>
            <q-input style="max-width:50px" input-class="text-center" dense hide-bottom-space hide-hint no-error-icon
              outlined v-model="_price.quantity" type="tel" maxlength="3" mask="###" debounce="500"
              :rules="[val => Number.isInteger(parseInt(val)) && parseInt(val) !== 0 || '']"
              @update:model-value="update" @focus="evt => evt.target.select()" />
            <q-btn size="sm" unelevated flat dense round :disable="parseInt(_price.quantity) > 998" @click="
            _price.quantity++; update()">
              <img class="icon" width="17" src="@/assets/icons/add.svg" />
            </q-btn>
          </div>
        </div>
      </q-card-section>
      <q-separator class="q-mx-xs" v-if="slots.actions" />
      <q-card-section v-if="slots.actions">
        <div v-show="globalLoading" class="row justify-end items-center q-gutter-x-sm"
          :class="$q.platform.is.mobile ? '' : 'q-pa-md'">
          <q-skeleton v-for="c in 2" :key="c" type="QBtn" width="36px" height="30px" />
        </div>
        <div v-show="!globalLoading" class="row justify-end items-center q-gutter-x-sm"
          :class="$q.platform.is.mobile ? '' : 'q-pa-md'">
          <slot name="actions"></slot>
        </div>
      </q-card-section>
    </q-form>
    <slot name="more" :loading="globalLoading"></slot>
  </q-card>
</template>
<style scoped>
.scroll {
  overflow-y: scroll;
  min-height: 30px;
}

.normal {
  background-color: var(--q-normal);
}

.text-magic {
  color: var(--q-magic);
}
</style>