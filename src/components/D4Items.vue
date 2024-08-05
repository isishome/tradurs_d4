<script setup lang="ts">
import { ref, computed, reactive, nextTick } from 'vue'
import { useQuasar, QInput, QSelect, uid } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'
import { checkAttribute, scrollPos } from 'src/common'
import { itemImgs } from 'src/common/items'
import {
  Item,
  Offer,
  type AffixValue,
  type IItem,
  Price,
  type Property,
  type Affix,
  type Restriction
} from 'src/types/item'
import { User } from 'src/types/user'

import D4Item from 'components/D4Item.vue'
import D4Property from 'components/D4Property.vue'
import D4Material from 'components/D4Material.vue'
import D4Affix from 'components/D4Affix.vue'
import D4Restriction from 'components/D4Restriction.vue'
import D4Offer from 'components/D4Offer.vue'
import D4User from 'components/D4User.vue'
import D4Analysis from 'components/D4Analysis.vue'

interface IProps {
  items: Array<Item>
  rewardItem?: Item
  width?: string | number
  height?: string | number
}

const props = withDefaults(defineProps<IProps>(), {
  width: '728',
  height: '220'
})

const emit = defineEmits([
  'upsert-item',
  'delete-item',
  'relist-item',
  'status-item',
  'reregister-item',
  'update-only',
  'copy',
  'favorite'
])

const prod: boolean = import.meta.env.PROD

// init module
const $q = useQuasar()
const as = useAccountStore()
const is = useItemStore()
const { t } = useI18n({ useScope: 'global' })
const route = useRoute()

// common variable
const requestProperties = computed<number>(() => is.properties.request)
const descriptions = computed(
  () => (itemTypeValue2: string) => is.filterMaterials(itemTypeValue2)
)
const requestAffixes = computed<number>(() => is.affixes.request)
const requestRestrictions = computed<number>(() => is.restrictions.request)
const itemHeight = computed(
  () => parseInt(props.height.toString()) - ($q.screen.lt.sm ? 50 : 0)
)

// about copy item
const copy = (itemId: string) => {
  emit('copy', itemId)
}

// about favorite item
const favorite = (itemId: string, favorite: boolean) => {
  emit('favorite', itemId, favorite)
}

// about editable item
const activatedRef = ref<typeof D4Item | null>(null)
const activateShow = ref<boolean>(false)
const activatedItem = ref<Item>(new Item(''))

const setDefaultProperties = () => {
  const findClass = is.findClass(activatedItem.value.itemTypeValue1)

  if (findClass) {
    findClass.properties.forEach((p) => {
      selectedProperty(p)
    })
  }
}

const editItem = (item: Item) => {
  const clone = JSON.parse(JSON.stringify(item))
  Object.assign(new Item(), clone)
  Object.setPrototypeOf(clone, Item.prototype)
  activatedItem.value = clone
  activateShow.value = true
}

const copyItem = (item: Item) => {
  const clone = JSON.parse(JSON.stringify(item))
  Object.assign(new Item(), clone)
  Object.setPrototypeOf(clone, Item.prototype)
  clone.itemId = ''
  clone.statusCode = '000'
  clone.user = new User()
  clone.price = new Price()
  clone.affixes = clone.affixes.map((a: Affix) => ({
    ...a,
    valueId: uid(),
    action: 2
  }))
  clone.properties = clone.properties.map((p: Property) => ({
    ...p,
    valueId: uid(),
    action: 2
  }))
  clone.restrictions = clone.restrictions.map((r: Restriction) => ({
    ...r,
    valueId: uid(),
    action: 2
  }))
  clone.offers = 0
  activatedItem.value = clone
  activateShow.value = true
}

