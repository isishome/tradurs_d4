<script setup lang="ts">
import { ref, computed, reactive, nextTick } from 'vue'
import { useQuasar, QInput, QSelect, uid } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useAccountStore } from 'stores/account-store'
import { useItemStore, type Property, type Affix, type Restriction } from 'stores/item-store'
import { checkAttribute } from 'src/common'
import { Item, Advertise, Offer, type IItem } from 'src/types/item'
import { icons } from 'src/common/icons'

import D4Item from 'components/D4Item.vue'
import D4Property from 'components/D4Property.vue'
import D4Affix from 'components/D4Affix.vue'
import D4Restriction from 'components/D4Restriction.vue'
import D4Offer from 'components/D4Offer.vue'

interface IProps {
  items: Array<Item>,
  width?: string | number,
  height?: string | number,
  loading?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  width: '700',
  height: '200',
  loading: false
})

const emit = defineEmits(['upsert-item', 'delete-item', 'relist-item', 'status-item', 'update-only'])

// init module
const $q = useQuasar()
const as = useAccountStore()
const is = useItemStore()
const { t } = useI18n({ useScope: 'global' })

// common variable
const requestProperties = computed<number>(() => is.properties.request)
const requestAffixes = computed<number>(() => is.affixes.request)
const requestRestrictions = computed<number>(() => is.restrictions.request)

// about editable item
const activatedRef = ref<typeof D4Item | null>(null)
const activateShow = ref<boolean>(false)
const activatedItem = ref<Item>(new Item(''))

const editItem = (item: Item) => {
  const clone = JSON.parse(JSON.stringify(item))
  Object.assign(new Item, clone)
  Object.setPrototypeOf(clone, Item.prototype)
  activatedItem.value = clone
  activateShow.value = true
}

const updateItem = ({ hardcore, ladder, name, quantity, quality, itemType, runeId, power, upgrade, equipmentClass, price }: IItem): void => {
  activatedItem.value.hardcore = hardcore
  activatedItem.value.ladder = ladder
  activatedItem.value.name = name
  activatedItem.value.quantity = quantity
  activatedItem.value.quality = quality
  activatedItem.value.runeId = runeId
  activatedItem.value.power = power
  activatedItem.value.upgrade = upgrade
  activatedItem.value.equipmentClass = equipmentClass
  activatedItem.value.price.currency = price.currency
  activatedItem.value.price.currencyValue = price.currencyValue
  activatedItem.value.price.quantity = price.quantity

  if (activatedItem.value.itemType !== itemType) {
    activatedItem.value.itemType = itemType
    activatedItem.value.quantity = 1
    activatedItem.value.properties.splice(0, activatedItem.value.properties.length)
    activatedItem.value.affixes.splice(0, activatedItem.value.affixes.length)
    activatedItem.value.restrictions.splice(0, activatedItem.value.restrictions.length)
    activatedItem.value.action = 16
  }
}

const disable = ref<boolean>(false)
const progress = ref<boolean>(false)
const done = () => {
  disable.value = false
  progress.value = false
}
const hideEditable = () => {
  done()
  activatedItem.value = new Item('')
  activateShow.value = false
}

