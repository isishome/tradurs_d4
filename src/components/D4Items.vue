<script setup lang="ts">
import { nanoid } from 'nanoid'
import { ref, computed, reactive } from 'vue'
import { useQuasar, QInput, QSelect } from 'quasar'
import type { AttributeType, Power, Property, Affix } from 'stores/item-store'
import { useItemStore } from 'stores/item-store'
import { checkAttribute } from 'src/common'
import type { IItem } from 'src/types/item'
import { Item, Advertise, Offer } from 'src/types/item'
import { icons } from 'src/common/icons'
import D4Item from 'components/D4Item.vue'
import D4Affix from 'components/D4Affix.vue'
import D4Power from 'components/D4Power.vue'
import D4Property from 'components/D4Property.vue'
import D4Price from 'components/D4Price.vue'
import D4User from 'components/D4User.vue'

defineProps({
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

const emit = defineEmits(['upsert-item', 'delete-item'])

// init module
const $q = useQuasar()
const store = useItemStore()

// common variable
const requestPowers = computed<number>(() => store.powers.request)
const requestAffixes = computed<number>(() => store.affixes.request)
const requestProperties = computed<number>(() => store.properties.request)

// about editable item
const activatedRef = ref<typeof D4Item | null>(null)
const activateShow = ref<boolean>(false)
const activatedItem = ref<Item>(new Item(''))

const editItem = (item: Item) => {
  activatedItem.value = JSON.parse(JSON.stringify(item))
  activateShow.value = true
}

// make an offer
const runes = computed(() => store.runes)
const offers = ref<Array<Offer>>([])
const makeOffer = ref<boolean>(false)

const makingOffer = (itemId: string): void => {
  offers.value = Array.from({ length: Math.floor(Math.random() * 6 + 100) }, () => {
    const currency: string = ['offer', 'rune', 'essence', 'glyph'][Math.floor(Math.random() * 4)]
    const currencyValue: string | null = currency === 'rune' ? runes.value.map(r => r.value)[Math.floor(Math.random() * runes.value.length)] : null
    const genOffer = new Offer(itemId, nanoid(), currency, currencyValue, Math.floor(Math.random() * 1 + 1))
    genOffer.loading = true
    genOffer.user.loading = true
    genOffer.itemId = itemId
    return genOffer
  })

  makeOffer.value = true
}

const showMakeOffer = (offer: Offer) => {
  offer.getInfo()
  offer.user.getInfo()
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
    activatedItem.value.equipmentClass = ''
  }
}

const disable = ref<boolean>(false)
const progress = ref<boolean>(false)
const hideEditable = () => {
  disable.value = false
  progress.value = false
  activatedItem.value = new Item('')
  activateShow.value = false
}

const deleteItem = () => {
  disable.value = true
  emit('delete-item', activatedItem.value, hideEditable)
}

const apply = () => {
  disable.value = true
  progress.value = true
  emit('upsert-item', activatedItem.value, hideEditable)
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
  else if ((add.category === 'powers' && store.matchPowers(add.attribute)) || (add.category === 'properties' && store.matchProperties(add.attribute)) || (add.category === 'affixes' && store.matchAffixes(add.attribute)))
    errorMessage = '이미 존재하는 형식입니다'

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
    .catch((e) => {
      $q.notify({
        type: 'negative',
        position: 'top',
        message: e,
      })
    })
    .then(() => {
      disable.value = false
    })
}

// about power
const powerId = ref<number | null>(null)
const powerOptions = store.filterPowers
const powerNeedle = ref<string | null>(null)

const filterPowers = (val: string): void => {
  powerNeedle.value = val.toLowerCase()
}

const selectedPower = (val: number): void => {
  if (val) {
    const tempId = nanoid()
    activatedItem.value.powers.push({ valueId: tempId, powerId: val, powerValues: [], action: 2 })
    powerId.value = null
    powerNeedle.value = null
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
const propertyId = ref<number | null>(null)
const propertyOptions = store.filterProperties
const propertyNeedle = ref<string | null>(null)

const filterProperties = (val: string): void => {
  propertyNeedle.value = val.toLowerCase()
}

const selectedProperty = (val: number): void => {
  if (val) {
    const tempId = nanoid()
    activatedItem.value.properties.push({ valueId: tempId, propertyId: val, propertyValues: [], action: 2 })
    propertyId.value = null
    propertyNeedle.value = null
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
const affixId = ref<number | null>(null)
const affixOptions = store.filterAffixes
const affixNeedle = ref<string | null>(null)

const filterAffixes = (val: string): void => {
  affixNeedle.value = val.toLowerCase()
}

const selectedAffix = (val: number): void => {
  const tempId = nanoid()
  activatedItem.value.affixes.push({ valueId: tempId, affixId: val, affixValues: [], action: 2 })
  affixId.value = null
  affixNeedle.value = null
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

// Execute function if an item is visible
const visible = (isVisible: boolean, item: Item): void => {
  isVisible
  item
}

const create = () => {
  activateShow.value = true
}
defineExpose({ create })
</script>

<template>
  <div class="col-12" :style="`max-width:${width}px`">
    <div :class="$q.platform.is.mobile ? 'q-gutter-y-xl' : 'q-gutter-y-xxl'">
      <q-intersection v-for="(item, i) in (items as Array<Item | Advertise>)" :key="item.itemId" class="item"
        :style="item.expanded ? 'height: 100%' : `height: ${height as number - ($q.platform.is.mobile ? 50 : 0)}px`"
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
            <D4Affix v-for="affix in item.affixes"
              :key="affix.valueId || `create_${Math.floor(Math.random() * 1000000)}`" :data="affix" />
          </template>
          <template #actions>
            <div class="row justify-between items-center q-px-md q-pt-lg">
              <div>
                <D4Btn label="수정" color="var(--q-secondary)" :loading="loading || item.loading"
                  @click="editItem(item)" />
              </div>
              <div>
                <D4Btn label="제안 리스트" :loading="loading || item.loading" @click="makingOffer(item.itemId)" />
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
    <q-dialog v-model="activateShow" :maximized="$q.platform.is.mobile" :persistent="disable" transition-show="none"
      transition-hide="none" @hide="hideEditable">
      <D4Item ref="activatedRef" :data="activatedItem" editable :loading="activatedItem.loading" :disable="disable"
        @update="updateItem" @apply="apply">
        <template #add-power>
          <div class="row no-wrap items-center q-gutter-x-sm">
            <q-select v-model="powerId" :disable="disable" outlined dense no-error-icon use-input hide-bottom-space
              hide-selected emit-value map-options transition-show="none" transition-hide="none" class="select col"
              label="능력 선택" :options="powerOptions(powerNeedle)" :dropdown-icon="`img:${icons.dropdown}`"
              @update:model-value="selectedPower" @input-value="filterPowers">
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    능력을 찾을 수 없습니다
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
        <template #add-property>
          <div class="row no-wrap items-center q-gutter-x-sm">
            <q-select v-model="propertyId" :disable="disable" outlined dense no-error-icon use-input hide-bottom-space
              hide-selected emit-value map-options transition-show="none" transition-hide="none" class="col"
              label="특성 선택" :options="propertyOptions(propertyNeedle)" :dropdown-icon="`img:${icons.dropdown}`"
              @update:model-value="selectedProperty" @input-value="filterProperties">
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    특성을 찾을 수 없습니다
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
        <template #add-affix>
          <div class="row items-center q-gutter-x-sm">
            <q-select v-model="affixId" :disable="disable" outlined dense no-error-icon use-input hide-bottom-space
              emit-value map-options transition-show="none" transition-hide="none" class="col" label="옵션 선택"
              :options="affixOptions(affixNeedle)" :dropdown-icon="`img:${icons.dropdown}`"
              @update:model-value="selectedAffix" @input-value="filterAffixes">
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    옵션을 찾을 수 없습니다
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
          <div class="row justify-between items-center q-gutter-x-sm q-px-md"
            :class="$q.platform.is.mobile ? '' : 'q-pt-lg'">
            <div>
              <D4Btn label="삭제" :loading="activatedItem.loading" :disable="disable" color="var(--q-secondary)"
                @click="deleteItem" />
            </div>
            <div>
              <D4Btn label="취소" :loading="activatedItem.loading" :disable="disable" color="rgb(150,150,150)"
                @click="activateShow = false" />
              <D4Btn label="적용" :loading="activatedItem.loading" :disable="disable" :progress="progress"
                type="submit" />
            </div>
          </div>
        </template>
      </D4Item>
    </q-dialog>
    <q-dialog v-model="add.show" @hide="hideAdd" :maximized="$q.platform.is.mobile" transition-show="none"
      transition-hide="none">
      <q-card class="card-item dialog normal">
        <q-form class="inner column full-height" @submit="applyAdd">
          <q-card-section>
            <div class="q-py-lg q-pl-sm name">{{ `${add.category === 'powers' ? '능력 ' : add.category === 'properties' ?
            '특성 ' : '옵션 '} 추가`}}</div>
          </q-card-section>
          <q-separator />
          <q-card-section :class="$q.platform.is.mobile ? 'col' : ''">
            <div class="column q-gutter-y-sm">
              <q-option-group v-model="add.type" :options="add.types" color="primary" size="xs" inline />
              <q-input autofocus ref="refAttribute" v-model="add.attribute"
                placeholder="엘리트 몬스터 처치 시 6초 동안 이동 속도 {x}% 증가" :disable="disable" :error="add.error"
                :error-message="add.errorMessage" outlined dense no-error-icon hide-hint />
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section :class="$q.platform.is.mobile ? 'col-1' : ''">
            <div class="row justify-end items-center q-gutter-x-sm q-px-md"
              :class="$q.platform.is.mobile ? '' : 'q-pt-lg'">
              <D4Btn label="취소" :loading="loading" :disable="disable" color="rgb(150,150,150)"
                @click="add.show = false" />
              <D4Btn label="추가" :loading="loading" :progress="disable" type="submit" />
            </div>
          </q-card-section>
        </q-form>
      </q-card>
    </q-dialog>
    <q-dialog v-model="makeOffer" :maximized="$q.platform.is.mobile" transition-show="none" transition-hide="none">
      <q-card class="card-item dialog no-scroll normal">
        <div class="inner column" :style="$q.platform.is.mobile ? 'height:100%' : 'max-height:90vh'">
          <q-card-section class="col scroll">
            <div class="row items-center q-col-gutter-lg">
              <q-intersection v-for="offer in (offers as Array<Offer>)" :key="`offer_${offer.itemId}_${offer.user.id}`"
                class="col-12 col-sm-6 offer" transition="fade" @visibility="showMakeOffer(offer)" once>
                <q-card flat bordered class="card-item expanded set">
                  <div class="inner">
                    <D4Price offer :data="offer" :loading="offer.loading">
                      <template #user>
                        <D4User :data="offer.user" :loading="offer.user.loading" />
                      </template>
                    </D4Price>
                  </div>
                </q-card>
              </q-intersection>
            </div>
          </q-card-section>
        </div>
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

.offer {
  height: 150px;
}
</style>