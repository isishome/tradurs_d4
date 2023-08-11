<script setup lang="ts">
import { reactive, computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { Offer, type Price } from 'src/types/item'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore } from 'src/stores/item-store'

const D4User = defineAsyncComponent(() => import('components/D4User.vue'))
const D4Price = defineAsyncComponent(() => import('components/D4Price.vue'))

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

const emit = defineEmits(['make-offer', 'accept-offer', 'retract-offer', 'turndown-offer', 'complete'])

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
    cancel: { label: t('btn.cancel'), noCaps: true, color: 'grey', outline: true },
    ok: { label: t('btn.accept'), noCaps: true, color: 'primary', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'none',
    transitionHide: 'none',
    noRouteDismiss: true,
    class: 'q-pa-sm'
  }).onOk(() => {
    emit('accept-offer', props.data)
  })
}

const retractOffer = () => {
  $q.dialog({
    title: t('retract.title'),
    message: `<div class="text-subtitle1">${t('retract.msg')}</div><div class="q-mt-md text-caption text-negative text-right">${t('retract.desc')}</div>`,
    html: true,
    persistent: true,
    cancel: { label: t('btn.cancel'), noCaps: true, color: 'grey', outline: true },
    ok: { label: t('btn.retractOffer'), noCaps: true, color: 'primary', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'none',
    transitionHide: 'none',
    noRouteDismiss: true,
    class: 'q-pa-sm'
  }).onOk(() => {
    emit('retract-offer', props.data)
  })
}

const turnDownOffer = () => {
  $q.dialog({
    title: t('turnDown.title'),
    message: `<div class="text-subtitle1">${t('turnDown.msg')}</div>`,
    html: true,
    persistent: true,
    cancel: { label: t('btn.cancel'), noCaps: true, color: 'grey', outline: true },
    ok: { label: t('btn.turnDownOffer'), noCaps: true, color: 'primary', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'none',
    transitionHide: 'none',
    noRouteDismiss: true,
    class: 'q-pa-sm'
  }).onOk(() => {
    emit('turndown-offer', props.data)
  })
}

const complete = () => {
  $q.dialog({
    title: t('complete.title'),
    message: t('complete.message'),
    options: {
      type: 'checkbox',
      model: [],
      size: 'sm',
      items: as.filterEvaluations()
    },
    persistent: true,
    cancel: { label: t('btn.cancel'), noCaps: true, color: 'grey', outline: true },
    ok: { label: t('btn.submit'), noCaps: true, color: 'primary', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'none',
    transitionHide: 'none',
    noRouteDismiss: true,
    class: 'q-pa-sm evaluations scroll'
  }).onOk((data) => {
    emit('complete', data)
  })
}

const isAcceptable = computed(() => props.data.itemStatusCode === '000' && props.data.statusCode === '000' && props.owner)
const isRetractable = computed(() => props.data.itemStatusCode === '000' && props.data.statusCode === '000' && props.data.authorized && props.data.retractable)
const isTradeable = computed(() => (props.data.statusCode === '003' && props.data.authorized) || (props.data.itemStatusCode === '003' && props.owner))
const existsEvaluation = computed(() => (props.data.statusCode === '001' && props.owner) || (props.data.statusCode === '001' && props.data.authorized))
const status = computed(() => is.findOfferStatus(props.data.statusCode)?.label)
const parsEvaluations = computed(() => props.owner ? as.filterEvaluations(props.evaluations) : props.data.authorized ? as.filterEvaluations(props.data.evaluations) : [])
</script>

<template>
  <q-form v-if="make" @submit="makeOffer" class="q-pt-md row justify-end items-center q-col-gutter-sm q-pa-md"
    :class="{ 'q-pt-lg': !$q.screen.lt.sm }">
    <div class="col">
      <D4Price offer :data="_offer.price" editable :disable="disable || progress" @update="updatePrice" />
    </div>
    <D4Btn :label="t('btn.offer')" :loading="data.loading" :disable="disable" :progress="progress" type="submit" />
  </q-form>
  <div v-else>
    <q-item>
      <q-item-section>
        <q-item-label>
          <D4Price :data="data.price" :disable="disable" />
        </q-item-label>
        <q-item-label caption>
          <D4User :data="data.user" :label="t('offerer')" :disable="disable" :authorized="data.authorized" />
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item class="q-px-sm">
      <q-item-section v-show="data.loading">
        <q-skeleton class="self-end" width="100px" :height="$q.screen.lt.sm ? '24px' : '36px'" />
      </q-item-section>
      <q-item-section v-show="!data.loading">
        <div class="row justify-end items-center q-gutter-x-sm">
          <template v-if="isAcceptable">
            <D4Btn :label="t('btn.turnDown')" color="var(--q-secondary)" :loading="data.loading" :disable="disable"
              :progress="progress" @click="turnDownOffer" />
            <D4Btn :label="t('btn.accept')" color="var(--q-primary)" :loading="data.loading" :disable="disable"
              :progress="progress" @click="acceptOffer" />
          </template>
          <D4Btn v-else-if="isRetractable" :label="t('btn.retractOffer')" color="var(--q-secondary)"
            :loading="data.loading" :disable="disable" :progress="progress" @click="retractOffer" />
          <D4Btn v-else-if="isTradeable" :label="t('btn.complete')" color="var(--q-primary)" :loading="data.loading"
            :disable="disable" :progress="progress" @click="complete" />
          <div v-else class="row items-start q-col-gutter-xs">
            <div>{{ status }}
            </div>
            <q-icon v-if="existsEvaluation" class="icon" name="img:/images/icons/evaluation.svg" size="19px">
              <D4Tooltip>
                <div class="text-overline text-weight-bold">
                  {{ parsEvaluations.length === 0 ? t('offer.noManners') : t('complete.evaluate') }}
                </div>
                <div v-show="parsEvaluations.length > 0" class="break-keep text-caption">
                  <ul class="evaluation">
                    <li v-for="evaluation, idx of parsEvaluations" :key="idx"
                      :class="{ 'text-negative': evaluation.type === '001' }">
                      {{ evaluation.label }}
                    </li>
                  </ul>
                </div>
              </D4Tooltip>
            </q-icon>
          </div>
        </div>
      </q-item-section>
    </q-item>
  </div>
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