<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useItemStore, type FixedItem } from 'stores/item-store'
import D4RunewordSequence from 'components/D4RunewordSequence.vue'
import type { LegacyRunewordDefinition } from 'src/data/legacy-runewords'

const props = defineProps<{
  definition: LegacyRunewordDefinition
  modelValue?: number
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void
}>()

const { t, locale } = useI18n({ useScope: 'global' })
const is = useItemStore()

const localeKey = computed<'ko' | 'en'>(() =>
  locale.value.toLowerCase().startsWith('ko') ? 'ko' : 'en'
)

const variants = computed<FixedItem[]>(() =>
  props.definition.fixedItemIds
    .map((id) => is.fixedItems.data.find((item) => item.value === id))
    .filter((item): item is FixedItem => item !== undefined)
)

const equipmentLabel = (item: FixedItem) =>
  is.findEquipClass(item.equipmentClass)?.label ?? item.equipmentClass ?? ''

const variantOptions = computed(() =>
  variants.value.map((item) => ({
    value: item.value,
    label: equipmentLabel(item),
    quality: item.quality,
    sort: item.sort
  }))
)

const selectedVariant = computed(() =>
  variants.value.find((item) => item.value === props.modelValue)
)

const selectedFixedItemId = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (value !== undefined) emit('update:modelValue', value)
  }
})

const name = computed(
  () => variants.value[0]?.label ?? props.definition.name[localeKey.value]
)

const templateLabel = (label?: string) => label?.replaceAll('{x}', '?') ?? ''

const isUniqueAffix = (id: number) => is.findAffix(id)?.type === 'unique'

type TemplateSegment = { text?: string; figure?: string }

const templateSegments = (label?: string): TemplateSegment[] =>
  (label ?? '')
    .split('{x}')
    .flatMap((text, idx) =>
      idx === 0 ? [{ text }] : [{ figure: '?' }, { text }]
    )
    .filter((segment: TemplateSegment) => segment.figure || segment.text)
</script>

<template>
  <div class="runeword-detail column no-wrap">
    <q-card-section class="detail-hero row no-wrap items-start">
      <div class="detail-image-frame">
        <q-img
          v-if="selectedVariant"
          :src="`/images/items/fixed/${selectedVariant.quality}-${selectedVariant.sort}.webp`"
          width="92px"
          height="112px"
          fit="contain"
          class="detail-image"
        />
      </div>
      <div class="col detail-heading">
        <div class="row no-wrap items-start justify-between">
          <div class="name text-unique">
            {{ name }}
          </div>
          <div v-if="$slots.actions" class="detail-actions">
            <slot name="actions"></slot>
          </div>
        </div>
        <D4RunewordSequence
          separated
          :rune-codes="definition.runeCodes"
          class="q-mt-sm"
        />
        <div class="text-caption text-grey q-mt-sm">
          {{ t('runewordKnowledge.recipeOrder') }}
        </div>
      </div>
    </q-card-section>

    <q-separator />
    <q-card-section class="detail-block">
      <div class="detail-title text-subtitle2">
        {{ t('runewordKnowledge.base') }}
      </div>
      <q-select
        v-model="selectedFixedItemId"
        class="runeword-variant-select q-mt-sm"
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
      <q-card-section class="detail-block">
        <div class="detail-title text-subtitle2">{{ t('properties') }}</div>
        <ul class="detail-values">
          <li v-for="id in selectedVariant.properties" :key="`property-${id}`">
            {{ templateLabel(is.findProperty(id)?.label) }}
          </li>
        </ul>
      </q-card-section>

      <q-separator />
      <q-card-section class="detail-block">
        <div class="detail-title text-subtitle2">{{ t('affixes') }}</div>
        <ul class="detail-values affix-values">
          <li
            v-for="id in selectedVariant.affixes"
            :key="`affix-${id}`"
            :class="{ 'unique-affix': isUniqueAffix(id) }"
          >
            <template v-if="isUniqueAffix(id)">
              <img
                class="affix-icon"
                src="/images/attribute_types/unique.svg"
                width="10"
                height="10"
                alt=""
              />
              <span class="affix-text">
                <template
                  v-for="(segment, idx) in templateSegments(
                    is.findAffix(id)?.label
                  )"
                  :key="idx"
                >
                  <span v-if="segment.figure" class="figure">{{
                    segment.figure
                  }}</span>
                  <template v-else>{{ segment.text }}</template>
                </template>
              </span>
            </template>
            <span v-else class="affix-text">
              {{ templateLabel(is.findAffix(id)?.label) }}
            </span>
          </li>
        </ul>
      </q-card-section>

      <template v-if="selectedVariant.restrictions?.length">
        <q-separator />
        <q-card-section class="detail-block">
          <div class="detail-title text-subtitle2">{{ t('restrictions') }}</div>
          <div class="restriction-list row q-gutter-xs q-mt-sm">
            <q-badge
              v-for="id in selectedVariant.restrictions"
              :key="`restriction-${id}`"
              outline
              color="primary"
              :label="templateLabel(is.findRestriction(id)?.label)"
            />
          </div>
        </q-card-section>
      </template>
    </template>

    <q-card-section class="value-notice text-caption text-grey">
      {{ t('runewordKnowledge.valueNotice') }}
    </q-card-section>
  </div>
</template>

<style scoped>
.runeword-detail {
  min-height: 0;
}

.detail-hero {
  gap: 18px;
  padding: 18px;
  background: linear-gradient(
    135deg,
    rgba(217, 168, 121, 0.12),
    transparent 62%
  );
}

.detail-image-frame {
  flex: 0 0 auto;
  padding: 6px;
  border: 1px solid rgba(217, 168, 121, 0.32);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.18);
}

.detail-image {
  display: block;
}

.detail-heading {
  min-width: 0;
  padding-top: 4px;
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

.runeword-variant-select :deep(.q-field__control),
.runeword-variant-select :deep(.q-field__marginal) {
  min-height: 34px;
}

.detail-values {
  display: grid;
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.detail-values li {
  position: relative;
  padding-left: 16px;
  line-height: 1.45;
}

.detail-values li::before {
  content: '◆';
  position: absolute;
  top: 0.12em;
  left: 1px;
  color: var(--q-primary);
  font-size: 7px;
}

.detail-values.affix-values li {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 0;
}

.detail-values.affix-values li::before {
  position: static;
  flex: 0 0 10px;
  text-align: center;
}

.detail-values.affix-values li.unique-affix::before {
  content: none;
}

.affix-icon {
  flex: 0 0 10px;
  filter: var(--q-filter-unique);
}

.affix-text {
  min-width: 0;
}

.unique-affix .affix-text {
  font-weight: 700;
}

.body--dark .unique-affix .affix-text {
  color: var(--q-unique);
}

.unique-affix .figure {
  color: rgb(123, 123, 234);
}

.body--dark .unique-affix .figure {
  color: rgb(163, 163, 234);
}

.restriction-list :deep(.q-badge) {
  padding: 4px 7px;
}

.value-notice {
  margin-top: auto;
  padding: 14px 18px 18px;
  line-height: 1.5;
}

.body--light .detail-image-frame {
  background: rgba(255, 255, 255, 0.5);
}

@media (max-width: 599px) {
  .detail-hero {
    gap: 12px;
    padding: 14px;
  }

  .detail-image-frame {
    padding: 4px;
  }

  .detail-image {
    width: 72px !important;
    height: 92px !important;
  }

  .detail-block {
    padding: 14px;
  }

  .value-notice {
    padding: 12px 14px 18px;
  }
}
</style>
