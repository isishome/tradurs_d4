<script setup>
import { defineAsyncComponent, ref, computed, reactive } from 'vue'
import { useQuasar, uid } from 'quasar'
import { useItemStore } from '@/stores/item.js'
import { checkAttribute } from '@/common'
import dropdown from '@/assets/icons/dropdown.svg'

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
    default: '180'
  }
})
const emit = defineEmits(['update-item'])

// define async component
const Item = defineAsyncComponent(() => import('@/components/Item.vue'))
const Affix = defineAsyncComponent(() => import('@/components/Affix.vue'))
const Property = defineAsyncComponent(() => import('@/components/Property.vue'))

// init module
const $q = useQuasar()
const store = useItemStore()

// common variable
const requestAffixes = computed(() => store.affixes.request)
const requestProperties = computed(() => store.properties.request)

// about editable item
const activated = reactive({
  show: false,
  editable: false
})
const activatedItem = ref(null)
const activate = (item) => {
  activatedItem.value = JSON.parse(JSON.stringify(item))
  activated.editable = true
  activated.show = true
}

const hide = () => {
  activatedItem.value = null
  activated.editable = false
}

const updateItem = ({ name, values, quality, type, rune, eClass, price }) => {
  activatedItem.value.name = name
  activatedItem.value.item_type_values = values
  activatedItem.value.quality = quality
  activatedItem.value.rune_id = rune
  activatedItem.value.equipment_class = eClass
  activatedItem.value.price.currency = price.currency
  activatedItem.value.price.quantity = price.quantity

  if (activatedItem.value.item_type !== type) {
    activatedItem.value.item_type = type
    activatedItem.value.properties.splice(0, activatedItem.value.properties.length)
    activatedItem.value.affixes.splice(0, activatedItem.value.affixes.length)
    activatedItem.value.rune_id = null
    activatedItem.value.equipment_class = null
    activatedItem.value.price.currency = 'amn'
    activatedItem.value.price.quantity = 1
  }
}

const apply = () => {
  emit('update-item', activatedItem.value)
  activated.show = false
}

// about add
const refAttribute = ref(null)
const add = reactive({
  show: false,
  category: null,
  types: store.attributeTypes,
  type: 'regular',
  attribute: null,
  error: false,
  errorMessage: ''
})
const hideAdd = () => {
  add.category = null
  add.type = 'regular'
  add.attribute = null
  add.error = false
  add.errorMessage = ''
}

const applyAdd = () => {
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
    refAttribute.value.focus()
    return
  }

  const attribute_id = uid()
  store.addAttribute(add.category, {
    value: attribute_id,
    label: add.attribute,
    type: add.type
  })

  if (add.category === 'properties')
    activatedItem.value.properties.push({ value_id: uid(), property_id: attribute_id, property_values: [], action: 2 })
  else if (add.category === 'affixes')
    activatedItem.value.affixes.push({ value_id: uid(), affix_id: attribute_id, affix_values: [], action: 2 })

  add.show = false
}

// about property
const propertyId = ref(null)
const propertyOptions = store.filterProperties
const propertyNeedle = ref(null)

const filterProperties = (val) => {
  propertyNeedle.value = val.toLowerCase()
}

const selectedProperty = (val) => {
  if (val) {
    activatedItem.value.properties.push({ value_id: uid(), property_id: val, property_values: [], action: 2 })
    propertyId.value = null
    propertyNeedle.value = null
  }
}

const createProperty = () => {
  add.category = 'properties'
  add.show = true
}

const updateProperty = ({ valueId, propertyValues }) => {
  const findProperty = activatedItem.value.properties.find(p => p.value_id === valueId)
  if (findProperty) {
    findProperty.action = findProperty.action !== 2 ? 4 : 2
    findProperty.property_values = propertyValues
  }
}

const removeProperty = ({ valueId }) => {
  const findProperty = activatedItem.value.properties.find(p => p.value_id === valueId)
  if (findProperty) {
    findProperty.disable = findProperty.action !== 8
    findProperty.restore = findProperty.action !== 8 ? findProperty.action : undefined
    findProperty.action = findProperty.action !== 8 ? 8 : findProperty.restore
  }
}

// about affix
const affixId = ref(null)
const affixOptions = store.filterAffixes
const affixNeedle = ref(null)

const filterAffixes = (val) => {
  affixNeedle.value = val.toLowerCase()
}

