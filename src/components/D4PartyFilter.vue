<script setup lang="ts">
import { computed, reactive } from 'vue'
import { QSelect, debounce, extend } from 'quasar'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore } from 'src/stores/item-store'
import { usePartyStore, type IFilter, PartyRegionTypes, type IPartyRegion, defaultFilter, PartyServiceTypes } from 'src/stores/party-store'
import { useI18n } from 'vue-i18n'

interface IProps {
  disable?: boolean
}
withDefaults(defineProps<IProps>(), {
  disable: false
})

const as = useAccountStore()
const is = useItemStore()
const ps = usePartyStore()
const { t } = useI18n({ useScope: 'global' })

const filter = reactive<IFilter>(extend(false, defaultFilter))
const filterLoading = computed(() => ps.filter.loading)
const serviceOptions = [
  {
    label: t('party.filter.all'),
    value: ''
  },
  {
    label: t('party.service.coop'),
    value: PartyServiceTypes.COOP
  },
  {
    label: t('party.service.sell'),
    value: PartyServiceTypes.SELL
  },
  {
    label: t('party.service.buy'),
    value: PartyServiceTypes.BUY
  }
]

const regionOptions: Array<IPartyRegion> = [
  {
    label: t('party.filter.all'),
    value: PartyRegionTypes.ALL
  }, ...ps.getRegion()
]

const currencies = [
  {
    label: t('party.filter.all'),
    value: ''
  },
  ...is.currencies()
]

Object.assign(filter, ps.filter)

const clearFilter = () => {
  ps.clearFilter()
  Object.assign(filter, ps.filter)
  filter.request--
  update()
}

const updateType = (val: string) => {
  filter.category = ps.getCategoryByType(val)?.[0]?.value as string
  update()
}

const update = () => {
  filter.request++
  Object.assign(ps.filter, filter)
}

const updateDebounce = debounce(() => {
  update()
}, 800)

const updateBasic = () => {
  if (as.signed) {
    is.setStorage()
      .then(() => {
        update()
      })
  }
  else {
    update()
  }
}

const updateBasicDebounce = debounce(() => {
  updateBasic()
}, 400)

defineExpose({
  clearFilter
})
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
    <q-item-label header>{{ t('party.service.title') }}</q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section>
        <q-select v-model="filter.service" :disable="filterLoading" outlined dense no-error-icon hide-bottom-space
          emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
          :options="serviceOptions" dropdown-icon="img:/images/icons/dropdown.svg" popup-content-class="scroll bordered"
          @update:model-value="update" />
      </q-item-section>
    </q-item>
    <q-item-label header>{{ t('party.info.region') }}</q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section>
        <q-select v-model="filter.region" :disable="filterLoading" outlined dense no-error-icon hide-bottom-space
          emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
          :options="regionOptions" dropdown-icon="img:/images/icons/dropdown.svg" popup-content-class="scroll bordered"
          @update:model-value="update" />
      </q-item-section>
    </q-item>
    <q-item-label header>{{ t('party.info.type') }}</q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section>
        <q-select v-model="filter.type" :disable="filterLoading" outlined dense no-error-icon hide-bottom-space
          emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
          :options="ps.base.partyTypes" dropdown-icon="img:/images/icons/dropdown.svg"
          popup-content-class="scroll bordered" @update:model-value="updateType" />
      </q-item-section>
    </q-item>
    <q-item-label header>{{ t('party.info.category') }}</q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section>
        <q-select v-model="filter.category" :disable="filterLoading" outlined dense no-error-icon hide-bottom-space
          emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
          :options="ps.getCategoryByType(filter.type)" dropdown-icon="img:/images/icons/dropdown.svg"
          popup-content-class="scroll bordered" @update:model-value="update" />
      </q-item-section>
    </q-item>
    <q-item-label header>{{ t('price.cost') }}</q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section>
        <q-select v-model="filter.cost" :disable="filterLoading" outlined dense no-error-icon hide-bottom-space
          emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
          :options="currencies" dropdown-icon="img:/images/icons/dropdown.svg" popup-content-class="scroll bordered"
          @update:model-value="update" />
      </q-item-section>
    </q-item>
    <q-item-label header>{{ t('party.info.runs') }}</q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section class="q-px-md">
        <q-range v-model="filter.runs" :track-color="$q.dark.isActive ? 'grey-8' : 'grey-5'" :dark="!$q.dark.isActive"
          :min="1" :max="30" :step="1" drag-range dense label markers snap @update:model-value="updateDebounce()" />
      </q-item-section>
    </q-item>
    <q-item-label header>{{ t('party.info.people') }}</q-item-label>
    <q-item :disable="filterLoading">
      <q-item-section class="q-px-md">
        <q-range v-model="filter.people" :track-color="$q.dark.isActive ? 'grey-8' : 'grey-5'" :dark="!$q.dark.isActive"
          :min="2" :max="8" :step="1" drag-range dense label markers snap @update:model-value="updateDebounce()" />
      </q-item-section>
    </q-item>
    <q-separator inset class="q-my-md" />
    <q-item :disable="filterLoading">
      <q-item-section>
        <q-btn outline aria-label="Tradurs Refresh Button" size="md" :ripple="false" class="no-hover"
          :disable="filterLoading" @click="clearFilter">
          <div class="row items-center q-gutter-xs">
            <div>{{ t('btn.resetFilter') }}</div>
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
</style>