<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useItemStore, type FixedItem } from 'stores/item-store'
import D4RunewordSequence from 'components/D4RunewordSequence.vue'
import {
  legacyRuneLabel,
  legacyRunewords,
  type LegacyRunewordDefinition
} from 'src/data/legacy-runewords'

const route = useRoute()
const { t, locale } = useI18n({ useScope: 'global' })
const is = useItemStore()
const query = ref('')
const selectedFixedItemId = ref<number>()

const localeKey = computed<'ko' | 'en'>(() =>
  locale.value.toLowerCase().startsWith('ko') ? 'ko' : 'en'
)

const fixedItemsFor = (definition: LegacyRunewordDefinition): FixedItem[] =>
  definition.fixedItemIds
    .map((id) => is.fixedItems.data.find((item) => item.value === id))
    .filter((item): item is FixedItem => item !== undefined)

const nameFor = (definition: LegacyRunewordDefinition) =>
  fixedItemsFor(definition)[0]?.label ?? definition.name[localeKey.value]

const equipmentLabel = (item: FixedItem) =>
  is.findEquipClass(item.equipmentClass)?.label ?? item.equipmentClass ?? ''

const searchableText = (definition: LegacyRunewordDefinition) =>
  [
    definition.key,
    definition.name.ko,
    definition.name.en,
    ...definition.runeCodes.flatMap((code) => [
      legacyRuneLabel(code, 'ko'),
      legacyRuneLabel(code, 'en')
    ]),
    ...fixedItemsFor(definition).map(equipmentLabel)
  ]
    .join(' ')
    .toLowerCase()

const filteredRunewords = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return needle
    ? legacyRunewords.filter((definition) =>
        searchableText(definition).includes(needle)
      )
    : legacyRunewords
})

const selectedDefinition = computed(
  () =>
    legacyRunewords.find(
      (definition) => definition.key === String(route.params.runeword ?? '')
    ) ?? filteredRunewords.value[0]
)

const variants = computed(() =>
  selectedDefinition.value ? fixedItemsFor(selectedDefinition.value) : []
)

watch(
  variants,
  (items) => {
    if (!items.some((item) => item.value === selectedFixedItemId.value)) {
      selectedFixedItemId.value = items[0]?.value as number | undefined
    }
  },
  { immediate: true }
)

const selectedVariant = computed(() =>
  variants.value.find((item) => item.value === selectedFixedItemId.value)
)

const variantOptions = computed(() =>
  variants.value.map((item) => ({
    value: item.value,
    label: equipmentLabel(item),
    quality: item.quality,
    sort: item.sort
  }))
)

const templateLabel = (label?: string) => label?.replaceAll('{x}', '?') ?? ''
</script>

