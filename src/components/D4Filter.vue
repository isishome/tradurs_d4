<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick } from 'vue'
import { QList, QSelect, debounce, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { Item } from 'src/types/item'
import { useAccountStore } from 'src/stores/account-store'
import { type IFilter, useItemStore, Rune } from 'src/stores/item-store'
import NotifyEn from '/images/filter/notify_en.webp'
import NotifyKo from '/images/filter/notify_ko.webp'

import D4Preset from 'components/D4Preset.vue'
import D4Analysis from 'components/D4Analysis.vue'

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
const snapshotFilter = reactive<IFilter>({} as IFilter)
const filter = reactive<IFilter>({} as IFilter)
const filterQuality = is.filterQuality
const filterTypes = is.filterTypes
const findType = is.findType
const filterClasses = is.filterClasses
const filterRunes = is.filterRunesByType
const filterLoading = computed(() => props.disable || is.filter.loading)
const findProperty = computed(() => is.findProperty)
const findAffix = computed(() => is.findAffix)
const findRestriction = computed(() => is.findRestriction)
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
    (is.filter.properties?.length ?? 0) +
    (is.filter.affixes?.length ?? 0) +
    (is.filter.restrictions.length ?? 0)
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

const moveScrollTarget = (listNode: QList | null) => {
  nextTick(() => {
    listNode?.$el?.querySelector('div.q-item:last-child').scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    })
  })
}

// about property
const propertyListRef = ref<QList | null>(null)
const propertyRef = ref<QSelect | null>(null)
const propertyOptions = is.filterProperties
const propertyNeedle = ref<string>()

const filterProperties = (e: KeyboardEvent) => {
  const val = (e.target as HTMLInputElement).value.toLowerCase()
  propertyRef.value?.showPopup()
  propertyRef.value?.updateInputValue(val)
  propertyNeedle.value = val
}

const selectedProperty = (val: number): void => {
  if (val) {
    propertyRef.value?.hidePopup()
    propertyNeedle.value = undefined
    moveScrollTarget(propertyListRef.value)
  }
}

const removeProperty = (val: number): void => {
  const findIndex = filter.properties.findIndex((p) => p === val)
  if (findIndex !== -1) {
    filter.properties.splice(findIndex, 1)
    moveScrollTarget(propertyListRef.value)
  }
}

// about affix
const affixListRef = ref<QList | null>(null)
const affixes = ref<Array<number | string | undefined>>([])
const affixRef = ref<QSelect | null>(null)
const affixOptions = is.filterAffixes
const affixNeedle = ref<string>()

const addRemoveAffix = () => {
  filter.affixes = [
    ...is.affixes.data
      .filter((a) => affixes.value.includes(a.value as number))
      .map((a) => ({
        affixId: a.value as number,
        affixGreater:
          filter.affixes.find((aa) => aa.affixId === a.value)?.affixGreater ?? 0
      })),
    ...is.runes
      .filter((r) => affixes.value.includes(r.value as string))
      .map((r) => ({
        runeId: r.value as string,
        affixGreater: 0
      }))
  ]
}

const filterAffixes = (e: KeyboardEvent) => {
  const val = (e.target as HTMLInputElement).value.toLowerCase()
  affixRef.value?.showPopup()
  affixRef.value?.updateInputValue(val)
  affixNeedle.value = val
}

const selectedAffix = (val: number): void => {
  if (val) {
    affixRef.value?.hidePopup()
    addRemoveAffix()
    affixNeedle.value = undefined
    moveScrollTarget(affixListRef.value)
  }
}

const removeAffix = (val?: number | string): void => {
  const findIndex = affixes.value.findIndex((a) => a === val)
  if (findIndex !== -1) {
    affixes.value.splice(findIndex, 1)
    addRemoveAffix()
    moveScrollTarget(affixListRef.value)
  }
}

// about restrictions
const restrictionListRef = ref<QList | null>(null)
const restrictionRef = ref<QSelect | null>(null)
const restrictionOptions = is.filterRestrictions
const restrictionNeedle = ref<string>()

const filterRestrictions = (e: KeyboardEvent) => {
  const val = (e.target as HTMLInputElement).value.toLowerCase()
  restrictionRef.value?.showPopup()
  restrictionRef.value?.updateInputValue(val)
  restrictionNeedle.value = val
}

