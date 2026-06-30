<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <q-icon class="icon" name="img:/images/icons/help.svg" size="19px">
    <D4Tooltip>
      <div class="text-caption mythic-conversion-tooltip">
        <div class="text-weight-bold">
          {{ t('season14.mythicConversion.title') }}
        </div>
        <div>
          {{ t('season14.mythicConversion.description') }}
        </div>
      </div>
    </D4Tooltip>
  </q-icon>
</template>

<style scoped>
.mythic-conversion-tooltip {
  max-width: 260px;
  line-height: 1.5;
}
</style>