<template>
  <div class="runeword-knowledge">
    <div class="top-space"></div>
    <header class="knowledge-header q-mb-lg">
      <p class="text-body2 text-grey q-mb-none">
        {{ t('runewordKnowledge.description') }}
      </p>
    </header>

    <q-input
      v-model="query"
      outlined
      dense
      clearable
      class="q-mb-lg"
      :label="t('runewordKnowledge.search')"
    >
      <template #prepend>
        <img
          class="icon"
          width="20"
          height="20"
          src="/images/icons/search.svg"
          alt=""
        />
      </template>
    </q-input>

    <div class="knowledge-grid">
      <q-list bordered separator class="rounded-borders runeword-list">
        <q-item-label header class="row justify-between items-center">
          <span>{{ t('runewordKnowledge.list') }}</span>
          <q-badge color="grey-8" :label="filteredRunewords.length" />
        </q-item-label>
        <q-item
          v-for="definition in filteredRunewords"
          :key="definition.key"
          v-ripple
          clickable
          :active="selectedDefinition?.key === definition.key"
          active-class="runeword-active"
          :to="{
            name: 'knowledgeRuneword',
            params: { lang: route.params.lang, runeword: definition.key }
          }"
        >
          <q-item-section>
            <q-item-label class="text-weight-bold">
              {{ nameFor(definition) }}
            </q-item-label>
            <q-item-label caption>
              <D4RunewordSequence
                separated
                :rune-codes="definition.runeCodes"
              />
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge
              outline
              color="grey-6"
              :label="definition.fixedItemIds.length"
            />
          </q-item-section>
        </q-item>
        <q-item v-if="filteredRunewords.length === 0">
          <q-item-section class="text-grey text-center q-py-xl">
            {{ t('runewordKnowledge.empty') }}
          </q-item-section>
        </q-item>
      </q-list>

      <q-card v-if="selectedDefinition" flat bordered class="detail-card">
        <q-card-section class="row no-wrap items-start q-gutter-md">
          <q-img
            v-if="selectedVariant"
            :src="`/images/items/fixed/${selectedVariant.quality}-${selectedVariant.sort}.webp`"
            width="88px"
            height="108px"
            fit="contain"
            class="rounded-borders detail-image"
          />
          <div class="col">
            <div class="text-h6 text-unique">
              {{ nameFor(selectedDefinition) }}
            </div>
            <D4RunewordSequence
              separated
              :rune-codes="selectedDefinition.runeCodes"
              class="q-mt-sm"
            />
            <div class="text-caption text-grey q-mt-sm">
              {{ t('runewordKnowledge.recipeOrder') }}
            </div>
          </div>
        </q-card-section>

        <q-separator />
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">
            {{ t('runewordKnowledge.base') }}
          </div>
          <q-select
            v-model="selectedFixedItemId"
            class="runeword-variant-select"
            :options="variantOptions"
            emit-value
            map-options
            outlined
            dense
            no-error-icon
            hide-bottom-space
            transition-show="none"
            transition-hide="none"
            :transition-duration="0"
            options-dense
            dropdown-icon="img:/images/icons/dropdown.svg"
            popup-content-class="scroll bordered limit-select"
          >
            <template #selected-item="scope">
              <div class="ellipsis">{{ scope.opt.label }}</div>
            </template>
            <template #option="scope">
              <q-item clickable v-bind="scope.itemProps">
                <q-item-section avatar>
                  <img
                    height="36"
                    :src="`/images/items/fixed/${scope.opt.quality}-${scope.opt.sort}.webp`"
                    alt=""
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <div class="text-caption text-grey q-mt-sm">
            {{ t('runewordKnowledge.variantCount', { count: variants.length }) }}
          </div>
        </q-card-section>

        <template v-if="selectedVariant">
          <q-separator />
          <q-card-section class="detail-section">
            <div class="text-subtitle2">{{ t('properties') }}</div>
            <ul>
              <li v-for="id in selectedVariant.properties" :key="`property-${id}`">
                {{ templateLabel(is.findProperty(id)?.label) }}
              </li>
            </ul>
          </q-card-section>

          <q-separator />
          <q-card-section class="detail-section">
            <div class="text-subtitle2">{{ t('affixes') }}</div>
            <ul>
              <li v-for="id in selectedVariant.affixes" :key="`affix-${id}`">
                {{ templateLabel(is.findAffix(id)?.label) }}
              </li>
            </ul>
          </q-card-section>

          <template v-if="selectedVariant.restrictions?.length">
            <q-separator />
            <q-card-section class="detail-section">
              <div class="text-subtitle2">{{ t('restrictions') }}</div>
              <ul>
                <li
                  v-for="id in selectedVariant.restrictions"
                  :key="`restriction-${id}`"
                >
                  {{ templateLabel(is.findRestriction(id)?.label) }}
                </li>
              </ul>
            </q-card-section>
          </template>
        </template>

        <q-card-section class="text-caption text-grey">
          {{ t('runewordKnowledge.valueNotice') }}
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style scoped>
.runeword-knowledge {
  width: 100%;
}

.knowledge-header {
  border-left: 3px solid var(--q-primary);
  padding-left: 16px;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: minmax(250px, 0.8fr) minmax(0, 1.2fr);
  align-items: start;
  gap: 20px;
}

.runeword-list,
.detail-card {
  background: rgba(30, 30, 30, 0.92);
}

.runeword-active {
  background: rgba(181, 140, 78, 0.16);
  color: inherit;
}

.detail-card {
  overflow: hidden;
}

.detail-image {
  flex: 0 0 auto;
  background: rgba(0, 0, 0, 0.14);
}

.runeword-variant-select :deep(.q-field__control),
.runeword-variant-select :deep(.q-field__marginal) {
  min-height: 34px;
}

.detail-section ul {
  margin: 10px 0 0;
  padding-left: 20px;
}

.detail-section li + li {
  margin-top: 6px;
}

.body--light .runeword-list,
.body--light .detail-card {
  background: rgba(255, 255, 255, 0.86);
}

@media (max-width: 700px) {
  .knowledge-grid {
    grid-template-columns: 1fr;
  }
}
</style>