const selectedRestriction = (val: number): void => {
  if (val) {
    restrictionRef.value?.hidePopup()
    restrictionNeedle.value = undefined
    moveScrollTarget(restrictionListRef.value)
  }
}

const removeRestriction = (val: number): void => {
  const findIndex = filter.restrictions.findIndex((r) => r === val)
  if (findIndex !== -1) {
    filter.restrictions.splice(findIndex, 1)
    moveScrollTarget(restrictionListRef.value)
  }
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
  affixes.value = []
  filter.request--
  update()
}

const update = (quality?: Array<string>) => {
  if (quality) {
    Object.keys(filter.itemTypeValues1).forEach((q: string) => {
      if (!quality.includes(q)) delete filter.itemTypeValues1[q]
    })
  }

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
  Object.assign(snapshotFilter, is.filter)
}
const closeAttribute = () => {
  attributeShow.value = false
  Object.assign(filter, snapshotFilter)
}
const applyAttribute = () => {
  attributeShow.value = false
  update()
}

const startAnalyze = () => {
  loading.value = true
}

const endAnalyze = (item: Item) => {
  loading.value = false
  filter.properties = item.properties.map((p) => p.propertyId)
  affixes.value = item.affixes.map((a) => a.affixId ?? a.runeId)
  addRemoveAffix()
  filter.restrictions = item.restrictions.map((r) => r.restrictId)
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
        v-for="itemType in filter.itemTypes.filter((it) => it !== 'aspect')"
        :key="itemType"
      >
        <q-item-section>
          <q-select
            :disable="filterLoading"
            v-model="filter.itemTypeValues1[itemType]"
            :options="
              findType(itemType)?.value === 'rune'
                ? filterRunes()
                : filterClasses(itemType)
            "
            :label="`${findType(itemType)?.label} ${t('filter.type')}`"
            outlined
            dense
            no-error-icon
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
          <q-item :disable="filterLoading">
            <q-item-section class="no-wrap">
              <q-select
                ref="propertyRef"
                v-model="filter.properties"
                :disable="filterLoading"
                max-values="10"
                outlined
                dense
                no-error-icon
                use-input
                hide-bottom-space
                hide-selected
                emit-value
                map-options
                multiple
                transition-show="none"
                transition-hide="none"
                :transition-duration="0"
                :label="`${t('properties')} ${t('searchOrSelect')}`"
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
                        size="8px"
                        :name="`img:/images/attribute_types/${
                          scope.opt.type || 'standard'
                        }.svg`"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label lines="3">{{
                        scope.opt.label
                      }}</q-item-label>
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
            </q-item-section>
          </q-item>
          <q-list
            ref="propertyListRef"
            dense
            class="attr q-mx-md scroll"
            v-if="filter.properties.length > 0"
          >
            <template v-for="(pid, idx) in filter.properties" :key="`${pid}`">
              <q-separator v-show="idx !== 0" inset />
              <q-item :disable="filterLoading" class="q-mx-md q-mb-xs">
                <q-item-section side>
                  <q-icon
                    class="icon rotate-45"
                    size="8px"
                    name="img:/images/attribute_types/standard.svg"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>
                    {{ findProperty(pid as number)?.label }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    :disable="filterLoading"
                    dense
                    unelevated
                    flat
                    round
                    aria-label="Tradurs Close Button"
                    size="xs"
                    :tabindex="-1"
                    class="q-ml-sm"
                    @click="removeProperty(pid)"
                  >
                    <img
                      class="icon"
                      width="13"
                      height="13"
                      src="/images/icons/close.svg"
                      alt="Tradurs Close Icon"
                    />
                  </q-btn>
                </q-item-section>
              </q-item>
            </template>
          </q-list>
          <q-item :disable="filterLoading">
            <q-item-section class="no-wrap">
              <q-select
                ref="affixRef"
                v-model="affixes"
                class="col"
                :disable="filterLoading"
                max-values="10"
                outlined
                dense
                no-error-icon
                use-input
                hide-bottom-space
                hide-selected
                emit-value
                map-options
                multiple
                transition-show="none"
                transition-hide="none"
                :transition-duration="0"
                :label="`${t('affixes')} ${t('searchOrSelect')}`"
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
                      <q-img
                        v-if="scope.opt.effect"
                        :src="`/images/items/rune/${scope.opt.type}/${scope.opt.value}.webp`"
                        width="16px"
                      />
                      <q-icon
                        v-else
                        class="icon"
                        :class="{ 'rotate-45': ['standard'].includes(scope.opt.type as string) }"
                        size="8px"
                        :name="`img:/images/attribute_types/${
                          scope.opt.type || 'standard'
                        }.svg`"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label :class="scope.opt.color">{{
                        scope.opt.effect ?? scope.opt.label
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
            </q-item-section>
          </q-item>
          <q-list
            ref="affixListRef"
            dense
            class="attr q-mx-md scroll"
            v-if="filter.affixes.length > 0"
          >
            <template
              v-for="(affix, idx) in filter.affixes"
              :key="`${affix.affixId}`"
            >
              <q-separator v-show="idx !== 0" inset />
              <q-item :disable="filterLoading" class="q-mx-sm q-my-xs">
                <q-item-section side>
                  <q-img
                    v-if="!!affix.runeId"
                    :src="`/images/items/rune/${
                      is.findRune(affix.runeId)?.type
                    }/${affix.runeId}.webp`"
                    width="16px"
                  />
                  <template v-else>
                    <q-rating
                      v-if="findAffix(affix.affixId)?.type === 'standard'"
                      v-model="affix.affixGreater"
                      :disable="filterLoading"
                      class="outline"
                      size="12px"
                      max="1"
                      icon="img:/images/attribute_types/greater_invert.svg"
                    />
                    <q-icon
                      v-else
                      class="icon"
                      size="8px"
                      :name="`img:/images/attribute_types/${
                        is.findAffix(affix.affixId)?.type || 'standard'
                      }.svg`"
                    />
                  </template>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>
                    {{
                      !!affix.runeId
                        ? (findAffix(affix.runeId) as Rune)?.effect
                        : findAffix(affix.affixId)?.label
                    }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    :disable="filterLoading"
                    dense
                    unelevated
                    flat
                    round
                    aria-label="Tradurs Close Button"
                    size="xs"
                    :tabindex="-1"
                    class="q-ml-sm"
                    @click="removeAffix(affix.affixId ?? affix.runeId)"
                  >
                    <img
                      class="icon"
                      width="13"
                      height="13"
                      src="/images/icons/close.svg"
                      alt="Tradurs Close Icon"
                    />
                  </q-btn>
                </q-item-section>
              </q-item>
            </template>
          </q-list>
          <q-item :disable="filterLoading">
            <q-item-section class="no-wrap">
              <q-select
                ref="restrictionRef"
                v-model="filter.restrictions"
                :disable="filterLoading"
                max-values="10"
                outlined
                dense
                no-error-icon
                use-input
                hide-bottom-space
                hide-selected
                emit-value
                map-options
                multiple
                transition-show="none"
                transition-hide="none"
                :transition-duration="0"
                :label="`${t('restrictions')} ${t('searchOrSelect')}`"
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
            </q-item-section>
          </q-item>
          <q-list
            ref="restrictionListRef"
            dense
            class="attr q-mx-md scroll"
            v-if="filter.restrictions.length > 0"
          >
            <template v-for="(rid, idx) in filter.restrictions" :key="`${rid}`">
              <q-separator v-show="idx !== 0" inset />
              <q-item :disable="filterLoading" class="q-mx-md q-mb-xs">
                <q-item-section side></q-item-section>
                <q-item-section>
                  <q-item-label caption>
                    {{ findRestriction(rid as number)?.label }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    :disable="filterLoading"
                    dense
                    unelevated
                    flat
                    round
                    aria-label="Tradurs Close Button"
                    size="xs"
                    :tabindex="-1"
                    class="q-ml-sm"
                    @click="removeRestriction(rid)"
                  >
                    <img
                      class="icon"
                      width="13"
                      height="13"
                      src="/images/icons/close.svg"
                      alt="Tradurs Close Icon"
                    />
                  </q-btn>
                </q-item-section>
              </q-item>
            </template>
          </q-list>
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

.attr-place {
  max-height: 50vh;
}

.outline {
  box-shadow: inset 0 0 0 1px rgba(150, 150, 150, 0.4);
  border-radius: 4px;
  padding: 2px;
}
</style>
