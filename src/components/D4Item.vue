<script setup lang="ts">
import { reactive, ref, computed, useSlots, nextTick, watch } from 'vue'
import { QCard, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useItemStore } from 'stores/item-store'
import { Price } from 'src/types/item'
import { checkName, focus } from 'src/common'
import { icons } from 'src/common/icons'
import { itemImgs } from 'src/common/items'
import { runeImgs } from 'src/common/runes'

import D4Price from 'components/D4Price.vue'
import D4Counter from 'components/D4Counter.vue'
import D4User from 'components/D4User.vue'

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
const { t } = useI18n({ useScope: 'global' })

// variable
const editWrap = ref<QCard | null>(null)
const hasProperties = computed(() => findType(props.data.itemType)?.hasProperties)
const hasAffixes = computed(() => findType(props.data.itemType)?.hasAffixes)

const _hardcore = ref<boolean>(props.data.hardcore)
const _ladder = ref<boolean>(props.data.ladder)
const _name = ref<string>(props.data.name)
const _quantity = ref<number>(props.data.quantity || 1)
const _quality = ref<string>(props.data.quality || 'regular')
const _type = ref<string>(props.data.itemType || 'weapons')
const runes = store.filterRunes
const _rune = ref<string>(props.data.runeId || 'eld')
const _power = ref<number>(props.data.power)
const _upgrade = ref<number>(props.data.upgrade)

const findRuneType = store.findRuneType
const filterTypes = store.filterTypes
const upgradeLimit = computed(() => store.findQuality(props.data.quality)?.upgradeLimit)
const findQuality = store.findQuality
const filterQuality = store.filterQuality
const findStatus = store.findItemStatus
const findRune = store.findRune
const findType = store.findType
const filterClasses = store.filterClasses
const _class = ref<string | number | null>(props.data.equipmentClass || filterClasses(props.data.itemType)?.[0]?.value || null)
const _price = reactive<Price>(new Price((props.data.price && props.data.price.currency ? props.data.price.currency : 'offer'), (props.data.price && props.data.price.currencyValue ? props.data.price.currencyValue : null), (props.data.price && props.data.price.quantity ? props.data.price.quantity : null)))

const attributes = computed(() => [
  { label: t('properties'), value: 'properties', hide: !hasProperties.value },
  { label: t('affixes'), value: 'affixes', hide: !hasAffixes.value },
  { label: t('restrictions'), value: 'restrictions' }
].filter(a => !a.hide))

const updateQuality = (val: string) => {
  _quality.value = val
  _power.value = 0
  _upgrade.value = 0
  update()
}

const updateType = (val: string) => {
  _name.value = val === 'rune' ? '' : _name.value
  _class.value = filterClasses(val)?.[0]?.value || null
  attribute.value = findType(val)?.hasProperties ? 'properties' : findType(val)?.hasAffixes ? 'affixes' : 'restrictions'
  update()
}

const update = () => {
  emit('update', { hardcore: _hardcore.value, ladder: _ladder.value, name: _name, quantity: _quantity.value, quality: _quality.value, itemType: _type.value, runeId: _rune.value, power: _power.value, upgrade: _upgrade.value, equipmentClass: _class.value, price: _price })
}

const updatePrice = (price: Price) => {
  _price.currency = price.currency
  _price.currencyValue = price.currencyValue
  _price.quantity = price.quantity
  update()
}

// control scroll
const propertyRef = ref<HTMLDivElement | null>(null)
const affixRef = ref<HTMLDivElement | null>(null)
const restrictionRef = ref<HTMLDivElement | null>(null)
const scrollEnd = (pType: string, valueId: string) => {
  nextTick(() => {
    if (pType === 'properties' && propertyRef.value) {
      const findValue = propertyRef.value.querySelector(`div[data-id="${valueId}"] input`) as HTMLInputElement
      findValue?.focus()
    }
    else if (pType === 'affixes' && affixRef.value) {
      const findValue = affixRef.value.querySelector(`div[data-id="${valueId}"] input`) as HTMLInputElement
      findValue?.focus()
    }
    else if (pType === 'restrictions' && restrictionRef.value) {
      const findValue = restrictionRef.value.querySelector(`div[data-id="${valueId}"] input`) as HTMLInputElement
      findValue?.focus()
    }
  })
}
const apply = () => {
  emit('apply')
}

// item images
const itemImage = computed(() => props.data.itemType === 'aspect' ? itemImgs.aspect : props.data.itemType === 'rune' ? runeImgs[props.data.runeId as keyof typeof runeImgs] : itemImgs[props.data.equipmentClass as keyof typeof itemImgs])

// attribute tabs
const attribute = ref<string>(hasProperties.value ? 'properties' : hasAffixes ? 'affixes' : 'restrictions')

watch(() => props.data.quantity, (val: number) => {
  _quantity.value = val
})