const deleteConfirm = () => {
  $q.dialog({
    title: t('deleteItem.title'),
    message: t('deleteItem.message'),
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey', outline: true },
    ok: { label: t('deleteItem.title'), color: 'negative', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'none',
    transitionHide: 'none',
    class: 'q-pa-sm'
  }).onOk(() => {
    disable.value = true
    emit('delete-item', activatedItem.value, done)
  })
}

const relistItem = () => {
  $q.dialog({
    title: t('relistItem.title'),
    message: t('relistItem.message'),
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey', outline: true },
    ok: { label: t('relistItem.title'), color: 'primary', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'none',
    transitionHide: 'none',
    class: 'q-pa-sm'
  }).onOk(() => {
    disable.value = true
    emit('relist-item', activatedItem.value, done)
  })
}

const statusItem = () => {
  const title = activatedItem.value.statusCode === '000' ? t('statusItem.suspendTitle') : t('statusItem.resumeTitle')
  const message = activatedItem.value.statusCode === '000' ? t('statusItem.suspendMessage') : t('statusItem.resumeMessage')
  $q.dialog({
    title: title,
    message: message,
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey', outline: true },
    ok: { label: title, color: 'primary', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'none',
    transitionHide: 'none',
    class: 'q-pa-sm'
  }).onOk(() => {
    disable.value = true
    emit('status-item', activatedItem.value, done)
  })
}

const apply = () => {
  disable.value = true
  progress.value = true
  emit('upsert-item', activatedItem.value, done)
}

// about add
interface Add {
  show: boolean,
  category: string | null,
  attributeTypes: Function,
  type: string,
  attribute: string,
  error: boolean,
  errorMessage: string
}

const refAttribute = ref<typeof QInput>()
const add = reactive<Add>({
  show: false as boolean,
  category: null as string | null,
  attributeTypes: is.filterAttributeTypes,
  type: 'regular',
  attribute: '',
  error: false,
  errorMessage: ''
})
const hideAdd = (): void => {
  add.category = null
  add.type = 'regular'
  add.attribute = ''
  add.error = false
  add.errorMessage = ''
}

const applyAdd = (): void => {
  let errorMessage = ''
  if (!add.attribute || add.attribute === '')
    errorMessage = t('attribute.enter', { attr: t(add.category as string) })
  else if (!checkAttribute(add.attribute))
    errorMessage = t('attribute.invalid', { attr: t(add.category as string) })
  else if ((add.category === 'properties' && is.matchProperties(add.attribute)) || (add.category === 'affixes' && is.matchAffixes(add.attribute)) || (add.category === 'restrictions' && is.matchRestrictions(add.attribute)))
    errorMessage = t('attribute.exists', { attr: t(add.category as string) })

  if (errorMessage !== '') {
    add.error = true
    add.errorMessage = errorMessage
    refAttribute.value?.focus()
    return
  }

  // add attribute request place
  disable.value = true
  is.addAttribute(add.category, {
    value: 0,
    label: add.attribute,
    type: add.type
  })
    .then((result: Property | Affix | Restriction) => {
      const tempId = uid()
      const attribute: any = { valueId: tempId, action: 2 }
      attribute[add.category === 'properties' ? 'propertyId' : add.category === 'affixes' ? 'affixId' : 'restrictId'] = result.value
      attribute[add.category === 'properties' ? 'propertyValues' : add.category === 'affixes' ? 'affixValues' : 'restrictValues'] = []
      const target = add.category === 'properties' ? activatedItem.value.properties : add.category === 'affixes' ? activatedItem.value.affixes : activatedItem.value.restrictions
      target.push(attribute)
      activatedRef.value?.scrollEnd(add.category, tempId)
      add.show = false
    })
    .catch(() => { })
    .then(() => {
      disable.value = false
    })
}

const addAttrNum = () => {
  add.attribute = add.attribute + '{x}'
  refAttribute.value?.focus()
}

// about property
const propertyRef = ref<QSelect | null>(null)
const propertyId = ref<number | null>(null)
const propertyOptions = is.filterProperties
const propertyNeedle = ref<string>()

const filterProperties = (val: string): void => {
  propertyRef.value?.showPopup()
  propertyNeedle.value = val.toLowerCase()
}

const selectedProperty = (val: number): void => {
  if (val) {
    const tempId = uid()
    const tempValues = is.findProperty(val)?.label
    activatedItem.value.properties.push({ valueId: tempId, propertyId: val, propertyValues: Array.from({ length: (tempValues?.match(/\{x\}/gi) || []).length }, () => 0), action: 2 })
    propertyId.value = null
    propertyNeedle.value = undefined
    activatedRef.value?.scrollEnd('properties', tempId)
  }
}

const createProperty = (): void => {
  add.category = 'properties'
  add.show = true
}

const updateProperty = ({ valueId, propertyValues }: { valueId: string, propertyValues: Array<number> }): void => {
  const findProperty = activatedItem.value.properties.find(p => p.valueId === valueId)
  if (findProperty) {
    findProperty.action = findProperty.action !== 2 ? 4 : 2
    findProperty.propertyValues = propertyValues
  }
}

const removeProperty = ({ valueId }: { valueId: string }): void => {
  const findProperty = activatedItem.value.properties.find(p => p.valueId === valueId)
  if (findProperty) {
    findProperty.disable = findProperty.action !== 8
    findProperty.restore = findProperty.action !== 8 ? findProperty.action : undefined
    findProperty.action = findProperty.action !== 8 ? 8 : findProperty.restore
  }
}

// about affix
const affixRef = ref<QSelect | null>(null)
const affixId = ref<number | null>(null)
const affixOptions = is.filterAffixes
const affixNeedle = ref<string>()

const filterAffixes = (val: string): void => {
  affixRef.value?.showPopup()
  affixNeedle.value = val.toLowerCase()
}

const selectedAffix = (val: number): void => {
  const tempId = uid()
  const tempValues = is.findAffix(val)?.label
  activatedItem.value.affixes.push({ valueId: tempId, affixId: val, affixValues: Array.from({ length: (tempValues?.match(/\{x\}/gi) || []).length }, () => 0), action: 2 })
  affixId.value = null
  affixNeedle.value = undefined
  activatedRef.value?.scrollEnd('affixes', tempId)
}

const createAffix = (): void => {
  add.category = 'affixes'
  add.show = true
}

const updateAffix = ({ valueId, affixValues }: { valueId: string, affixValues: Array<number> }): void => {
  const findAffix = activatedItem.value.affixes.find(a => a.valueId === valueId)
  if (findAffix) {
    findAffix.action = findAffix.action !== 2 ? 4 : 2
    findAffix.affixValues = affixValues
  }
}

const removeAffix = ({ valueId }: { valueId: string }): void => {
  const findAffix = activatedItem.value.affixes.find(a => a.valueId === valueId)
  if (findAffix) {
    findAffix.disable = findAffix.action !== 8
    findAffix.restore = findAffix.action !== 8 ? findAffix.action : undefined
    findAffix.action = findAffix.action !== 8 ? 8 : findAffix.restore
  }
}

// about restrictions
const restrictionRef = ref<QSelect | null>(null)
const restrictId = ref<number | null>(null)
const restrictionOptions = is.filterRestrictions
const restrictionNeedle = ref<string>()

const filterRestrictions = (val: string): void => {
  restrictionRef.value?.showPopup()
  restrictionNeedle.value = val.toLowerCase()
}

const selectedRestriction = (val: number): void => {
  const tempId = uid()
  const tempValues = is.findRestriction(val)?.label
  activatedItem.value.restrictions.push({ valueId: tempId, restrictId: val, restrictValues: Array.from({ length: (tempValues?.match(/\{x\}/gi) || []).length }, () => 0), action: 2 })
  restrictId.value = null
  restrictionNeedle.value = undefined
  activatedRef.value?.scrollEnd('restrictions', tempId)
}

const createRestriction = (): void => {
  add.category = 'restrictions'
  add.show = true
}

const updateRestriction = ({ valueId, restrictValues }: { valueId: string, restrictValues: Array<number> }): void => {
  const findRestriction = activatedItem.value.restrictions.find(r => r.valueId === valueId)
  if (findRestriction) {
    findRestriction.action = findRestriction.action !== 2 ? 4 : 2
    findRestriction.restrictValues = restrictValues
  }
}

const removeRestriction = ({ valueId }: { valueId: string }): void => {
  const findRestriction = activatedItem.value.restrictions.find(r => r.valueId === valueId)
  if (findRestriction) {
    findRestriction.disable = findRestriction.action !== 8
    findRestriction.restore = findRestriction.action !== 8 ? findRestriction.action : undefined
    findRestriction.action = findRestriction.action !== 8 ? 8 : findRestriction.restore
  }
}

// make an offer
const offerItem = ref<Item | undefined>()
const offers = ref<Array<Offer>>([])
const progressOffer = ref<boolean>(false)
const disableOffers = ref<boolean>(false)
const showOffers = ref<boolean>(false)
const makeOffer = ref<Offer>(new Offer())

const hideOffers = () => {
  offerItem.value = undefined
  makeOffer.value = new Offer()
  showOffers.value = false
}

const openMakingOffer = (item: Item): void => {
  disableOffers.value = true
  offers.value =
    Array.from({ length: 2 }, () => {
      const offer = new Offer()
      offer.loading = true
      offer.user.loading = true
      offer.price.loading = true
      return offer
    })

  offerItem.value = item
  makeOffer.value.itemId = item.itemId
  makeOffer.value.user = as.info
  if (item.price.currency !== 'offer')
    makeOffer.value.price = item.price
  showOffers.value = true

  is.getOffers(item.itemId)
    .then((resultOffers: Array<Offer>) => {
      let i = 0
      while (i < offers.value.length) {
        const offer = resultOffers.shift()
        if (offer) {
          offers.value[i] = offer
          i++
        } else {
          offers.value.splice(i)
          break
        }
      }
    })
    .catch(() => { })
    .then(() => {
      disableOffers.value = false
    })
}

const isMakingOffer = computed(() => !offerItem.value?.authorized && as.signed && offerItem.value?.statusCode === '000' && !offers.value.find(o => o.user.battleTag === as.info.battleTag))
const makingOffer = (offer: Offer) => {
  progressOffer.value = true

  is.makeOffer(offer)
    .then((response) => {
      Object.assign(offer, response)
      const findOffer = offers.value.find(o => o.offerId === offer.offerId)
      if (findOffer)
        Object.assign(findOffer, offer)
      else
        offers.value.unshift(offer)

      progressOffer.value = false
    })
    .catch(() => {
      progressOffer.value = false
    })
}

const acceptOffer = (offer: Offer) => {
  disableOffers.value = true
  is.acceptOffer(offer.offerId)
    .then(() => {
      is.getOffers(offer.itemId, offer.offerId)
        .then((response) => {
          const findOffer = offers.value.find(o => o.offerId === offer.offerId)

          if (findOffer && offerItem.value && response.length > 0) {
            Object.assign(findOffer, response[0])
            emit('update-only', findOffer.itemId)
          }

          disableOffers.value = false
        })
        .catch(() => {
          disableOffers.value = false
        })
    })
    .catch(() => {
      disableOffers.value = false
    })
}

const complete = (evaluations: Array<number>) => {
  disableOffers.value = true
  is.addEvaluations(offerItem.value?.itemId as string, evaluations)
    .then(() => {
      if (offerItem.value)
        emit('update-only', offerItem.value.itemId)
      showOffers.value = false
    })
    .catch(() => { })
    .then(() => {
      disableOffers.value = false
    })
}

// Execute function if an item is visible (adsense)
const visible = (isVisible: boolean, item: Item): void => {
  const findItem = document.querySelector(`div[data-itemid="${item.itemId}"]`) as HTMLDivElement
  if (findItem && item.expanded)
    findItem.style.height = isVisible ? '100%' : `${findItem.offsetHeight}px`
}

const create = () => {
  activateShow.value = true
}

const openOffers = (itemId: string) => {
  const findItem = props.items.find(i => i.itemId.toString() === itemId)

  if (findItem)
    openMakingOffer(findItem)
}

defineExpose({ create, hideEditable, openOffers, hideOffers })
</script>

<template>
  <div class="col-12" :style="`max-width:${width}px`">
    <div :class="$q.screen.lt.sm ? 'q-gutter-y-xl' : 'q-gutter-y-xxl'">
      <q-intersection v-for="item, idx in (items as Array<Item | Advertise>)" :key="`item_${idx}`"
        :data-itemid="item.itemId" class="item"
        :style="item.expanded ? 'height:100%' : `height: ${height as number - ($q.screen.lt.sm ? 50 : 0)}px;`"
        transition="fade" @visibility="isVisible => visible(isVisible, item)" ssr-prerender>
        <div v-if="(item instanceof Advertise)" class="bg-grey" style="width:100%;height:500px"></div>
        <D4Item v-else :data="item" :loading="loading || item.loading">
          <template #top-right>
          </template>
          <template v-if="requestProperties > 0" #properties>
            <D4Property v-for="property in item.properties" :key="property.valueId" :data="property" />
          </template>
          <template v-if="requestAffixes > 0" #affixes>
            <D4Affix v-for="affix in item.affixes" :key="affix.valueId" :data="affix" />
          </template>
          <template v-if="requestRestrictions > 0" #restrictions>
            <D4Restriction v-for="restriction in item.restrictions" :key="restriction.valueId" :data="restriction" />
          </template>
          <template #actions>
            <div class="row justify-between items-center q-px-md q-pt-lg">
              <div>
                <D4Btn v-if="item.authorized && item.statusCode !== '001'" :label="t('btn.edit')"
                  color="var(--q-secondary)" :loading="loading || item.loading" @click="editItem(item)" />
              </div>
              <div>
                <D4Btn
                  :label="item.authorized || !as.signed || item.statusCode !== '000' ? t('offer.list') : t('btn.makeOffer')"
                  :loading="loading || item.loading" @click="openMakingOffer(item)" />
              </div>
            </div>
          </template>
          <template #more="{ loading }">
            <q-btn v-if="!item.expanded && !loading" flat text-color="black" class="more no-hover" padding="20px"
              @click="item.expanded = true">
              <img class="icon" width="24" height="16" src="~assets/icons/more.svg" />
            </q-btn>
          </template>
        </D4Item>
      </q-intersection>
    </div>
    <div v-show="items.length === 0" class="row justify-center items-center" style="height:40vh">{{ t('noItem') }}</div>
    <q-dialog v-model="activateShow" :maximized="$q.screen.lt.sm" :persistent="disable" transition-show="none"
      transition-hide="none" @hide="hideEditable">
      <D4Item ref="activatedRef" :data="activatedItem" editable :loading="activatedItem.loading" :disable="disable"
        @update="updateItem" @apply="apply">
        <template #add-property="props">
          <div class="row items-center q-gutter-sm">
            <q-select ref="propertyRef" v-model="propertyId" :disable="disable"
              :popup-content-style="{ 'height': `${props.wrap?.$el.clientHeight / 2}px` }" outlined dense no-error-icon
              use-input hide-bottom-space hide-selected emit-value map-options transition-show="none"
              transition-hide="none" class="col" :label="t('searchOrSelect')" :options="propertyOptions(propertyNeedle)"
              :dropdown-icon="`img:${icons.dropdown}`" @update:model-value="selectedProperty"
              @input-value="filterProperties">
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section side>
                    <q-icon class="icon"
                      :class="{ 'rotate-45': ['regular', 'offensive', 'defensive', 'utility', 'resistance'].includes(scope.opt.type as string) }"
                      size="14px" :name="`img:${icons[scope.opt.type as keyof typeof icons || 'regular']}`" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    {{ t('noMessage', { attr: t('properties') }) }}
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-btn size="sm" :disable="disable" unelevated flat dense round @click="createProperty">
              <img class="icon" width="24" src="~assets/icons/add.svg" />
            </q-btn>
          </div>
        </template>
        <template #properties>
          <D4Property v-for="property in activatedItem.properties" :key="property.valueId || uid()" :data="property"
            editable :disable="disable" @update="updateProperty" @remove="removeProperty" />
        </template>
        <template #add-affix="props">
          <div class="row items-center q-gutter-sm">
            <q-select ref="affixRef" v-model="affixId" :disable="disable"
              :popup-content-style="{ 'height': `${props.wrap?.$el.clientHeight / 2}px` }" outlined dense no-error-icon
              use-input hide-bottom-space emit-value map-options transition-show="none" transition-hide="none" class="col"
              :label="t('searchOrSelect')" :options="affixOptions(affixNeedle)" :dropdown-icon="`img:${icons.dropdown}`"
              @update:model-value="selectedAffix" @input-value="filterAffixes">
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section side>
                    <q-icon class="icon"
                      :class="{ 'rotate-45': ['regular', 'offensive', 'defensive', 'utility', 'resistance'].includes(scope.opt.type as string) }"
                      size="14px" :name="`img:${icons[scope.opt.type as keyof typeof icons || 'regular']}`" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    {{ t('noMessage', { attr: t('affixes') }) }}
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-btn size="sm" :disable="disable" unelevated flat dense round @click="createAffix">
              <img class="icon" width="24" src="~assets/icons/add.svg" />
            </q-btn>
          </div>
        </template>
        <template #affixes>
          <D4Affix v-for="affix in activatedItem.affixes" :key="affix.valueId || uid()" :data="affix" editable
            :disable="disable" @update="updateAffix" @remove="removeAffix" />
        </template>
        <template #add-restriction="props">
          <div class="row items-center q-gutter-sm">
            <q-select ref="restrictionRef" v-model="restrictId" :disable="disable"
              :popup-content-style="{ 'height': `${props.wrap?.$el.clientHeight / 2}px` }" outlined dense no-error-icon
              use-input hide-bottom-space emit-value map-options transition-show="none" transition-hide="none" class="col"
              :label="t('searchOrSelect')" :options="restrictionOptions(restrictionNeedle)"
              :dropdown-icon="`img:${icons.dropdown}`" @update:model-value="selectedRestriction"
              @input-value="filterRestrictions">
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    {{ t('noMessage', { attr: t('restrictions') }) }}
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-btn size="sm" :disable="disable" unelevated flat dense round @click="createRestriction">
              <img class="icon" width="24" src="~assets/icons/add.svg" />
            </q-btn>
          </div>
        </template>
        <template #restrictions>
          <D4Restriction v-for="restriction in activatedItem.restrictions" :key="restriction.valueId || uid()"
            :data="restriction" editable :disable="disable" @update="updateRestriction" @remove="removeRestriction" />
        </template>
        <template #actions>
          <div v-if="activatedItem.authorized || activatedItem.itemId === ''"
            class="row justify-between items-center q-pa-md" :class="{ 'q-pt-lg': !$q.screen.lt.sm }">
            <div class="row items-center q-gutter-sm">
              <D4Btn v-if="activatedItem.itemId" :label="t('btn.moreActions')" :loading="activatedItem.loading"
                :disable="disable" color="var(--q-secondary)">
                <q-icon class="q-ml-xs invert" size="sm" :name="`img:${icons.dropdown}`" />
                <q-menu fit anchor="bottom middle" self="top middle" auto-close>
                  <q-item :disable="activatedItem.statusCode !== '000'" clickable @click="relistItem">
                    <q-item-section class="text-uppercase">{{ t('btn.relist') }}</q-item-section>
                  </q-item>
                  <q-item :disable="!['000', '002'].includes(activatedItem.statusCode)" clickable @click="statusItem">
                    <q-item-section class="text-uppercase">{{ activatedItem.statusCode === '002' ? t('btn.resume') :
                      t('btn.suspend')
                    }}</q-item-section>
                  </q-item>
                  <q-item clickable @click="deleteConfirm">
                    <q-item-section class="text-uppercase text-negative text-weight-bold">{{ t('btn.delete')
                    }}</q-item-section>
                  </q-item>
                </q-menu>
              </D4Btn>
            </div>
            <div class="row items-center q-gutter-sm">
              <D4Btn :label="t('btn.cancel')" :loading="activatedItem.loading" :disable="disable" color="rgb(150,150,150)"
                @click="activateShow = false" />
              <D4Btn :label="t('btn.apply')" :loading="activatedItem.loading" :disable="disable" :progress="progress"
                type="submit" />
            </div>
          </div>
        </template>
      </D4Item>
    </q-dialog>
    <q-dialog v-model="add.show" @hide="hideAdd" :maximized="$q.screen.lt.sm" transition-show="none"
      transition-hide="none">
      <q-card class="card-item dialog normal">
        <q-form class="inner column full-height" @submit="applyAdd">
          <q-card-section>
            <div class="q-py-lg q-pl-sm name text-uppercase">{{ t('attribute.add', { attr: t(add.category as string) }) }}
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section :class="{ 'col': $q.screen.lt.sm }">
            <div class="column q-gutter-y-sm">
              <div class="row justify-between items-center no-wrap">
                <q-option-group v-model="add.type" :options="add.attributeTypes(add.category)" :disable="disable"
                  color="primary" size="xs" inline />
                <div v-show="$q.screen.lt.sm" class="col-2 text-right">
                  <D4Btn label="{ x }" :loading="loading" round :disable="disable" color="var(--q-light-normal)"
                    @click="addAttrNum" />
                </div>
              </div>
              <q-input autofocus ref="refAttribute" v-model="add.attribute" :placeholder="t('attribute.placeholder')"
                :disable="disable" :error="add.error" :error-message="add.errorMessage" outlined dense no-error-icon
                hide-hint />
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section>
            <div class="row justify-end items-center q-gutter-sm q-pa-md" :class="{ 'q-pt-lg': !$q.screen.lt.sm }">
              <D4Btn :label="t('btn.cancel')" :loading="loading" :disable="disable" color="rgb(150,150,150)"
                @click="add.show = false" />
              <D4Btn :label="t('btn.add')" :loading="loading" :progress="disable" type="submit" />
            </div>
          </q-card-section>
        </q-form>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showOffers" @hide="hideOffers" :maximized="$q.screen.lt.sm" transition-show="none"
      transition-hide="none" :persistent="disableOffers || progressOffer" :no-route-dismiss="false">
      <q-card class="card-item dialog offers no-scroll normal">
        <div class="inner column no-wrap" :style="$q.screen.lt.sm ? 'height:100%' : 'min-height:50vh;max-height:90vh'">
          <q-card-section class="row justify-end no-padding">
            <q-btn unelevated class="no-hover icon" :ripple="false">
              <img :src="icons.close" width="24" @click="showOffers = false" />
            </q-btn>
          </q-card-section>
          <q-card-section class="col d4-scroll">
            <div class="q-pb-xl full-height">
              <div class="row items-center q-col-gutter-lg">
                <q-intersection v-for="offer, idx in (offers as Array<Offer>)" :key="`offers_${idx}`"
                  class="col-12 col-sm-6" transition="fade" once>
                  <q-card flat bordered class="card-item expanded"
                    :class="{ 'unique': offer.statusCode === '003', 'set': offer.statusCode === '001' }">
                    <div class="inner">
                      <D4Offer class="offer" :data="offer" :owner="offerItem?.authorized"
                        :evaluations="offerItem?.evaluations" :disable="disableOffers" @accept-offer="acceptOffer"
                        @complete="complete" />
                    </div>
                  </q-card>
                </q-intersection>
              </div>
              <div v-show="offers.length === 0" class="absolute-center">{{
                t('offer.noOffer') }}</div>
            </div>
          </q-card-section>
          <template v-if="isMakingOffer">
            <q-separator />
            <q-card-section>
              <D4Offer :data="makeOffer" make :disable="disableOffers" :progress="progressOffer"
                @make-offer="makingOffer" />
            </q-card-section>
          </template>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>
<style scoped>
.item:deep(>div) {
  height: inherit;
}

.body--light .item:deep(>div:after) {
  content: '';
  position: absolute;
  z-index: -1;
  top: 3px;
  bottom: 3px;
  left: 3px;
  right: 3px;
  box-shadow: rgb(38, 57, 77) 0px 20px 30px -10px;
}

.q-gutter-y-xxl {
  margin-top: -96px;
}

.q-gutter-y-xxl:deep(>*) {
  margin-top: 96px;
}

.more {
  position: absolute;
  bottom: 0;
  z-index: 1;
  left: 0;
  right: 0;
  opacity: .4;
}

.more.disabled {
  opacity: .2 !important;
}

@media (max-width:600px) {
  .more {
    padding: 8px !important;
  }
}

.more:not(.disabled):hover {
  opacity: .8;
}

.more:deep(.icon) {
  transition: transform .3s ease;
}

.more:not(.disabled):hover:deep(.icon) {
  transform: translateY(30%);
}

.offers:deep(.card-item) {
  border-image: none;
}

.offers:deep(.card-item::before) {
  content: none;
}

.body--dark .offers:deep(.card-item) {
  border: none;
}

.body--light .offers:deep(.card-item) {
  background-color: var(--q-light);
}


.body--dark .offers:deep(>div) {
  background: none;
}

.body--light .offers::before {
  background-color: var(--q-light-page);
}

.offer {
  min-height: 60px;
}
</style>