<script lang="ts">
import { usePartyStore } from 'src/stores/party-store'
import { checkName } from 'src/common'

export default {
  preFetch({ store }) {
    const ps = usePartyStore(store);

    return ps.getBase()
  }
}
</script>

<script setup lang="ts">
import { ref, reactive, computed, defineAsyncComponent, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar, date } from 'quasar'
import { useRoute } from 'vue-router'
import { useGlobalStore } from 'src/stores/global-store'
import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'src/stores/item-store'
import { type IParty, type IPartyUser, PartyServiceTypes, PartyRegionTypes } from 'src/stores/party-store'
import { Price } from 'src/types/item'

const D4Price = defineAsyncComponent(() => import('components/D4Price.vue'))

// init module
const ps = usePartyStore()
const gs = useGlobalStore()
const as = useAccountStore()
const is = useItemStore()
const { t } = useI18n({ useScope: 'global' })
const $q = useQuasar()
const route = useRoute()

// loading variable
const completeList = ref(false)
const progress = ref(false)
const disabled = ref(false)
const disable = computed(() => progress.value || disabled.value)
const joined = computed(() => ps.joined)

// variable
const serviceOptions = [
  {
    label: t('party.service.sell'),
    value: PartyServiceTypes.SELL
  },
  {
    label: t('party.service.buy'),
    value: PartyServiceTypes.BUY
  }
]
const partyInfo = reactive<IParty>({} as IParty)
const page = ref<number>(1)
const over = computed(() => ps.partyPage.over)
const more = computed(() => ps.partyPage.more)
const parties = reactive<Array<IParty>>([])

const reset = () => {
  partyInfo.service = PartyServiceTypes.SELL
  partyInfo.region = (route.params.lang === 'ko' ? PartyRegionTypes.ASIA : PartyRegionTypes.AMERICAS)
  partyInfo.hardcore = is.storage.data.hardcore
  partyInfo.ladder = is.storage.data.ladder
  partyInfo.type = 'bosses'
  partyInfo.category = 'duriel'
  partyInfo.name = ''
  partyInfo.runs = 1
  partyInfo.people = 2
  partyInfo.time = 1
  partyInfo.notes = ''
  partyInfo.price = new Price()
}

const getParties = () => {
  disabled.value = true
  ps.getParties(page.value)
    .then((result) => {
      parties.splice(0, parties.length)
      parties.push(...result)
      setTimeout(() => {
        completeList.value = true
      }, 100)
    })
    .catch(() => { })
    .then(() => {
      disabled.value = false
    })
}

const showForm = ref<boolean>(false)

const check = () => {
  ps.party?.emit('check', as.info.id, (member?: Array<IPartyUser>, remainSeconds?: number, totalSeconds?: number) => {
    if (member && remainSeconds && totalSeconds) {
      ps.partyMember = member!
      ps.remainSeconds = remainSeconds!
      ps.totalSeconds = totalSeconds!
      ps.joined = true
      ps.startTimer()
    }
  })
}

const open = () => {
  progress.value = true
  ps.openParty(partyInfo)
    .then(() => {
      as.retrieve()
      check()
      showForm.value = false
      getParties()
    })
    .catch(() => { })
    .then(() => {
      progress.value = false
      reset()
    })
}

const join = (battleTag: string) => {
  progress.value = true
  ps.joinParty(battleTag)
    .then(() => {
      check()
    })
    .catch(() => { })
    .then(() => {
      progress.value = false
    })
}

const prev = () => {
  if (page.value > 1) {
    gs.reloadAdKey++
    page.value--
    getParties()
  }
}

const next = () => {
  gs.reloadAdKey++
  page.value++
  getParties()
}

const updateType = (val: string) => {
  partyInfo.category = ps.partyCategories(val)?.[0]?.value as string
}

const updatePrice = (price: Price) => {
  partyInfo.price.currency = price.currency
  partyInfo.price.currencyValue = price.currencyValue
  partyInfo.price.quantity = price.quantity
}

