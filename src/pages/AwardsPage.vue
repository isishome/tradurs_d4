<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import {
  type Awards,
  type Award,
  type Gem,
  type Elixir,
  useItemStore,
  Summoning
} from 'src/stores/item-store'

import D4Award from 'components/D4Award.vue'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const is = useItemStore()

const loading = ref<boolean>(true)
const awards: Awards = reactive({
  highPriced: [
    {
      ranking: 1,
      battleTag: '',
      itemName: '',
      itemType: '',
      itemTypeValue1: '',
      imageId: 0,
      price: 0
    }
  ],
  bestManners: [
    {
      ranking: 1,
      temperature: 0,
      battleTag: ''
    }
  ],
  mostSold: [
    {
      ranking: 1,
      items: 0,
      battleTag: ''
    }
  ],
  mostPurchased: [
    {
      ranking: 1,
      items: 0,
      battleTag: ''
    }
  ]
})
const itemName = computed(
  () =>
    (
      itemName?: string,
      itemType?: string,
      typeValue1?: string,
      typeValue2?: string
    ) =>
      (itemType === 'rune'
        ? `${is.findRune(typeValue2 ?? '')?.label} ${
            is.findType('rune')?.label
          }`
        : itemType === 'aspect'
        ? is.findAspect(Number(typeValue2))?.aspectName
        : typeValue1 === 'gem'
        ? is.gems.find((g: Gem) => g.value === typeValue2)?.label || null
        : typeValue1 === 'elixir'
        ? is.elixirs.find((e: Elixir) => e.value === typeValue2)?.label || null
        : typeValue1 === 'summoning'
        ? is.summonings.find((s: Summoning) => s.value === typeValue2)?.label ||
          null
        : itemName) ?? t('item.unknown')
)

const itemImage = computed(
  () => (awards: Award) =>
    awards.itemType === 'rune'
      ? `/images/items/rune/${awards.itemTypeValue1}/${awards.itemTypeValue2}.webp`
      : awards.itemType === 'aspect'
      ? `/images/items/aspect/legendary/${awards.itemTypeValue2}.webp`
      : ['gem', 'summoning'].includes(awards.itemTypeValue1 ?? '')
      ? `/images/items/${awards.itemType}/${awards.itemTypeValue1}/${awards.itemTypeValue2}.webp`
      : awards.itemTypeValue1 === 'elixir'
      ? `/images/items/${awards.itemType}/${awards.itemTypeValue1}/${
          (awards.itemTypeValue2 ?? '').split('_')[1]
        }.webp`
      : `/images/items/${awards.itemType}/${awards.itemTypeValue1}/${awards.imageId}.webp`
)

const noData = computed(
  () =>
    !loading.value &&
    (awards.highPriced?.length || 0) +
      (awards.bestManners?.length || 0) +
      (awards.mostSold?.length || 0) +
      (awards.mostPurchased?.length || 0) ===
      0
)

is.getAwards()
  .then((data) => {
    Object.assign(awards, {
      highPriced: [],
      bestManners: [],
      mostSold: [],
      mostPurchased: []
    })

    Object.assign(awards, data)
  })
  .catch(() => {
    {
    }
  })
  .then(() => {
    loading.value = false
  })
</script>

