<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useItemStore, type FixedItem } from 'stores/item-store'
import D4RunewordSequence from 'components/D4RunewordSequence.vue'
import D4RunewordKnowledgeDetail from 'components/knowledge/D4RunewordKnowledgeDetail.vue'
import {
  legacyRuneLabel,
  legacyRunewords,
  type LegacyRunewordDefinition
} from 'src/data/legacy-runewords'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const { t, locale } = useI18n({ useScope: 'global' })
const is = useItemStore()
const query = ref('')
const selectedFixedItemId = ref<number>()
const mobileDetailOpen = ref(false)
const isMobile = computed(() => $q.screen.lt.sm)

const localeKey = computed<'ko' | 'en'>(() =>
  locale.value.toLowerCase().startsWith('ko') ? 'ko' : 'en'
)

const fixedItemsFor = (definition: LegacyRunewordDefinition): FixedItem[] =>
  definition.fixedItemIds
    .map((id) => is.fixedItems.data.find((item) => item.value === id))
    .filter((item): item is FixedItem => item !== undefined)

const nameFor = (definition: LegacyRunewordDefinition) =>
  fixedItemsFor(definition)[0]?.label ?? definition.name[localeKey.value]

const imageFor = (definition: LegacyRunewordDefinition) => {
  const item = fixedItemsFor(definition)[0]
  return item
    ? `/images/items/fixed/${item.quality}-${item.sort}.webp`
    : undefined
}

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

const openMobileDetail = () => {
  if (isMobile.value) mobileDetailOpen.value = true
}

const updateQuery = (event: Event) => {
  // QInput defers model updates while qComposing is true. Read the native
  // control directly so unfinished Korean/Japanese composition can filter.
  query.value = (event.target as HTMLInputElement).value
}

const clearQuery = () => {
  query.value = ''
}

const closeMobileDetail = () => {
  if (
    isMobile.value &&
    route.name === 'knowledgeRuneword' &&
    route.params.runeword
  ) {
    void router.replace({
      name: 'knowledgeRuneword',
      params: { lang: route.params.lang }
    })
  }
}

watch(
  [() => route.params.runeword, isMobile],
  ([runeword, mobile]) => {
    const validRuneword = legacyRunewords.some(
      (definition) => definition.key === String(runeword ?? '')
    )
    mobileDetailOpen.value = Boolean(mobile && validRuneword)
  },
  { immediate: true }
)
</script>

