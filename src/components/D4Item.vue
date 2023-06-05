<script setup lang="ts">
import { reactive, ref, computed, useSlots, nextTick, watch } from 'vue'
import { QCard, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useItemStore } from 'stores/item-store'
import { Item, Price } from 'src/types/item'
import { checkName } from 'src/common'
import { icons } from 'src/common/icons'
import { itemImgs } from 'src/common/items'

import D4Price from 'components/D4Price.vue'
import D4Counter from 'components/D4Counter.vue'
import D4User from 'components/D4User.vue'
import D4Dialog from 'components/D4Dialog.vue'

interface IProps {
  data: Item,
  editable?: boolean,
  loading?: boolean,
  disable?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  editable: false,
  loading: false,
  disable: false
})

const emit = defineEmits(['update', 'apply'])

// common variable
const $q = useQuasar()
const slots = useSlots()
const store = useItemStore()
const { t } = useI18n({ useScope: 'global' })

// variable
const editWrap = ref<QCard | null>(null)
const hasProperties = computed(() => findType(_type.value)?.hasProperties)
const hasAffixes = computed(() => findType(_type.value)?.hasAffixes)

const filterClasses = store.filterClasses
const filterRunesByType = store.filterRunesByType
const filterGems = store.filterGems

const _hardcore = ref<boolean>(props.data.hardcore)
const _ladder = ref<boolean>(props.data.ladder)
const _name = ref<string>(props.data.name)
const _quantity = ref<number>(props.data.quantity || 1)
const _quality = ref<string>(props.data.quality || 'normal')
const _type = ref<string>(props.data.itemType || store.filterTypes()[0].value as string)
const _typeValue1 = ref<string>(props.data.itemTypeValue1 || (_type.value === 'aspect' ? store.aspectCategories[0].value as string : filterClasses(_type.value)[0].value as string))
const _typeValue2 = ref<string>(props.data.itemTypeValue2 || (_typeValue1.value === 'gem' ? filterGems()[0].value as string : ''))


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
const findClass = store.findClass

const filterAspectCategories = store.filterAspectCategories

const _image = ref<number>(props.data.imageId)
const _price = reactive<Price>(new Price((props.data.price && props.data.price.currency ? props.data.price.currency : 'offer'), (props.data.price && props.data.price.currencyValue ? props.data.price.currencyValue : null), (props.data.price && props.data.price.quantity ? props.data.price.quantity : undefined)))

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
  _typeValue1.value = val === 'aspect' ? store.aspectCategories[0].value as string : filterClasses(val)[0].value as string
  attribute.value = findType(val)?.hasProperties ? 'properties' : findType(val)?.hasAffixes ? 'affixes' : 'restrictions'
  update()
}

const updateTypeValue1 = (val: string) => {
  _image.value = 0
  _typeValue2.value = val === 'gem' ? filterGems()[0].value as string : ''
  update()
}

