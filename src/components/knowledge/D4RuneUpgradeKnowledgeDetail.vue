<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useItemStore } from 'stores/item-store'
import { legacyRuneLabel, type LegacyRuneCode } from 'src/data/legacy-runewords'
import {
  runeImage,
  runeUpgradeSources,
  type RuneUpgradeGem,
  type RuneUpgradeGemQuality,
  type RuneUpgradeRecipe
} from 'src/data/legacy-rune-upgrades'

const props = defineProps<{ recipe: RuneUpgradeRecipe }>()
const { t, locale } = useI18n({ useScope: 'global' })
const is = useItemStore()

const inputName = computed(() => legacyRuneLabel(props.recipe.inputRune, locale.value))
const outputName = computed(() => legacyRuneLabel(props.recipe.outputRune, locale.value))
const inputImage = computed(() => runeImage(props.recipe.inputRune))
const outputImage = computed(() => runeImage(props.recipe.outputRune))
const legacyRunes = new Set<LegacyRuneCode>(['jah', 'ohm', 'thul', 'vex'])

const gemFallback: Record<RuneUpgradeGem, { ko: string; en: string }> = {
  amethyst: { ko: '자수정', en: 'Amethyst' },
  diamond: { ko: '다이아몬드', en: 'Diamond' },
  emerald: { ko: '에메랄드', en: 'Emerald' },
  ruby: { ko: '루비', en: 'Ruby' },
  sapphire: { ko: '사파이어', en: 'Sapphire' },
  topaz: { ko: '토파즈', en: 'Topaz' }
}

const qualityFallback: Record<
  RuneUpgradeGemQuality,
  { ko: string; en: string }
> = {
  chipped: { ko: '이 빠진', en: 'Chipped' },
  flawless: { ko: '온전한', en: 'Flawless' },
  grand: { ko: '웅장한', en: 'Grand' }
}

const localeKey = computed<'ko' | 'en'>(() =>
  locale.value.toLowerCase().startsWith('ko') ? 'ko' : 'en'
)

const gemName = computed(() => {
  const gem = props.recipe.gem
  if (!gem) return ''
  const catalog = is.gems.find(
    (entry) => entry.value === gem.type && entry.quality === gem.quality
  )
  const quality = catalog?.qualityName ?? qualityFallback[gem.quality][localeKey.value]
  const name = catalog?.label ?? gemFallback[gem.type][localeKey.value]
  return `${quality} ${name}`.trim()
})

const runeImageClass = (code: LegacyRuneCode) => ({
  'legacy-rune-image': legacyRunes.has(code)
})
</script>

<template>
  <div class="rune-upgrade-detail column no-wrap">
    <q-card-section class="detail-hero row no-wrap items-center">
      <div class="detail-output-frame row items-center justify-center">
        <img
          :src="`/images/items/rune/${outputImage.type}/${outputImage.key}.webp`"
          :class="runeImageClass(recipe.outputRune)"
          class="detail-output-image"
          alt=""
        />
      </div>
      <div class="col detail-heading">
        <div class="row no-wrap items-start justify-between">
          <div class="name text-unique">
            {{ inputName }} → {{ outputName }}
          </div>
          <div v-if="$slots.actions" class="detail-actions">
            <slot name="actions"></slot>
          </div>
        </div>
        <div class="text-caption text-grey q-mt-xs">
          {{ t(`runeUpgradeKnowledge.${recipe.chain}Chain`) }}
        </div>
      </div>
    </q-card-section>

    <q-separator />
    <q-card-section class="detail-block">
      <div class="detail-title text-subtitle2">
        {{ t('runeUpgradeKnowledge.input') }}
      </div>
      <div class="craft-flow q-mt-md" :class="{ 'with-gem': recipe.gem }">
        <div class="material-tile">
          <div class="material-image-frame row items-center justify-center">
            <img
              :src="`/images/items/rune/${inputImage.type}/${inputImage.key}.webp`"
              :class="runeImageClass(recipe.inputRune)"
              class="material-image"
              alt=""
            />
          </div>
          <div class="material-name text-weight-medium">
            {{
              t('runeUpgradeKnowledge.quantity', {
                name: inputName,
                count: recipe.inputQuantity
              })
            }}
          </div>
        </div>

        <template v-if="recipe.gem">
          <div class="flow-symbol" aria-hidden="true">+</div>
          <div class="material-tile">
            <div class="material-image-frame row items-center justify-center">
              <img
                :src="`/images/items/inventory/gem/${recipe.gem.quality}_${recipe.gem.type}.webp`"
                class="material-image gem-image"
                alt=""
              />
            </div>
            <div class="material-name text-weight-medium">
              {{
                t('runeUpgradeKnowledge.gemQuantity', {
                  name: gemName,
                  count: recipe.gem.quantity
                })
              }}
            </div>
          </div>
        </template>

        <div class="flow-symbol flow-arrow" aria-hidden="true">→</div>
        <div class="material-tile material-result">
          <div class="material-image-frame row items-center justify-center">
            <img
              :src="`/images/items/rune/${outputImage.type}/${outputImage.key}.webp`"
              :class="runeImageClass(recipe.outputRune)"
              class="material-image"
              alt=""
            />
          </div>
          <div class="material-name text-weight-bold text-unique">
            {{ outputName }}
          </div>
        </div>
      </div>
      <div v-if="!recipe.gem" class="text-caption text-grey q-mt-sm">
        {{ t('runeUpgradeKnowledge.noGem') }}
      </div>
    </q-card-section>

    <q-separator />
    <q-card-section class="detail-block gap-notice">
      <div class="detail-title text-subtitle2">
        {{ t('runeUpgradeKnowledge.gapTitle') }}
      </div>
      <p class="text-body2 text-grey q-mb-none q-mt-sm">
        {{ t('runeUpgradeKnowledge.gapDescription') }}
      </p>
    </q-card-section>

    <q-separator />
    <q-card-section class="detail-block source-block">
      <div class="detail-title text-subtitle2">
        {{ t('runeUpgradeKnowledge.sourceTitle') }}
      </div>
      <p class="text-caption text-grey q-mb-sm q-mt-sm">
        {{ t('runeUpgradeKnowledge.sourceNotice') }}
      </p>
      <div class="column items-start q-gutter-y-xs">
        <a
          v-for="source in runeUpgradeSources"
          :key="source.key"
          :href="source.url"
          target="_blank"
          rel="noopener noreferrer"
        >{{ t(source.labelKey) }}</a>
      </div>
    </q-card-section>
  </div>