watch(joined, () => {
  setTimeout(() => {
    getParties()
  }, 400)
})

onMounted(() => {
  getParties()
  reset()
})

</script>

<template>
  <div>
    <q-list bordered separator class="rounded-borders">
      <q-item>
        <q-item-section>
        </q-item-section>
        <q-item-section side>
          <q-btn no-caps push :disable="disable || progress" unelevated :aria-label="t('btn.open')" color="grey-8"
            :label="t('btn.open')" @click="showForm = true" />
        </q-item-section>
      </q-item>
      <q-item v-for="p in parties" :key="p.battleTag" class="no-padding">
        <q-item-section top side>
          <div class="card-title">{{ t(`party.service.${p.service}`) }}</div>
        </q-item-section>
        <q-item-section>
          <div class="q-pa-md column q-gutter-xs">
            <div> {{ t('party.info.region') }} : {{ ps.getRegion(p.region) }}</div>
            <div> {{ t('party.info.name') }} : {{ p.name }}</div>
            <div> {{ t('party.info.type') }} : {{ ps.getType(p.type) }}</div>
            <div> {{ t('party.info.category') }} : {{ ps.getCategory(p.category) }}</div>
            <div> {{ t('party.info.runs') }} : {{ p.runs }}</div>
            <div> {{ t('party.info.people') }} : {{ p.people }}</div>
            <div> {{ t('party.info.endTime') }} : {{ date.formatDate(p.expireDate, 'YYYY-MM-DD HH:mm:ss') }}</div>
            <q-expansion-item dense expand-separator expand-icon="img:/images/icons/dropdown.svg"
              :label="t('party.info.notes')">
              <q-card>
                <q-card-section>
                  {{ p.notes }}
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>
        </q-item-section>
        <q-item-section side>
          <div class="q-pr-md q-py-md">
            <q-btn :disable="disable" color="green-7" :label="t('btn.join')" @click="join(p.battleTag as string)" />
          </div>
        </q-item-section>
      </q-item>
    </q-list>
    <div class="row justify-between q-mt-md q-px-sm paging">
      <div>{{ t('message.page', { page }) }}</div>
      <div class="row justify-end items-center q-gutter-x-md">
        <q-btn flat dense round padding="0" aria-label="Tradurs Prev Button" :disable="!over || disable"
          :shadow="!$q.dark.isActive">
          <img src="/images/icons/prev.svg" width="24" height="24" class="icon" alt="Tradurs Prev Icon" @click="prev" />
        </q-btn>
        <q-btn flat dense round padding="0" aria-label="Tradurs Next Button" :disable="!more || disable"
          :shadow="!$q.dark.isActive" @click="next">
          <img src="/images/icons/next.svg" width="24" height="24" class="icon" alt="Tradurs Next Icon" />
        </q-btn>
      </div>
    </div>
    <q-dialog v-model="showForm" :maximized="$q.screen.lt.sm" transition-show="none" transition-hide="none"
      transition-duration="0" persistent>
      <q-card bordered class="party-form dialog">
        <q-form :class="{ 'full-height column': $q.screen.lt.sm }" @submit="open">
          <q-card-section>
            <div class="row justify-between items-center q-gutter-y-sm">
              <div class="row justify-start items-center q-gutter-x-sm col-12 col-sm-6 overflow-hidden">
                <q-select v-model="partyInfo.service" :disable="disable" outlined dense no-error-icon hide-bottom-space
                  emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
                  :options="serviceOptions" dropdown-icon="img:/images/icons/dropdown.svg"
                  popup-content-class="scroll bordered" :label="t('party.service.title')"
                  :rules="[val => !!val && serviceOptions.map(so => so.value).includes(val) || '']" />
                <q-select v-model="partyInfo.region" :disable="disable" outlined dense no-error-icon hide-bottom-space
                  emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
                  :options="ps.base.regions" dropdown-icon="img:/images/icons/dropdown.svg"
                  popup-content-class="scroll bordered" :label="t('party.info.region')"
                  :rules="[val => !!val && ps.base.regions.map(r => r.value).includes(val) || '']" />
              </div>
              <div class="row justify-end items-center q-gutter-x-sm col-12 col-sm-6">
                <q-checkbox :disable="disable" dense v-model="partyInfo.hardcore" :label="t('item.hardcore')" />
                <q-checkbox :disable="disable" dense v-model="partyInfo.ladder" :label="t('item.ladder')" />
              </div>
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section>
            <q-input outlined dense no-error-icon hide-bottom-space v-model="partyInfo.name" :label="t('party.info.name')"
              :rules="[val => !!val && checkName(val) || '']" maxlength="256" />
          </q-card-section>
          <q-separator inset />
          <q-card-section>
            <div class="row justify-between items-center q-gutter-sm">
              <div class="row justify-end items-center q-gutter-sm">
                <q-select v-model="partyInfo.type" :disable="disable" outlined dense no-error-icon hide-bottom-space
                  emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
                  :options="ps.base.partyTypes" dropdown-icon="img:/images/icons/dropdown.svg"
                  popup-content-class="scroll bordered" :label="t('party.info.type')" @update:model-value="updateType"
                  :rules="[val => !!val && ps.base.partyTypes.map(pt => pt.value).includes(val) || '']" />
                <q-select v-model="partyInfo.category" :disable="disable" outlined dense no-error-icon hide-bottom-space
                  emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
                  :options="ps.partyCategories(partyInfo.type)" dropdown-icon="img:/images/icons/dropdown.svg"
                  popup-content-class="scroll bordered" :label="t('party.info.category')"
                  :rules="[val => !!val && ps.partyCategories(partyInfo.type).map(pc => pc.value).includes(val) || '']" />
              </div>
              <div class="row justify-end items-center q-gutter-sm no-wrap">
                <D4Counter v-model.number="partyInfo.runs" max-width="60px" :label="t('party.info.runs')" :max="5"
                  :disable="disable" :no-button="false" />
                <D4Counter v-model.number="partyInfo.people" max-width="60px" :label="t('party.info.people')" :min="2"
                  :max="5" :disable="disable" />
                <D4Counter v-model.number="partyInfo.time" max-width="60px" :label="t('party.info.time')" :min="1"
                  :max="12" :disable="disable" />
              </div>
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section class="col">
            <q-input :disable="disable" outlined class="textarea" input-class="scroll" type="textarea"
              v-model="partyInfo.notes" :label="t('party.info.notes')" maxlength="500" counter />
          </q-card-section>
          <q-separator inset />
          <q-card-section>
            <D4Price party :data="partyInfo.price" editable :disable="disable" :progress="progress"
              @update="updatePrice" />
          </q-card-section>
          <q-separator />
          <q-card-section class="row justify-between items-center">
            <q-btn no-caps :disable="disable" :label="t('btn.close')" color="grey-9" :aria-label="t('btn.close')"
              @click="showForm = false" />
            <q-btn no-caps :label="t('btn.open')" color="primary" type="submit" :aria-label="t('btn.open')"
              @progress="progress" />
          </q-card-section>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
  <div class="q-pt-xl"></div>
  <template v-if="completeList">

  </template>
</template>

<style scoped>
.card-title {
  margin: 4px 0 0 -12px;
  padding: 4px 8px;
  position: relative;
  border-radius: 3px 5px 5px 0;
  background: #d8e1e5;
  color: #757575;
  font-size: 10px;
  letter-spacing: .7px;
}

.card-title:after {
  content: "";
  position: absolute;
  top: 100%;
  left: 0;
  width: 0;
  height: 0;
  border: 0 solid transparent;
  border-width: 9px 0 0 11px;
  border-top-color: #b0c2ca;
}

.textarea {
  height: 100%;
}

.textarea:deep(textarea) {
  resize: none;
}

.textarea:deep(.q-field__control) {
  height: 100%;
}

@media (max-width:600px) {
  .party-form:deep(.q-card__section--vert) {
    padding: 8px;
  }
}
</style>