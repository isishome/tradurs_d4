<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
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
const is = useItemStore()
const { t } = useI18n({ useScope: 'global' })

const filterQuality = is.filterQuality
const filterTypes = is.filterTypes
const findType = is.findType
const filterClasses = is.filterClasses
const filterRunes = is.filterRunes
const filterLoading = computed(() => is.filter.loading)

const update = (quality?: Array<string>) => {
  if (quality)
    Object.keys(is.filter.equipmentClasses).forEach((q: string) => {
      if (!quality.includes(q))
        delete is.filter.equipmentClasses[q]
    })

  is.filter.request++
}
</script>

<template>
  <q-list :class="{ 'disable': disable || filterLoading }">
    <q-item :inset-level=".2" dense>
      <q-item-section>
        <div class="row items-center q-gutter-sm">
          <q-checkbox size="xs" :disable="filterLoading" v-model="is.filter.hardcore" :label="t('hardcore')"
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
          <q-checkbox size="xs" :disable="filterLoading" v-model="is.filter.ladder" :label="t('ladder')"
            @update:model-value="update()" />
          <q-btn dense round flat size="xs" :ripple="false" class="no-hover" :disable="filterLoading"
            @click="is.filter.ladder = null; update()">
            <q-icon class="icon" :name="`img:${icons.close}`" />
          </q-btn>
        </div>
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
        <q-select v-model="is.filter.equipmentClasses[itemType]"
          :options="findType(itemType)?.value === 'rune' ? filterRunes() : filterClasses(itemType)"
          :label="`${findType(itemType)?.label} 종류`" :disable="filterLoading" outlined dense no-error-icon
          hide-bottom-space emit-value map-options multiple transition-show="none" transition-hide="none"
          :dropdown-icon="`img:${icons.dropdown}`" popup-content-class="d4-scroll" @update:model-value="update()" />
      </q-item-section>
    </q-item>
    <q-item :inset-level=".2">
      <q-input outlined dense v-model="is.filter.name" :label="t('item.name')" :disable="filterLoading"
        @keyup.enter="update()">
        <template v-if="$q.screen.lt.sm" v-slot:append>
          <q-btn flat dense size="xs" :ripple="false" class="no-hover" :disable="filterLoading" @click="update()">
            <q-icon class="icon" :name="`img:${icons.search}`" size="xs" />
          </q-btn>
        </template>
      </q-input>
    </q-item>
    <q-item :inset-level=".2" class="q-mt-xl">
      <q-btn outline size="md" :ripple="false" class="no-hover" :disable="filterLoading" @click="is.clearFilter">
        <div class="row items-center q-gutter-xs">
          <div>{{ t('btn.resetSearch') }}</div>
          <q-icon class="icon" :name="`img:${icons.refresh}`" size="xs" />
        </div>
      </q-btn>
    </q-item>
    <!-- <q-item>
                                                      <q-item-section>
                                                        {{ is.filter }}
                                                      </q-item-section>
                                                    </q-item> -->
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