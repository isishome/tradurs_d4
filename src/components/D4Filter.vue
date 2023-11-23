<script setup lang="ts">
import { computed, ref } from 'vue'
import { QSelect, debounce } from 'quasar'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore } from 'src/stores/item-store'
import { useI18n } from 'vue-i18n'
import NotifyEn from '/images/filter/notify_en.webp'
import NotifyKo from '/images/filter/notify_ko.webp'

import D4Preset from 'components/D4Preset.vue'

interface IProps {
  disable?: boolean
}
withDefaults(defineProps<IProps>(), {
  disable: false
})

const as = useAccountStore()
const is = useItemStore()
const { t, locale } = useI18n({ useScope: 'global' })

const preset = ref<number | null>(null)
const presets = is.storage.data.presets
const filterQuality = is.filterQuality
const filterTypes = is.filterTypes
const findType = is.findType
const filterClasses = is.filterClasses
const filterRunes = is.filterRunesByType
const filterLoading = computed(() => is.filter.loading)
const findProperty = computed(() => is.findProperty)
const findAffix = computed(() => is.findAffix)
const findRestriction = computed(() => is.findRestriction)

const itemStatus = computed(() => [{ value: 'all', label: t('filter.all') }, ...is.itemStatus])

// about property
const propertyRef = ref<QSelect | null>(null)
const propertyOptions = is.filterProperties
const propertyNeedle = ref<string>()

const filterProperties = (val: string): void => {
  propertyRef.value?.showPopup()
  propertyNeedle.value = val.toLowerCase()
}

const selectedProperty = (val: number): void => {
  if (val) {
    propertyRef.value?.hidePopup()
    update()
  }
}

const removeProperty = (val: number): void => {
  const findIndex = is.filter.properties.findIndex(p => p === val)
  if (findIndex !== -1) {
    is.filter.properties.splice(findIndex, 1)
    update()
  }
}

// about affix
const affixRef = ref<QSelect | null>(null)
const affixOptions = is.filterAffixes
const affixNeedle = ref<string>()

const filterAffixes = (val: string): void => {
  affixRef.value?.showPopup()
  affixNeedle.value = val.toLowerCase()
}

const selectedAffix = (val: number): void => {
  if (val) {
    affixRef.value?.hidePopup()
    update()
  }
}

const removeAffix = (val: number): void => {
  const findIndex = is.filter.affixes.findIndex(a => a === val)
  if (findIndex !== -1) {
    is.filter.affixes.splice(findIndex, 1)
    update()
  }
}

// about restrictions
const restrictionRef = ref<QSelect | null>(null)
const restrictionOptions = is.filterRestrictions
const restrictionNeedle = ref<string>()

const filterRestrictions = (val: string): void => {
  restrictionRef.value?.showPopup()
  restrictionNeedle.value = val.toLowerCase()
}

const selectedRestriction = (val: number): void => {
  if (val) {
    restrictionRef.value?.hidePopup()
    update()
  }
}

const removeRestriction = (val: number): void => {
  const findIndex = is.filter.restrictions.findIndex(r => r === val)
  if (findIndex !== -1) {
    is.filter.restrictions.splice(findIndex, 1)
    update()
  }
}

const mine = () => {
  if (!is.filter.mine)
    is.filter.offered = false

  updateDebounce()
}

const clearFilter = () => {
  preset.value = null
  is.clearFilter(true)
  is.filter.request--
}

const update = (quality?: Array<string>) => {
  if (quality) {
    Object.keys(is.filter.itemTypeValues1).forEach((q: string) => {
      if (!quality.includes(q))
        delete is.filter.itemTypeValues1[q]
    })
  }

  is.filter.request++
}

const updateDebounce = debounce((quality?: Array<string>) => {
  update(quality)
}, 800)

const updateBasic = () => {
  if (as.signed) {
    is.setStorage()
      .then(() => {
        is.filter.request++
      })
  }
  else
    is.filter.request++
}

const updateBasicDebounce = debounce(() => {
  updateBasic()
}, 400)

const updatePreset = (id: number) => {
  const findPreset = is.findPreset(id)

  if (findPreset) {
    Object.assign(is.filter, findPreset.filter)
    update()
  }
}

