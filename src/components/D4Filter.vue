<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuasar, QSelect } from 'quasar'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore } from 'src/stores/item-store'
import { useI18n } from 'vue-i18n'
import { icons } from 'src/common/icons'

interface IProps {
  disable?: boolean
}
withDefaults(defineProps<IProps>(), {
  disable: false
})

const $q = useQuasar()
const as = useAccountStore()
const is = useItemStore()
const { t } = useI18n({ useScope: 'global' })

const filterQuality = is.filterQuality
const filterTypes = is.filterTypes
const findType = is.findType
const filterClasses = is.filterClasses
const filterRunes = is.filterRunesByType
const filterLoading = computed(() => is.filter.loading)
const findProperty = computed(() => is.findProperty)
const findAffix = computed(() => is.findAffix)
const findRestriction = computed(() => is.findRestriction)

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

const update = (quality?: Array<string>) => {
  if (quality)
    Object.keys(is.filter.itemTypeValues1).forEach((q: string) => {
      if (!quality.includes(q))
        delete is.filter.itemTypeValues1[q]
    })

  is.filter.request++
}
</script>

<template>
  <q-list :class="{ 'disable': disable || filterLoading }">
    <q-item :inset-level=".2" dense>
      <q-item-section>
        <div class="row items-center q-gutter-sm">
          <q-checkbox size="xs" :disable="filterLoading" v-model="is.filter.hardcore" :label="t('item.hardcore')"
            @update:model-value="update()" />
          <q-btn dense round flat size="xs" :ripple="false" class="no-hover" :disable="filterLoading"
            @click="is.filter.hardcore = null; update()">
            <q-icon class="icon" :name="`img:${icons.close}`" />
          </q-btn>
        </div>
      </q-item-section>
    </q-item>
    <q-item :inset-level=".2" dense>
      <q-item-section>
        <div class="row items-center q-gutter-sm">
          <q-checkbox size="xs" :disable="filterLoading" v-model="is.filter.ladder" :label="t('item.ladder')"
            @update:model-value="update()" />
          <q-btn dense round flat size="xs" :ripple="false" class="no-hover" :disable="filterLoading"
            @click="is.filter.ladder = null; update()">
            <q-icon class="icon" :name="`img:${icons.close}`" />
          </q-btn>
        </div>
      </q-item-section>
    </q-item>
    <q-item :inset-level=".2" dense>
      <q-item-section>
        <q-checkbox size="xs" :disable="filterLoading" v-model="is.filter.available" :label="t('item.available')"
          @update:model-value="update()" />
      </q-item-section>
    </q-item>
    <q-item v-if="as.signed">
      <q-item-section>
        <q-item-label header>{{ t('filter.onlyForMe') }}</q-item-label>
        <q-checkbox size="xs" class="q-pl-sm" :disable="filterLoading" v-model="is.filter.mine" :label="t('filter.mine')"
          @update:model-value="update()" />
        <q-checkbox size="xs" class="q-pl-sm" :disable="filterLoading" v-model="is.filter.offer"
          :label="t('filter.offer')" @update:model-value="update()" />
        <q-checkbox :disable="filterLoading" v-model="is.filter.favorite" class="q-pl-sm" size="xs"
          :label="t('item.favorites')" @update:model-value="update()" />
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label header>{{ t('item.quality') }}</q-item-label>
        <q-option-group size="xs" :disable="filterLoading" inline class="q-pl-sm"
          :options="filterQuality().map(fq => ({ ...fq, label: fq.fullName }))" type="checkbox"
          v-model="is.filter.quality" @update:model-value="update()" />
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label header>{{ t('item.selectType') }}</q-item-label>
        <q-option-group size="xs" :disable="filterLoading" inline class="q-pl-sm" :options="filterTypes()" type="checkbox"
          v-model="is.filter.itemTypes" @update:model-value="val => update(val)" />
      </q-item-section>
    </q-item>
    <q-item :inset-level=".2" v-for="itemType in is.filter.itemTypes.filter(it => it !== 'aspect')" :key="itemType">
      <q-item-section>
        <q-select v-model="is.filter.itemTypeValues1[itemType]"
          :options="findType(itemType)?.value === 'rune' ? filterRunes() : filterClasses(itemType)"
          :label="`${findType(itemType)?.label} ${t('filter.type')}`" :disable="filterLoading" outlined dense
          no-error-icon hide-bottom-space emit-value map-options multiple transition-show="none" transition-hide="none"
          :transition-duration="0" :dropdown-icon="`img:${icons.dropdown}`" popup-content-class="d4-scroll"
          @update:model-value="update()">
        </q-select>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label header>{{ t('filter.advanced') }}</q-item-label>
        <q-item-label class="q-px-md">
          <div class="column q-gutter-md">
            <div style="width:200px">
              <q-select ref="propertyRef" v-model="is.filter.properties" :disable="disable" max-values="3" outlined dense
                no-error-icon use-input hide-bottom-space hide-selected emit-value map-options multiple
                transition-show="none" transition-hide="none" :transition-duration="0"
                :label="`${t('properties')} ${t('searchOrSelect')}`" :options="propertyOptions(propertyNeedle)"
                :dropdown-icon="`img:${icons.dropdown}`" popup-content-class="d4-scroll"
                @update:model-value="selectedProperty" @input-value="filterProperties">
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section side>
                      <q-icon class="icon" :class="{ 'rotate-45': ['standard'].includes(scope.opt.type as string) }"
                        size="14px" :name="`img:${icons[scope.opt.type as keyof typeof icons || 'standard']}`" />
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
              <div bordered class="q-mt-xs q-pl-sm rounded-borders column q-gutter-xs text-caption full-width">
                <div v-for="pid in is.filter.properties" :key="`${pid}`" class="row items-center no-wrap full-width">
                  <div class="ellipsis">
                    {{ findProperty(pid as number)?.label }}
                  </div>
                  <q-btn :disable="disable" dense unelevated flat round size="xs" :tabindex="-1" class="q-ml-sm"
                    @click="removeProperty(pid)">
                    <img class="icon" width="13" src="~assets/icons/close.svg" />
                  </q-btn>
                </div>
              </div>
            </div>
            <div style="width:200px">
              <q-select ref="affixRef" v-model="is.filter.affixes" :disable="disable" max-values="3" outlined dense
                no-error-icon use-input hide-bottom-space hide-selected emit-value map-options multiple
                transition-show="none" transition-hide="none" :transition-duration="0"
                :label="`${t('affixes')} ${t('searchOrSelect')}`" :options="affixOptions(affixNeedle)"
                :dropdown-icon="`img:${icons.dropdown}`" popup-content-class="d4-scroll"
                @update:model-value="selectedAffix" @input-value="filterAffixes">
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section side>
                      <q-icon class="icon" :class="{ 'rotate-45': ['standard'].includes(scope.opt.type as string) }"
                        size="14px" :name="`img:${icons[scope.opt.type as keyof typeof icons || 'standard']}`" />
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
              <div bordered class="q-mt-xs q-pl-sm rounded-borders column q-gutter-xs text-caption full-width">
                <div v-for="aid in is.filter.affixes" :key="`${aid}`" class="row items-center no-wrap full-width">
                  <div class="ellipsis">
                    {{ findAffix(aid as number)?.label }}
                  </div>
                  <q-btn :disable="disable" dense unelevated flat round size="xs" :tabindex="-1" class="q-ml-sm"
                    @click="removeAffix(aid)">
                    <img class="icon" width="13" src="~assets/icons/close.svg" />
                  </q-btn>
                </div>
              </div>
            </div>
            <div style="width:200px">
              <q-select ref="restrictionRef" v-model="is.filter.restrictions" :disable="disable" max-values="3" outlined
                dense no-error-icon use-input hide-bottom-space hide-selected emit-value map-options multiple
                transition-show="none" transition-hide="none" :transition-duration="0"
                :label="`${t('restrictions')} ${t('searchOrSelect')}`" :options="restrictionOptions(restrictionNeedle)"
                :dropdown-icon="`img:${icons.dropdown}`" popup-content-class="d4-scroll"
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
              <div bordered class="q-mt-xs q-pl-sm rounded-borders column q-gutter-xs text-caption full-width">
                <div v-for="rid in is.filter.restrictions" :key="`${rid}`" class="row items-center no-wrap full-width">
                  <div class="ellipsis">
                    {{ findRestriction(rid as number)?.label }}
                  </div>
                  <q-btn :disable="disable" dense unelevated flat round size="xs" :tabindex="-1" class="q-ml-sm"
                    @click="removeRestriction(rid)">
                    <img class="icon" width="13" src="~assets/icons/close.svg" />
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item :inset-level=".3" class="q-mt-xl">
      <q-btn outline size="md" :ripple="false" class="no-hover" :disable="filterLoading" @click="is.clearFilter">
        <div class="row items-center q-gutter-xs">
          <div>{{ t('btn.resetSearch') }}</div>
          <q-icon class="icon" :name="`img:${icons.refresh}`" size="xs" />
        </div>
      </q-btn>
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
</style>