<template>
  <div class="runeword-knowledge">
    <div class="top-space"></div>
    <header class="knowledge-header q-mb-md">
      <p class="text-body2 text-grey q-mb-none">
        {{ t('runewordKnowledge.description') }}
      </p>
    </header>

    <q-field
      :model-value="query"
      outlined
      dense
      class="runeword-search q-mb-lg"
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
      <template #control="{ id }">
        <input
          :id="id"
          :value="query"
          type="text"
          autocomplete="off"
          class="q-field__input col"
          :aria-label="t('runewordKnowledge.search')"
          @input="updateQuery"
        />
      </template>
      <template #append>
        <div class="runeword-search-clear-slot">
          <q-btn
            v-show="query"
            flat
            dense
            size="xs"
            :ripple="false"
            class="no-hover runeword-search-clear"
            :aria-label="t('btn.delete')"
            @click="clearQuery"
          >
            <q-icon
              class="icon"
              name="img:/images/icons/close.svg"
              size="xs"
            />
          </q-btn>
        </div>
      </template>
    </q-field>

    <div class="knowledge-grid">
      <q-card flat bordered class="runeword-list-card">
        <q-item-label header class="list-header row justify-between items-center">
          <span class="text-subtitle2">{{ t('runewordKnowledge.list') }}</span>
          <q-badge outline color="primary" :label="filteredRunewords.length" />
        </q-item-label>
        <q-list separator class="runeword-list">
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
            @click="openMobileDetail"
          >
            <q-item-section avatar class="runeword-thumb-section">
              <q-img
                v-if="imageFor(definition)"
                :src="imageFor(definition)"
                width="42px"
                height="48px"
                fit="contain"
                class="runeword-thumb"
              />
            </q-item-section>
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
            <q-item-section side class="row no-wrap items-center q-gutter-x-sm">
              <q-badge
                outline
                color="primary"
                :label="definition.fixedItemIds.length"
              />
              <img
                src="/images/icons/chevron_right.svg"
                width="16"
                height="16"
                class="icon list-chevron"
                alt=""
              />
            </q-item-section>
          </q-item>
          <q-item v-if="filteredRunewords.length === 0">
            <q-item-section class="text-grey text-center q-py-xl">
              {{ t('runewordKnowledge.empty') }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <q-card
        v-if="selectedDefinition && !isMobile"
        flat
        class="card-item unique detail-card"
      >
        <div class="inner">
          <D4RunewordKnowledgeDetail
            v-model="selectedFixedItemId"
            :definition="selectedDefinition"
          />
        </div>
      </q-card>
    </div>

    <D4Dialog
      v-if="isMobile && selectedDefinition"
      v-model="mobileDetailOpen"
      maximized
      @hide="closeMobileDetail"
    >
      <template #middle>
        <D4RunewordKnowledgeDetail
          v-model="selectedFixedItemId"
          :definition="selectedDefinition"
          class="col scroll mobile-detail"
        >
          <template #actions>
            <q-btn
              flat
              round
              dense
              :aria-label="t('btn.close')"
              class="no-hover icon"
              :ripple="false"
              @click="mobileDetailOpen = false"
            >
              <img
                src="/images/icons/close.svg"
                width="22"
                height="22"
                alt=""
              />
            </q-btn>
          </template>
        </D4RunewordKnowledgeDetail>
      </template>
    </D4Dialog>
  </div>
</template>

<style scoped>
.runeword-knowledge {
  width: 100%;
}

.knowledge-header {
  position: relative;
  border-left: 3px solid var(--q-primary);
  border-radius: 0 4px 4px 0;
  padding: 12px 16px;
  background: linear-gradient(90deg, var(--q-cloud), transparent 78%);
}

.knowledge-header p {
  line-height: 1.65;
}

.runeword-search :deep(.q-field__control) {
  background: var(--q-cloud);
}

.runeword-search-clear-slot {
  width: 24px;
}

.runeword-search-clear {
  background: transparent !important;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.2fr);
  align-items: start;
  gap: 20px;
}

.runeword-list-card {
  overflow: hidden;
  border-color: var(--q-dark-border);
  background: linear-gradient(180deg, rgba(32, 33, 28, 0.96), rgba(4, 4, 4, 0.96));
}

.list-header {
  min-height: 48px;
  border-bottom: 1px solid var(--q-dark-border);
  color: var(--q-primary);
}

.runeword-list :deep(.q-item) {
  min-height: 68px;
  border-left: 3px solid transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.runeword-list :deep(.q-item:hover) {
  background: var(--q-cloud);
}

.runeword-thumb-section {
  min-width: 54px;
  padding-right: 8px;
}

.runeword-thumb {
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.16);
}

.list-chevron {
  opacity: 0.45;
}

.runeword-active {
  border-left-color: var(--q-primary) !important;
  background: rgba(165, 146, 99, 0.14) !important;
  color: inherit;
}

.detail-card {
  width: 100%;
  overflow: hidden;
}

.body--light .runeword-list-card {
  border-color: var(--q-light-border);
  background: rgba(255, 255, 255, 0.9);
}

@media (max-width: 599px) {
  .knowledge-header {
    padding: 10px 12px;
  }

  .knowledge-grid {
    grid-template-columns: 1fr;
  }

  .runeword-list :deep(.q-item) {
    min-height: 64px;
  }

  .mobile-detail {
    overscroll-behavior: contain;
  }
}
</style>