const addPreset = ({ name, done, error }: { name: string, done: Function, error: Function }) => {
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

const removePreset = ({ id, done, error }: { id: number, done: Function, error: Function }) => {
  is.removePreset(id)
    .then(() => {
      if (id === preset.value)
        preset.value = null
    })
    .catch(() => {
      error()
    })
    .then(() => {
      done()
    })
}
</script>

<template>
  <q-list dense class="filter" :class="{ 'disable': disable || filterLoading }">
    <q-item-label header>
      <div class="row items-center q-gutter-sm">
        <div>
          {{ t('filter.basic') }}
        </div>
        <q-icon v-if="as.signed" class="icon" name="img:/images/icons/help.svg" size="19px">
          <D4Tooltip>
            <div style="max-width:200px" class="text-caption break-keep">
              {{ t('filter.basicDescription') }}
            </div>
          </D4Tooltip>
        </q-icon>
        <q-separator class="col" />
      </div>
    </q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section>
        <q-checkbox dense :disable="filterLoading" size="xs" v-model="is.storage.data.hardcore"
          :label="t('item.hardcore')" @update:model-value="updateBasicDebounce()" />
      </q-item-section>
    </q-item>
    <q-item :disable="filterLoading">
      <q-item-section>
        <q-checkbox dense :disable="filterLoading" size="xs" v-model="is.storage.data.ladder" :label="t('item.ladder')"
          @update:model-value="updateBasicDebounce()" />
      </q-item-section>
    </q-item>
    <q-separator inset />
    <template v-if="as.signed">
      <D4Preset v-model="preset" :options="presets" :disable="filterLoading" @update:model-value="updatePreset"
        @add="addPreset" @remove="removePreset" />
      <q-separator inset />
    </template>
    <template v-if="as.signed">
      <q-item-label header>{{ t('filter.onlyForMe') }}</q-item-label>
      <q-item :disable="filterLoading">
        <q-item-section>
          <q-checkbox dense :disable="filterLoading" size="xs" v-model="is.filter.mine" :label="t('filter.mine')"
            @update:model-value="mine" />
        </q-item-section>
      </q-item>
      <q-slide-transition>
        <div v-show="is.filter.mine" class="q-pl-lg row items-center q-gutter-xs">
          <div class="tree"></div>
          <q-checkbox dense :disable="filterLoading" size="xs" class="text-caption" v-model="is.filter.offered"
            :label="t('filter.offered')" @update:model-value="updateDebounce()" />
        </div>
      </q-slide-transition>
      <q-item :disable="filterLoading">
        <q-item-section>
          <q-checkbox dense :disable="filterLoading" size="xs" v-model="is.filter.offer" :label="t('filter.offer')"
            @update:model-value="updateDebounce()" />
        </q-item-section>
      </q-item>
      <q-item :disable="filterLoading">
        <q-item-section>
          <q-checkbox dense :disable="filterLoading" size="xs" v-model="is.filter.onlyCurrency"
            :label="t('filter.onlyCurrency')" @update:model-value="updateDebounce()" />
        </q-item-section>
      </q-item>
      <q-item :disable="filterLoading">
        <q-item-section>
          <q-checkbox dense :disable="filterLoading" v-model="is.filter.favorite" size="xs" :label="t('item.favorites')"
            @update:model-value="updateDebounce()" />
        </q-item-section>
      </q-item>
      <q-separator inset />
    </template>
    <q-item-label header>{{ t('filter.status') }}</q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section>
        <q-select v-model="is.filter.status" :disable="filterLoading" outlined dense no-error-icon hide-bottom-space
          emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
          :options="itemStatus" dropdown-icon="img:/images/icons/dropdown.svg" popup-content-class="scroll bordered"
          @update:model-value="update()" />
      </q-item-section>
    </q-item>
    <q-item-label header>{{ t('item.power') }}</q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section>
        <div class="row justify-center no-wrap q-col-gutter-sm items-center">
          <D4Counter :disable="filterLoading" v-model="is.filter.power[0]" :label="t('min')" :max="9999" allow-zero
            no-button @update:model-value="update()" :debounce="1000" max-width="100%" />
          <div>-</div>
          <D4Counter :disable="filterLoading" v-model="is.filter.power[1]" :label="t('max')" :max="9999" allow-zero
            no-button @update:model-value="update()" :debounce="1000" max-width="100%" />
        </div>
      </q-item-section>
    </q-item>
    <q-item-label header>{{ t('item.level') }}</q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section>
        <div class="row justify-center no-wrap q-col-gutter-sm items-center">
          <D4Counter :disable="filterLoading" v-model="is.filter.level[0]" :label="t('min')" :max="999" allow-zero
            no-button @update:model-value="update()" :debounce="1000" max-width="100%" />
          <div>-</div>
          <D4Counter :disable="filterLoading" v-model="is.filter.level[1]" :label="t('max')" :max="999" allow-zero
            no-button @update:model-value="update()" :debounce="1000" max-width="100%" />
        </div>
      </q-item-section>
    </q-item>
    <q-item-label header>{{ t('item.quality') }}</q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section>
        <q-option-group dense :disable="filterLoading" size="xs" inline
          :options="filterQuality().map(fq => ({ ...fq, label: fq.fullName }))" type="checkbox"
          v-model="is.filter.quality" @update:model-value="updateDebounce()" />
      </q-item-section>
    </q-item>
    <q-item-label header>{{ t('item.selectType') }}</q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section>
        <q-option-group dense :disable="filterLoading" size="xs" inline :options="filterTypes()" type="checkbox"
          v-model="is.filter.itemTypes" @update:model-value="val => update(val)" />
      </q-item-section>
    </q-item>
    <q-item :disable="filterLoading" v-for="itemType in is.filter.itemTypes.filter(it => it !== 'aspect')"
      :key="itemType">
      <q-item-section>
        <q-select :disable="filterLoading" v-model="is.filter.itemTypeValues1[itemType]"
          :options="findType(itemType)?.value === 'rune' ? filterRunes() : filterClasses(itemType)"
          :label="`${findType(itemType)?.label} ${t('filter.type')}`" outlined dense no-error-icon hide-bottom-space
          emit-value map-options multiple transition-show="none" transition-hide="none" :transition-duration="0"
          dropdown-icon="img:/images/icons/dropdown.svg" popup-content-class="scroll bordered"
          @update:model-value="updateDebounce()">
        </q-select>
      </q-item-section>
    </q-item>
    <q-item-label header class="row items-center q-gutter-sm">
      <div>
        {{ t('filter.advanced') }}
      </div>
      <q-icon class="icon" name="img:/images/icons/help.svg" size="19px">
        <D4Tooltip self="bottom left">
          <div style="max-width:240px">
            <div class="text-subtitle2 text-weight-bold">{{ t('filter.description.advanced') }} </div>
            <div class="text-center full-width">
              <img class="q-py-lg" :src="locale === 'ko' ? NotifyKo : NotifyEn" width="200" />
            </div>
            <ul class="text-caption text-weight-bold q-px-sm q-gutter-y-sm">
              <li>{{ t('filter.description.advanced2') }}</li>
              <li>{{ t('filter.affixDescription') }}</li>
            </ul>
          </div>
        </D4Tooltip>
      </q-icon>
    </q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section class="no-wrap">
        <q-select ref="propertyRef" v-model="is.filter.properties" :disable="filterLoading" max-values="3" outlined dense
          no-error-icon use-input hide-bottom-space hide-selected emit-value map-options multiple transition-show="none"
          transition-hide="none" :transition-duration="0" :label="`${t('properties')} ${t('searchOrSelect')}`"
          :options="propertyOptions(propertyNeedle)" dropdown-icon="img:/images/icons/dropdown.svg"
          popup-content-class="scroll bordered limit-select" @update:model-value="selectedProperty"
          @input-value="filterProperties">
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section side>
                <q-icon class="icon" :class="{ 'rotate-45': ['standard'].includes(scope.opt.type as string) }" size="14px"
                  :name="`img:/images/attribute_types/${scope.opt.type || 'standard'}.svg`" />
              </q-item-section>
              <q-item-section>
                <q-item-label lines="3">{{ scope.opt.label }}</q-item-label>
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
    <q-item :disable="filterLoading" class="q-mx-md q-mb-xs" v-for="pid in is.filter.properties" :key="`${pid}`">
      <q-item-section>
        <q-item-label caption>
          {{ findProperty(pid as number)?.label }}
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-btn :disable="filterLoading" dense unelevated flat round aria-label="Tradurs Close Button" size="xs"
          :tabindex="-1" class="q-ml-sm" @click="removeProperty(pid)">
          <img class="icon" width="13" height="13" src="/images/icons/close.svg" alt="Tradurs Close Icon" />
        </q-btn>
      </q-item-section>
    </q-item>
    <q-item :disable="filterLoading">
      <q-item-section class="no-wrap">
        <q-select ref="affixRef" v-model="is.filter.affixes" class="col" :disable="filterLoading" max-values="4" outlined
          dense no-error-icon use-input hide-bottom-space hide-selected emit-value map-options multiple
          transition-show="none" transition-hide="none" :transition-duration="0"
          :label="`${t('affixes')} ${t('searchOrSelect')}`" :options="affixOptions(affixNeedle)"
          dropdown-icon="img:/images/icons/dropdown.svg" popup-content-class="scroll bordered limit-select"
          @update:model-value="selectedAffix" @input-value="filterAffixes">
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section side>
                <q-icon class="icon" :class="{ 'rotate-45': ['standard'].includes(scope.opt.type as string) }" size="14px"
                  :name="`img:/images/attribute_types/${scope.opt.type || 'standard'}.svg`" />
              </q-item-section>
              <q-item-section>
                <q-item-label :class="scope.opt.color">{{ scope.opt.label }}</q-item-label>
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
    <q-item :disable="filterLoading" class="q-mx-md q-mb-xs" v-for="aid in is.filter.affixes" :key="`${aid}`">
      <q-item-section>
        <q-item-label caption>
          {{ findAffix(aid as number)?.label }}
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-btn :disable="filterLoading" dense unelevated flat round aria-label="Tradurs Close Button" size="xs"
          :tabindex="-1" class="q-ml-sm" @click="removeAffix(aid)">
          <img class="icon" width="13" height="13" src="/images/icons/close.svg" alt="Tradurs Close Icon" />
        </q-btn>
      </q-item-section>
    </q-item>
    <q-item :disable="filterLoading">
      <q-item-section class="no-wrap">
        <q-select ref="restrictionRef" v-model="is.filter.restrictions" :disable="filterLoading" max-values="3" outlined
          dense no-error-icon use-input hide-bottom-space hide-selected emit-value map-options multiple
          transition-show="none" transition-hide="none" :transition-duration="0"
          :label="`${t('restrictions')} ${t('searchOrSelect')}`" :options="restrictionOptions(restrictionNeedle)"
          dropdown-icon="img:/images/icons/dropdown.svg" popup-content-class="scroll bordered limit-select"
          @update:model-value="selectedRestriction" @input-value="filterRestrictions">
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
    <q-item :disable="filterLoading" class="q-mx-md q-mb-xs" v-for="rid  in  is.filter.restrictions" :key="`${rid}`">
      <q-item-section>
        <q-item-label caption>
          {{ findRestriction(rid as number)?.label }}
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-btn :disable="filterLoading" dense unelevated flat round aria-label="Tradurs Close Button" size="xs"
          :tabindex="-1" class="q-ml-sm" @click="removeRestriction(rid)">
          <img class="icon" width="13" height="13" src="/images/icons/close.svg" alt="Tradurs Close Icon" />
        </q-btn>
      </q-item-section>
    </q-item>
    <q-separator inset />
    <q-item :disable="filterLoading">
      <q-item-section>
        <q-btn outline aria-label="Tradurs Refresh Button" size="md" :ripple="false" class="no-hover"
          :disable="filterLoading" @click="clearFilter">
          <div class="row items-center q-gutter-xs">
            <div>{{ t('btn.resetSearch') }}</div>
            <q-icon class="icon" name="img:/images/icons/restore.svg" size="xs" />
          </div>
        </q-btn>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<style scoped>
.disable {
  user-select: none;
  cursor: not-allowed !important;
  opacity: .6;
}

.disable:deep(*) {
  pointer-events: none;
  cursor: not-allowed !important;
}

.filter:deep(.q-item__label--header) {
  color: var(--q-primary);
  padding: 14px;
  padding-bottom: 8px;
}

.tree {
  width: 10px;
  height: 10px;
  border-bottom: 1px solid currentColor;
  border-left: 1px solid currentColor;
  transform: translate(50%, -50%);
}

.q-separator--horizontal-inset {
  margin-top: 8px;
  margin-bottom: 0;
}

.q-option-group.q-gutter-x-sm:deep(>*) {
  margin-right: 8px;
}
</style>