<template>
  <div class="column items-center">
    <div class="top-space full-width"></div>
    <!-- <D4Note label="test" class="full-width">
      <p class="text-caption no-padding">{{ t('awards.description') }}</p>
    </D4Note> -->
    <D4Award v-if="awards.highPriced.length > 0" :loading="loading">
      <template #category>
        {{ t('awards.highPriced.category') }}
      </template>
      <template #item-name>
        <div class="row justify-center">
          <q-item
            dense
            class="rounded-borders item-name text-body1 text-weight-bold text-amber-8"
            :to="{
              name: 'itemInfo',
              params: {
                lang: route.params.lang,
                itemid: awards.highPriced[0]?.itemId
              }
            }"
          >
            <q-item-section avatar>
              <q-img :src="itemImage(awards.highPriced[0])" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{
                  itemName(
                    awards.highPriced[0]?.itemName,
                    awards.highPriced[0]?.itemType,
                    awards.highPriced[0]?.itemTypeValue1,
                    awards.highPriced[0]?.itemTypeValue2
                  )
                }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <img
                :src="'/images/icons/open.svg'"
                class="icon"
                width="18"
                height="18"
                alt="Tradurs Favorite Icon"
              />
            </q-item-section>
          </q-item>
        </div>
      </template>
      <template #detail>
        <div class="text-h6 text-center text-weight-bold">
          {{
            $n(
              Number.parseFloat(awards.highPriced[0]?.price as string),
              'decimal',
              { notation: 'compact' }
            )
          }}
        </div>
      </template>
      <template #battleTag>
        {{ awards.highPriced[0]?.ranking }}.
        {{ awards.highPriced[0]?.battleTag }}
      </template>
      <template #etc>
        <q-separator v-show="awards.highPriced.length > 1" />
        <q-list separator class="rounded-borders">
          <q-item
            v-for="(ranker, idx) in awards.highPriced.slice(
              1,
              awards.highPriced.length
            )"
            :key="idx"
            class="etc"
            :to="{
              name: 'itemInfo',
              params: { lang: route.params.lang, itemid: ranker?.itemId }
            }"
          >
            <q-item-section>
              <q-item-label>
                {{ ranker?.ranking }}.
                {{
                  itemName(
                    ranker?.itemName,
                    ranker?.itemType,
                    ranker?.itemTypeValue1,
                    ranker?.itemTypeValue2
                  )
                }}
              </q-item-label>
              <q-item-label class="text-right">{{
                ranker?.battleTag
              }}</q-item-label>
              <q-item-label caption class="text-right">{{
                $n(Number.parseFloat(ranker?.price as string), 'decimal', {
                  notation: 'compact'
                })
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
        + {{ awards.bestManners[0]?.good }}<span>&#8451;</span>
      </template>

      <template #battleTag>
        1. {{ awards.bestManners[0]?.battleTag }}
      </template>

      <template #etc>
        <div
          class="text-overline etc"
          v-for="(ranker, idx) in awards.bestManners.slice(
            1,
            awards.bestManners.length
          )"
          :key="idx"
        >
          {{ ranker?.ranking }}. {{ ranker?.battleTag }} + {{ ranker?.good
          }}<span>&#8451;</span>
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

      <template #battleTag> 1. {{ awards.mostSold[0]?.battleTag }} </template>

      <template #etc>
        <div
          class="text-overline etc"
          v-for="(ranker, idx) in awards.mostSold.slice(
            1,
            awards.mostSold.length
          )"
          :key="idx"
        >
          {{ ranker?.ranking }}. {{ ranker?.battleTag }} - {{ ranker?.items
          }}{{ t('awards.mostSold.unit') }}
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
        <div
          class="text-overline etc"
          v-for="(ranker, idx) in awards.mostPurchased.slice(
            1,
            awards.mostPurchased.length
          )"
          :key="idx"
        >
          {{ ranker?.ranking }}. {{ ranker?.battleTag }} - {{ ranker?.items
          }}{{ t('awards.mostPurchased.unit') }}
        </div>
      </template>

      <template #desc>
        {{ t('awards.mostPurchased.desc') }}
      </template>
    </D4Award>
    <div v-show="noData" class="row items-center" style="min-height: 40vh">
      {{ t('awards.noData') }}
    </div>
  </div>
</template>

<style scoped>
.etc {
  line-height: 1.2;
}

.etc:nth-child(1) {
  font-size: 13px;
  opacity: 0.7;
}

.etc:nth-child(2) {
  font-size: 12px;
  opacity: 0.6;
}

.etc:nth-child(3) {
  font-size: 11px;
  opacity: 0.5;
}

.etc:nth-child(4) {
  font-size: 10px;
  opacity: 0.4;
}

.item-name {
  position: absolute;
  top: -38px;
  z-index: 2;
}
</style>
