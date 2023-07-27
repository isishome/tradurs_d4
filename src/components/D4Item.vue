<script setup lang="ts">
import { reactive, ref, computed, defineAsyncComponent, useSlots, nextTick, watch, onUnmounted } from 'vue'
import { QCard, useQuasar, date } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'
import { Item, Price } from 'src/types/item'
import { checkName, clipboard } from 'src/common'
import { itemImgs } from 'src/common/items'

const D4Price = defineAsyncComponent(() => import('components/D4Price.vue'))
const D4User = defineAsyncComponent(() => import('components/D4User.vue'))
const D4Separator = defineAsyncComponent(() => import('components/D4Separator.vue'))

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

const emit = defineEmits(['update', 'apply', 'copy', 'favorite'])

// common variable
const $q = useQuasar()
const slots = useSlots()
const as = useAccountStore()
const store = useItemStore()
const { t } = useI18n({ useScope: 'global' })

// variable
const editWrap = ref<QCard | null>(null)

const filterClasses = store.filterClasses
const filterRunesByType = store.filterRunesByType

const _hardcore = ref<boolean>(props.data.hardcore)
const _ladder = ref<boolean>(props.data.ladder)
const _name = ref<string>(props.data.name)
const _quantity = ref<number>(props.data.quantity || 1)
const remainDate = ref<number>(date.getDateDiff(new Date(props.data.endDate), new Date(), 'seconds'))
const hour = 60 * 60
const minute = 60
const remainHours = computed(() => Math.floor(Math.max(remainDate.value / hour, 0)).toString().padStart(2, '0'))
const remainMinutes = computed(() => Math.floor(Math.max(remainDate.value % hour / minute, 0)).toString().padStart(2, '0'))
const remainSeconds = computed(() => Math.floor(Math.max(remainDate.value % hour % minute, 0)).toString().padStart(2, '0'))
const remainColor = computed(() => remainDate.value < hour ? `text-red-6` : '')
const remainInterval = setInterval(() => {
  remainDate.value--
}, 1000)
const _quality = ref<string>(props.data.quality || 'rare')
const _type = ref<string>(props.data.itemType || store.filterTypes()[0].value as string)
const _typeValue1 = ref<string>(props.data.itemTypeValue1 || (_type.value === 'aspect' ? store.aspectCategories[0].value as string : filterClasses(_type.value)[0].value as string))
const _typeValue2 = ref<string>(props.data.itemTypeValue2 || (_typeValue1.value === 'gem' ? store.gems[0].value as string : ''))
const _power = ref<number>(props.data.power)
const _upgrade = ref<number>(props.data.upgrade)
const _level = ref<number | null>(props.data.level === 0 ? null : props.data.level)
const _favorite = ref<boolean>(props.data.favorite)

const findRuneType = store.findRuneType
const filterTypes = store.filterTypes
const upgradeLimit = computed(() => store.findQuality(props.data.quality)?.upgradeLimit)
const findQuality = store.findQuality
const filterQuality = store.filterQuality
const findStatus = store.findItemStatus
const findRune = store.findRune
const findType = store.findType
const findClass = store.findClass

const hasProperties = computed(() => findClass(_typeValue1.value)?.properties.length !== 0)

const _image = ref<number>(props.data.imageId)
const _price = reactive<Price>(new Price((props.data.price && props.data.price.currency ? props.data.price.currency : 'offer'), (props.data.price && props.data.price.currencyValue ? props.data.price.currencyValue : null), (props.data.price && props.data.price.quantity ? props.data.price.quantity : undefined)))

const attributes = computed(() => [
  { label: t('properties'), value: 'properties', hide: !hasProperties.value },
  { label: t('affixes'), value: 'affixes' },
  { label: t('restrictions'), value: 'restrictions' }
].filter(a => !a.hide))

const copy = () => {
  clipboard(`${document.location.origin}/item/${props.data.itemId}`, t('item.url'))
}

const updateQuality = (val: string) => {
  _quality.value = val
  _power.value = 0
  _upgrade.value = 0
  update()
}

const updateType = (val: string) => {
  _typeValue1.value = val === 'aspect' ? store.aspectCategories[0].value as string : filterClasses(val)[0].value as string
  update()
}

const updateTypeValue1 = (val: string) => {
  _image.value = 0
  attribute.value = findClass(val)?.properties.length !== 0 ? 'properties' : 'affixes'
  _typeValue2.value = val === 'gem' ? store.gems[0].value as string : ''
  update()
}

