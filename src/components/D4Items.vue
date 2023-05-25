<script setup lang="ts">
import { nanoid } from 'nanoid'
import { ref, computed, reactive } from 'vue'
import { useQuasar, QInput, QSelect } from 'quasar'
import { useI18n } from 'vue-i18n'

import { useAccountStore } from 'stores/account-store'
import { useItemStore, type Power, type Property, type Affix } from 'stores/item-store'
import { checkAttribute } from 'src/common'
import { Item, Advertise, Offer, type IItem } from 'src/types/item'
import { icons } from 'src/common/icons'

import D4Item from 'components/D4Item.vue'
import D4Affix from 'components/D4Affix.vue'
import D4Power from 'components/D4Power.vue'
import D4Property from 'components/D4Property.vue'
import D4Offer from 'components/D4Offer.vue'

interface IProps {
  items: Array<Item>,
  width?: string | number,
  height?: string | number,
  loading?: boolean
}

withDefaults(defineProps<IProps>(), {
  width: '700',
  height: '200',
  loading: false
})

const emit = defineEmits(['upsert-item', 'delete-item', 'relist-item', 'status-item', 'update-only'])

// init module
const $q = useQuasar()
const as = useAccountStore()
const store = useItemStore()
const { t } = useI18n({ useScope: 'global' })

// common variable
const requestPowers = computed<number>(() => store.powers.request)
const requestAffixes = computed<number>(() => store.affixes.request)
const requestProperties = computed<number>(() => store.properties.request)

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

