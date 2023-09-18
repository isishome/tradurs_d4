<script setup lang="ts">
import { ref, reactive, computed, onUnmounted, onMounted, defineAsyncComponent } from 'vue'
import { useQuasar, date } from 'quasar'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAccountStore, type IHistory } from 'src/stores/account-store'
import { Item, Price } from 'src/types/item'
import { sleep } from 'src/common'

const D4Item = defineAsyncComponent(() => import('components/D4Item.vue'))

const $q = useQuasar()
const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const as = useAccountStore()

const lang = route.params.lang || 'ko'
const loading = ref<boolean>(false)
const loadingItem = new Item()
loadingItem.quality = 'normal'
const historyType = ref<string>('item')
const historyTypes = as.historyTypes.data
const period = ref<number>(0)
const today = new Date()
const periodOptions = Array.from({ length: 3 }, (_, i) => ({ value: i, label: date.formatDate(date.subtractFromDate(today, { months: i }), 'YYYY-MM') }))

const more = computed(() => as.historyPage.nextHistoryId)
const history = reactive<Array<IHistory>>([])

const request = (reset: boolean = false) => {
  loading.value = true

  if (reset) {
    as.historyPage.nextHistoryId = null
    history.splice(0, history.length)
  }

  sleep(1000).then(() => {
    as.getHistory('diablo4', historyType.value, period.value)
      .then((data) => {
        data.forEach((d: IHistory) => {
          d.statusCode = '000'
          d.price = new Price()
          d.price.currency = d.price_currency
          d.price.currencyValue = d.price_currency_value
          d.price.quantity = d.price_quantity
          d.expanded = true
        })
        history.push(...data)
      })
      .catch(() => { })
      .then(() => {
        loading.value = false
      })
  })
}

onMounted(() => {
  request()
})

onUnmounted(() => {
  as.historyPage.nextHistoryId = null
})
</script>

<template>
  <div>
    <D4Note label="test" class="full-width">
      <p class="text-caption no-padding">{{ t('history.description1') }}</p>
      <p class="text-caption no-padding">{{ t('history.description2') }}</p>
    </D4Note>
    <div v-show="$q.screen.lt.sm" class="row justify-end item-center q-mb-sm">
      <q-select v-model="period" outlined dense no-error-icon hide-bottom-space emit-value map-options
        transition-show="none" transition-hide="none" :transition-duration="0" :label="t('history.period')"
        :options="periodOptions" dropdown-icon="img:/images/icons/dropdown.svg" popup-content-class="scroll bordered"
        :disable="loading" @update:model-value="request(true)" />
    </div>
    <div class="row justify-between items-end">
      <q-btn-toggle v-model="historyType" :dense="$q.screen.lt.sm" :spread="$q.screen.lt.sm" unelevated rounded no-caps
        :ripple="false" toggle-color="active" :options="historyTypes" class="tab" :class="{ 'col': $q.screen.lt.sm }"
        @update:model-value="request(true)" :disable="loading" />
      <q-select v-show="!$q.screen.lt.sm" v-model="period" outlined dense no-error-icon hide-bottom-space emit-value
        map-options transition-show="none" transition-hide="none" :transition-duration="0" :label="t('history.period')"
        :options="periodOptions" dropdown-icon="img:/images/icons/dropdown.svg" class="q-mb-xs"
        popup-content-class="scroll bordered" @update:model-value="request(true)" :disable="loading" />
    </div>
    <q-list bordered :class="$q.screen.lt.sm ? 'q-py-md q-pl-sm q-pr-lg' : 'q-py-lg q-pl-md q-pr-xl'">
      <q-timeline>
        <q-timeline-entry :tag="$q.screen.lt.sm ? 'h6' : 'h5'" heading>
          <q-skeleton v-show="loading" width="30%" height="36px" />
          <div v-show="!loading">{{ periodOptions.find(po => po.value === period)?.label }}</div>
        </q-timeline-entry>
        <q-timeline-entry v-for="(h, i) in history" :key="i" class="entry">
          <template v-slot:title>
            <div class="row items-center q-gutter-x-md text-body1">
              <div>{{ h.actionName }}</div>
              <div v-if="historyType === 'temperature'">
                {{ h.contents.degree as number > 0 ? t('history.temperatureRise', { degree: h.contents.degree }) :
                  t('history.temperatureDrop', { degree: h.contents.degree }) }}
              </div>
              <div v-else-if="historyType === 'yolk'">
                {{ h.contents.amount as number > 0 ? t('history.yolkRise', { amount: h.contents.amount }) :
                  t('history.yolkDrop', { amount: h.contents.amount }) }}
              </div>
            </div>
          </template>
          <template v-slot:subtitle>
            {{ (new Date(h.regDate)).toLocaleString(lang) }}
          </template>
          <D4Item v-if="h.itemId" :data="h" history></D4Item>
        </q-timeline-entry>
        <q-timeline-entry v-if="!loading && history.length === 0" heading tag="div" class="text-center q-pb-xl">
          {{ t('history.noData') }}
        </q-timeline-entry>
        <div v-if="loading">
          <q-timeline-entry v-for="c in 3" :key="c" color="grey-8">
            <template v-slot:title>
              <q-skeleton width="50%" />
            </template>
            <template v-slot:subtitle>
              <div class="row q-gutter-x-xs item-center">
                <q-skeleton class="col-2" />
                <q-skeleton class="col-1" />
              </div>
            </template>
            <D4Item :data="loadingItem" loading style="max-height:200px" />
          </q-timeline-entry>
        </div>
      </q-timeline>
      <div v-show="more" class="row justify-center items-center">
        <q-btn :loading="loading" no-caps unelevated aria-label="Tradurs More Button" :ripple="false" class="no-hover"
          :label="t('btn.showMore')" color="primary" @click="request()" />
      </div>
    </q-list>

  </div>
</template>
<style scoped>
.tab {
  border-radius: 0;
}

.tab:deep(button) {
  border: none !important;
  box-shadow: inset 0 1px 0 1px rgba(255, 255, 255, 0.28), 0 1px 0 0 var(--q-dark-page);
  border-radius: 4px 4px 0 0 !important;
  background-color: var(--q-dark);
  opacity: .4 !important;
}

.body--light .tab:deep(button) {
  box-shadow: inset 0 1px 0 1px rgba(0, 0, 0, 0.12), 0 1px 0 0 var(--q-light-page);
  background-color: var(--q-light);
}

.tab:deep(.bg-active) {
  opacity: 1 !important;
  background-color: var(--q-dark-page);
  font-weight: 700;
}

.body--light .tab:deep(.bg-active) {
  background-color: var(--q-light-page);
  color: currentColor !important;
}

.entry:deep(.q-timeline__content) {
  padding-bottom: 48px;
}
</style>