</template>

<style scoped>
.rune-upgrade-detail {
  min-height: 0;
}

.detail-hero {
  gap: 16px;
  padding: 18px;
  background: linear-gradient(135deg, rgba(217, 168, 121, 0.12), transparent 62%);
}

.detail-output-frame,
.material-image-frame {
  flex: 0 0 auto;
  border: 1px solid rgba(217, 168, 121, 0.28);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.18);
}

.detail-output-frame {
  width: 76px;
  height: 76px;
}

.detail-output-image {
  width: auto;
  height: 66px;
  object-fit: contain;
}

.detail-heading {
  min-width: 0;
}

.detail-actions {
  flex: 0 0 auto;
  margin: -8px -8px 0 8px;
}

.detail-block {
  padding: 16px 18px;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--q-primary);
}

.detail-title::before {
  content: '';
  width: 3px;
  height: 14px;
  background: currentColor;
}

.craft-flow {
  display: grid;
  grid-template-columns: minmax(72px, 1fr) auto minmax(72px, 1fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.craft-flow.with-gem {
  grid-template-columns: minmax(72px, 1fr) auto minmax(92px, 1.2fr) auto minmax(72px, 1fr);
}

.material-tile {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.material-name {
  display: flex;
  min-height: 44px;
  align-items: flex-start;
  justify-content: center;
  line-height: 1.45;
  word-break: keep-all;
}

.material-image-frame {
  width: 70px;
  height: 70px;
}

.material-image {
  width: auto;
  height: 60px;
  object-fit: contain;
}

.gem-image {
  width: 54px;
  height: 54px;
}

.legacy-rune-image {
  transform: scale(0.7);
}

.flow-symbol {
  flex: 0 0 auto;
  color: var(--q-grey-6);
  font-size: 1.25rem;
}

.flow-arrow {
  color: var(--q-primary);
  font-size: 1.6rem;
}

.material-result {
  border-radius: 4px;
  padding: 8px 4px;
  background: rgba(165, 146, 99, 0.09);
}

.source-block a {
  color: var(--q-primary);
  text-decoration: none;
}

.source-block a:hover {
  text-decoration: underline;
}

.body--light .detail-output-frame,
.body--light .material-image-frame {
  background: rgba(255, 255, 255, 0.5);
}

@media (max-width: 599px) {
  .detail-hero,
  .detail-block {
    padding: 14px;
  }

  .craft-flow {
    gap: 7px;
  }

  .craft-flow.with-gem {
    grid-template-columns: minmax(58px, 1fr) auto minmax(82px, 1.2fr) auto minmax(58px, 1fr);
  }

  .material-image-frame {
    width: 58px;
    height: 58px;
  }

  .material-image {
    height: 50px;
  }

  .gem-image {
    width: 44px;
    height: 44px;
  }
}
</style>
