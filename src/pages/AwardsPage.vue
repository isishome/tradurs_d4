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
    //Object.assign(awards, data)
    Object.assign(awards, {
      "highPriced": [
        {
          "ranking": "1",
          "battleTag": "현명한다홍전차#31427",
          "itemName": "명예의 중재자",
          "itemType": "accesesory",
          "itemTypeValue1": "amulet",
          "itemTypeValue2": "",
          "imageId": 0,
          "price": "900000000"
        },
        {
          "ranking": "2",
          "battleTag": "로크#31810",
          "itemName": "기념비적인 연결체",
          "itemType": "accesesory",
          "itemTypeValue1": "amulet",
          "itemTypeValue2": "",
          "imageId": 37,
          "price": "90000000"
        },
        {
          "ranking": "3",
          "battleTag": "정의구현#31557",
          "itemName": "SS 뼈의 달음질 (피감(준으뜸),방어도(준으뜸),최생,모능)",
          "itemType": "armor",
          "itemTypeValue1": "pants",
          "itemTypeValue2": "",
          "imageId": 0,
          "price": "9000000"
        },
        {
          "ranking": "4",
          "battleTag": "코붕이#3516",
          "itemName": "야수의 전통",
          "itemType": "weapon",
          "itemTypeValue1": "focus",
          "itemTypeValue2": "",
          "imageId": 0,
          "price": "9000000"
        }
      ],
      "bestManners": [
        {
          "ranking": "1",
          "battleTag": "사랑#64421",
          "temperature": 3.1
        },
        {
          "ranking": "2",
          "battleTag": "시가#3271",
          "temperature": 6.5
        },
        {
          "ranking": "3",
          "battleTag": "럭스#31227",
          "temperature": 5.1
        },
        {
          "ranking": "4",
          "battleTag": "최태공#31975",
          "temperature": 3.3
        }
      ],
      "mostSold": [
        {
          "ranking": "1",
          "battleTag": "디아블로잉#37066",
          "items": "10"
        },
        {
          "ranking": "2",
          "battleTag": "사랑#64421",
          "items": "10"
        },
        {
          "ranking": "3",
          "battleTag": "프로#31682",
          "items": "9"
        },
        {
          "ranking": "4",
          "battleTag": "현명한금빛임프#3124",
          "items": "9"
        }
      ],
      "mostPurchased": [
        {
          "ranking": "1",
          "battleTag": "불곰#31810",
          "items": "16"
        },
        {
          "ranking": "2",
          "battleTag": "루팡#3483",
          "items": "14"
        },
        {
          "ranking": "3",
          "battleTag": "안티#3436",
          "items": "11"
        },
        {
          "ranking": "4",
          "battleTag": "junghc#31114",
          "items": "11"
        }
      ]
    })
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
        <div class="text-body1 text-center text-weight-bold">
          {{ n(Number.parseFloat(awards.highPriced[0]?.price as string), 'decimal') }}
        </div>
      </template>
      <template #battleTag>
        1. {{ awards.highPriced[0]?.battleTag }}
      </template>
      <template #etc>
        <q-list separator>
          <q-item v-for="ranker, idx in awards.highPriced.slice(1, awards.highPriced.length)" :key="idx" class="etc">
            <q-item-section>
              <q-item-label>{{ ranker?.ranking }}. [{{ ranker?.itemName }}]</q-item-label>
              <q-item-label class="text-right">{{ ranker?.battleTag }}</q-item-label>
              <q-item-label caption class="text-right">{{ n(Number.parseFloat(ranker?.price as string), 'decimal')
              }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
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
        1. {{ awards.bestManners[0]?.battleTag }}
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
      <template #desc>
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
        1. {{ awards.mostPurchased[0]?.battleTag }}
      </template>
      <template #etc>
        <div class="text-overline etc" v-for="ranker, idx in awards.mostPurchased.slice(1, awards.mostPurchased.length)"
          :key="idx">
          {{ ranker?.ranking }}. {{ ranker?.battleTag }} - {{ ranker?.items }}{{ t('awards.mostPurchased.unit') }}
        </div>
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
  opacity: .3;
}

.etc:nth-child(3) {
  font-size: 11px;
  opacity: .2;
}
</style>