const selectedAffix = (val) => {
  activatedItem.value.affixes.push({ value_id: uid(), affix_id: val, affix_values: [], action: 2 })
  affixId.value = null
  affixNeedle.value = null
}

const createAffix = () => {
  add.category = 'affixes'
  add.show = true
}

const updateAffix = ({ valueId, affixValues }) => {
  const findAffix = activatedItem.value.affixes.find(a => a.value_id === valueId)
  if (findAffix) {
    findAffix.action = findAffix.action !== 2 ? 4 : 2
    findAffix.affix_values = affixValues
  }
}

const removeAffix = ({ valueId }) => {
  const findAffix = activatedItem.value.affixes.find(a => a.value_id === valueId)
  if (findAffix) {
    findAffix.disable = findAffix.action !== 8
    findAffix.restore = findAffix.action !== 8 ? findAffix.action : undefined
    findAffix.action = findAffix.action !== 8 ? 8 : findAffix.restore
  }
}

// Execute function if an item is visible
const visible = (isVisible, item) => {
}
</script>

<template>
  <div class="col-12" :style="`max-width:${width}px`">
    <div class="column" :class="$q.platform.is.mobile ? 'q-gutter-y-xl' : 'q-gutter-y-xxl'">
      <q-intersection class="item"
        :style="item.expanded ? 'height: 100%' : `height: ${height - ($q.platform.is.mobile ? 50 : 0)}px`"
        v-for="(item, i) in items" :key="item.item_id" transition="jump-up"
        @visibility="isVisible => visible(isVisible, item)" once>
        <div v-if="item.ad" class="bg-grey" style="width:100%;height:500px"></div>
        <Item v-else :data="item" :loading="item.loading">
          <template #top-right>
            <q-btn unelevated dense round padding="0" @click.stop="activate(item)">
              <img class="icon" width="24" src="@/assets/icons/edit.svg" />
            </q-btn>
          </template>
          <template v-if="requestProperties > 0" #properties>
            <Property v-for="property in item.properties" :key="property.id" :data="property" />
          </template>
          <template v-if="requestAffixes > 0" #affixes>
            <Affix v-for="affix in item.affixes" :key="affix.id" :data="affix" />
          </template>
          <template #more="{ loading }">

            <q-btn v-if="!item.expanded" flat :disable="loading" text-color="black" class="more" padding="20px"
              @click="item.expanded = true">
              <img class="icon" width="16" height="16" src="@/assets/icons/more.svg" />
            </q-btn>
          </template>
        </Item>
      </q-intersection>
    </div>
    <q-dialog v-model="activated.show" @hide="hide" :maximized="$q.platform.is.mobile" transition-show="none"
      transition-hide="none">
      <Item :data="activatedItem" :editable="activated.editable" @update="updateItem" @apply="apply">
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
          <Property v-for="property in activatedItem.properties" :key="property.id" :data="property"
            :editable="activated.editable" @update="updateProperty" @remove="removeProperty" />
        </template>
        <template #add-affix>
          <div class="row no-wrap items-center q-gutter-x-sm">
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
          <Affix v-for="affix in activatedItem.affixes" :key="affix.id" :data="affix" :editable="activated.editable"
            @update="updateAffix" @remove="removeAffix" />
        </template>
        <template #actions>
          <q-btn dense unelevated outline color="grey-8" label="취소" @click="activated.show = false" />
          <q-btn dense unelevated color="primary" label="적용" type="submit" />
        </template>
      </Item>
    </q-dialog>
    <q-dialog v-model="add.show" @hide="hideAdd" :maximized="$q.platform.is.mobile" transition-show="none"
      transition-hide="none">
      <q-card class="card-item add-attribute">
        <q-form class="inner column full-height" @submit="applyAdd">
          <q-card-section>
            <div class="kodia q-py-lg q-pl-sm name">{{ add.category === 'properties' ? '특성 ' : '옵션 ' }} 추가</div>
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
      </q-card>
    </q-dialog>
  </div>
</template>
<style scoped>
.item:deep(>div) {
  height: inherit;
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
  opacity: .6;
}

.more.disabled {
  opacity: .2 !important;
}

@media (max-width:600px) {
  .more {
    padding: 10px !important;
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
  max-width: 90%;
}

.add-attribute {
  width: 600px;
  max-width: 100vw;
}
</style>