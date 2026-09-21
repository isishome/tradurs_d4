<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useItemStore } from 'stores/item-store'
import D4RuneUpgradeKnowledgeDetail from 'components/knowledge/D4RuneUpgradeKnowledgeDetail.vue'
import { legacyRuneLabel, type LegacyRuneCode } from 'src/data/legacy-runewords'
import {
  runeImage,
  runeUpgradeRecipes,
  type RuneUpgradeRecipe
} from 'src/data/legacy-rune-upgrades'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })
const is = useItemStore()
const query = ref('')
const mobileDetailOpen = ref(false)
const isMobile = computed(() => $q.screen.lt.sm)
const legacyRunes = new Set<LegacyRuneCode>(['jah', 'ohm', 'thul', 'vex'])

const runeImageClass = (code: LegacyRuneCode) => ({
  'legacy-rune-image': legacyRunes.has(code)
})

const gemLabel = (recipe: RuneUpgradeRecipe, lang: 'ko' | 'en') => {
  if (!recipe.gem) return ''
  const entry = is.gems.find(
    (gem) => gem.value === recipe.gem?.type && gem.quality === recipe.gem.quality
  )
  if (entry?.label && entry.qualityName) return `${entry.qualityName} ${entry.label}`

  const names = {
    amethyst: { ko: '자수정', en: 'Amethyst' },
    diamond: { ko: '다이아몬드', en: 'Diamond' },
    emerald: { ko: '에메랄드', en: 'Emerald' },
    ruby: { ko: '루비', en: 'Ruby' },
    sapphire: { ko: '사파이어', en: 'Sapphire' },
    topaz: { ko: '토파즈', en: 'Topaz' }
  } as const
  const qualities = {
    chipped: { ko: '이 빠진', en: 'Chipped' },
    flawless: { ko: '온전한', en: 'Flawless' },
    grand: { ko: '웅장한', en: 'Grand' }
  } as const
  return `${qualities[recipe.gem.quality][lang]} ${names[recipe.gem.type][lang]}`
}

const searchableText = (recipe: RuneUpgradeRecipe) =>
  [
    recipe.key,
    recipe.inputRune,
    recipe.outputRune,
    legacyRuneLabel(recipe.inputRune, 'ko'),
    legacyRuneLabel(recipe.inputRune, 'en'),
    legacyRuneLabel(recipe.outputRune, 'ko'),
    legacyRuneLabel(recipe.outputRune, 'en'),
    gemLabel(recipe, 'ko'),
    gemLabel(recipe, 'en'),
    recipe.gem?.type,
    recipe.gem?.quality
  ]
    .join(' ')
    .toLowerCase()

const filteredRecipes = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return needle
    ? runeUpgradeRecipes.filter((recipe) => searchableText(recipe).includes(needle))
    : runeUpgradeRecipes
})

const selectedRecipe = computed(
  () =>
    runeUpgradeRecipes.find(
      (recipe) => recipe.key === String(route.params.recipe ?? '')
    ) ?? filteredRecipes.value[0]
)

const updateQuery = (event: Event) => {
  query.value = (event.target as HTMLInputElement).value
}

const clearQuery = () => {
  query.value = ''
}

const openMobileDetail = () => {
  if (isMobile.value) mobileDetailOpen.value = true
}

const closeMobileDetail = () => {
  if (isMobile.value && route.name === 'knowledgeRuneRecipe' && route.params.recipe) {
    void router.replace({
      name: 'knowledgeRuneRecipe',
      params: { lang: route.params.lang }
    })
  }
}

watch(
  [() => route.params.recipe, isMobile],
  ([recipe, mobile]) => {
    const valid = runeUpgradeRecipes.some(
      (definition) => definition.key === String(recipe ?? '')
    )
    mobileDetailOpen.value = Boolean(mobile && valid)
  },
  { immediate: true }
)
</script>