const updateItem = ({
  name,
  quantity,
  tier,
  quality,
  itemType,
  itemTypeValue1,
  itemTypeValue2,
  imageId,
  power,
  upgrade,
  level,
  price
}: IItem): void => {
  const changeTypeNotFirst =
    activatedItem.value.itemType && activatedItem.value.itemType !== itemType
  const changeTypeValue1NotFirst =
    activatedItem.value.itemTypeValue1 &&
    activatedItem.value.itemTypeValue1 !== itemTypeValue1
  activatedItem.value.itemType = itemType
  activatedItem.value.name = name
  activatedItem.value.quantity = quantity
  activatedItem.value.tier = tier
  activatedItem.value.quality = quality
  activatedItem.value.itemTypeValue1 = itemTypeValue1
  activatedItem.value.itemTypeValue2 = itemTypeValue2
  activatedItem.value.power = power
  activatedItem.value.upgrade = upgrade
  activatedItem.value.level = level
  activatedItem.value.imageId = imageId
  activatedItem.value.price.currency = price.currency
  activatedItem.value.price.currencyValue = price.currencyValue
  activatedItem.value.price.quantity = price.quantity

  if (changeTypeNotFirst) {
    activatedItem.value.quantity = 1
    activatedItem.value.imageId =
      Math.floor(
        Math.random() * itemImgs[itemType]?.[itemTypeValue1 as string]
      ) || 0
    activatedItem.value.properties.splice(
      0,
      activatedItem.value.properties.length
    )
    activatedItem.value.affixes.splice(0, activatedItem.value.affixes.length)
    activatedItem.value.restrictions.splice(
      0,
      activatedItem.value.restrictions.length
    )
    activatedItem.value.pacts = { ferocity: 0, divinity: 0, eternity: 0 }

    const actions = new Set(activatedItem.value.actions)
    actions.add(16)
    activatedItem.value.actions = Array.from(actions)
  }

  if (changeTypeValue1NotFirst) {
    activatedItem.value.properties.splice(
      0,
      activatedItem.value.properties.length
    )
    const actions = new Set(activatedItem.value.actions)
    actions.add(32)
    activatedItem.value.actions = Array.from(actions)
    setDefaultProperties()
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

const relistItem = () => {
  $q.dialog({
    title: t('relistItem.title'),
    message: t('relistItem.message'),
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey', outline: true },
    ok: {
      label: t('relistItem.title'),
      color: 'primary',
      unelevated: true,
      class: 'text-weight-bold invert-icon'
    },
    transitionShow: 'fade',
    transitionHide: 'fade',
    noRouteDismiss: true,
    class: 'q-pa-sm'
  }).onOk(() => {
    disable.value = true
    emit('relist-item', activatedItem.value, done)
  })
}

const statusItem = () => {
  const title =
    activatedItem.value.statusCode === '000'
      ? t('statusItem.suspendTitle')
      : t('statusItem.resumeTitle')
  const message =
    activatedItem.value.statusCode === '000'
      ? t('statusItem.suspendMessage')
      : t('statusItem.resumeMessage')
  $q.dialog({
    title: title,
    message: message,
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey', outline: true },
    ok: {
      label: title,
      color: 'primary',
      unelevated: true,
      class: 'text-weight-bold invert-icon'
    },
    transitionShow: 'fade',
    transitionHide: 'fade',
    noRouteDismiss: true,
    class: 'q-pa-sm'
  }).onOk(() => {
    disable.value = true
    emit('status-item', activatedItem.value, done)
  })
}

const reRegisterItem = (reRegisterItem?: Item) => {
  $q.dialog({
    title: t('reRegisterItem.title'),
    message: t('reRegisterItem.message'),
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey', outline: true },
    ok: {
      label: t('reRegisterItem.title'),
      color: 'primary',
      unelevated: true,
      class: 'text-weight-bold invert-icon'
    },
    transitionShow: 'fade',
    transitionHide: 'fade',
    noRouteDismiss: true,
    class: 'q-pa-sm'
  }).onOk(() => {
    disable.value = true
    emit('reregister-item', reRegisterItem || activatedItem.value, done)
  })
}

const deleteConfirm = (deleteItem?: Item) => {
  $q.dialog({
    title: t('deleteItem.title'),
    message: t('deleteItem.message'),
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey', outline: true },
    ok: {
      label: t('deleteItem.title'),
      color: 'negative',
      unelevated: true,
      class: 'text-weight-bold invert-icon'
    },
    transitionShow: 'fade',
    transitionHide: 'fade',
    noRouteDismiss: true,
    class: 'q-pa-sm'
  }).onOk(() => {
    disable.value = true
    emit('delete-item', deleteItem || activatedItem.value, done)
  })
}

const apply = () => {
  disable.value = true
  progress.value = true
  // check attribute
  activatedItem.value.properties.forEach((p) => {
    p.action =
      is.findProperty(p.propertyId)?.label.match(/\{x\}/g) &&
      [0, NaN].includes(
        p.propertyValues.reduce((pv: number, cv: number) => pv + cv, 0)
      )
        ? 8
        : p.action
  })
  activatedItem.value.affixes.forEach((a) => {
    a.action =
      is.findAffix(a.affixId)?.label.match(/\{x\}/g) &&
      [0, NaN].includes(
        a.affixValues
          .map((av: AffixValue) => av.value)
          .reduce((pv: number, cv: number) => pv + cv, 0)
      )
        ? 8
        : a.action
  })
  activatedItem.value.restrictions.forEach((r) => {
    r.action =
      is.findRestriction(r.restrictId)?.label.match(/\{x\}/g) &&
      [0, NaN].includes(
        r.restrictValues.reduce((pv: number, cv: number) => pv + cv, 0)
      )
        ? 8
        : r.action
  })
  emit('upsert-item', activatedItem.value, done)
}

// about add
interface Add {
  show: boolean
  category: string | null
  type: string
  attribute: string
  continuous: boolean
  error: boolean
  errorMessage: string
}

const refAttribute = ref<typeof QInput>()
const add = reactive<Add>({
  show: false as boolean,
  category: null,
  type: '',
  attribute: '',
  continuous: false,
  error: false,
  errorMessage: ''
})
const findQuality = computed(
  () => is.findQuality(activatedItem.value.quality)?.hasAttributeTypes
)
const filterAttributeTypes = computed(() =>
  is
    .filterAttributeTypes(add.category as string)
    .filter((at) => findQuality.value?.includes(at.value as string))
)

const hideAdd = (): void => {
  add.category = null
  add.type = ''
  add.attribute = ''
  add.error = false
  add.errorMessage = ''
}

const applyAdd = (): void => {
  let errorMessage = ''
  if (!add.attribute || add.attribute.trim() === '')
    errorMessage = t('attribute.enter', { attr: t(add.category as string) })
  else if (!checkAttribute(add.attribute))
    errorMessage = t('attribute.invalid', { attr: t(add.category as string) })
  else if (
    add.category === 'affixes' &&
    is.matchAffixes(add.type, add.attribute)
  )
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
    .then(() => {
      $q.notify({
        icon: 'img:/images/icons/check.svg',
        color: 'positive',
        classes: '',
        message: t('attribute.complete')
      })

      if (add.continuous) add.attribute = ''

      add.show = add.continuous
    })
    .catch(() => {})
    .then(() => {
      disable.value = false
      nextTick(() => {
        refAttribute.value?.focus()
      })
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

const filterProperties = (e: KeyboardEvent): void => {
  const val = (e.target as HTMLInputElement).value.toLowerCase()
  propertyRef.value?.showPopup()
  propertyRef.value?.updateInputValue(val)
  propertyNeedle.value = val
}

const selectedProperty = (val: number): void => {
  if (val) {
    const tempId = uid()
    const tempValues = is.findProperty(val)?.label
    activatedItem.value.properties.push({
      valueId: tempId,
      propertyId: val,
      propertyValues: Array.from(
        { length: (tempValues?.match(/\{x\}/gi) || []).length },
        () => 0
      ),
      action: 2
    })
    propertyId.value = null
    propertyNeedle.value = undefined
    activatedRef.value?.scrollEnd('properties', tempId)
  }
}

const updateProperty = ({
  valueId,
  propertyValues
}: {
  valueId: string
  propertyValues: Array<number>
}): void => {
  const findProperty = activatedItem.value.properties.find(
    (p) => p.valueId === valueId
  )
  if (findProperty) {
    findProperty.action = findProperty.action !== 2 ? 4 : 2
    findProperty.propertyValues = propertyValues
  }
}

const removeProperty = ({ valueId }: { valueId: string }): void => {
  const findProperty = activatedItem.value.properties.find(
    (p) => p.valueId === valueId
  )
  if (findProperty) {
    findProperty.disable = findProperty.action !== 8
    findProperty.restore =
      findProperty.action !== 8 ? findProperty.action : undefined
    findProperty.action = findProperty.action !== 8 ? 8 : findProperty.restore
  }
}

// about affix
const affixRef = ref<QSelect | null>(null)
const affixId = ref<number | null>(null)
const affixOptions = is.filterAffixes
const affixNeedle = ref<string>()

const filterAffixes = (e: KeyboardEvent) => {
  const val = (e.target as HTMLInputElement).value.toLowerCase()
  affixRef.value?.showPopup()
  affixRef.value?.updateInputValue(val)
  affixNeedle.value = val
}

const selectedAffix = (val: number): void => {
  const tempId = uid()
  const tempValues = is.findAffix(val)?.label
  const valuesLen = (tempValues?.match(/\{x\}/gi) || []).length
  activatedItem.value.affixes.push({
    valueId: tempId,
    affixId: val,
    affixValues: Array.from({ length: valuesLen }, () => {
      const tempRangeId = uid()
      return { valueRangeId: tempRangeId, value: 0, min: 0, max: 0 }
    }),
    action: 2
  })
  affixId.value = null
  affixNeedle.value = undefined
  activatedRef.value?.scrollEnd('affixes', tempId)
}

const createAffix = (): void => {
  add.category = 'affixes'
  add.type = filterAttributeTypes.value?.[0]?.value as string
  add.show = true
}

const updateAffix = ({
  valueId,
  affixGreater,
  affixValues
}: {
  valueId: string
  affixGreater: boolean
  affixValues: Array<AffixValue>
}): void => {
  const findAffix = activatedItem.value.affixes.find(
    (a) => a.valueId === valueId
  )
  if (findAffix) {
    findAffix.action = findAffix.action !== 2 ? 4 : 2
    findAffix.affixGreater = affixGreater
    findAffix.affixValues = affixValues
  }
}

const removeAffix = ({ valueId }: { valueId: string }): void => {
  const findAffix = activatedItem.value.affixes.find(
    (a) => a.valueId === valueId
  )
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

const filterRestrictions = (e: KeyboardEvent): void => {
  const val = (e.target as HTMLInputElement).value.toLowerCase()
  restrictionRef.value?.showPopup()
  restrictionRef.value?.updateInputValue(val)
  restrictionNeedle.value = val
}

const selectedRestriction = (val: number): void => {
  const tempId = uid()
  const tempValues = is.findRestriction(val)?.label
  activatedItem.value.restrictions.push({
    valueId: tempId,
    restrictId: val,
    restrictValues: Array.from(
      { length: (tempValues?.match(/\{x\}/gi) || []).length },
      () => 0
    ),
    action: 2
  })
  restrictId.value = null
  restrictionNeedle.value = undefined
  activatedRef.value?.scrollEnd('restrictions', tempId)
}

const updateRestriction = ({
  valueId,
  restrictValues
}: {
  valueId: string
  restrictValues: Array<number>
}): void => {
  const findRestriction = activatedItem.value.restrictions.find(
    (r) => r.valueId === valueId
  )
  if (findRestriction) {
    findRestriction.action = findRestriction.action !== 2 ? 4 : 2
    findRestriction.restrictValues = restrictValues
  }
}

const removeRestriction = ({ valueId }: { valueId: string }): void => {
  const findRestriction = activatedItem.value.restrictions.find(
    (r) => r.valueId === valueId
  )
  if (findRestriction) {
    findRestriction.disable = findRestriction.action !== 8
    findRestriction.restore =
      findRestriction.action !== 8 ? findRestriction.action : undefined
    findRestriction.action =
      findRestriction.action !== 8 ? 8 : findRestriction.restore
  }
}

// make an offer
const offerItem = ref<Item | undefined>()
const offers = ref<Array<Offer>>([])
const progressOffer = ref<boolean>(false)
const disableOffers = ref<boolean>(false)
const showOffers = ref<boolean>(false)
const makeOffer = ref<Offer>(new Offer())
const allowShowSeller = computed(
  () =>
    offerItem.value?.statusCode === '003' &&
    offers.value.find((o) => o.authorized)?.statusCode === '003' &&
    offers.value.find((o) => o.authorized)
)

const hideOffers = () => {
  offerItem.value = undefined
  offers.value.splice(0, offers.value.length)
  makeOffer.value = new Offer()
}

const openMakingOffer = (item: Item): void => {
  disableOffers.value = true
  showOffers.value = true
  offers.value.push(
    ...Array.from({ length: 3 }, () => {
      const offer = new Offer()
      offer.loading = true
      offer.user.loading = true
      offer.price.loading = true
      return offer
    })
  )

  offerItem.value = item
  makeOffer.value.itemId = item.itemId
  makeOffer.value.user = as.info

  if (item.price.currency !== 'offer') makeOffer.value.price = item.price

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
      offers.value.push(...resultOffers)
    })
    .catch(() => {})
    .then(() => {
      disableOffers.value = false
    })
}

const isMakingOffer = computed(
  () =>
    !offerItem.value?.authorized &&
    as.signed &&
    offerItem.value?.statusCode === '000'
)
const makingOffer = (offer: Offer) => {
  progressOffer.value = true

  is.makeOffer(offer)
    .then((response) => {
      const findOffer = offers.value.find((o) => o.offerId === response.offerId)
      as.checkSign()

      if (findOffer) {
        $q.notify({
          icon: 'img:/images/icons/check.svg',
          color: 'positive',
          classes: '',
          message: t('offer.updateOffer')
        })
      }
    })
    .catch(() => {})
    .then(() => {
      progressOffer.value = false
      emit('update-only', offerItem.value?.itemId, (updatedItem: Item) => {
        openMakingOffer(updatedItem)
      })
    })
}

const acceptOffer = (offer: Offer) => {
  disableOffers.value = true
  is.acceptOffer(offer)
    .then(() => {
      $q.notify({
        icon: 'img:/images/icons/check.svg',
        color: 'positive',
        classes: '',
        message: t('offer.acceptOffer')
      })
    })
    .catch(() => {})
    .then(() => {
      disableOffers.value = false
      emit('update-only', offerItem.value?.itemId, (updatedItem: Item) => {
        openMakingOffer(updatedItem)
      })
    })
}

const retractOffer = (offer: Offer) => {
  disableOffers.value = true
  is.retractOffer(offer.offerId)
    .then(() => {
      $q.notify({
        icon: 'img:/images/icons/check.svg',
        color: 'positive',
        classes: '',
        message: t('offer.retractOffer')
      })
    })
    .catch(() => {})
    .then(() => {
      disableOffers.value = false
      emit('update-only', offerItem.value?.itemId, (updatedItem: Item) => {
        openMakingOffer(updatedItem)
      })
    })
}

const turnDownOffer = (offer: Offer) => {
  disableOffers.value = true
  is.turnDownOffer(offer.offerId)
    .then(() => {
      $q.notify({
        icon: 'img:/images/icons/check.svg',
        color: 'positive',
        classes: '',
        message: t('offer.turnDownOffer')
      })
    })
    .catch(() => {})
    .then(() => {
      disableOffers.value = false
      emit('update-only', offerItem.value?.itemId, (updatedItem: Item) => {
        openMakingOffer(updatedItem)
      })
    })
}

const complete = (evaluations: Array<number>) => {
  disableOffers.value = true
  is.addEvaluations(offerItem.value?.itemId as string, evaluations)
    .then(() => {
      as.checkSign()

      $q.notify({
        icon: 'img:/images/icons/check.svg',
        color: 'positive',
        classes: '',
        message: t('offer.complete')
      })
    })
    .catch(() => {})
    .then(() => {
      disableOffers.value = false
      emit('update-only', offerItem.value?.itemId, (updatedItem: Item) => {
        openMakingOffer(updatedItem)
      })
    })
}

const expanded = (item: Item, isReward?: boolean) => {
  item.expanded = true
  const findItem = document.querySelector(
    `div[data-itemid="${isReward ? 'reward-item' : item.itemId}"]`
  ) as HTMLDivElement
  if (findItem) {
    nextTick(() => {
      scrollPos(findItem.offsetTop, 'smooth')
    })
  }
}

// analysis
const analyzeKey = ref<number>(0)
const startAnalyze = () => {
  disable.value = true
}

const endAnalyze = (item: Item) => {
  disable.value = false
  item.itemId = activatedItem.value.itemId
  item.hardcore = is.storage.data.hardcore
  item.ladder = is.storage.data.ladder
  item.authorized = activatedItem.value.authorized
  activatedItem.value = item
  analyzeKey.value++
}

const failedAnalyze = (msg: string) => {
  disable.value = false
  $q.notify({
    icon: 'img:/images/icons/alert.svg',
    color: 'negative',
    classes: '',
    message: msg,
    timeout: 2000
  })
}

const create = () => {
  activatedItem.value.hardcore = is.storage.data.hardcore
  activatedItem.value.ladder = is.storage.data.ladder
  activatedItem.value.itemType = 'weapon'
  activatedItem.value.itemTypeValue1 = 'axe'
  setDefaultProperties()
  activateShow.value = true
}

const openOffers = (itemId: string) => {
  const findItem = props.items.find((i) => i.itemId === itemId)

  if (findItem) {
    activateShow.value = false
    openMakingOffer(findItem)
  }
}

// about screen size
const size = computed(() =>
  $q.screen.width < 728
    ? 'display:inline-block;width:300px;max-height:100px;'
    : 'display:inline-block;width:728px;height:90px;'
)

defineExpose({ copyItem, create, hideEditable, openOffers, hideOffers })
</script>

<template>
  <div class="col-12" :style="`max-width:${width}px`">
    <div :class="$q.screen.lt.sm ? 'q-gutter-y-xl' : 'q-gutter-y-xxl'">
      <div
        v-if="rewardItem"
        class="item relative-position reward"
        :style="`min-height:${itemHeight}px;height:${
          rewardItem.expanded ? '100%' : `${itemHeight}px`
        }`"
        data-itemid="reward-item"
      >
        <D4Item
          :data="rewardItem"
          :loading="rewardItem.loading"
          @favorite="favorite"
          @copy="copy"
          @update-only="(val: string) => emit('update-only', val)"
        >
          <template #top-right> </template>
          <template v-if="requestProperties > 0" #properties>
            <D4Property
              v-for="property in rewardItem.properties"
              :key="property.valueId"
              :data="property"
            />
          </template>
          <template
            v-if="
              rewardItem.itemTypeValue1 === 'summoning' &&
              descriptions(rewardItem.itemTypeValue2).length > 0
            "
            #description
          >
            <D4Material
              v-for="material in descriptions(rewardItem.itemTypeValue2)"
              :key="material.value"
              :data="material"
            />
          </template>
          <template v-if="requestAffixes > 0" #affixes>
            <D4Affix
              v-for="affix in rewardItem.affixes"
              :key="affix.valueId"
              :data="affix"
            />
          </template>
          <template v-if="requestRestrictions > 0" #restrictions>
            <D4Restriction
              v-for="restriction in rewardItem.restrictions"
              :key="restriction.valueId"
              :data="restriction"
            />
          </template>
          <template #actions>
            <div
              v-show="rewardItem.expanded"
              class="row justify-between items-center q-pt-lg"
            >
              <div>
                <D4Btn
                  v-if="
                    rewardItem.authorized &&
                    !['001', '003', '004'].includes(rewardItem.statusCode)
                  "
                  :label="t('btn.edit')"
                  color="var(--q-secondary)"
                  :loading="rewardItem.loading"
                  @click="editItem(rewardItem as Item)"
                />
              </div>
              <div>
                <D4Btn
                  :label="
                    rewardItem.authorized ||
                    !as.signed ||
                    rewardItem.statusCode !== '000'
                      ? t('offer.list')
                      : t('btn.makeOffer')
                  "
                  :loading="rewardItem.loading"
                  :disable="rewardItem.forDisplay"
                  @click="openMakingOffer(rewardItem as Item)"
                >
                  <div
                    v-show="rewardItem.offers > 0"
                    class="q-ml-xs row items-center no-wrap"
                  >
                    <div class="text-grey-8">(</div>
                    <div>{{ rewardItem.offers }}</div>
                    <div class="text-grey-8">)</div>
                  </div>
                </D4Btn>
              </div>
            </div>
          </template>
          <template #more="{ loading }">
            <q-btn
              v-if="!rewardItem.expanded && !loading"
              flat
              aria-label="Tradurs More Button"
              text-color="black"
              class="more no-hover full-width"
              padding="10px"
              @click="expanded(rewardItem as Item, true)"
            >
              <img
                class="icon"
                :width="$q.screen.lt.sm ? 24 : 36"
                :height="$q.screen.lt.sm ? 24 : 36"
                src="/images/icons/more.svg"
                alt="Tradurs More Icon"
              />
            </q-btn>
          </template>
        </D4Item>
      </div>
      <div
        v-for="item, idx in (items as Array<Item>)"
        :key="item.itemId"
        :data-itemid="item.itemId"
        class="item relative-position"
        :style="`min-height:${itemHeight}px;height:${
          item.expanded ? '100%' : `${itemHeight}px`
        }`"
      >
        <D4Item
          :data="item"
          :loading="item.loading"
          @favorite="favorite"
          @copy="copy"
          @update-only="(val: string) => emit('update-only', val)"
        >
          <template #top-right> </template>
          <template v-if="requestProperties > 0" #properties>
            <D4Property
              v-for="property in item.properties"
              :key="property.valueId"
              :data="property"
            />
          </template>
          <template
            v-if="
              item.itemTypeValue1 === 'summoning' &&
              descriptions(item.itemTypeValue2).length > 0
            "
            #description
          >
            <D4Material
              v-for="material in descriptions(item.itemTypeValue2)"
              :key="material.value"
              :data="material"
            />
          </template>
          <template v-if="requestAffixes > 0" #affixes>
            <D4Affix
              v-for="affix in item.affixes"
              :key="affix.valueId"
              :data="affix"
            />
          </template>
          <template v-if="requestRestrictions > 0" #restrictions>
            <D4Restriction
              v-for="restriction in item.restrictions"
              :key="restriction.valueId"
              :data="restriction"
            />
          </template>
          <template #actions>
            <div
              v-show="item.expanded"
              class="row justify-between items-center q-pt-lg"
            >
              <div>
                <div
                  class="row items-center q-gutter-x-sm"
                  v-if="item.authorized && ['004'].includes(item.statusCode)"
                >
                  <D4Btn
                    :label="t('btn.delete')"
                    color="var(--q-secondary)"
                    :loading="item.loading"
                    @click="deleteConfirm(item)"
                  />
                  <D4Btn
                    :label="t('btn.reRegister')"
                    color="var(--q-light-magic)"
                    :loading="item.loading"
                    @click="reRegisterItem(item)"
                  />
                </div>
                <D4Btn
                  v-else-if="
                    item.authorized &&
                    !['001', '003', '004'].includes(item.statusCode)
                  "
                  :label="t('btn.edit')"
                  color="var(--q-light-set)"
                  :loading="item.loading"
                  @click="editItem(item)"
                />
              </div>
              <div>
                <D4Btn
                  :label="
                    item.authorized || !as.signed || item.statusCode !== '000'
                      ? t('offer.list')
                      : t('btn.makeOffer')
                  "
                  :loading="item.loading"
                  :disable="item.forDisplay"
                  @click="openMakingOffer(item)"
                >
                  <div
                    v-show="item.offers > 0"
                    class="q-ml-xs row items-center no-wrap"
                  >
                    <div class="text-grey-8">(</div>
                    <div>{{ item.offers }}</div>
                    <div class="text-grey-8">)</div>
                  </div>
                </D4Btn>
              </div>
            </div>
          </template>
          <template #more="{ loading }">
            <q-btn
              v-if="!item.expanded && !loading"
              flat
              aria-label="Tradurs More Button"
              text-color="black"
              class="more no-hover full-width"
              padding="10px"
              @click="expanded(item)"
            >
              <img
                class="icon"
                :width="$q.screen.lt.sm ? 24 : 36"
                :height="$q.screen.lt.sm ? 24 : 36"
                src="/images/icons/more.svg"
                alt="Tradurs More Icon"
              />
            </q-btn>
          </template>
        </D4Item>
      </div>
      <div
        v-show="items.length === 0"
        class="column q-gutter-y-sm justify-center items-center"
        style="min-height: 30vh"
      >
        <div>
          {{ t(route.name === 'tradeList' ? 'noFilterdItems' : 'noItem') }}
        </div>
        <div class="text-caption">
          {{ route.name === 'tradeList' ? t('noFilterdItemsDesc') : '' }}
        </div>
      </div>
    </div>
    <q-dialog
      v-model="activateShow"
      :maximized="$q.screen.lt.sm"
      persistent
      :no-route-dismiss="false"
      transition-show="fade"
      transition-hide="fade"
      transition-duration="100"
      @hide="hideEditable"
    >
      <D4Item
        ref="activatedRef"
        :data="activatedItem"
        :key="analyzeKey"
        editable
        :loading="activatedItem.loading"
        :disable="disable"
        @update="updateItem"
        @apply="apply"
      >
        <template #add-property="props">
          <div class="row items-center q-gutter-sm">
            <q-select
              ref="propertyRef"
              v-model="propertyId"
              :disable="disable"
              :popup-content-style="{
                height: `${props.wrap?.$el.clientHeight / 2}px`
              }"
              outlined
              dense
              no-error-icon
              use-input
              hide-bottom-space
              hide-selected
              emit-value
              map-options
              transition-show="none"
              transition-hide="none"
              :transition-duration="0"
              class="col"
              :label="t('searchOrSelect')"
              :options="propertyOptions(propertyNeedle)"
              dropdown-icon="img:/images/icons/dropdown.svg"
              popup-content-class="scroll bordered limit-select"
              @update:model-value="selectedProperty"
              @input.stop="filterProperties"
              @blur="() => (propertyNeedle = undefined)"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section side>
                    <q-icon
                      class="icon"
                      :class="{ 'rotate-45': ['standard'].includes(scope.opt.type as string) }"
                      size="14px"
                      :name="`img:/images/attribute_types/${
                        scope.opt.type || 'standard'
                      }.svg`"
                    />
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
          </div>
        </template>
        <template #properties>
          <D4Property
            v-for="property in activatedItem.properties"
            :key="property.valueId || uid()"
            :data="property"
            editable
            :disable="disable"
            @update="updateProperty"
            @remove="removeProperty"
          />
        </template>
        <template #add-affix="props">
          <div class="row items-center q-gutter-sm">
            <q-select
              ref="affixRef"
              v-model="affixId"
              :disable="disable"
              :popup-content-style="{
                height: `${props.wrap?.$el.clientHeight / 2}px`
              }"
              outlined
              dense
              no-error-icon
              use-input
              hide-bottom-space
              hide-selected
              emit-value
              map-options
              transition-show="none"
              transition-hide="none"
              :transition-duration="0"
              class="col"
              :label="t('searchOrSelect')"
              :options="affixOptions(affixNeedle)"
              dropdown-icon="img:/images/icons/dropdown.svg"
              popup-content-class="scroll bordered limit-select"
              @update:model-value="selectedAffix"
              @input.stop="filterAffixes"
              @blur="() => (affixNeedle = undefined)"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section side>
                    <q-icon
                      class="icon"
                      :class="{ 'rotate-45': ['standard'].includes(scope.opt.type as string) }"
                      size="14px"
                      :name="`img:/images/attribute_types/${
                        scope.opt.type || 'standard'
                      }.svg`"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label :class="scope.opt.color">{{
                      scope.opt.label
                    }}</q-item-label>
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
            <q-btn
              size="sm"
              :disable="disable"
              unelevated
              flat
              dense
              round
              aria-label="Tradurs Add Button"
              @click="createAffix"
            >
              <img
                class="icon"
                width="24"
                height="24"
                src="/images/icons/add.svg"
                alt="Tradurs Add Icon"
              />
            </q-btn>
          </div>
        </template>
        <template #affixes>
          <D4Affix
            v-for="affix in activatedItem.affixes"
            :key="affix.valueId || uid()"
            :data="affix"
            editable
            :disable="disable"
            @update="updateAffix"
            @remove="removeAffix"
          />
        </template>
        <template #add-restriction="props">
          <div class="row items-center q-gutter-sm">
            <q-select
              ref="restrictionRef"
              v-model="restrictId"
              :disable="disable"
              :popup-content-style="{
                height: `${props.wrap?.$el.clientHeight / 2}px`
              }"
              outlined
              dense
              no-error-icon
              use-input
              hide-bottom-space
              hide-selected
              emit-value
              map-options
              transition-show="none"
              transition-hide="none"
              :transition-duration="0"
              class="col"
              :label="t('searchOrSelect')"
              :options="restrictionOptions(restrictionNeedle)"
              dropdown-icon="img:/images/icons/dropdown.svg"
              popup-content-class="scroll bordered limit-select"
              @update:model-value="selectedRestriction"
              @input.stop="filterRestrictions"
              @blur="() => (restrictionNeedle = undefined)"
            >
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
          </div>
        </template>
        <template #restrictions>
          <D4Restriction
            v-for="restriction in activatedItem.restrictions"
            :key="restriction.valueId || uid()"
            :data="restriction"
            editable
            :disable="disable"
            @update="updateRestriction"
            @remove="removeRestriction"
          />
        </template>
        <!-- D4 season2 Pact -->
        <!--
          <template v-if="is.storage.data.ladder && activatedItem.itemType === 'armor'" #base-end>
          <div class="row justify-around items-center">
            <div class="relative-position">
              <q-spinner-puff :color="$q.dark.isActive ? 'yellow-6' : 'black'" class="absolute-center" size="52px" />
              <q-icon class="caution" size="19px">
                <D4Tooltip>
                  <div style="max-width:140px" class="text-caption break-keep">
                    {{ t('season.second.pact') }}
                  </div>
                </D4Tooltip>
              </q-icon>
            </div>
            <div class="row items-center">
              <q-icon name="img:/images/season/002/ferocity.webp" size="40px">
                <D4Tooltip anchor="top middle" self="top middle" :offset="[14, 28]" padding="xs" transition-show="jump-up"
                  transition-hide="jump-down">
                  <div style="max-width:140px" class="text-caption break-keep">
                    {{ t('season.second.ferocity') }}
                  </div>
                </D4Tooltip>
              </q-icon>
              <D4Counter v-model.number="activatedItem.pacts.ferocity" max-width="40px" hide-label :max="5" allow-zero
                allow-null :no-button="$q.screen.lt.sm" :disable="disable" />
            </div>
            <div class="row items-center">
              <q-icon name="img:/images/season/002/divinity.webp" size="40px">
                <D4Tooltip anchor="top middle" self="top middle" :offset="[14, 28]" padding="xs" transition-show="jump-up"
                  transition-hide="jump-down">
                  <div style="max-width:140px" class="text-caption break-keep">
                    {{ t('season.second.divinity') }}
                  </div>
                </D4Tooltip>
              </q-icon>
              <D4Counter v-model.number="activatedItem.pacts.divinity" max-width="40px" hide-label :max="5" allow-zero
                allow-null :no-button="$q.screen.lt.sm" :disable="disable" />
            </div>
            <div class="row items-center">
              <q-icon name="img:/images/season/002/eternity.webp" size="40px">
                <D4Tooltip anchor="top middle" self="top middle" :offset="[14, 28]" padding="xs" transition-show="jump-up"
                  transition-hide="jump-down">
                  <div style="max-width:140px" class="text-caption break-keep">
                    {{ t('season.second.eternity') }}
                  </div>
                </D4Tooltip>
              </q-icon>
              <D4Counter v-model.number="activatedItem.pacts.eternity" max-width="40px" hide-label :max="5" allow-zero
                allow-null :no-button="$q.screen.lt.sm" :disable="disable" />
            </div>
          </div>
        </template> -->
        <template #actions>
          <div
            v-if="activatedItem.authorized || activatedItem.itemId === ''"
            class="row justify-between items-center q-py-xs"
          >
            <div class="row items-center q-gutter-sm">
              <D4Btn
                v-if="activatedItem.itemId"
                :label="!$q.screen.lt.sm ? t('btn.moreActions') : ''"
                :loading="activatedItem.loading"
                :disable="disable || activatedItem.statusCode === '003'"
                color="var(--q-secondary)"
              >
                <q-icon
                  class="invert"
                  :class="{ 'q-ml-xs': !$q.screen.lt.sm }"
                  size="24px"
                  :name="`img:/images/icons/${
                    !$q.screen.lt.sm ? 'dropdown.svg' : 'morehoriz.svg'
                  }`"
                />
                <q-menu
                  fit
                  anchor="bottom middle"
                  self="top middle"
                  auto-close
                  class="no-shadow scroll rounded-borders"
                  transition-show="none"
                  transition-hide="none"
                  :transition-duration="0"
                >
                  <q-list :bordered="!$q.screen.lt.sm" class="rounded-borders">
                    <q-item
                      :disable="activatedItem.statusCode !== '000'"
                      clickable
                      @click="relistItem"
                    >
                      <q-item-section>{{ t('btn.relist') }}</q-item-section>
                    </q-item>
                    <q-item
                      :disable="
                        !['000', '002'].includes(activatedItem.statusCode) ||
                        !activatedItem.editable ||
                        disable
                      "
                      clickable
                      @click="statusItem"
                    >
                      <q-item-section>{{
                        activatedItem.statusCode === '002'
                          ? t('btn.resume')
                          : t('btn.suspend')
                      }}</q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      :disable="!activatedItem.editable || disable"
                      @click="deleteConfirm()"
                    >
                      <q-item-section class="text-negative text-weight-bold">{{
                        t('btn.delete')
                      }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </D4Btn>
              <D4Analysis
                ref="analysis"
                :loading="activatedItem.loading"
                :disable="
                  (!activatedItem.editable && !!activatedItem.itemId) ||
                  ['001', '004'].includes(activatedItem.statusCode) ||
                  disable
                "
                @start="startAnalyze"
                @end="endAnalyze"
                @failed="failedAnalyze"
              />
            </div>
            <div class="row justify-between items-center q-gutter-sm">
              <D4Btn
                :label="t('btn.cancel')"
                :loading="activatedItem.loading"
                :disable="disable"
                color="rgb(150,150,150)"
                @click="activateShow = false"
              />
              <D4Btn
                :label="t('btn.apply')"
                :loading="activatedItem.loading"
                :disable="
                  (!activatedItem.editable && !!activatedItem.itemId) ||
                  ['001', '004'].includes(activatedItem.statusCode) ||
                  disable
                "
                :progress="progress"
                type="submit"
              />
            </div>
          </div>
        </template>
      </D4Item>
    </q-dialog>
    <D4Dialog
      v-model="add.show"
      :no-route-dismiss="false"
      :persistent="disable"
      @submit="applyAdd"
      @hide="hideAdd"
    >
      <template #top>
        <q-card-section class="row items-center q-ml-md">
          <div class="name">
            {{ t('attribute.request', { attr: t(add.category as string) }) }}
          </div>
        </q-card-section>
      </template>
      <template #middle>
        <q-card-section :class="{ col: $q.screen.lt.sm }">
          <div class="column q-gutter-y-sm">
            <div class="row justify-between items-center no-wrap">
              <q-option-group
                v-model="add.type"
                :options="filterAttributeTypes"
                :disable="disable"
                color="primary"
                size="xs"
                inline
              />
              <div v-show="$q.screen.lt.sm" class="text-right">
                <D4Btn
                  label="{ x }"
                  round
                  :disable="disable"
                  color="var(--q-light-normal)"
                  @click="addAttrNum"
                />
              </div>
            </div>
            <q-input
              autofocus
              ref="refAttribute"
              v-model="add.attribute"
              type="textarea"
              :placeholder="t('attribute.placeholder')"
              :disable="disable"
              :error="add.error"
              :error-message="add.errorMessage"
              outlined
              dense
              no-error-icon
              hide-hint
              @keydown.exact.enter.prevent="applyAdd"
            />
          </div>
        </q-card-section>
      </template>
      <template #bottom>
        <q-card-section>
          <div class="row justify-between items-center q-py-xs">
            <q-checkbox
              size="xs"
              :disable="disable"
              v-model="add.continuous"
              :label="t('attribute.continuous')"
            />
            <div class="row items-center q-gutter-sm">
              <D4Btn
                :label="t('btn.cancel')"
                :disable="disable"
                color="rgb(150,150,150)"
                @click="add.show = false"
              />
              <D4Btn
                :label="t('btn.request')"
                :progress="disable"
                type="submit"
              />
            </div>
          </div>
        </q-card-section>
      </template>
    </D4Dialog>
    <D4Dialog
      v-model="showOffers"
      @hide="hideOffers"
      :maximized="$q.screen.lt.sm"
      :persistent="disableOffers || progressOffer"
      :no-route-dismiss="false"
    >
      <template #top>
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 q-pl-sm">
            {{ t('offer.list') }}
          </div>
          <q-btn
            unelevated
            aria-label="Tradurs Close Button"
            class="no-hover icon"
            :ripple="false"
            @click="showOffers = false"
          >
            <img
              src="/images/icons/close.svg"
              width="24"
              height="24"
              alt="Tradurs Close Icon"
            />
          </q-btn>
        </q-card-section>
      </template>
      <template #middle>
        <q-card-section
          class="col scroll"
          :style="
            $q.screen.lt.sm
              ? 'height:100%'
              : 'min-height:40vh !important;max-height:50vh !important'
          "
        >
          <div class="q-pb-xl full-height">
            <div class="row items-center q-col-gutter-lg">
              <div
                v-for="offer, idx in (offers as Array<Offer>)"
                :key="`offers_${idx}`"
                class="col-12 col-sm-6"
              >
                <q-card
                  flat
                  bordered
                  class="card-item expanded"
                  :class="{
                    unique: offer.statusCode === '003',
                    set: offer.statusCode === '001',
                    magic: offer.authorized
                  }"
                >
                  <div class="inner">
                    <D4Offer
                      class="offer"
                      :data="offer"
                      :owner="offerItem?.authorized"
                      :evaluations="offerItem?.evaluations"
                      :disable="disableOffers"
                      @accept-offer="acceptOffer"
                      @retract-offer="retractOffer"
                      @turndown-offer="turnDownOffer"
                      @complete="complete"
                      @reload="openMakingOffer(offerItem as Item)"
                    />
                  </div>
                </q-card>
              </div>
            </div>
            <div v-show="offers.length === 0" class="absolute-center">
              {{ t('offer.noOffer') }}
            </div>
          </div>
        </q-card-section>
      </template>
      <template v-if="isMakingOffer" #bottom>
        <q-card-section>
          <D4Offer
            :data="makeOffer"
            make
            :fixed="offerItem?.price.currency !== 'offer'"
            :disable="disableOffers"
            :progress="progressOffer"
            @make-offer="makingOffer"
          />
        </q-card-section>
      </template>
      <template v-else-if="allowShowSeller" #bottom>
        <q-card-section class="row justify-end q-gutter-sm items-center">
          <div>{{ t('seller') }}</div>
          <q-img src="/images/icons/direction.svg" class="icon" width="20px" />
          <D4User
            :data="offerItem?.user"
            :disable="disableOffers"
            @update="emit('update-only', offerItem?.itemId)"
          />
        </q-card-section>
      </template>
    </D4Dialog>
  </div>
</template>
<style scoped>
.item {
  height: inherit;
}

@keyframes awards {
  0% {
    transform: translate(-2px, -8px);
    opacity: 0;
  }
}

.reward::before {
  z-index: 2;
  animation: awards 0.6s ease;
  content: '';
  background: url('/images/awards/blood.webp');
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1),
    rgba(0, 0, 0, 0.8) 20%,
    rgba(0, 0, 0, 0.6)
  );
  color: red;
  background-size: 90px;
  background-repeat: no-repeat;
  width: 90px;
  height: 52px;
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(-2px, -5px);
}

.body--light .item:after {
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

.q-gutter-y-xxl:deep(> *) {
  margin-top: 96px;
}

.more {
  position: absolute;
  bottom: 0;
  z-index: 1;
  left: 0;
  right: 0;
  opacity: 0.4;
}

.more.disabled {
  opacity: 0.2 !important;
}

@media (max-width: 600px) {
  .more {
    padding: 4px !important;
  }

  .reward::before {
    background-size: 60px;
    transform: translate(-2px, -4px);
    width: 60px;
    height: 34.5px;
  }
}

.more:not(.disabled):hover {
  opacity: 0.8;
}

.more:deep(.icon) {
  transition: transform 0.3s ease;
}

.more:not(.disabled):hover:deep(.icon) {
  transform: translateY(20%);
}

.offer {
  min-height: 60px;
}
</style>