const update = () => {
  emit('update', { hardcore: _hardcore.value, ladder: _ladder.value, name: _name, quantity: _quantity.value, quality: _quality.value, itemType: _type.value, itemTypeValue1: _typeValue1.value, itemTypeValue2: _typeValue2.value, imageId: _image, power: _power.value, upgrade: _upgrade.value, level: _level.value, price: _price, favorite: _favorite })
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
const attribute = ref<string>(hasProperties.value ? 'properties' : 'affixes')

watch(() => props.data.quantity, (val: number) => {
  _quantity.value = val
})

watch(() => props.data.endDate, (val: string) => {
  remainDate.value = date.getDateDiff(new Date(val), new Date(), 'seconds')
})

onUnmounted(() => {
  clearInterval(remainInterval)
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
                  unelevated aria-label="Tradurs Quality Button"
                  :class="['text-weight-bold', { 'active': _quality === q.value }]" :label="q.label"
                  @click="updateQuality(q.value as string)" />
              </div>
            </div>
            <div class="row justify-end items-center q-gutter-xs toggles">
              <q-toggle left-label v-model="_hardcore" :disable="disable" color="secondary" :label="t('item.hardcore')"
                dense @update:model-value="update" />
              <q-toggle left-label v-model="_ladder" :disable="disable" color="primary" :label="t('item.ladder')" dense
                @update:model-value="update" />
            </div>
          </div>
          <div class="full-width">
            <div class="row items-center q-col-gutter-sm">
              <div class="col">
                <q-select v-model="_type" :disable="disable" behavior="menu" outlined dense no-error-icon
                  hide-bottom-space emit-value map-options transition-show="none" transition-hide="none"
                  :transition-duration="0" :label="t('item.selectType')" dropdown-icon="img:/images/icons/dropdown.svg"
                  :options="filterTypes()" popup-content-class="d4-scroll" @update:model-value="updateType">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                </q-select>
              </div>
              <!-- Item Type Value Place ----------------------------------------------------------------------------------->
              <div class="col" v-if="_type === 'rune'">
                <q-select v-model="_typeValue1" :disable="disable" behavior="menu" outlined dense no-error-icon
                  hide-bottom-space emit-value map-options transition-show="none" transition-hide="none"
                  :transition-duration="0" :label="t('item.selectRune')" :options="filterRunesByType()"
                  dropdown-icon="img:/images/icons/dropdown.svg " popup-content-class="d4-scroll"
                  @update:model-value="update">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <img :src="`/images/items/rune/${scope.opt.value}.webp`" width="24" height="24"
                          alt="Tradurs Rune Image" />
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
                  :transition-duration="0" :label="t('item.selectAspectCategory')"
                  dropdown-icon="img:/images/icons/dropdown.svg" :options="store.aspectCategories"
                  popup-content-class="d4-scroll" @update:model-value="update">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                  <template #option="scope">
                    <q-item clickable @click="scope.toggleOption(scope.opt.value)">
                      <q-item-section avatar>
                        <img height="36" :src="`/images/items/${_type}/${scope.opt.value}.webp`"
                          alt="Tradurs Aspect Image" />
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
                    :transition-duration="0" :label="t('item.selectClass')" dropdown-icon="img:/images/icons/dropdown.svg"
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
                    :transition-duration="0" :label="t('item.selectGem')" dropdown-icon="img:/images/icons/dropdown.svg"
                    :options="store.gems" popup-content-class="d4-scroll" @update:model-value="update">
                    <template #selected-item="scope">
                      <div class="ellipsis">{{ scope.opt.label }}</div>
                    </template>
                    <template #option="scope">
                      <q-item clickable @click="scope.toggleOption(scope.opt.value)">
                        <q-item-section avatar>
                          <img height="36" :src="`/images/items/${_type}/${_typeValue1}/${scope.opt.value}.webp`"
                            alt="Tradurs Gem Image" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="ellipsis">{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div v-else>
                  <q-btn dense glossy outline aria-label="Tradurs Thumbnail Button" padding="4px 8px" color="primary"
                    :ripple="false" class="no-hover rounded-borders" @click="showItemImages = true">
                    <img height="32" :src="`/images/items/${_type}/${_typeValue1}/${_image}.webp`"
                      alt="Tradurs Item Thumbnail Image" />
                    <D4Dialog v-model="showItemImages" :no-route-dismiss="false">
                      <template #top>
                        <q-card-section class="row justify-between items-center q-ml-md">
                          <div class="name text-uppercase">{{ t('item.selectImage', {
                            tv:
                              findClass(data.itemTypeValue1)?.label || findType(data.itemType)?.label
                          }) }}
                          </div>
                          <q-btn unelevated aria-label="Tradurs Close Button" class="no-hover icon" :ripple="false">
                            <img src="/images/icons/close.svg" width="24" height="24" @click="showItemImages = false"
                              alt="icon_close" />
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
                                  <q-img style="width:90%" :src="`/images/items/${_type}/${_typeValue1}/${idx}.webp`"
                                    alt="Tradurs Item Image" />
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
      <D4Separator v-show="data.itemType !== 'rune'" />
      <q-card-section v-if="data.itemType !== 'rune'">
        <q-input v-show="data.itemType !== 'rune'" :disable="disable" dense no-error-icon hide-bottom-space autofocus
          v-model="_name" outlined class="col-10" :label="t('item.name')" @update:model-value="update" maxlength="256"
          :rules="[val => checkName(val) || '']" />
      </q-card-section>
      <D4Separator v-show="data.itemType === 'rune'" />
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
          <q-icon class="icon rotate-45" size="13px" name="img:/images/attribute_types/standard.svg" />
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
      <D4Separator />
      <q-card-section class="row justify-between items-center q-col-gutter-x-sm">
        <div class="row items-center q-gutter-x-sm">
          <D4Counter v-model="_power" :label="t('item.power')" :max="9999" max-width="110px" allow-zero no-button
            :disable="disable" @update:model-value="update" />
          <D4Counter v-if="upgradeLimit" v-model="_upgrade" :label="t('item.upgrade', { u: _upgrade, ul: upgradeLimit })"
            max-width="110px" :max="upgradeLimit" allow-zero :disable="disable" @update:model-value="update" />
        </div>
        <D4Counter v-model="_level" class="col row justify-end" :label="t('item.level')" max-width="110px" :max="999"
          allow-null no-button :disable="disable" @update:model-value="update" />
      </q-card-section>
      <D4Separator />
      <q-card-section class="tab row justify-end items-center">
        <q-btn-toggle v-model="attribute" square flat no-caps aria-label="Tradurs Attribute Button" :ripple="false"
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
            <q-tab-panel name="affixes" class="q-gutter-y-xs no-padding column">
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
      <D4Separator v-if="!hasProperties" />
      <q-card-section>
        <D4Price :data="data.price" :editable="editable" :disable="disable" :progress="loading" @update="updatePrice" />
      </q-card-section>
      <D4Separator v-if="slots.actions" />
      <q-card-section v-if="slots.actions">
        <slot name="actions"></slot>
      </q-card-section>
    </q-form>
    <slot name="more" :loading="loading"></slot>
  </q-card>
  <q-card v-else class="card-item non-selectable no-scroll full-height overflow-hidden"
    :class="[data.expanded ? 'expanded' : 'no-expanded', data.quality, `status-${data.statusCode} `]">
    <div class="inner">
      <q-card-section class="relative-position">
        <q-img v-show="!loading"
          :src="data.itemType === 'aspect' ? `/images/items/${data.itemType}/${data.itemTypeValue1}.webp` : data.itemTypeValue1 === 'gem' ? `/images/items/${data.itemType}/${data.itemTypeValue1}/${data.itemTypeValue2}.webp` : `/images/items/${data.itemType}/${data.itemTypeValue1}/${data.imageId}.webp`"
          class="item-image" alt="Tradurs Item Image" />
        <div class="column justify-center items-end user-area" :class="{ 'q-gutter-xs': !$q.screen.lt.sm || loading }">
          <q-skeleton v-show="loading" width="50px" :height="$q.screen.lt.sm ? '16px' : '18px'" />
          <div v-show="!loading" class="row items-center q-gutter-x-sm">
            <template v-if="!data.forDisplay">
              <div v-if="['000', '002'].includes(data.statusCode)" class="date" :class="remainColor">
                {{ remainHours }}:{{ remainMinutes }}:{{ remainSeconds }}
              </div>
              <div v-else-if="data.statusCode === '001'" class="date complete">
                {{ date.formatDate(data.updDate, 'YY.MM.DD') }}
              </div>
              <div>
                {{ findStatus(data.statusCode)?.label }}
              </div>
            </template>
            <div v-else>
              {{ t('item.forDisplay') }}
            </div>
          </div>
          <div v-if="slots['top-right']">
            <slot name="top-right"></slot>
          </div>
          <D4Price :data="data.price" :progress="loading" />
          <D4User v-if="!data.forDisplay" :data="data.user" :label="t('seller')" :disable="disable" :progress="loading"
            :authorized="data.authorized" />
        </div>
        <div class="column items-start q-pa-sm relative-position" :class="{ 'q-gutter-xs': !$q.screen.lt.sm || loading }">
          <div v-show="!loading" class="hardcore-ladder row justify-end items-center">
            <div class="text-secondary">{{ data.hardcore ? '&#10074;' : '' }}</div>
            <div class="text-primary">{{ data.ladder ? '&#10074;' : '' }}</div>
          </div>
          <div v-show="loading">
            <q-skeleton width="150px" :height="$q.screen.lt.sm ? '16px' : '24px'" />
          </div>
          <div class="name-place">
            <div v-show="!loading" class="row items-center q-gutter-xs q-mb-xs no-wrap">
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

              <div class="more-action">
                <q-btn dense flat aria-label="Tradurs More Button" :ripple="false" class="no-hover" padding="0">
                  <img class="icon" src="/images/icons/morevert.svg" :width="$q.screen.lt.sm ? 16 : 20"
                    :height="$q.screen.lt.sm ? 16 : 20" alt="icon_more" />
                  <q-menu auto-close class="no-shadow" transition-show="none" transition-hide="none"
                    :transition-duration="0" anchor="top end" self="bottom start"
                    :class="[$q.dark.isActive ? 'bg-grey-4' : 'bg-grey-9']">
                    <q-item v-if="as.signed" :class="[$q.dark.isActive ? 'text-grey-9' : 'text-grey-4']"
                      :dense="$q.screen.lt.sm" clickable @click="$emit('favorite', data.itemId, !data.favorite)">
                      <q-item-section side>
                        <img :class="{ 'invert': !$q.dark.isActive }"
                          :src="data.favorite ? '/images/icons/unfavorite.svg' : '/images/icons/favorite.svg'" width="24"
                          height="24" alt="icon_favorite" />
                      </q-item-section>
                      <q-item-section>{{ data.favorite ? t('btn.unfavorite') : t('btn.favorite')
                      }}</q-item-section>
                    </q-item>
                    <q-item v-if="as.signed" :class="[$q.dark.isActive ? 'text-grey-9' : 'text-grey-4']"
                      :dense="$q.screen.lt.sm" clickable @click="$emit('copy', data.itemId)">
                      <q-item-section side>
                        <img :class="{ 'invert': !$q.dark.isActive }" src="/images/icons/copy.svg" width="24" height="24"
                          alt="icon_copy" />
                      </q-item-section>
                      <q-item-section>{{ t('btn.copy') }}</q-item-section>
                    </q-item>
                    <q-item :class="[$q.dark.isActive ? 'text-grey-9' : 'text-grey-4']" :dense="$q.screen.lt.sm" clickable
                      @click="copy">
                      <q-item-section side>
                        <img :class="{ 'invert': !$q.dark.isActive }" src="/images/icons/share.svg" width="24" height="24"
                          alt="icon_share" />
                      </q-item-section>
                      <q-item-section>{{ t('btn.share') }}</q-item-section>
                    </q-item>
                  </q-menu>
                </q-btn>
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
            {{ t('item.power', { p: data.power, u: data.upgrade ? ` + ${data.upgrade * 5}` : '' }) }}
          </div>
          <div v-show="data.upgrade > 0" class="stress">
            {{ t('item.upgrade', { u: data.upgrade, ul: upgradeLimit }) }}
          </div>
        </div>
      </q-card-section>
      <D4Separator type="left" />
      <q-card-section v-show="loading || (!loading && (data.itemType === 'rune' || data.properties.length > 0))">
        <div v-show="data.itemType === 'rune'" class="q-px-sm">
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
            <q-icon class="icon rotate-45" size="13px" name="img:/images/attribute_types/standard.svg" />
            <div>{{ (filterRunesByType().find(r => r.value === data.itemTypeValue1) || {}).attribute }}
            </div>
          </div>
        </div>
        <div class="q-px-sm">
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
      <D4Separator v-show="loading || (!loading && data.properties.length > 0 && data.affixes.length > 0)" />
      <q-card-section v-show="loading || (!loading && data.affixes.length > 0)">
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
      <q-card-section v-show="!loading && data.properties.length === 0 && data.affixes.length === 0"
        class="q-my-lg"></q-card-section>
      <q-card-section class="row justify-end">
        <div class="q-px-sm">
          <q-item v-show="loading" v-for="c in 3" :key="c" style="min-height:10px;padding:3px">
            <q-item-section>
              <q-item-label>
                <q-skeleton type="text" width="65%" />
              </q-item-label>
            </q-item-section>
          </q-item>
          <div class="column" :class="{ 'q-gutter-y-xs': !$q.screen.lt.sm }">
            <div class="text-right q-pt-sm">
              {{ t('item.level') }}: {{ data.level }}
            </div>
            <slot v-if="slots.restrictions && !loading && data.restrictions.length > 0" name="restrictions">
            </slot>
          </div>
        </div>
      </q-card-section>
      <D4Separator v-show="slots.actions" />
      <q-card-section v-if="slots.actions">
        <slot v-if="!loading" name="actions"></slot>
      </q-card-section>
    </div>
    <slot name="more" :loading="loading"></slot>
  </q-card>
</template>
<style scoped>
.date {
  font-family: monospace;
  font-size: 11px;
  line-height: 12px;
}

.complete {
  color: var(--q-legendary);
}
</style>