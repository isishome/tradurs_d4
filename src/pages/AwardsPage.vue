<script setup lang="ts">
import { ref, computed, defineAsyncComponent, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { type Awards, useItemStore } from 'src/stores/item-store'

const D4Award = defineAsyncComponent(() => import('components/D4Award.vue'))

const { t, n } = useI18n({ useScope: 'global' })
const is = useItemStore()

const loading = ref<boolean>(true)
const awards: Awards = reactive({
  highPriced: [{
    ranking: 1,
    battleTag: '',
    itemName: '',
    itemType: '',
    itemTypeValue1: '',
    imageId: 0,
    price: 0
  }],
  bestManners: [{
    ranking: 1,
    temperature: 0,
    battleTag: ''
  }],
  mostSold: [{
    ranking: 1,
    items: 0,
    battleTag: ''
  }],
  mostPurchased: [{
    ranking: 1,
    items: 0,
    battleTag: ''
  }]
})
const noData = computed(() => !loading.value && (awards.bestManners?.length || 0) + (awards.mostSold?.length || 0) + (awards.mostPurchased?.length || 0) === 0)

is.getAwards()
  .then((data) => {
    Object.assign(awards, { highPriced: [], bestManners: [], mostSold: [], mostPurchased: [] })
    Object.assign(awards, data)
  })
  .catch(() => { { } })
  .then(() => {
    loading.value = false
  })
</script>
<template>
  <div class="column items-center">
    <D4Award v-if="awards.highPriced.length > 0" :loading="loading"
      :image="awards.highPriced[0]?.itemType === 'aspect' ? `/images/items/${awards.highPriced[0]?.itemType}/${awards.highPriced[0]?.itemTypeValue1}.webp` : awards.highPriced[0]?.itemTypeValue1 === 'gem' ? `/images/items/${awards.highPriced[0]?.itemType}/${awards.highPriced[0]?.itemTypeValue1}/${awards.highPriced[0]?.itemTypeValue2}.webp` : `/images/items/${awards.highPriced[0]?.itemType}/${awards.highPriced[0]?.itemTypeValue1}/${awards.highPriced[0]?.imageId}.webp`">
      <template #category>
        {{ t('awards.highPriced.category') }}
      </template>
      <template #item-name>
        {{ awards.highPriced[0]?.itemName }}
      </template>
      <template #detail>
        <div class="text-h6 text-center text-weight-bold">
          {{ n(awards.highPriced[0]?.price as number, 'decimal') }}
        </div>
      </template>
      <template #battleTag>
        {{ awards.highPriced[0]?.battleTag }}
      </template>
      <template #etc>
        <div class="text-overline etc" v-for="ranker, idx in awards.highPriced.slice(1, awards.highPriced.length)"
          :key="idx">
          {{ ranker?.ranking }}. {{ ranker?.battleTag }} - [{{ ranker?.itemName }}] {{ n(ranker?.price as number,
            'decimal')
          }}
        </div>
      </template>
      <template #desc>
        {{ t('awards.bestManners.desc') }}
      </template>
    </D4Award>
    <D4Award v-if="awards.bestManners.length > 0" :loading="loading">
      <template #category>
        {{ t('awards.bestManners.category') }}
      </template>
      <template #detail>
        {{ awards.bestManners[0]?.temperature }}&#8451
      </template>
      <template #battleTag>
        {{ awards.bestManners[0]?.battleTag }}
      </template>
      <template #etc>
        <div class="text-overline etc" v-for="ranker, idx in awards.bestManners.slice(1, awards.bestManners.length)"
          :key="idx">
          {{ ranker?.ranking }}. {{ ranker?.battleTag }} - {{ ranker?.temperature }}&#8451
        </div>
      </template>
      <template #desc>
        {{ t('awards.bestManners.desc') }}
      </template>
    </D4Award>
    <D4Award v-if="awards.mostSold.length > 0" :loading="loading">
      <template #category>
        {{ t('awards.mostSold.category') }}
      </template>
      <template #detail>
        {{ awards.mostSold[0]?.items }}{{ t('awards.mostSold.unit') }}
      </template>
      <template #battleTag>
        1. {{ awards.mostSold[0]?.battleTag }}
      </template>
      <template #etc>
        <div class="text-overline etc" v-for="ranker, idx in awards.mostSold.slice(1, awards.mostSold.length)" :key="idx">
          {{ ranker?.ranking }}. {{ ranker?.battleTag }} - {{ ranker?.items }}{{ t('awards.mostSold.unit') }}
        </div>
      </template>
      <template v-if="awards.mostSold.length > 0" #desc>
        {{ t('awards.mostSold.desc') }}
      </template>
    </D4Award>
    <D4Award v-if="awards.mostPurchased.length > 0" :loading="loading">
      <template #category>
        {{ t('awards.mostPurchased.category') }}
      </template>
      <template #detail>
        {{ awards.mostPurchased[0]?.items }}{{ t('awards.mostPurchased.unit') }}
      </template>
      <template #battleTag>
        {{ awards.mostPurchased[0]?.battleTag }}
      </template>
      <template #desc>
        {{ t('awards.mostPurchased.desc') }}
      </template>
    </D4Award>
    <div v-show="noData" class="row items-center" style="min-height: 40vh;">
      {{ t('awards.noData') }}</div>
  </div>
</template>
<style scoped>
.etc {
  line-height: 1.2;
}

.etc:nth-child(1) {
  font-size: 12px;
  opacity: .4;
}

.etc:nth-child(2) {
  font-size: 11px;
  opacity: .2;
}
</style>