<script setup lang="ts">
import { reactive, ref, computed, useSlots, nextTick, watch } from 'vue'
import { QCard, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { clipboard } from 'src/common'

import { useItemStore } from 'stores/item-store'
import { Price } from 'src/types/item'
import { checkName, parse } from 'src/common'
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
const typeAttribute = computed(() => findType(props.data.itemType)?.attribute)
const hasPowers = computed(() => findType(props.data.itemType)?.hasPowers)
const hasProperties = computed(() => findType(props.data.itemType)?.hasProperties)
const hasAffixes = computed(() => findType(props.data.itemType)?.hasAffixes)
const _hardcore = ref<boolean>(props.data.hardcore)
const _ladder = ref<boolean>(props.data.ladder)
const _name = ref<string>(props.data.name)
const _quantity = ref<number>(props.data.quantity || 1)
const filterQuality = store.filterQuality//computed<Array<Quality>>(() => store.quality)
const _quality = ref<string>(props.data.quality || 'regular')
const filterTypes = store.filterTypes
const _type = ref<string>(props.data.itemType || 'weapons')
const findRuneType = store.findRuneType
const runes = store.filterRunes
const _rune = ref<string>(props.data.runeId || 'eld')
const findStatus = store.findItemStatus
const findRune = store.findRune
const findType = store.findType
const filterClasses = store.filterClasses
const _class = ref<string>(props.data.equipmentClass || 'axes')
const typeInfo = ref(parse(typeAttribute.value, props.data.itemTypeValues))
const _price = reactive<Price>(new Price((props.data.price && props.data.price.currency ? props.data.price.currency : 'offer'), (props.data.price && props.data.price.currencyValue ? props.data.price.currencyValue : null), (props.data.price && props.data.price.quantity ? props.data.price.quantity : null)))
const attributes = computed(() => [
  { label: t('powers'), value: 'powers', hide: !hasPowers.value },
  { label: t('properties'), value: 'properties', hide: !hasProperties.value },
  { label: t('affixes'), value: 'affixes', hide: !hasAffixes.value }
].filter(a => !a.hide))

const updateType = (val: string) => {
  typeInfo.value = parse(findType(val)?.attribute)
  _name.value = val === 'rune' ? '' : _name.value
  _class.value = filterClasses(val).length > 0 ? filterClasses(val)[0].value as string : 'axes'
  attribute.value = findType(val)?.hasPowers ? 'powers' : findType(val)?.hasProperties ? 'properties' : 'affixes'
  update()
}

const update = () => {
  emit('update', { hardcore: _hardcore.value, ladder: _ladder.value, name: _name, itemTypeValues: typeInfo.value?.filter(i => i.type === 'variable').map(i => parseInt(i.value.toString())), quantity: _quantity.value, quality: _quality.value, itemType: _type.value, runeId: _rune.value, equipmentClass: _class.value, price: _price })
}

const updatePrice = (price: Price) => {
  _price.currency = price.currency
  _price.currencyValue = price.currencyValue
  _price.quantity = price.quantity
  update()
}

const focus = (evt: Event) => {
  const el: HTMLInputElement | null = (evt.target as Element)?.closest('input')
  el?.select()
}

// control scroll
const powerRef = ref<HTMLDivElement | null>(null)
const propertyRef = ref<HTMLDivElement | null>(null)
const affixRef = ref<HTMLDivElement | null>(null)
const scrollEnd = (pType: string, valueId: string) => {
  nextTick(() => {
    if (pType === 'powers' && powerRef.value) {
      const findValue = powerRef.value.querySelector(`div[data-id="${valueId}"] input`) as HTMLInputElement
      findValue?.focus()
    }
    else if (pType === 'properties' && propertyRef.value) {
      const findValue = propertyRef.value.querySelector(`div[data-id="${valueId}"] input`) as HTMLInputElement
      findValue?.focus()
    }
    else if (pType === 'affixes' && affixRef.value) {
      const findValue = affixRef.value.querySelector(`div[data-id="${valueId}"] input`) as HTMLInputElement
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
const attribute = ref<string>(hasPowers.value ? 'powers' : hasProperties.value ? 'properties' : 'affixes')

watch(() => props.data.quantity, (val) => {
  _quantity.value = val
})

defineExpose({ scrollEnd })
</script>

<template>
  <q-card v-if="editable" ref="editWrap" class="card-item non-selectable no-scroll editable" :class="data.quality">
    <q-form class="inner column no-wrap" :class="$q.screen.lt.sm ? '' : 'justify-between'" @submit="apply"
      :style="$q.screen.lt.sm ? 'height:100%' : 'max-height:90vh'">
      <q-card-section>
        <div class="column items-start q-gutter-y-sm">
          <div class="row items-center justify-between full-width q-gutter-sm">
            <div>
              <div class="row items-center q-gutter-sm quality">
                <q-btn :ripple="!$q.dark.isActive" v-for="q in filterQuality()" :key="q.value" :disable="disable" round
                  unelevated :class="['text-weight-bold', _quality === q.value ? 'active' : '']" :label="q.label"
                  @click="_quality = q.value as string; update()" />
              </div>
            </div>
            <div class="col column items-end q-gutter-y-sm toggles">
              <q-toggle left-label v-model="_hardcore" :disable="disable" color="secondary" :label="t('hardcore')" dense
                @update:model-value="update" />
              <q-toggle left-label v-model="_ladder" :disable="disable" color="primary" :label="t('ladder')" dense
                @update:model-value="update" />
            </div>
          </div>
          <div class="full-width">
            <div class="row items-center q-col-gutter-sm">
              <div class="col">
                <q-select v-model="_type" :disable="disable" outlined dense no-error-icon hide-bottom-space emit-value
                  map-options transition-show="none" transition-hide="none" :label="t('item.selectType')"
                  :dropdown-icon="`img:${icons.dropdown}`" :options="filterTypes()" @update:model-value="updateType">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                </q-select>
              </div>
              <div class="col" v-show="filterClasses(data.itemType).length > 0">
                <q-select v-model="_class" :disable="disable" outlined dense no-error-icon hide-bottom-space emit-value
                  map-options transition-show="none" transition-hide="none" :label="t('item.selectClass')"
                  :dropdown-icon="`img:${icons.dropdown}`" :options="filterClasses(data.itemType)"
                  @update:model-value="update">
                  <template #selected-item="scope">
                    <div class="ellipsis">{{ scope.opt.label }}</div>
                  </template>
                </q-select>
              </div>
              <div class="col" v-show="data.itemType === 'rune'">
                <q-select v-model="_rune" :disable="disable" outlined dense no-error-icon hide-bottom-space emit-value
                  map-options transition-show="none" transition-hide="none" :label="t('item.selectRune')"
                  :options="runes()" :dropdown-icon="`img:${icons.dropdown}`" @update:model-value="update">
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
      <q-card-section v-if="typeAttribute || hasPowers || hasProperties || hasAffixes" class="tab">
        <div class="row justify-between items-center">
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
          <div>
            <q-btn-toggle v-model="attribute" square flat :ripple="false" :color="$q.dark.isActive ? 'grey-5' : 'grey-8'"
              toggle-color="transparent toggle" :options="attributes" />
          </div>
        </div>
      </q-card-section>
      <q-card-section v-if="hasPowers || hasProperties || hasAffixes" class="col column no-wrap" style="padding-top:0">
        <div class="attribute column">
          <q-tab-panels v-model="attribute" class="q-pa-xs bg-transparent col">
            <q-tab-panel v-if="hasPowers" name="powers" class="column q-gutter-y-xs no-padding">
              <div v-if="slots['add-power']">
                <slot name="add-power" :wrap="editWrap"></slot>
              </div>
              <div ref="powerRef" class="col d4-scroll">
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
          </q-tab-panels>
        </div>
      </q-card-section>
      <q-separator v-if="!hasPowers && !hasProperties && !hasAffixes" />
      <q-card-section>
        <D4Price :data="data.price" :editable="editable" :disable="disable" @update="updatePrice" />
      </q-card-section>
      <q-separator v-if="slots.actions" />
      <q-card-section v-if="slots.actions">
        <slot name="actions"></slot>
      </q-card-section>
    </q-form>
    <slot name="more" :loading="loading"></slot>
  </q-card>
  <q-card v-else class="card-item non-selectable no-scroll full-height overflow-hidden"
    :class="[data.expanded ? 'expanded' : '', data.quality, `status-${data.statusCode}`]">
    <div class="inner" :style="$q.screen.lt.sm ? 'height:100%' : ''">
      <q-card-section>
        <div class="row justify-beween items-start q-px-sm">
          <div class="col relative-position" :class="$q.screen.lt.sm ? 'q-gutter-y-xs' : 'q-gutter-y-sm q-py-sm'">
            <div>
              <q-skeleton v-show="loading" width="50%" height="24px" />
              <div v-show="!loading" class="row no-wrap items-center q-col-gutter-x-xs">
                <div v-show="data.itemType === 'rune'" class="row items-center">
                  <div class="name">{{ (runes().find(r => r.value === data.runeId) || {}).label }}</div>
                  <div>{{ findRuneType(findRune(data.runeId)?.type)?.label }}
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
              <D4User :data="data.user" type="row">
                <template #battleTag>
                  <div class="row items-center q-gutter-xs">
                    <div :class="[data.authorized ? 'authorized' : '', data.user.battleTag !== '' ? 'allow-copy' : '']"
                      @click="clipboard(data.user.battleTag)">
                      {{ data.user.battleTag === '' ?
                        t('seller') :
                        data.user.battleTag }}</div>
                    <q-icon v-show="data.user.battleTag === ''" class="icon" :name="`img:${icons.help}`" size="19px">
                      <q-tooltip :class="$q.dark.isActive ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4'"
                        anchor="center right" self="center left" :offset="[10, 0]" transition-hide="jump-right"
                        transition-show="jump-left">
                        <div class="break-keep text-caption" style="max-width:160px;">
                          {{ t('sellerHelp.sh1') }}
                          <span class="underline text-weight-bold">{{ t('sellerHelp.sh2') }}</span>
                          {{ t('sellerHelp.sh3') }}
                          <span class="underline text-weight-bold">{{ t('sellerHelp.sh4') }}</span>
                          {{ t('sellerHelp.sh5') }}
                        </div>
                      </q-tooltip>
                    </q-icon>
                  </div>
                </template>
              </D4User>
            </div>
            <div v-if="slots.powers && !loading && hasPowers && data.powers.length > 0" class="column q-gutter-y-xs">
              <slot name="powers">
              </slot>
            </div>
            <q-img v-show="!loading" class="item-image" :src="itemImage" />
          </div>
          <div class="column justify-center items-end q-gutter-xs">
            <q-skeleton v-show="loading" width="50px" :height="$q.screen.lt.sm ? '16px' : '18px'" />
            <div v-show="!loading" :class="data.statusCode === '001' ? 'text-red-8 text-weight-bold' : ''">{{
              findStatus(data.statusCode)?.label }}</div>
            <div v-if="slots['top-right']">
              <slot name="top-right"></slot>
            </div>
            <D4Price :data="data.price" />
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
            <q-icon class="icon rotate-45" size="13px" :name="`img:${icons.regular} `" />
            <div>{{ (runes().find(r => r.value === data.runeId) || {}).attribute }}
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-section v-show="loading || typeAttribute || hasProperties">
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
      <q-separator v-if="slots.actions" />
      <q-card-section v-if="slots.actions">
        <slot v-if="!loading" name="actions"></slot>
      </q-card-section>
    </div>
    <slot name="more" :loading="loading"></slot>
  </q-card>
</template>
<style scoped></style>