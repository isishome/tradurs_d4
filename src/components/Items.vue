<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useQuasar, QInput } from 'quasar'
import type { AttributeType } from '@/stores/item'
import { useItemStore } from '@/stores/item'
import { checkAttribute } from '@/common'
import type { IItem } from '@/types/item'
import { Item, Advertise, Offer } from '@/types/item'
import dropdown from '@/assets/icons/dropdown.svg'
import ItemComp from '@/components/Item.vue'
import Affix from '@/components/Affix.vue'
import Property from '@/components/Property.vue'
import PriceComp from '@/components/Price.vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  width: {
    type: [String, Number],
    default: '700'
  },
  height: {
    type: [String, Number],
    default: '200'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update-item'])

// init module
const $q = useQuasar()
const store = useItemStore()

// common variable
const requestAffixes = computed<number>(() => store.affixes.request)
const requestProperties = computed<number>(() => store.properties.request)

// about editable item
interface Dialog {
  show: boolean,
  editable: boolean
}

const activatedRef = ref<typeof ItemComp | null>(null)
const activated = reactive<Dialog>({
  show: false,
  editable: false
})
const activatedItem = ref<Item>(new Item())
const activate = (item: Item): void => {
  activatedItem.value = JSON.parse(JSON.stringify(item))
  activated.editable = true
  activated.show = true
}

const hideActivated = (): void => {
  activatedItem.value = new Item()
  activated.editable = false
}

// make an offer
const runes = computed(() => store.runes)
const offers = ref<Array<Offer>>([])
const makeOffer = ref<boolean>(false)
const offer = ref<Offer>(new Offer(123))

const makingOffer = (itemId: number): void => {
  offer.value.itemId = itemId
  offers.value = Array.from({ length: Math.floor(Math.random() * 20) }, (_, i) => {
    const currency: string = ['offer', 'rune', 'essence', 'glyph'][Math.floor(Math.random() * 4)]
    const currencyValue: string | null = currency === 'rune' ? runes.value.map(r => r.value)[Math.floor(Math.random() * runes.value.length)] : null
    const genOffer = new Offer(123, currency, currencyValue, Math.floor(Math.random() * 1 + 1))
    genOffer.itemId = itemId
    return genOffer
  })
  makeOffer.value = true
}
const hideMakeOffer = (): void => {
  offer.value = new Offer(123)
  makeOffer.value = false
}

const updateItem = ({ name, itemTypeValues, quantity, quality, itemType, runeId, equipmentClass, price }: IItem): void => {
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
    activatedItem.value.properties.splice(0, activatedItem.value.properties.length)
    activatedItem.value.affixes.splice(0, activatedItem.value.affixes.length)
    activatedItem.value.equipmentClass = ''
  }
}

const apply = (): void => {
  emit('update-item', activatedItem.value)
  activated.show = false
}

// about add
interface Add {
  show: boolean,
  category: string | null,
  types: Array<AttributeType>,
  type: string,
  attribute: string,
  error: boolean,
  errorMessage: string
}

