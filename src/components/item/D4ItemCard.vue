<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useItemStore } from 'stores/item-store'
import type { Affix, Item, Property } from 'src/types/item'

import D4Affix from 'components/D4Affix.vue'
import D4Description from 'components/D4Description.vue'
import D4Item from 'components/D4Item.vue'
import D4Material from 'components/D4Material.vue'
import D4Property from 'components/D4Property.vue'
import D4Restriction from 'components/D4Restriction.vue'

defineProps<{ item: Item }>()

const { t } = useI18n({ useScope: 'global' })
const is = useItemStore()

const fixedItem = (item: Item) =>
  is
    .filterFixedItems(item.quality, item.itemTypeValue1)
    .find((fixed) => fixed.value === item.fixedItemId)

const isGuaranteedProperty = (item: Item, property: Property) =>
  fixedItem(item)?.guaranteedProperties?.includes(property.propertyId) ?? false

const isGuaranteedAffix = (item: Item, affix: Affix) =>
  affix.affixId !== undefined &&
  (fixedItem(item)?.guaranteedAffixes?.includes(affix.affixId) ?? false)
</script>

<template>
  <D4Item
    :data="{ ...item, expanded: true }"
    :loading="item.loading"
    navigable
    :show-actions-menu="false"
  >
    <template #top-right></template>
    <template v-if="item.itemType !== 'aspect'" #properties>
      <D4Property
        v-for="property in item.properties"
        :key="property.valueId"
        :data="property"
        :guaranteed="isGuaranteedProperty(item, property)"
      />
    </template>
    <template v-if="item.itemType === 'rune'" #description>
      <template v-if="item.itemTypeValue1 === 'ritual'">
        <D4Description
          :item="t('rune.gain')"
          :desc="is.findRune(item.itemTypeValue2)?.gain"
        />
      </template>
      <template v-else>
        <D4Description
          :item="t('rune.requires')"
          :desc="is.findRune(item.itemTypeValue2)?.requires"
        />
        <D4Description
          :item="t('rune.cooldown')"
          :desc="`${is.findRune(item.itemTypeValue2)?.cooldown}${t(
            'rune.second'
          )}`"
        />
      </template>
      <D4Description
        v-for="(effect, index) in (
          is.findRune(item.itemTypeValue2)?.effect ?? ''
        ).split('|')"
        :key="index"
        :class="
          is.findRuneType(is.findRune(item.itemTypeValue2)?.type)?.color
        "
        :desc="effect"
      />
    </template>
    <template
      v-else-if="
        item.itemTypeValue1 === 'summoning' &&
        is.filterMaterials(item.itemTypeValue2).length > 0
      "
      #description
    >
      <D4Material
        v-for="material in is.filterMaterials(item.itemTypeValue2)"
        :key="material.value"
        :data="material"
      />
    </template>
    <template #affixes>
      <D4Affix
        v-for="affix in item.affixes"
        :key="affix.valueId"
        :data="affix"
        :guaranteed="isGuaranteedAffix(item, affix)"
      />
    </template>
    <template #restrictions>
      <D4Restriction
        v-for="restriction in item.restrictions"
        :key="restriction.valueId"
        :data="restriction"
      />
    </template>
  </D4Item>
</template>