const updateItem = ({ hardcore, ladder, name, itemTypeValues, quantity, quality, itemType, runeId, equipmentClass, price }: IItem): void => {
  activatedItem.value.hardcore = hardcore
  activatedItem.value.ladder = ladder
  activatedItem.value.name = name
  activatedItem.value.itemTypeValues = itemTypeValues
  activatedItem.value.quantity = quantity
  activatedItem.value.quality = quality
  activatedItem.value.runeId = runeId
  activatedItem.value.equipmentClass = equipmentClass
  activatedItem.value.price.currency = price.currency
  activatedItem.value.price.currencyValue = price.currencyValue
  activatedItem.value.price.quantity = price.quantity

  if (activatedItem.value.itemType !== itemType) {
    activatedItem.value.itemType = itemType
    activatedItem.value.quantity = 1
    activatedItem.value.powers.splice(0, activatedItem.value.powers.length)
    activatedItem.value.properties.splice(0, activatedItem.value.properties.length)
    activatedItem.value.affixes.splice(0, activatedItem.value.affixes.length)
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
  types: Function,
  type: string,
  attribute: string,
  error: boolean,
  errorMessage: string
}

const refAttribute = ref<typeof QInput>()
const add = reactive<Add>({
  show: false as boolean,
  category: null as string | null,
  types: store.filterAttributeTypes,
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
  else if ((add.category === 'powers' && store.matchPowers(add.attribute)) || (add.category === 'properties' && store.matchProperties(add.attribute)) || (add.category === 'affixes' && store.matchAffixes(add.attribute)))
    errorMessage = t('attribute.exists', { attr: t(add.category as string) })

  if (errorMessage !== '') {
    add.error = true
    add.errorMessage = errorMessage
    refAttribute.value?.focus()
    return
  }

  // add attribute request place
  disable.value = true
  store.addAttribute(add.category, {
    value: 0,
    label: add.attribute,
    type: add.type
  })
    .then((result: Power | Property | Affix) => {
      const tempId = nanoid()
      const attribute: any = { valueId: tempId, action: 2 }
      attribute[add.category === 'powers' ? 'powerId' : add.category === 'properties' ? 'propertyId' : 'affixId'] = result.value
      attribute[add.category === 'powers' ? 'powerValues' : add.category === 'properties' ? 'propertyValues' : 'affixValues'] = []
      const target = add.category === 'powers' ? activatedItem.value.powers : add.category === 'properties' ? activatedItem.value.properties : activatedItem.value.affixes
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

// about power
const powerRef = ref<QSelect | null>(null)
const powerId = ref<number | null>(null)
const powerOptions = store.filterPowers
const powerNeedle = ref<string | undefined>()

const filterPowers = (val: string): void => {
  powerRef.value?.showPopup()
  powerNeedle.value = val.toLowerCase()
}

const selectedPower = (val: number): void => {
  if (val) {
    const tempId = nanoid()
    activatedItem.value.powers.push({ valueId: tempId, powerId: val, powerValues: [], action: 2 })
    powerId.value = null
    powerNeedle.value = undefined
    activatedRef.value?.scrollEnd('powers', tempId)
  }
}

const createPower = (): void => {
  add.category = 'powers'
  add.show = true
}

const updatePower = ({ valueId, powerValues }: { valueId: string, powerValues: Array<number> }): void => {
  const findPower = activatedItem.value.powers.find(p => p.valueId === valueId)
  if (findPower) {
    findPower.action = findPower.action !== 2 ? 4 : 2
    findPower.powerValues = powerValues
  }
}

const removePower = ({ valueId }: { valueId: string }): void => {
  const findPower = activatedItem.value.powers.find(p => p.valueId === valueId)
  if (findPower) {
    findPower.disable = findPower.action !== 8
    findPower.restore = findPower.action !== 8 ? findPower.action : undefined
    findPower.action = findPower.action !== 8 ? 8 : findPower.restore
  }
}

// about property
const propertyRef = ref<QSelect | null>(null)
const propertyId = ref<number | null>(null)
const propertyOptions = store.filterProperties
const propertyNeedle = ref<string>()

const filterProperties = (val: string): void => {
  propertyRef.value?.showPopup()
  propertyNeedle.value = val.toLowerCase()
}

const selectedProperty = (val: number): void => {
  if (val) {
    const tempId = nanoid()
    activatedItem.value.properties.push({ valueId: tempId, propertyId: val, propertyValues: [], action: 2 })
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
const affixOptions = store.filterAffixes
const affixNeedle = ref<string>()

const filterAffixes = (val: string): void => {
  affixRef.value?.showPopup()
  affixNeedle.value = val.toLowerCase()
}

const selectedAffix = (val: number): void => {
  const tempId = nanoid()
  activatedItem.value.affixes.push({ valueId: tempId, affixId: val, affixValues: [], action: 2 })
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

  store.getOffers(item.itemId)
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
      offers.value.push(...resultOffers)
    })
    .catch(() => { })
    .then(() => {
      disableOffers.value = false
    })
}

const makingOffer = (offer: Offer) => {
  progressOffer.value = true
  const clone = JSON.parse(JSON.stringify(offer))
  Object.assign(new Offer, clone)
  Object.setPrototypeOf(clone, Offer.prototype)
  clone.make(() => {
    const findOffer = offers.value.find(o => o.offerId === clone.offerId)
    if (findOffer)
      Object.assign(findOffer, clone)
    else
      offers.value.unshift(clone)

    progressOffer.value = false

  }, () => {
    progressOffer.value = false
  })
}

const acceptOffer = (offer: Offer) => {
  disableOffers.value = true
  const clone = JSON.parse(JSON.stringify(offer))
  Object.assign(new Offer, clone)
  Object.setPrototypeOf(clone, Offer.prototype)
  clone.accept(() => {
    clone.info(() => {
      const findOffer = offers.value.find(o => o.offerId === clone.offerId)

      if (findOffer && offerItem.value) {
        Object.assign(findOffer, clone)
        emit('update-only', findOffer.itemId)
      }

      disableOffers.value = false
    }, () => {
      disableOffers.value = false
    })
  }, () => {
    disableOffers.value = false
  })
}

// Execute function if an item is visible
const visible = (isVisible: boolean, item: Item): void => {
  isVisible
  item
}

const create = () => {
  activateShow.value = true
}
defineExpose({ create, hideEditable })
</script>

<template>
  <div class="col-12" :style="`max-width:${width}px`">
    <div :class="$q.screen.lt.sm ? 'q-gutter-y-xl' : 'q-gutter-y-xxl'">
      <q-intersection v-for="item, idx in (items as Array<Item | Advertise>)" :key="`item_${idx}`" class="item"
        :style="item.expanded ? 'height: 100%' : `height: ${height as number - ($q.screen.lt.sm ? 50 : 0)}px;`"
        transition="jump-up" @visibility="isVisible => visible(isVisible, item)" once>
        <div v-if="(item instanceof Advertise)" class="bg-grey" style="width:100%;height:500px"></div>
        <D4Item v-else :data="item" :loading="loading || item.loading">
          <template #top-right>
          </template>
          <template v-if="requestPowers > 0" #powers>
            <D4Power v-for="(power, i) in item.powers" :key="power.valueId" :data="power" />
          </template>
          <template v-if="requestProperties > 0" #properties>
            <D4Property v-for="(property, i) in item.properties" :key="property.valueId" :data="property" />
          </template>
          <template v-if="requestAffixes > 0" #affixes>
            <D4Affix v-for="affix in item.affixes" :key="affix.valueId || `create_${Math.floor(Math.random() * 1000000)}`"
              :data="affix" />
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
        <template #add-power="props">
          <div class="row no-wrap items-center q-gutter-x-sm">
            <q-select ref="powerRef" v-model="powerId" :disable="disable"
              :popup-content-style="{ 'height': `${props.wrap?.$el.clientHeight / 2}px` }" option-dense outlined dense
              no-error-icon use-input hide-bottom-space hide-selected emit-value map-options transition-show="none"
              transition-hide="none" class="select col" :label="t('searchOrSelect')" :options="powerOptions(powerNeedle)"
              :dropdown-icon="`img:${icons.dropdown}`" @update:model-value="selectedPower" @input-value="filterPowers">
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
                    {{ t('noMessage', { attr: t('powers') }) }}
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-btn size="sm" :disable="disable" unelevated flat dense round @click="createPower">
              <img class="icon" width="24" src="~assets/icons/add.svg" />
            </q-btn>
          </div>
        </template>
        <template #powers>
          <D4Power v-for="power in activatedItem.powers"
            :key="power.valueId || `create_${Math.floor(Math.random() * 1000000)}`" :data="power" editable
            :disable="disable" @update="updatePower" @remove="removePower" />
        </template>
        <template #add-property="props">
          <div class="row no-wrap items-center q-gutter-x-sm">
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
                      :class="['regular', 'offensive', 'defensive', 'utility', 'resistance'].includes(scope.opt.type as string) ? 'rotate-45' : ''"
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
          <D4Property v-for="property in activatedItem.properties"
            :key="property.valueId || `create_${Math.floor(Math.random() * 1000000)}`" :data="property" editable
            :disable="disable" @update="updateProperty" @remove="removeProperty" />
        </template>
        <template #add-affix="props">
          <div class="row items-center q-gutter-x-sm">
            <q-select ref="affixRef" v-model="affixId" :disable="disable"
              :popup-content-style="{ 'height': `${props.wrap?.$el.clientHeight / 2}px` }" outlined dense no-error-icon
              use-input hide-bottom-space emit-value map-options transition-show="none" transition-hide="none" class="col"
              :label="t('searchOrSelect')" :options="affixOptions(affixNeedle)" :dropdown-icon="`img:${icons.dropdown}`"
              @update:model-value="selectedAffix" @input-value="filterAffixes">
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section side>
                    <q-icon class="icon"
                      :class="['regular', 'offensive', 'defensive', 'utility', 'resistance'].includes(scope.opt.type as string) ? 'rotate-45' : ''"
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
          <D4Affix v-for="affix in activatedItem.affixes"
            :key="affix.valueId || `create_${Math.floor(Math.random() * 1000000)}`" :data="affix" editable
            :disable="disable" @update="updateAffix" @remove="removeAffix" />
        </template>
        <template #actions>
          <div v-if="activatedItem.authorized || activatedItem.itemId === ''"
            class="row justify-between items-center q-px-md" :class="$q.screen.lt.sm ? '' : 'q-pt-lg'">
            <div class="row items-center q-gutter-x-sm">
              <D4Btn v-if="activatedItem.itemId" :label="t('btn.moreActions')" :loading="activatedItem.loading"
                :disable="disable" color="var(--q-secondary)">
                <q-icon class="q-ml-xs invert" size="sm" :name="`img:${icons.dropdown}`" />
                <q-menu fit anchor="bottom middle" self="top middle" auto-close>
                  <q-item :disable="activatedItem.statusCode === '002'" clickable @click="relistItem">
                    <q-item-section class="text-uppercase">{{ t('btn.relist') }}</q-item-section>
                  </q-item>
                  <q-item clickable @click="statusItem">
                    <q-item-section class="text-uppercase">{{ activatedItem.statusCode === '000' ? t('btn.suspend') :
                      t('btn.resume')
                    }}</q-item-section>
                  </q-item>
                  <q-item clickable @click="deleteConfirm">
                    <q-item-section class="text-uppercase text-negative text-weight-bold">{{ t('btn.delete')
                    }}</q-item-section>
                  </q-item>
                </q-menu>
              </D4Btn>
            </div>
            <div class="row items-center q-gutter-x-sm">
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
          <q-card-section :class="$q.screen.lt.sm ? 'col' : ''">
            <div class="column q-gutter-y-sm">
              <div class="row justify-between items-center no-wrap">
                <q-option-group v-model="add.type" :options="add.types()" :disable="disable" color="primary" size="xs"
                  inline />
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
          <q-card-section :class="$q.screen.lt.sm ? 'col-1' : ''">
            <div class="row justify-end items-center q-gutter-x-sm q-px-md" :class="$q.screen.lt.sm ? '' : 'q-pt-lg'">
              <D4Btn :label="t('btn.cancel')" :loading="loading" :disable="disable" color="rgb(150,150,150)"
                @click="add.show = false" />
              <D4Btn :label="t('btn.add')" :loading="loading" :progress="disable" type="submit" />
            </div>
          </q-card-section>
        </q-form>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showOffers" @hide="hideOffers" :maximized="$q.screen.lt.sm" transition-show="none"
      transition-hide="none" :persistent="disableOffers || progressOffer">
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
                  <q-card flat bordered class="card-item expanded" :class="offer.statusCode === '003' ? 'unique' : ''">
                    <div class="inner">
                      <D4Offer class="offer" :data="offer" :owner="offerItem?.authorized" :disable="disableOffers"
                        @accept-offer="acceptOffer" />
                    </div>
                  </q-card>
                </q-intersection>
              </div>
              <div v-show="offers.length === 0" class="absolute-center">{{
                t('offer.noOffer') }}</div>
            </div>
          </q-card-section>
          <template v-if="!offerItem?.authorized && as.signed && !offers.find(o => o.statusCode === '003')">
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