const refAttribute = ref<typeof QInput>()
const add = reactive<Add>({
  show: false as boolean,
  category: null as string | null,
  types: store.attributeTypes,
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
    errorMessage = '내용을 입력해 주세요'
  else if (!checkAttribute(add.attribute))
    errorMessage = '잘못된 형식이 입력되었습니다'
  else if ((add.category === 'properties' && store.matchProperties(add.attribute)) || (add.category === 'affixes' && store.matchAffixes(add.attribute)))
    errorMessage = '이미 존재하는 형식입니다'

  if (errorMessage !== '') {
    add.error = true
    add.errorMessage = errorMessage
    refAttribute.value?.focus()
    return
  }

  const uuid: number = Math.floor(Math.random() * 1000000)
  const attribute_id: number = Math.floor(Math.random() * 1000000)
  store.addAttribute(add.category, {
    value: attribute_id,
    label: add.attribute,
    type: add.type
  })

  if (add.category === 'properties')
    activatedItem.value.properties.push({ valueId: uuid, propertyId: attribute_id, propertyValues: [], action: 2 })
  else if (add.category === 'affixes')
    activatedItem.value.affixes.push({ valueId: uuid, affixId: attribute_id, affixValues: [], action: 2 })

  activatedRef.value?.scrollEnd(add.category)
  add.show = false
}

// about property
const propertyId = ref<number | null>(null)
const propertyOptions = store.filterProperties
const propertyNeedle = ref<string | null>(null)

const filterProperties = (val: string): void => {
  propertyNeedle.value = val.toLowerCase()
}

const selectedProperty = (val: number): void => {
  if (val) {
    activatedItem.value.properties.push({ propertyId: val, propertyValues: [], action: 2 })
    propertyId.value = null
    propertyNeedle.value = null
    activatedRef.value?.scrollEnd('properties')
  }
}

const createProperty = (): void => {
  add.category = 'properties'
  add.show = true
}

const updateProperty = ({ valueId, propertyValues }: { valueId: number, propertyValues: Array<number> }): void => {
  const findProperty = activatedItem.value.properties.find(p => p.valueId === valueId)
  if (findProperty) {
    findProperty.action = findProperty.action !== 2 ? 4 : 2
    findProperty.propertyValues = propertyValues
  }
}

const removeProperty = ({ valueId }: { valueId: number }): void => {
  const findProperty = activatedItem.value.properties.find(p => p.valueId === valueId)
  if (findProperty) {
    findProperty.disable = findProperty.action !== 8
    findProperty.restore = findProperty.action !== 8 ? findProperty.action : undefined
    findProperty.action = findProperty.action !== 8 ? 8 : findProperty.restore
  }
}

// about affix
const affixId = ref<number | null>(null)
const affixOptions = store.filterAffixes
const affixNeedle = ref<string | null>(null)

const filterAffixes = (val: string): void => {
  affixNeedle.value = val.toLowerCase()
}

const selectedAffix = (val: number): void => {
  activatedItem.value.affixes.push({ affixId: val, affixValues: [], action: 2 })
  affixId.value = null
  affixNeedle.value = null
  activatedRef.value?.scrollEnd('affixes')
}

const createAffix = (): void => {
  add.category = 'affixes'
  add.show = true
}

const updateAffix = ({ valueId, affixValues }: { valueId: number, affixValues: Array<number> }): void => {
  const findAffix = activatedItem.value.affixes.find(a => a.valueId === valueId)
  if (findAffix) {
    findAffix.action = findAffix.action !== 2 ? 4 : 2
    findAffix.affixValues = affixValues
  }
}

const removeAffix = ({ valueId }: { valueId: number }): void => {
  const findAffix = activatedItem.value.affixes.find(a => a.valueId === valueId)
  if (findAffix) {
    findAffix.disable = findAffix.action !== 8
    findAffix.restore = findAffix.action !== 8 ? findAffix.action : undefined
    findAffix.action = findAffix.action !== 8 ? 8 : findAffix.restore
  }
}

// Execute function if an item is visible
const visible = (isVisible: boolean, item: Item): void => {
}
</script>

<template>
  <div class="col-12" :style="`max-width:${width}px`">
    <div :class="$q.platform.is.mobile ? 'q-gutter-y-xl' : 'q-gutter-y-xxl'">
      <q-intersection v-for="(item, i) in (items as Array<Item | Advertise>)" :key="`item$_{i}`" class="item"
        :style="item.expanded ? 'height: 100%' : `height: ${height as number - ($q.platform.is.mobile ? 50 : 0)}px`"
        transition="jump-up" @visibility="isVisible => visible(isVisible, item)" once>
        <div v-if="(item instanceof Advertise)" class="bg-grey" style="width:100%;height:500px"></div>
        <ItemComp v-else :data="item" :loading="loading || item.loading">
          <template #top-right>
          </template>
          <template v-if="requestProperties > 0" #properties>
            <Property v-for="(property, i) in item.properties" :key="`property_${i}`" :data="property" />
          </template>
          <template v-if="requestAffixes > 0" #affixes>
            <Affix v-for="affix in item.affixes" :key="affix.valueId || `create_${Math.floor(Math.random() * 1000000)}`"
              :data="affix" />
          </template>
          <template #actions>
            <div class="row justify-between items-center" :class="$q.platform.is.mobile ? '' : 'q-pt-xl'">
              <div>
                <Btn label="수정" color="var(--q-secondary)" :loading="loading || item.loading" @click="activate(item)" />
              </div>
              <div>
                <Btn label="제안 리스트" :loading="loading || item.loading" @click="makingOffer(item.itemId as number)" />
              </div>
            </div>
          </template>
          <template #more="{ loading }">
            <q-btn v-if="!item.expanded && !loading" flat text-color="black" class="more no-hover" padding="20px"
              @click="item.expanded = true">
              <img class="icon" width="24" height="16" src="@/assets/icons/more.svg" />
            </q-btn>
          </template>
        </ItemComp>
      </q-intersection>
    </div>
    <q-dialog v-model="activated.show" @hide="hideActivated" :maximized="$q.platform.is.mobile" transition-show="none"
      transition-hide="none">
      <ItemComp ref="activatedRef" :data="activatedItem" :editable="activated.editable" @update="updateItem"
        @apply="apply">
        <template #add-property>
          <div class="row no-wrap items-center q-gutter-x-sm">
            <q-select v-model="propertyId" outlined dense no-error-icon use-input hide-bottom-space hide-selected
              emit-value map-options transition-show="none" transition-hide="none" class="select" label="특성 선택"
              :options="propertyOptions(propertyNeedle)" :dropdown-icon="`img:${dropdown}`"
              @update:model-value="selectedProperty" @input-value="filterProperties">
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    특성을 찾을 수 없습니다
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-btn size="sm" unelevated flat dense round @click="createProperty">
              <img class="icon" width="24" src="@/assets/icons/add.svg" />
            </q-btn>
          </div>
        </template>
        <template #properties>
          <Property v-for="property in activatedItem.properties"
            :key="property.valueId || `create_${Math.floor(Math.random() * 1000000)}`" :data="property"
            :editable="activated.editable" @update="updateProperty" @remove="removeProperty" />
        </template>
        <template #add-affix>
          <div class="row items-center q-gutter-x-sm">
            <q-select v-model="affixId" outlined dense no-error-icon use-input hide-bottom-space emit-value map-options
              transition-show="none" transition-hide="none" class="select" label="옵션 선택"
              :options="affixOptions(affixNeedle)" :dropdown-icon="`img:${dropdown}`"
              @update:model-value="selectedAffix" @input-value="filterAffixes">
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    옵션을 찾을 수 없습니다
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-btn size="sm" unelevated flat dense round @click="createAffix">
              <img class="icon" width="24" src="@/assets/icons/add.svg" />
            </q-btn>
          </div>
        </template>
        <template #affixes>
          <Affix v-for="affix in activatedItem.affixes"
            :key="affix.valueId || `create_${Math.floor(Math.random() * 1000000)}`" :data="affix"
            :editable="activated.editable" @update="updateAffix" @remove="removeAffix" />
        </template>
        <template #actions>
          <div class="row justify-end items-center q-gutter-x-sm" :class="$q.platform.is.mobile ? '' : 'q-pt-xl'">
            <Btn label="취소" :loading="loading" color="rgb(150,150,150)" @click="activated.show = false" />
            <Btn label="적용" :loading="loading" type="submit" />
          </div>
        </template>
      </ItemComp>
    </q-dialog>
    <q-dialog v-model="add.show" @hide="hideAdd" :maximized="$q.platform.is.mobile" transition-show="none"
      transition-hide="none">
      <q-card class="card-item dialog">
        <q-form class="inner column full-height" @submit="applyAdd">
          <q-card-section>
            <div class="q-py-lg q-pl-sm name">{{ add.category === 'properties' ? '특성 ' : '옵션 ' }} 추가</div>
          </q-card-section>
          <q-separator />
          <q-card-section :class="$q.platform.is.mobile ? 'col' : ''">
            <div class="column q-gutter-y-sm">
              <q-option-group v-model="add.type" :options="add.types" color="primary" size="xs" inline />
              <q-input autofocus ref="refAttribute" v-model="add.attribute"
                placeholder="엘리트 몬스터 처치 시 6초 동안 이동 속도 {x}% 증가" :error="add.error" :error-message="add.errorMessage"
                :outlined="!$q.dark.isActive" :standout="$q.dark.isActive" dense no-error-icon hide-hint />
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section :class="$q.platform.is.mobile ? 'col-1' : ''">
            <div class="row justify-end items-center q-gutter-x-sm" :class="$q.platform.is.mobile ? '' : 'q-pt-xl'">
              <Btn label="취소" :loading="loading" color="rgb(150,150,150)" @click="add.show = false" />
              <Btn label="추가" :loading="loading" type="submit" />
            </div>
          </q-card-section>
        </q-form>
      </q-card>
    </q-dialog>
    <q-dialog v-model="makeOffer" @hide="hideMakeOffer" :maximized="$q.platform.is.mobile" transition-show="none"
      transition-hide="none">
      <q-card class="card-item dialog overflow-hidden">
        <q-card-section>
          <div class="row items-center q-col-gutter-sm scroll">
            <div class="col-12 col-sm-6" v-for="(offer, idx) in offers" :key="idx">
              <q-card flat bordered class="bg-transparent">
                <PriceComp offer :data="offer" />
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
      <!-- <q-card class="card-item dialog">
        <q-form class="inner column full-height" @submit="applyAdd">
          <q-card-section>
            <div class="q-py-lg q-pl-sm name">{{ add.category === 'properties' ? '특성 ' : '옵션 ' }} 추가</div>
          </q-card-section>
          <q-separator />
          <q-card-section :class="$q.platform.is.mobile ? 'col' : ''">
            <div class="column q-gutter-y-sm">
              <q-option-group v-model="add.type" :options="add.types" color="primary" size="xs" inline />
              <q-input autofocus ref="refAttribute" v-model="add.attribute"
                placeholder="엘리트 몬스터 처치 시 6초 동안 이동 속도 {x}% 증가" :error="add.error" :error-message="add.errorMessage"
                :outlined="!$q.dark.isActive" :standout="$q.dark.isActive" dense no-error-icon hide-hint />
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section :class="$q.platform.is.mobile ? 'col-1' : ''">
            <div class="row justify-end items-center q-gutter-x-sm" :class="$q.platform.is.mobile ? '' : 'q-pa-md'">
              <q-btn dense unelevated outline color="grey-8" label="취소" @click="add.show = false" />
              <q-btn dense unelevated color="primary" label="추가" type="submit" />
            </div>
          </q-card-section>
        </q-form>
      </q-card> -->
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

.select {
  width: 700px;
  max-width: 80%;
}

.dialog {
  width: 600px;
  max-width: 100vw;
}
</style>