<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { QList, QSelect, debounce, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { Item } from 'src/types/item'
import { useAccountStore } from 'src/stores/account-store'
import { type IFilter, type Attr, useItemStore } from 'src/stores/item-store'
import NotifyEn from '/images/filter/notify_en.webp'
import NotifyKo from '/images/filter/notify_ko.webp'

import D4Preset from 'components/D4Preset.vue'
import D4Analysis from 'components/D4Analysis.vue'
import D4Attribute from 'components/D4Attribute.vue'

interface IProps {
  disable?: boolean
}
const props = withDefaults(defineProps<IProps>(), {
  disable: false
})

const $q = useQuasar()
const as = useAccountStore()
const is = useItemStore()
const { t, te, locale } = useI18n({ useScope: 'global' })

const loading = ref(false)
const preset = ref<number | null>(null)
const presets = is.storage.data.presets
const filter = reactive<IFilter>({} as IFilter)
const filterQuality = is.filterQuality
const filterTypes = is.filterTypes
const findType = is.findType
const filterClasses = is.filterClasses
const filterRunes = is.filterRunesByType
const filterAspectByCategory = is.filterAspectByCategory
const filterLoading = computed(() => props.disable || is.filter.loading)
const itemStatus = computed(() => [
  {
    value: 'all',
    label: t('filter.all'),
    disable: !is.filter.mine
  },
  ...is.itemStatus
])
const attrCount = computed(
  () =>
    (filter.properties.length ?? 0) +
    (filter.affixes.length ?? 0) +
    (filter.restrictions.length ?? 0)
)

Object.assign(filter, is.filter)

const isMine = computed(
  () =>
    !!filter.mine || !!filter.offered || filter.onlyCurrency || filter.favorite
)

const isItem = computed(
  () =>
    filter.power[0] !== 0 ||
    filter.power[1] !== 9999 ||
    filter.level[0] !== 0 ||
    filter.level[1] !== 999 ||
    filter.itemTypes.length > 0 ||
    filter.quality.length > 0
)
const expandMine = ref<boolean>(isMine.value)
const expandItem = ref<boolean>(isItem.value)

// about property
const properties = ref<Array<Attr>>([])
const propertyOptions = is.filterProperties
const updateProperties = (val: Array<Attr>) => {
  properties.value.splice(0, properties.value.length, ...val)
}

// about affix
const affixes = ref<Array<Attr>>([])
const affixOptions = is.filterAffixes
const updateAffixes = (val: Array<Attr>) => {
  affixes.value.splice(0, affixes.value.length, ...val)
}

// about restrictions
const restrictions = ref<Array<Attr>>([])
const restrictionOptions = is.filterRestrictions
const updateRestrictions = (val: Array<Attr>) => {
  restrictions.value.splice(0, restrictions.value.length, ...val)
}

// about typevalue2
const typeValue2Ref = ref<{ [key: string]: QSelect }>({})
const typeValue2Needle = ref<{ [key: string]: string }>({})

const filterTypeValue = (e: KeyboardEvent, itemType: string) => {
  const val = (e.target as HTMLInputElement).value.toLowerCase()
  typeValue2Ref.value?.[itemType]?.showPopup()
  typeValue2Ref.value?.[itemType]?.updateInputValue(val)
  typeValue2Needle.value[itemType] = val
}

const mine = () => {
  if (!filter.mine) {
    filter.status = filter.status === 'all' ? '000' : filter.status
    filter.offered = false
  } else filter.status = 'all'

  updateDebounce()
}

const clearFilter = () => {
  preset.value = null
  is.clearFilter(true)
  Object.assign(filter, is.filter)
  properties.value = []
  affixes.value = []
  restrictions.value = []
  filter.request--
  update()
}

const update = (quality?: Array<string>) => {
  if (quality) {
    Object.keys(filter.itemTypeValues1).forEach((q: string) => {
      if (!quality.includes(q)) delete filter.itemTypeValues1[q]
    })
  }

  filter.name = is.filter.name
  filter.request++

  Object.assign(is.filter, filter)
}

const updateDebounce = debounce(() => {
  update()
}, 500)

const updateBasic = () => {
  is.setStorage()
    .then(() => {})
    .catch(() => {})
    .then(() => {
      filter.request++
      Object.assign(is.filter, filter)
    })
}

const updateBasicDebounce = debounce(() => {
  updateBasic()
}, 500)

const updatePreset = (id: number) => {
  const findPreset = is.findPreset(id)

  if (findPreset) {
    Object.assign(filter, findPreset.filter)
    update()
  }
}

const addPreset = ({
  name,
  done,
  error
}: {
  name: string
  done: Function
  error: Function
}) => {
  is.addPreset(name)
    .then((id: number) => {
      preset.value = id
    })
    .catch(() => {
      error()
    })
    .then(() => {
      done()
    })
}

const removePreset = ({
  id,
  done,
  error
}: {
  id: number
  done: Function
  error: Function
}) => {
  is.removePreset(id)
    .then(() => {
      if (id === preset.value) preset.value = null
    })
    .catch(() => {
      error()
    })
    .then(() => {
      done()
    })
}

const attributeShow = ref(false)
const beforeShowAttribute = () => {
  const clone = JSON.parse(JSON.stringify(filter))

  properties.value = clone.properties
  affixes.value = clone.affixes
  restrictions.value = clone.restrictions
}
const closeAttribute = () => {
  attributeShow.value = false
}
const applyAttribute = () => {
  attributeShow.value = false

  filter.properties = properties.value
  filter.affixes = affixes.value
  filter.restrictions = restrictions.value

  update()
}

const startAnalyze = () => {
  loading.value = true
}

const endAnalyze = (item: Item) => {
  loading.value = false

  properties.value = item.properties.map((p) => ({
    value: p.propertyId,
    minmax: is
      .findProperty(p.propertyId)
      ?.label.match(/\{x\}/g)
      ?.map(() => ({ min: 0, max: 9999 }))
  }))

  affixes.value = item.affixes
    .filter(
      (a) => typeof a.affixId !== 'undefined' || typeof a.runeId !== 'undefined'
    )
    .map((a) => ({
      value: a.affixId ?? a.runeId,
      affixGreater: 0,
      minmax: is
        .findAffix(a.affixId ?? a.runeId)
        ?.label.match(/\{x\}/g)
        ?.map(() => ({ min: 0, max: 9999 }))
    })) as Array<Attr>

  restrictions.value = item.restrictions.map((r) => ({ value: r.restrictId }))
}

const failedAnalyze = (msg: string) => {
  loading.value = false
  $q.notify({
    icon: 'img:/images/icons/alert.svg',
    color: 'negative',
    classes: '',
    message: msg,
    timeout: 2000
  })
}

watch(isMine, (val: boolean) => {
  expandMine.value = val
})

watch(isItem, (val: boolean) => {
  expandItem.value = val
})

defineExpose({
  clearFilter
})
</script>

<template>
  <div>
    <q-list dense class="filter" :class="{ disable: filterLoading }">
      <q-item-label header>
        <div class="row items-center q-gutter-sm">
          <div>
            {{ t('filter.basic') }}
          </div>
          <q-icon
            v-if="as.signed"
            class="icon"
            name="img:/images/icons/help.svg"
            size="19px"
          >
            <D4Tooltip>
              <div style="max-width: 200px" class="text-caption break-keep">
                {{ t('filter.basicDescription') }}
              </div>
            </D4Tooltip>
          </q-icon>
          <q-separator class="col" />
        </div>
      </q-item-label>
      <q-item :disable="filterLoading">
        <q-item-section>
          <q-checkbox
            dense
            :disable="filterLoading"
            size="xs"
            v-model="is.storage.data.hardcore"
            :label="t('item.hardcore')"
            color="secondary"
            @update:model-value="updateBasicDebounce()"
          />
        </q-item-section>
      </q-item>
      <q-item :disable="filterLoading">
        <q-item-section>
          <q-checkbox
            dense
            :disable="filterLoading"
            size="xs"
            v-model="is.storage.data.ladder"
            :label="t('item.ladder')"
            :class="[te('season.color') ? t('season.color') : '']"
            @update:model-value="updateBasicDebounce()"
          />
        </q-item-section>
      </q-item>
      <q-item :disable="filterLoading">
        <q-item-section>
          <q-checkbox
            dense
            :disable="filterLoading"
            size="xs"
            v-model="is.storage.data.expanded"
            :label="t('item.expanded')"
            @update:model-value="updateBasic()"
          />
        </q-item-section>
      </q-item>
      <q-separator inset />
      <template v-if="as.signed">
        <D4Preset
          v-model="preset"
          :options="presets"
          :disable="filterLoading"
          @update:model-value="updatePreset"
          @add="addPreset"
          @remove="removePreset"
        />
        <q-separator inset />
      </template>
      <template v-if="as.signed">
        <q-expansion-item
          dense
          dense-toggle
          class="no-hover"
          v-model="expandMine"
          expand-icon="img:/images/icons/dropdown.svg"
        >
          <template #header>
            <q-item-label
              style="padding-left: 0"
              class="full-width q-py-none row items-center"
              header
              >{{ t('filter.onlyForMe') }}</q-item-label
            >
          </template>
          <q-item :disable="filterLoading" dense>
            <q-item-section>
              <q-checkbox
                dense
                :disable="filterLoading"
                size="xs"
                v-model="filter.mine"
                :label="t('filter.mine')"
                @update:model-value="mine"
              />
            </q-item-section>
          </q-item>
          <q-slide-transition>
            <div
              v-show="filter.mine"
              class="q-pl-lg row items-center q-gutter-xs"
            >
              <div class="tree"></div>
              <q-checkbox
                dense
                :disable="filterLoading"
                size="xs"
                class="text-caption"
                v-model="filter.offered"
                :label="t('filter.offered')"
                @update:model-value="updateDebounce()"
              />
            </div>
          </q-slide-transition>
          <q-item :disable="filterLoading" dense>
            <q-item-section>
              <q-checkbox
                dense
                :disable="filterLoading"
                size="xs"
                v-model="filter.offer"
                :label="t('filter.offer')"
                @update:model-value="updateDebounce()"
              />
            </q-item-section>
          </q-item>
          <q-item :disable="filterLoading" dense>
            <q-item-section>
              <q-checkbox
                dense
                :disable="filterLoading"
                size="xs"
                v-model="filter.onlyCurrency"
                :label="t('filter.onlyCurrency')"
                @update:model-value="updateDebounce()"
              />
            </q-item-section>
          </q-item>
          <q-item :disable="filterLoading" dense>
            <q-item-section>
              <q-checkbox
                dense
                :disable="filterLoading"
                v-model="filter.favorite"
                size="xs"
                :label="t('item.favorites')"
                @update:model-value="updateDebounce()"
              />
            </q-item-section>
          </q-item>
        </q-expansion-item>
        <q-separator inset />
      </template>
      <q-item-label header>{{ t('filter.status') }}</q-item-label>
      <q-item :disable="filterLoading">
        <q-item-section>
          <q-select
            v-model="filter.status"
            :disable="filterLoading"
            outlined
            dense
            no-error-icon
            hide-bottom-space
            emit-value
            map-options
            transition-show="none"
            transition-hide="none"
            :transition-duration="0"
            :options="itemStatus"
            dropdown-icon="img:/images/icons/dropdown.svg"
            popup-content-class="scroll bordered"
            @update:model-value="update()"
          />
        </q-item-section>
      </q-item>
      <q-separator inset />
      <q-item-label header>{{ t('item.power') }}</q-item-label>
      <q-item :disable="filterLoading">
        <q-item-section>
          <div class="row justify-center no-wrap q-col-gutter-sm items-center">
            <D4Counter
              :disable="filterLoading"
              v-model="filter.power[0]"
              :label="t('min')"
              :max="9999"
              allow-zero
              no-button
              @update:model-value="update()"
              :debounce="1000"
              max-width="100%"
            />
            <div>-</div>
            <D4Counter
              :disable="filterLoading"
              v-model="filter.power[1]"
              :label="t('max')"
              :max="9999"
              allow-zero
              no-button
              @update:model-value="update()"
              :debounce="1000"
              max-width="100%"
            />
          </div>
        </q-item-section>
      </q-item>
      <q-separator inset />
      <q-item-label header>{{ t('item.level') }}</q-item-label>
      <q-item :disable="filterLoading">
        <q-item-section>
          <div class="row justify-center no-wrap q-col-gutter-sm items-center">
            <D4Counter
              :disable="filterLoading"
              v-model="filter.level[0]"
              :label="t('min')"
              :max="999"
              allow-zero
              no-button
              @update:model-value="update()"
              :debounce="1000"
              max-width="100%"
            />
            <div>-</div>
            <D4Counter
              :disable="filterLoading"
              v-model="filter.level[1]"
              :label="t('max')"
              :max="999"
              allow-zero
              no-button
              @update:model-value="update()"
              :debounce="1000"
              max-width="100%"
            />
          </div>
        </q-item-section>
      </q-item>
      <q-separator inset />
      <q-item-label header>{{ t('item.quality') }}</q-item-label>
      <q-item :disable="filterLoading">
        <q-item-section>
          <q-option-group
            dense
            :disable="filterLoading"
            size="xs"
            inline
            :options="
              filterQuality().map((fq) => ({ ...fq, label: fq.fullName }))
            "
            type="checkbox"
            v-model="filter.quality"
            @update:model-value="updateDebounce()"
          />
        </q-item-section>
      </q-item>
      <q-separator inset />
      <q-item-label header>{{ t('item.selectType') }}</q-item-label>
      <q-item :disable="filterLoading">
        <q-item-section>
          <q-option-group
            dense
            :disable="filterLoading"
            size="xs"
            inline
            :options="filterTypes()"
            type="checkbox"
            v-model="filter.itemTypes"
            @update:model-value="(val) => update(val)"
          />
        </q-item-section>
      </q-item>
      <q-item
        :disable="filterLoading"
        v-for="itemType in filter.itemTypes"
        :key="itemType"
      >
        <q-item-section>
          <q-select
            :ref="(selectEl:QSelect) => (typeValue2Ref[itemType] = selectEl)"
            :disable="filterLoading"
            v-model="filter.itemTypeValues1[itemType]"
            :options="
              findType(itemType)?.value === 'rune'
                ? filterRunes(undefined, typeValue2Needle[itemType])
                : findType(itemType)?.value === 'aspect'
                ? filterAspectByCategory(undefined, typeValue2Needle[itemType])
                : filterClasses(itemType, typeValue2Needle[itemType])
            "
            :label="`${findType(itemType)?.label} ${t('filter.type')}`"
            outlined
            dense
            no-error-icon
            use-input
            hide-bottom-space
            emit-value
            map-options
            multiple
            transition-show="none"
            transition-hide="none"
            :transition-duration="0"
            dropdown-icon="img:/images/icons/dropdown.svg"
            popup-content-class="scroll bordered"
            @update:model-value="updateDebounce()"
            @input.stop="(e) => filterTypeValue(e, itemType)"
            @blur="() => delete typeValue2Needle[itemType]"
          >
          </q-select>
        </q-item-section>
      </q-item>
      <q-separator inset />
      <q-item :disable="filterLoading">
        <div
          class="row justify-between items-center q-gutter-x-sm full-width no-wrap"
        >
          <q-btn
            unelevated
            outline
            color="grey-6"
            aria-label="Tradurs Refresh Button"
            size="md"
            :ripple="false"
            class="no-hover break-keep q-ml-none"
            :disable="filterLoading"
            :label="t('btn.resetFilter')"
            @click="clearFilter"
          />
          <q-btn
            unelevated
            color="primary"
            aria-label="Tradurs Search Attribute Button"
            size="md"
            :ripple="false"
            class="no-hover break-keep"
            :disable="filterLoading"
            :label="t('btn.attributeFilter')"
            @click="() => (attributeShow = true)"
          >
            <q-badge v-show="attrCount > 0" color="red-8" floating>
              {{ attrCount }}
            </q-badge>
          </q-btn>
        </div>
      </q-item>
    </q-list>
    <D4Dialog
      v-model="attributeShow"
      :maximized="$q.screen.lt.md"
      @before-show="beforeShowAttribute"
    >
      <template #top>
        <q-item-label header class="row justify-between items-center">
          <div class="row items-center q-gutter-sm">
            <div class="text-h6 text-primary">
              {{ t('filter.advanced') }}
            </div>
            <q-icon class="icon" name="img:/images/icons/help.svg" size="19px">
              <D4Tooltip self="bottom left">
                <div style="max-width: 240px">
                  <div class="text-subtitle2 text-weight-bold">
                    {{ t('filter.description.advanced') }}
                  </div>
                  <div class="text-center full-width">
                    <img
                      class="q-py-lg"
                      :src="locale === 'ko' ? NotifyKo : NotifyEn"
                      width="200"
                    />
                  </div>
                  <ul
                    class="text-caption text-weight-bold q-px-sm q-gutter-y-sm"
                  >
                    <li>{{ t('filter.description.advanced2') }}</li>
                    <li>{{ t('filter.affixDescription') }}</li>
                  </ul>
                </div>
              </D4Tooltip>
            </q-icon>
          </div>
          <div>
            <q-rating
              v-model="filter.greaterCount"
              :disable="filterLoading"
              size="18px"
              max="4"
              icon="img:/images/attribute_types/greater_invert.svg"
            />
          </div>
        </q-item-label>
      </template>
      <template #middle>
        <q-list :class="{ col: $q.screen.lt.md }">
          <D4Attribute
            :data="properties"
            :options="propertyOptions()"
            :disable="filterLoading"
            :search-message="`${t('properties')} ${t('searchOrSelect')}`"
            :no-message="t('noMessage', { attr: t('properties') })"
            @update="updateProperties"
          />
          <D4Attribute
            :data="affixes"
            :options="affixOptions()"
            :disable="filterLoading"
            :search-message="`${t('affixes')} ${t('searchOrSelect')}`"
            :no-message="t('noMessage', { attr: t('affixes') })"
            greatable
            @update="updateAffixes"
          />
          <D4Attribute
            :data="restrictions"
            :options="restrictionOptions()"
            :disable="filterLoading"
            :search-message="`${t('restrictions')} ${t('searchOrSelect')}`"
            :no-message="t('noMessage', { attr: t('restrictions') })"
            no-icon
            @update="updateRestrictions"
          />
        </q-list>
      </template>
      <template #bottom>
        <q-card-section>
          <div class="row justify-between items-center q-py-xs">
            <div class="row items-center">
              <D4Analysis
                v-if="as.signed"
                ref="analysis"
                :loading="loading"
                :disable="filterLoading"
                attr-only
                @start="startAnalyze"
                @end="endAnalyze"
                @failed="failedAnalyze"
              />
            </div>
            <div class="row items-center q-gutter-x-sm">
              <D4Btn
                :label="t('btn.close')"
                :disable="filterLoading"
                color="rgb(150,150,150)"
                @click="closeAttribute"
              />
              <D4Btn
                :label="t('btn.apply')"
                :disable="filterLoading"
                @click="applyAttribute"
              />
            </div>
          </div>
        </q-card-section>
      </template>
    </D4Dialog>
  </div>
</template>

<style scoped>
.disable {
  user-select: none;
  cursor: not-allowed !important;
  opacity: 0.6;
}

.disable:deep(*) {
  pointer-events: none;
  cursor: not-allowed !important;
}

.filter:deep(.q-list--dense > .q-item),
.filter:deep(.q-item--dense) {
  padding: 2px 16px !important;
}

.filter:deep(> .q-item__label--header) {
  color: var(--q-primary);
  padding: 6px 16px;
  padding-bottom: 8px;
}

.tree {
  width: 10px;
  height: 10px;
  border-bottom: 1px solid currentColor;
  border-left: 1px solid currentColor;
  transform: translate(50%, -50%);
}

.filter:deep(> .q-separator--horizontal-inset) {
  margin-top: 8px;
  margin-bottom: 8px;
}

.q-option-group.q-gutter-x-sm:deep(> *) {
  margin-right: 8px;
}

.attr {
  margin-top: -10px;
  margin-bottom: 10px;
  background-color: var(--q-half);
  border-radius: 0 0 4px 4px;
  max-height: 18vh;
}

.attr:deep(.q-item) {
  margin: 0;
}

.attr:deep(.q-item .q-item__section:first-child) {
  width: 20px;
  padding-right: 8px;
  flex-direction: row;
  align-items: center;
}

.attr:deep(.q-item .q-item__section:last-child) {
  padding-left: 0;
}

.attr:deep(.q-item .q-item__section .q-item__label) {
  line-height: 1.4 !important;
  padding: 4px 0;
}

.outline {
  box-shadow: inset 0 0 0 1px rgba(150, 150, 150, 0.4);
  border-radius: 4px;
  padding: 2px;
}
</style>
