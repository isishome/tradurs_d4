<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const D4Award = defineAsyncComponent(() => import('components/D4Award.vue'))

const { t } = useI18n({ useScope: 'global' })

const awards = {
  bestManners: {
    temperature: 20,
    battleTag: '숨겨진오징어#38709'
  },
  mostSold: {
    count: 10,
    battleTag: '강남스타일#33323'
  },
  mostPurchased: {
    count: 50,
    battleTag: '바람#324239'
  }
}
</script>
<template>
  <div class="column items-center">
    <D4Award v-if="awards.bestManners">
      <template #category>
        {{ t('awards.bestManners.category') }}
      </template>
      <template #detail>
        {{ awards.bestManners.temperature }}&#8451
      </template>
      <template #battleTag>
        {{ awards.bestManners.battleTag }}
      </template>
      <template #desc>
        {{ t('awards.bestManners.desc') }}
      </template>
    </D4Award>
    <D4Award v-if="awards.mostSold">
      <template #category>
        {{ t('awards.mostSold.category') }}
      </template>
      <template #detail>
        {{ awards.mostSold.count }}{{ t('awards.mostSold.unit') }}
      </template>
      <template #battleTag>
        {{ awards.mostSold.battleTag }}
      </template>
      <template #desc>
        {{ t('awards.mostSold.desc') }}
      </template>
    </D4Award>
    <D4Award v-if="awards.mostPurchased">
      <template #category>
        {{ t('awards.mostPurchased.category') }}
      </template>
      <template #detail>
        {{ awards.mostPurchased.count }}{{ t('awards.mostPurchased.unit') }}
      </template>
      <template #battleTag>
        {{ awards.mostPurchased.battleTag }}
      </template>
      <template #desc>
        {{ t('awards.mostPurchased.desc') }}
      </template>
    </D4Award>
  </div>
</template>