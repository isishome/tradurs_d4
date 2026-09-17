<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  legacyRuneLabel,
  type LegacyRuneCode
} from 'src/data/legacy-runewords'

const props = withDefaults(
  defineProps<{
    runeCodes: readonly LegacyRuneCode[]
    separated?: boolean
  }>(),
  { separated: false }
)

const { locale } = useI18n({ useScope: 'global' })
const labels = computed(() =>
  props.runeCodes.map((code) => legacyRuneLabel(code, locale.value))
)
const accessibleLabel = computed(() => labels.value.join(' + '))
</script>

<template>
  <div
    class="runeword-sequence row items-center"
    :class="{ separated }"
    :aria-label="accessibleLabel"
  >
    <template v-for="(label, index) in labels" :key="`${runeCodes[index]}-${index}`">
      <span v-if="separated && index > 0" class="separator" aria-hidden="true">+</span>
      <span>{{ label }}</span>
    </template>
  </div>
</template>

<style scoped>
.runeword-sequence {
  color: var(--q-light);
  font-size: 0.95rem;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

.runeword-sequence.separated {
  gap: 6px;
  color: var(--q-unique);
  font-weight: 600;
}

.separator {
  color: var(--q-grey-6);
  font-weight: 400;
}

.body--light .runeword-sequence:not(.separated) {
  color: var(--q-dark);
}
</style>