<template>
  <div class="rune-upgrade-knowledge">
    <div class="top-space"></div>
    <header class="knowledge-header q-mb-md">
      <p class="text-body2 text-grey q-mb-none">
        {{ t('runeUpgradeKnowledge.description') }}
      </p>
    </header>

    <q-field
      :model-value="query"
      outlined
      dense
      class="recipe-search q-mb-lg"
      :label="t('runeUpgradeKnowledge.search')"
    >
      <template #prepend>
        <img class="icon" width="20" height="20" src="/images/icons/search.svg" alt="" />
      </template>
      <template #control="{ id }">
        <input
          :id="id"
          :value="query"
          type="text"
          autocomplete="off"
          class="q-field__input col"
          :aria-label="t('runeUpgradeKnowledge.search')"
          @input="updateQuery"
        />
      </template>
      <template #append>
        <div class="search-clear-slot">
          <q-btn
            v-show="query"
            flat
            dense
            size="xs"
            :ripple="false"
            class="no-hover"
            :aria-label="t('btn.delete')"
            @click="clearQuery"
          >
            <q-icon class="icon" name="img:/images/icons/close.svg" size="xs" />
          </q-btn>
        </div>
      </template>
    </q-field>

    <div class="knowledge-grid">
      <q-card flat bordered class="recipe-list-card">
        <q-item-label header class="list-header row justify-between items-center">
          <span class="text-subtitle2">{{ t('runeUpgradeKnowledge.list') }}</span>
          <q-badge outline color="primary" :label="filteredRecipes.length" />
        </q-item-label>
        <q-list separator class="recipe-list">
          <q-item
            v-for="recipe in filteredRecipes"
            :key="recipe.key"
            v-ripple
            clickable
            class="recipe-list-item"
            :active="selectedRecipe?.key === recipe.key"
            active-class="recipe-active"
            :to="{
              name: 'knowledgeRuneRecipe',
              params: { lang: route.params.lang, recipe: recipe.key }
            }"
            @click="openMobileDetail"
          >
            <q-item-section avatar class="recipe-rune-section">
              <img
                :src="`/images/items/rune/${runeImage(recipe.inputRune).type}/${runeImage(recipe.inputRune).key}.webp`"
                :class="runeImageClass(recipe.inputRune)"
                class="recipe-rune-image"
                alt=""
              />
            </q-item-section>
            <q-item-section class="recipe-summary-section">
              <q-item-label class="recipe-title text-weight-bold">
                {{ legacyRuneLabel(recipe.inputRune, $i18n.locale) }} ×{{ recipe.inputQuantity }}
                → {{ legacyRuneLabel(recipe.outputRune, $i18n.locale) }}
              </q-item-label>
              <q-item-label caption class="recipe-requirement">
                {{
                  recipe.gem
                    ? gemLabel(recipe, $i18n.locale.startsWith('ko') ? 'ko' : 'en')
                    : t('runeUpgradeKnowledge.noGem')
                }}
              </q-item-label>
            </q-item-section>
            <q-item-section side class="recipe-side-section items-end q-gutter-y-xs">
              <q-badge
                outline
                color="primary"
                :label="t(`runeUpgradeKnowledge.${recipe.chain}Chain`)"
              />
              <img src="/images/icons/chevron_right.svg" width="16" height="16" class="icon list-chevron" alt="" />
            </q-item-section>
          </q-item>
          <q-item v-if="filteredRecipes.length === 0">
            <q-item-section class="text-grey text-center q-py-xl">
              {{ t('runeUpgradeKnowledge.empty') }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <q-card v-if="selectedRecipe && !isMobile" flat class="card-item unique detail-card">
        <div class="inner">
          <D4RuneUpgradeKnowledgeDetail :recipe="selectedRecipe" />
        </div>
      </q-card>
    </div>

    <D4Dialog
      v-if="isMobile && selectedRecipe"
      v-model="mobileDetailOpen"
      maximized
      @hide="closeMobileDetail"
    >
      <template #middle>
        <D4RuneUpgradeKnowledgeDetail
          :recipe="selectedRecipe"
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
              <img src="/images/icons/close.svg" width="22" height="22" alt="" />
            </q-btn>
          </template>
        </D4RuneUpgradeKnowledgeDetail>
      </template>
    </D4Dialog>
  </div>
</template>

<style scoped>
.rune-upgrade-knowledge {
  width: 100%;
}

.knowledge-header {
  border-left: 3px solid var(--q-primary);
  border-radius: 0 4px 4px 0;
  padding: 12px 16px;
  background: linear-gradient(90deg, var(--q-cloud), transparent 78%);
}

.knowledge-header p {
  line-height: 1.65;
}

.recipe-search :deep(.q-field__control) {
  background: var(--q-cloud);
}

.search-clear-slot {
  width: 24px;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.8fr) minmax(0, 1.2fr);
  align-items: start;
  gap: 20px;
}

.recipe-list-card {
  overflow: hidden;
  border-color: var(--q-dark-border);
  background: linear-gradient(180deg, rgba(32, 33, 28, 0.96), rgba(4, 4, 4, 0.96));
}

.list-header {
  min-height: 48px;
  border-bottom: 1px solid var(--q-dark-border);
  color: var(--q-primary);
}

.recipe-list :deep(.q-item) {
  min-height: 74px;
  border-left: 3px solid transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.recipe-list :deep(.q-item:hover) {
  background: var(--q-cloud);
}

.recipe-rune-section {
  flex: 0 0 58px;
  width: 58px;
  min-width: 58px;
  align-items: center;
  justify-content: center;
  padding-right: 0;
  transform: translateX(4px);
}

.recipe-rune-image {
  width: auto;
  height: 58px;
  object-fit: contain;
}

.legacy-rune-image {
  transform: scale(0.7);
}

.recipe-summary-section {
  min-width: 0;
  padding-left: 8px;
}

.recipe-title,
.recipe-requirement {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.recipe-side-section {
  flex: 0 0 86px;
  width: 86px;
  min-width: 86px;
  padding-left: 8px;
}

.recipe-active {
  border-left-color: var(--q-primary) !important;
  background: rgba(165, 146, 99, 0.14) !important;
  color: inherit;
}

.list-chevron {
  opacity: 0.45;
}

.detail-card {
  width: 100%;
  overflow: hidden;
}

.body--light .recipe-list-card {
  border-color: var(--q-light-border);
}

.body--light .recipe-list-card {
  background: rgba(255, 255, 255, 0.9);
}

@media (max-width: 599px) {
  .knowledge-header {
    padding: 10px 12px;
  }

  .knowledge-grid {
    grid-template-columns: 1fr;
  }

  .recipe-list :deep(.q-item) {
    min-height: 68px;
  }

  .mobile-detail {
    overscroll-behavior: contain;
  }
}
</style>