defineExpose({ scrollEnd })
</script>

<template>
  <q-card v-if="editable" ref="editWrap" class="card-item non-selectable no-scroll editable" :class="data.quality">
    <q-form class="inner column no-wrap" :class="{ 'justify-between': !$q.screen.lt.sm }" @submit="apply"
      :style="$q.screen.lt.sm ? 'height:100%' : 'max-height:90vh'">
      <q-card-section>
        <div class="column items-start q-gutter-y-sm">
          <div class="row items-center justify-between q-col-gutter-sm full-width q-py-sm">
            <div class="col-12 col-sm">
              <div class="row items-center q-gutter-sm quality">
                <q-btn :ripple="!$q.dark.isActive" v-for="q in filterQuality()" :key="q.value" :disable="disable" round
                  unelevated :class="['text-weight-bold', { 'active': _quality === q.value }]" :label="q.label"
                  @click="updateQuality(q.value as string)" />
              </div>
            </div>
            <div class="col-12 col-sm row justify-end items-center q-gutter-md toggles">
              <q-toggle left-label v-model="_hardcore" :disable="disable" color="secondary" :label="t('hardcore')" dense
                @update:model-value="update" />
              <q-toggle left-label v-model="_ladder" :disable="disable" color="primary" :label="t('ladder')" dense
                @update:model-value="update" />
            </div>
          </div>
          <div class="full-width">
            <div class="row items-center q-col-gutter-sm">
              <div class="col">
                <q-select v-model="_type" :disable="disable" behavior="menu" outlined dense no-error-icon
                  hide-bottom-space emit-value map-options transition-show="none" transition-hide="none"
                  :label="t('item.selectType')" :dropdown-icon="`img:${icons.dropdown}`" :options="filterTypes()"
                  @update:model-value="updateType">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                </q-select>
              </div>
              <div class="col" v-show="filterClasses(data.itemType).length > 0">
                <q-select v-model="_class" :disable="disable" behavior="menu" outlined dense no-error-icon
                  hide-bottom-space emit-value map-options transition-show="none" transition-hide="none"
                  :label="t('item.selectClass')" :dropdown-icon="`img:${icons.dropdown}`"
                  :options="filterClasses(data.itemType)" @update:model-value="update">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                </q-select>
              </div>
              <div class="col" v-show="data.itemType === 'rune'">
                <q-select v-model="_rune" :disable="disable" behavior="menu" outlined dense no-error-icon
                  hide-bottom-space emit-value map-options transition-show="none" transition-hide="none"
                  :label="t('item.selectRune')" :options="runes()" :dropdown-icon="`img:${icons.dropdown}`"
                  @update:model-value="update">
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
      <q-card-section v-if="data.itemType !== 'rune'">
        <q-input v-show="data.itemType !== 'rune'" :disable="disable" dense no-error-icon hide-bottom-space autofocus
          v-model="_name" outlined class="col-10" :label="t('item.name')" @update:model-value="update"
          :rules="[val => checkName(val) || '']" />
      </q-card-section>
      <q-separator v-show="data.itemType === 'rune'" />
      <q-card-section v-if="data.itemType === 'rune'" class="col">
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
        <div v-show="!loading" class="row no-wrap items-baseline q-gutter-xs">
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
      <q-separator />
      <q-card-section class="row justify-start items-center q-gutter-sm">
        <D4Counter v-model="_power" :label="t('item.power')" :max="9999" max-width="110px" allow-zero no-button
          :disable="disable" @update:model-value="update" />
        <D4Counter v-if="upgradeLimit" v-model="_upgrade" :label="t('item.upgrade', { u: _upgrade, ul: upgradeLimit })"
          max-width="110px" :max="upgradeLimit" allow-zero :disable="disable" @update:model-value="update" />
      </q-card-section>
      <q-separator />
      <q-card-section class="tab row justify-end items-center">
        <q-btn-toggle v-model="attribute" square flat no-caps :ripple="false"
          :color="$q.dark.isActive ? 'grey-5' : 'grey-8'" :padding="$q.screen.lt.sm ? '8px 8px' : ''"
          :size="$q.screen.lt.sm ? '12px' : ''" toggle-color="transparent toggle" :options="attributes" />
      </q-card-section>
      <q-card-section v-if="hasProperties || hasAffixes" class="col column no-wrap" style="padding-top:0">
        <div class="attribute column">
          <q-tab-panels v-model="attribute" class="q-pa-xs bg-transparent col">
            <q-tab-panel v-if="hasProperties" name="properties" class="column q-gutter-y-xs no-padding">
              <div v-if="slots['add-property']">
                <slot name="add-property" :wrap="editWrap"></slot>
              </div>
              <div ref="propertyRef" class="col d4-scroll">
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
                <slot name="add-affix" :wrap="editWrap"></slot>
              </div>
              <div ref="affixRef" class="col d4-scroll">
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
            <q-tab-panel name="restrictions" class="column q-gutter-y-xs no-padding">
              <div v-if="slots['add-restriction']">
                <slot name="add-restriction" :wrap="editWrap"></slot>
              </div>
              <div ref="restrictionRef" class="col d4-scroll">
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
                <div v-if="slots.restrictions && !loading" class="list column q-gutter-y-sm">
                  <slot name="restrictions">
                  </slot>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-card-section>
      <q-separator v-if="!hasProperties && !hasAffixes" />
      <q-card-section>
        <D4Price :data="data.price" :editable="editable" :disable="disable" :progress="loading" @update="updatePrice" />
      </q-card-section>
      <q-separator v-if="slots.actions" />
      <q-card-section v-if="slots.actions">
        <slot name="actions"></slot>
      </q-card-section>
    </q-form>
    <slot name="more" :loading="loading"></slot>
  </q-card>
  <q-card v-else class="card-item non-selectable no-scroll full-height overflow-hidden"
    :class="[{ 'expanded': data.expanded }, data.quality, `status-${data.statusCode}`]">
    <div class="inner">
      <q-card-section class="relative-position">
        <div class="column justify-center items-end q-gutter-xs user-area">
          <q-skeleton v-show="loading" width="50px" :height="$q.screen.lt.sm ? '16px' : '18px'" />
          <div v-show="!loading">{{
            findStatus(data.statusCode)?.label }}</div>
          <div v-if="slots['top-right']">
            <slot name="top-right"></slot>
          </div>
          <D4Price :data="data.price" :progress="loading" />
          <D4User :data="data.user" :label="t('seller')" :disable="disable" :progress="loading"
            :authorized="data.authorized" />
        </div>
        <div class="row justify-beween items-start q-px-sm">
          <div class="col relative-position q-gutter-y-xs" :class="{ 'q-py-sm': !$q.screen.lt.sm }">
            <div class="column items-start q-col-gutter-xs q-pb-sm">
              <div v-show="loading">
                <q-skeleton width="200px" height="24px" />
              </div>
              <div v-show="!loading" class="row no-wrap items-center q-col-gutter-xs">
                <div v-show="data.itemType === 'rune'" class="row items-center q-gutter-sm">
                  <div class="name">{{ (runes().find(r => r.value === data.runeId) || {}).label }}</div>
                  <div>{{ findRuneType(findRune(data.runeId)?.type)?.label }}
                  </div>
                </div>
                <div v-show="data.itemType !== 'rune'" class="name stress ellipsis-2-lines"
                  @click="$router.push({ name: 'item-detail', params: { itemid: data.itemId } })">
                  {{ data.name }}
                </div>
                <div v-if="data.quantity > 1" class="col-3 col-sm-2 price row items-center q-gutter-xs">
                  <div class="text-lowercase">x</div>
                  <div>{{ data.quantity }}</div>
                </div>
              </div>
              <div v-show="loading">
                <q-skeleton width="100px" :height="$q.screen.lt.sm ? '16px' : '18px'" />
              </div>
              <div v-show="!loading" class="stress" style="opacity:.6">{{ findQuality(data.quality)?.label }} {{
                findType(data.itemType)?.label }}
              </div>
            </div>
            <div v-show="data.power > 0">{{ t('item.power', { p: data.power }) }}</div>
            <div v-show="data.upgrade > 0" class="stress">{{ t('item.upgrade', { u: data.upgrade, ul: upgradeLimit }) }}
            </div>
            <q-skeleton v-show="loading" type="circle" class="q-mt-md item-image" height="140%" />
            <q-img v-show="!loading" no-spinner class="item-image" :src="itemImage" />
          </div>
        </div>
      </q-card-section>
      <q-separator style="width:50%" />
      <q-card-section class="col">
        <div v-show="data.itemType === 'rune'" class="q-pa-sm">
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
          <div v-show="!loading" class="row no-wrap items-baseline q-gutter-xs">
            <q-icon class="icon rotate-45" size="13px" :name="`img:${icons.regular}`" />
            <div>{{ (runes().find(r => r.value === data.runeId) || {}).attribute }}
            </div>
          </div>
        </div>
        <div v-show="loading || hasProperties" class="q-pa-sm">
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
      <q-separator v-show="loading || (hasProperties && hasAffixes)" />
      <q-card-section v-show="loading || hasAffixes">
        <div class="q-px-sm">
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
      <q-card-section class="row justify-end">
        <div class="q-px-sm">
          <q-item v-show="loading" v-for="c in 3" :key="c" style="min-height:10px;padding:3px">
            <q-item-section>
              <q-item-label>
                <q-skeleton type="text" width="65%" />
              </q-item-label>
            </q-item-section>
          </q-item>
          <div v-if="slots.restrictions && !loading" class="column q-gutter-y-sm">
            <slot name="restrictions">
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
<style scoped></style>