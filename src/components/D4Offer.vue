<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { Offer, type Price } from 'src/types/item'
import { icons } from 'src/common/icons'
import { clipboard } from 'src/common'

import D4User from 'components/D4User.vue'
import D4Price from 'components/D4Price.vue'

interface IProps {
  data: Offer,
  make?: boolean,
  disable?: boolean,
  progress?: boolean,
  owner?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  make: false,
  disable: false,
  progress: false,
  owner: false
})

const emit = defineEmits(['make-offer', 'accept-offer'])

const { t } = useI18n({ useScope: 'global' })
const $q = useQuasar()

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

const ownerComplete = () => {
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

const offererComplete = () => {
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

</script>

<template>
  <q-form v-if="make" @submit="makeOffer" class="q-pt-md row justify-between items-center q-col-gutter-sm">
    <div class="col">
      <D4Price offer :data="_offer.price" editable :disable="disable || progress" @update="updatePrice" />
    </div>
    <D4Btn :label="t('btn.offer')" :loading="data.loading" :disable="disable" :progress="progress" type="submit" />
  </q-form>
  <q-item v-else dense>
    <q-item-section class="q-gutter-xs">
      <D4User :data="data.user" :disable="disable">
        <template #battleTag>
          <div class="row items-center q-gutter-xs">
            <div :class="[data.authorized ? 'authorized' : '', data.user.battleTag !== '' ? 'allow-copy' : '']"
              @click="clipboard(data.user.battleTag)">
              {{ data.user.battleTag === '' ? t('offerer') : data.user.battleTag }}
            </div>
            <q-icon v-show="data.user.battleTag === ''" class="icon" :name="`img:${icons.help}`" size="19px">
              <q-tooltip :class="$q.dark.isActive ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4'"
                anchor="center right" self="center left" :offset="[10, 0]" transition-hide="jump-right"
                transition-show="jump-left">
                <div class="break-keep text-caption" style="max-width:160px;">
                  {{ t('sellerHelp.sh1') }}
                  <span class="underline text-weight-bold">{{ t('sellerHelp.sh2') }}</span>
                  {{ t('sellerHelp.sh3') }}
                  <span class="underline text-weight-bold">{{ t('sellerHelp.sh4') }}</span>
                  {{ t('sellerHelp.sh5') }}
                </div>
              </q-tooltip>
            </q-icon>
          </div>
        </template>
      </D4User>
      <div>
        <D4Price :data="data.price" :disable="disable" />
      </div>
    </q-item-section>
    <q-item-section side>
      <D4Btn v-if="data.statusCode === '000' && owner" :label="t('btn.accept')" color="var(--q-secondary)"
        :loading="data.loading" :disable="disable" :progress="progress" @click="acceptOffer" />
      <D4Btn v-else-if="data.statusCode === '003' && owner" label="완료" color="var(--q-primary)" :loading="data.loading"
        :disable="disable" :progress="progress" @click="ownerComplete" />
      <D4Btn v-else-if="data.statusCode === '003' && data.authorized" label="완료" color="var(--q-primary)"
        :loading="data.loading" :disable="disable" :progress="progress" @click="offererComplete" />
      <div v-else-if="data.statusCode === '003'">거래 중</div>
      <!-- <div class="text-center text-primary text-weight-bold" style="min-width:80px">
                                                                        {{ t('offer.accepted') }}
                                                                      </div> -->
    </q-item-section>
  </q-item>
</template>

<style scoped>
.coin {
  filter: invert(65%) sepia(69%) saturate(606%) hue-rotate(3deg) brightness(110%) contrast(102%);
}
</style>