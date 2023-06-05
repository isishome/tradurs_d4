<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { Offer, type Price } from 'src/types/item'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore } from 'src/stores/item-store'
import { icons } from 'src/common/icons'

import D4User from 'components/D4User.vue'
import D4Price from 'components/D4Price.vue'
import D4Tooltip from 'components/D4Tooltip.vue'

interface IProps {
  data: Offer,
  make?: boolean,
  disable?: boolean,
  progress?: boolean,
  owner?: boolean,
  evaluations?: Array<number>
}

const props = withDefaults(defineProps<IProps>(), {
  make: false,
  disable: false,
  progress: false,
  owner: false,
  evaluations: () => []
})

const emit = defineEmits(['make-offer', 'accept-offer', 'complete'])

const { t } = useI18n({ useScope: 'global' })
const $q = useQuasar()
const as = useAccountStore()
const is = useItemStore()

const _offer = reactive<Offer>(JSON.parse(JSON.stringify(props.data)))

const updatePrice = (price: Price) => {
  _offer.price.currency = price.currency
  _offer.price.currencyValue = price.currencyValue
  _offer.price.quantity = price.quantity
}

const makeOffer = () => {
  emit('make-offer', _offer)
}

const acceptOffer = () => {
  $q.dialog({
    title: t('accept.title'),
    message: `<div class="text-subtitle1">${t('accept.msg1')}</div><div class="q-mt-xs text-caption">${t('accept.msg2')}<strong class="text-negative">${t('accept.msg3')}</strong>${t('accept.msg4')}<strong class="text-negative">${t('accept.msg5')}</strong>${t('accept.msg6')}</div>`,
    html: true,
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey', outline: true },
    ok: { label: t('btn.accept'), color: 'primary', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'none',
    transitionHide: 'none',
    class: 'q-pa-sm'
  }).onOk(() => {
    emit('accept-offer', props.data)
  })
}

const complete = () => {
  $q.dialog({
    title: t('complete.title'),
    message: t('complete.message'),
    options: {
      color: 'primary',
      type: 'checkbox',
      model: [],
      // inline: true
      items: as.filterEvaluations()
    },
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey', outline: true },
    ok: { label: t('btn.submit'), color: 'primary', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'none',
    transitionHide: 'none',
    class: 'q-pa-sm'
  }).onOk((data) => {
    emit('complete', data)
  })
}

const isAcceptable = computed(() => props.data.itemStatusCode === '000' && props.owner)
const isTradeable = computed(() => props.data.statusCode === '003' && ((props.data.itemStatusCode === '003' && props.owner && props.evaluations.length === 0) || (props.data.authorized && props.data.evaluations.length === 0)))
const existsEvaluation = computed(() => props.evaluations.length > 0 || props.data.evaluations.length > 0)
const status = computed(() => is.findOfferStatus(props.data.statusCode)?.label)
const parsEvaluations = computed(() => props.owner ? as.filterEvaluations(props.data.evaluations) : props.data.authorized ? as.filterEvaluations(props.evaluations) : [])

</script>

<template>
  <q-form v-if="make" @submit="makeOffer" class="q-pt-md row justify-end items-center q-col-gutter-sm q-pa-md"
    :class="{ 'q-pt-lg': !$q.screen.lt.sm }">
    <div class="col">
      <D4Price offer :data="_offer.price" editable :disable="disable || progress" @update="updatePrice" />
    </div>
    <D4Btn :label="t('btn.offer')" :loading="data.loading" :disable="disable" :progress="progress" type="submit" />
  </q-form>
  <q-item v-else>
    <q-item-section>
      <q-item-label>
        <D4Price :data="data.price" :disable="disable" />
      </q-item-label>
      <q-item-label caption>
        <D4User :data="data.user" :label="t('offerer')" :disable="disable" :authorized="data.authorized" />
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <D4Btn v-if="isAcceptable" :label="t('btn.accept')" color="var(--q-secondary)" :loading="data.loading"
        :disable="disable" :progress="progress" @click="acceptOffer" />
      <D4Btn v-else-if="isTradeable" :label="t('btn.complete')" color="var(--q-primary)" :loading="data.loading"
        :disable="disable" :progress="progress" @click="complete" />
      <div v-else class="row items-start q-col-gutter-xs">
        <div>{{ status }}
        </div>
        <q-icon v-if="existsEvaluation" class="icon" :name="`img:${icons.evaluation}`" size="19px">
          <D4Tooltip>
            <div class="text-overline text-weight-bold">
              {{ t('complete.evaluate') }}
            </div>
            <div class="break-keep text-caption">
              <ul class="evaluation">
                <li v-for="evaluation, idx of parsEvaluations" :key="idx">
                  {{ evaluation.label }}
                </li>
              </ul>
            </div>
          </D4Tooltip>
        </q-icon>
      </div>
    </q-item-section>
  </q-item>
</template>

<style scoped>
.coin {
  filter: invert(65%) sepia(69%) saturate(606%) hue-rotate(3deg) brightness(110%) contrast(102%);
}

.evaluation {
  list-style-position: inside;
  padding-left: 0;
}
</style>