const update = () => {
  emit('update', { hardcore: _hardcore.value, ladder: _ladder.value, name: _name, quantity: _quantity.value, quality: _quality.value, itemType: _type.value, itemTypeValue1: _typeValue1.value, itemTypeValue2: _typeValue2.value, imageId: _image, power: _power.value, upgrade: _upgrade.value, price: _price })
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
const showItemImages = ref<boolean>(false)

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
          <div class="row items-center no-wrap justify-between q-col-gutter-sm full-width q-py-sm">
            <div>
              <div class="row no-wrap items-center q-gutter-xs quality">
                <q-btn :ripple="!$q.dark.isActive" v-for="q in filterQuality()" :key="q.value" :disable="disable" round
                  unelevated :class="['text-weight-bold', { 'active': _quality === q.value }]" :label="q.label"
                  @click="updateQuality(q.value as string)" />
              </div>
            </div>
            <div class="row justify-end items-center q-gutter-xs toggles">
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
                  popup-content-class="d4-scroll" @update:model-value="updateType">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                </q-select>
              </div>
              <!-- Item Type Value Place ----------------------------------------------------------------------------------->
              <div class="col" v-if="_type === 'rune'">
                <q-select v-model="_typeValue1" :disable="disable" behavior="menu" outlined dense no-error-icon
                  hide-bottom-space emit-value map-options transition-show="none" transition-hide="none"
                  :label="t('item.selectRune')" :options="filterRunesByType()" :dropdown-icon="`img:${icons.dropdown} `"
                  popup-content-class="d4-scroll" @update:model-value="update">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <img :src="`/images/items/rune/${scope.opt.value}.webp`" width="24" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div class="col" v-else-if="_type === 'aspect'">
                <q-select v-model="_typeValue1" :disable="disable" behavior="menu" outlined dense no-error-icon
                  hide-bottom-space emit-value map-options transition-show="none" transition-hide="none"
                  :label="t('item.selectAspectCategory')" :dropdown-icon="`img:${icons.dropdown}`"
                  :options="filterAspectCategories()" popup-content-class="d4-scroll" @update:model-value="update">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                  <template #option="scope">
                    <q-item clickable @click="scope.toggleOption(scope.opt.value)">
                      <q-item-section avatar>
                        <img height="36" :src="`/images/items/${_type}/${scope.opt.value}.webp`" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="ellipsis">{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <template v-else>
                <div class="col">
                  <q-select v-model="_typeValue1" :disable="disable" behavior="menu" outlined dense no-error-icon
                    hide-bottom-space emit-value map-options transition-show="none" transition-hide="none"
                    :label="t('item.selectClass')" :dropdown-icon="`img:${icons.dropdown}`"
                    :options="filterClasses(_type)" popup-content-class="d4-scroll"
                    @update:model-value="updateTypeValue1">
                    <template #selected-item="scope">
                      <div class="ellipsis">{{ scope.opt.label }}</div>
                    </template>
                  </q-select>
                </div>
                <div class="col" v-if="_typeValue1 === 'gem'">
                  <q-select v-model="_typeValue2" :disable="disable" behavior="menu" outlined dense no-error-icon
                    hide-bottom-space emit-value map-options transition-show="none" transition-hide="none"
                    :label="t('item.selectGem')" :dropdown-icon="`img:${icons.dropdown}`" :options="filterGems()"
                    popup-content-class="d4-scroll" @update:model-value="update">
                    <template #selected-item="scope">
                      <div class="ellipsis">{{ scope.opt.label }}</div>
                    </template>
                    <template #option="scope">
                      <q-item clickable @click="scope.toggleOption(scope.opt.value)">
                        <q-item-section avatar>
                          <img height="36" :src="`/images/items/${_type}/${_typeValue1}/${scope.opt.value}.webp`" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="ellipsis">{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div v-else>
                  <q-btn dense glossy outline padding="4px 8px" color="primary" :ripple="false"
                    class="no-hover rounded-borders" @click="showItemImages = true">
                    <img height="32" :src="`/images/items/${_type}/${_typeValue1}/${_image}.webp`" />
                    <D4Dialog v-model="showItemImages" :no-route-dismiss="false">
                      <template #top>
                        <q-card-section class="row justify-between items-center q-ml-md">
                          <div class="name text-uppercase">{{ t('item.selectImage', {
                            tv:
                              findClass(data.itemTypeValue1)?.label || findType(data.itemType)?.label
                          }) }}
                          </div>
                          <q-btn unelevated class="no-hover icon" :ripple="false">
                            <img :src="icons.close" width="24" @click="showItemImages = false" />
                          </q-btn>
                        </q-card-section>
                      </template>
                      <template #middle>
                        <q-card-section class="d4-scroll q-ma-lg" style="height:50vh">
                          <div class="row q-col-gutter-md">
                            <div v-for="i, idx in itemImgs[_type][_typeValue1 as string]" :key="idx"
                              class="col-4 col-md-3 cursor-pointer" @click="_image = idx; update()" v-close-popup>
                              <q-card flat bordered class="item-image-card"
                                :class="{ 'bg-primary-cloud': idx === data.imageId }">
                                <q-card-section class="text-center no-padding">
                                  <q-img style="width:90%" :src="`/images/items/${_type}/${_typeValue1}/${idx}.webp`" />
                                </q-card-section>
                              </q-card>
                            </div>
                          </div>
                        </q-card-section>
                      </template>
                    </D4Dialog>
                  </q-btn>
                </div>
              </template>
              <!-- Item Type Value Place ----------------------------------------------------------------------------------->
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
          <q-icon class="icon rotate-45" size="13px" :name="`img:${icons.standard} `" />
          <div>{{ (filterRunesByType().find(r => r.value === data.itemTypeValue1) || {}).attribute }}
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
      <q-card-section class="col" style="padding-top:0">
        <div class="attribute">
          <q-tab-panels v-model="attribute" class="q-pa-xs bg-transparent full-height">
            <q-tab-panel v-if="hasProperties" name="properties" class="q-gutter-y-xs no-padding column">
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
                <div v-if="slots.properties && !loading" class="list q-gutter-y-xs">
                  <slot name="properties">
                  </slot>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel v-if="hasAffixes" name="affixes" class="q-gutter-y-xs no-padding column">
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
                <div v-if="slots.affixes && !loading" class="list q-gutter-y-xs">
                  <slot name="affixes">
                  </slot>
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel name="restrictions" class="q-gutter-y-xs no-padding column">
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
                <div v-if="slots.restrictions && !loading" class="list q-gutter-y-xs">
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
    :class="[data.expanded ? 'expanded' : 'no-expanded', data.quality, `status - ${data.statusCode} `]">
    <div class="inner">
      <q-card-section class="relative-position">
        <q-img v-show="!loading"
          :src="data.itemType === 'aspect' ? `/images/items/${data.itemType}/${data.itemTypeValue1}.webp` : data.itemTypeValue1 === 'gem' ? `/images/items/${data.itemType}/${data.itemTypeValue1}/${data.itemTypeValue2}.webp` : `/images/items/${data.itemType}/${data.itemTypeValue1}/${data.imageId}.webp`"
          class="item-image" />
        <div class="column justify-center items-end user-area" :class="{ 'q-gutter-xs': !$q.screen.lt.sm || loading }">
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
        <div class="column items-start q-pa-sm relative-position" :class="{ 'q-gutter-xs': !$q.screen.lt.sm || loading }">
          <div v-show="!loading" class="avatar row justify-end items-center">
            <div class="text-secondary">{{ data.hardcore ? '&#10074;' : '' }}</div>
            <div class="text-primary">{{ data.ladder ? '&#10074;' : '' }}</div>
          </div>
          <div v-show="loading">
            <q-skeleton width="150px" :height="$q.screen.lt.sm ? '16px' : '24px'" />
          </div>
          <div style="width:70%">
            <div v-show="!loading" class="row items-center q-gutter-xs q-mb-xs">
              <div v-show="data.itemType === 'rune'" class="row items-center q-gutter-sm">
                <div class="name">{{ (filterRunesByType().find(r => r.value === data.itemTypeValue1) || {}).label }}</div>
                <div>{{ findRuneType(findRune(data.itemTypeValue1)?.type)?.label }}
                </div>
              </div>
              <div v-show="data.itemType !== 'rune'" class="name stress ellipsis-2-lines">
                {{ data.name }}
              </div>
              <div v-if="data.quantity > 1" class="price row items-center q-gutter-xs">
                <div class="text-lowercase">x</div>
                <div>{{ data.quantity }}</div>
              </div>
            </div>
          </div>
          <div v-show="loading">
            <q-skeleton width="100px" :height="$q.screen.lt.sm ? '16px' : '18px'" />
          </div>
          <div v-show="!loading" class="stress" style="opacity:.6">{{ findQuality(data.quality)?.fullName }}
            {{ findClass(data.itemTypeValue1)?.label || findType(data.itemType)?.label }}
          </div>
          <div v-show="data.power > 0">
            {{ t('item.power', { p: data.power }) }}
          </div>
          <div v-show="data.upgrade > 0" class="stress">
            {{ t('item.upgrade', { u: data.upgrade, ul: upgradeLimit }) }}
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
            <q-icon class="icon rotate-45" size="13px" :name="`img:${icons.standard} `" />
            <div>{{ (filterRunesByType().find(r => r.value === data.itemTypeValue1) || {}).attribute }}
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
          <div v-if="slots.properties && !loading" class="column" :class="{ 'q-gutter-y-xs': !$q.screen.lt.sm }"
            style="min-height:25px;">
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
          <div v-if="slots.affixes && !loading" class="column" :class="{ 'q-gutter-y-xs': !$q.screen.lt.sm }"
            style="min-height:25px;">
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
          <div v-if="slots.restrictions && !loading" class="column" :class="{ 'q-gutter-y-xs': !$q.screen.lt.sm }">
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