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
import { ref, reactive, computed, defineAsyncComponent, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { scrollPos } from 'src/common'
import { useAccountStore } from 'stores/account-store'
import { type IParty, type IPartyUser, type IPartyRoom, Party, PartyServiceTypes, PartyRegionTypes } from 'src/stores/party-store'
import { Price } from 'src/types/item'

const D4Price = defineAsyncComponent(() => import('components/D4Price.vue'))
const D4User = defineAsyncComponent(() => import('components/D4User.vue'))

// init module
const ps = usePartyStore()
const as = useAccountStore()
const { t } = useI18n({ useScope: 'global' })
const $q = useQuasar()
const route = useRoute()
const router = useRouter()

// loading variable
const progress = ref(false)
const disable = computed(() => progress.value || ps.filter.loading || ps.joined)

// variable
const request = computed(() => ps.request)
const filter = computed(() => ps.filter.request)
const serviceOptions = [
  {
    label: t('party.service.coop'),
    value: PartyServiceTypes.COOP
  },
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
const page = ref<number>(route.query.page ? parseInt(route.query.page as string) : 1)
const over = computed(() => ps.partyPage.over)
const more = computed(() => ps.partyPage.more)
const parties = reactive<Array<Party>>([])

const reset = () => {
  partyInfo.service = PartyServiceTypes.COOP
  partyInfo.region = (route.params.lang === 'ko' || !!!route.params.lang ? PartyRegionTypes.ASIA : PartyRegionTypes.AMERICAS)
  partyInfo.type = 'bosses'
  partyInfo.category = 'duriel'
  partyInfo.name = ''
  partyInfo.runs = 1
  partyInfo.people = 2
  partyInfo.time = 1
  partyInfo.notes = ''
  partyInfo.price = new Price()
  partyInfo.price.currency = 'gold'
}

const getParties = () => {
  ps.filter.loading = true
  parties.splice(0, parties.length)
  ps.getParties(page.value)
    .then((result) => {
      parties.push(...result.map(p => new Party(p)))
    })
    .catch(() => { })
    .then(() => {
      ps.filter.loading = false
      scrollPos()
    })
}

const showForm = ref<boolean>(false)

const check = () => {
  ps.party?.emit('check', as.info.id, (info?: IPartyRoom, member?: Array<IPartyUser>, remainSeconds?: number, totalSeconds?: number) => {
    if (info && member && remainSeconds && totalSeconds) {
      ps.partyInfo = info!
      ps.partyMember = member!
      ps.remainSeconds = remainSeconds!
      ps.totalSeconds = totalSeconds!
      ps.joined = true
      ps.startTimer()
    }
  })
}

const reload = () => {
  if (page.value === 1)
    getParties()
  else
    router.push({ name: 'partyPlay', params: { lang: route.params.lang }, query: { page: 1 } })
}

const open = () => {
  progress.value = true
  ps.openParty(partyInfo)
    .then(() => {
      as.retrieve()
      check()
      showForm.value = false
      ps.clearFilter()
      reload()
    })
    .catch(() => { })
    .then(() => {
      progress.value = false
    })
}

const join = (battleTag: string) => {
  progress.value = true
  ps.joinParty(battleTag)
    .then(() => {
      check()
      reload()
    })
    .catch(() => {
      getInfo(battleTag)
    })
    .then(() => {
      progress.value = false
    })
}

const getInfo = (battleTag: string) => {
  ps.getParty(battleTag).then((result: Array<IParty>) => {
    if (result.length > 0) {
      const updateParty = new Party(result[0])
      const findParty = parties.find(p => p.user.battleTag === updateParty.user.battleTag)

      if (findParty)
        Object.assign(findParty, updateParty)
    }
    else
      reload()
  })
}

const updateType = (val: string) => {
  partyInfo.category = ps.getCategoryByType(val)?.[0]?.value as string
}

const updatePrice = (price: Price) => {
  partyInfo.price.currency = price.currency
  partyInfo.price.currencyValue = price.currencyValue
  partyInfo.price.quantity = price.quantity
}

watch(request, (val, old) => {
  if (val !== old)
    reload()
})

watch(filter, (val, old) => {
  if (val !== old)
    reload()
})

const move = (val: number) => {
  router.push({ name: 'partyPlay', params: { lang: route.params.lang }, query: { page: page.value + val } })
}

watch(() => route.query.page, (val, old) => {
  if (val !== old) {
    page.value = val ? parseInt(val as string) : 1
    getParties()
  }
})

onMounted(() => {
  getParties()
})

onUnmounted(() => {
  parties.forEach(p => p.clear())
})

</script>

<template>
  <div>
    <q-bar class="bg-transparent q-my-sm">
      <q-space />
      <q-btn v-if="as.signed" no-caps push :disable="disable" unelevated :aria-label="t('btn.open')" color="grey-8"
        :label="t('btn.open')" @click="showForm = true" />
    </q-bar>
    <div class="party-wrap">
      <q-card flat class="party-card" v-show="parties.length === 0">
        <q-card-section class="q-pa-xl text-center text-caption">
          {{ t('party.messages.noData') }}
        </q-card-section>
      </q-card>
      <q-card bordered class="party-card" v-for="p in parties" :key="p.user.battleTag">
        <div class="card-title">{{ t(`party.service.${p.service}`) }}</div>
        <div class="text-weight-bold ellipsis party-name" :class="$q.screen.lt.sm ? 'text-subtitle2' : 'text-subtitle1'">
          {{ p.name }}
        </div>
        <q-card-section class="q-pt-lg q-pb-none">
          <div class="text-caption row justify-end">
            <div :class="`text-${p.remainColor}`">{{ p.remain }}</div>
          </div>
        </q-card-section>
        <q-card-section class="q-py-none">
          <div class="text-caption row justify-end q-gutter-sm text-grey-6">
            <q-breadcrumbs active-color="grey-6" gutter="xs">
              <template v-slot:separator>
                <q-icon class="icon" name="img:/images/icons/chevron_right.svg" size="16px" />
              </template>
              <q-breadcrumbs-el v-if="p.hardcore" :label="t('item.hardcore')" />
              <q-breadcrumbs-el v-if="p.ladder" :label="t('item.ladder')" />
              <q-breadcrumbs-el :label="ps.getRegion(p.region)?.[0]?.label" />
            </q-breadcrumbs>
          </div>
        </q-card-section>
        <q-card-section class="q-py-none">
          <div class="text-caption row justify-end q-gutter-sm text-grey-6">
            <q-breadcrumbs active-color="grey-6" gutter="xs">
              <template v-slot:separator>
                <q-icon class="icon" name="img:/images/icons/chevron_right.svg" size="16px" />
              </template>
              <q-breadcrumbs-el :label="ps.getType(p.type)?.[0]?.label" />
              <q-breadcrumbs-el :label="ps.getCategory(p.category)?.[0]?.label" />
              <q-breadcrumbs-el>
                {{ t('party.info.runs') }}<span class="q-ml-xs"
                  :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-9'">{{ p.runs
                  }}</span>
              </q-breadcrumbs-el>
              <q-breadcrumbs-el>
                {{ t('party.info.people') }}<span class="q-ml-xs"
                  :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-9'">
                  {{ p.current }} / {{ p.people }}
                </span>
              </q-breadcrumbs-el>
            </q-breadcrumbs>
          </div>
        </q-card-section>
        <q-card-section v-if="p.service !== PartyServiceTypes.COOP" class="q-py-none">
          <div class="row justify-end items-center">
            <D4Price :data="p.price" :disable="disable" />
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row justify-end items-center">
            <D4User :data="p.user" :disable="disable" :progress="progress" :authorized="p.authorized"
              @update="getInfo(p.user.battleTag)" />
          </div>
        </q-card-section>
        <q-card-section v-if="!!p.notes">
          <q-expansion-item v-model="p.showNotes" dense dense-toggle expand-separator
            expand-icon="img:/images/icons/dropdown.svg" :label="t('party.info.notes')"
            class="overflow-hidden text-caption no-hover" style="border-radius: 10px"
            :style="{ 'backgroundColor': 'var(--q-tiny)' }">
            <div class="q-pa-sm text-grey-6">
              {{ p.notes }}
            </div>
          </q-expansion-item>
        </q-card-section>
        <q-card-section class="q-py-xs"></q-card-section>
        <template v-if="p.user.battleTag !== as.info.battleTag && as.signed">
          <q-separator />
          <q-card-section>
            <div class="row justify-end">
              <q-btn unelevated :disable="disable || p.people === p.current" color="primary" :label="t('btn.join')"
                :aria-label="t('btn.join')" @click="join(p.user.battleTag as string)" />
            </div>
          </q-card-section>
        </template>
      </q-card>
    </div>
    <div class="row justify-between q-mt-md q-px-sm paging">
      <div>{{ t('message.page', { page }) }}</div>
      <div class="row justify-end items-center q-gutter-x-md">
        <q-btn flat dense round padding="0" aria-label="Tradurs Prev Button"
          :disable="!over || progress || ps.filter.loading" :shadow="!$q.dark.isActive" @click="move(-1)">
          <img src="/images/icons/prev.svg" width="24" height="24" class="icon" alt="Tradurs Prev Icon" />
        </q-btn>
        <q-btn flat dense round padding="0" aria-label="Tradurs Next Button"
          :disable="!more || progress || ps.filter.loading" :shadow="!$q.dark.isActive" @click="move(1)">
          <img src="/images/icons/next.svg" width="24" height="24" class="icon" alt="Tradurs Next Icon" />
        </q-btn>
      </div>
    </div>
    <q-dialog v-model="showForm" :maximized="$q.screen.lt.sm" transition-show="none" transition-hide="none"
      transition-duration="0" @before-show="reset" persistent>
      <q-card bordered class="party-form dialog">
        <q-form :class="{ 'full-height column': $q.screen.lt.sm }" @submit="open">
          <q-card-section>
            <div class="row justify-between items-center q-gutter-y-sm">
              <q-option-group v-model="partyInfo.service" :options="serviceOptions" inline dense />
              <q-select v-model="partyInfo.region" :disable="disable" outlined dense no-error-icon hide-bottom-space
                emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
                :options="ps.base.regions" dropdown-icon="img:/images/icons/dropdown.svg"
                popup-content-class="scroll bordered" :label="t('party.info.region')"
                :rules="[val => !!val && ps.base.regions.map(r => r.value).includes(val) || '']" />
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
                  :options="ps.getCategoryByType(partyInfo.type)" dropdown-icon="img:/images/icons/dropdown.svg"
                  popup-content-class="scroll bordered" :label="t('party.info.category')"
                  :rules="[val => !!val && ps.getCategoryByType(partyInfo.type).map(pc => pc.value).includes(val) || '']" />
              </div>
              <div class="row justify-end items-center q-gutter-sm no-wrap">
                <D4Counter v-model.number="partyInfo.runs" max-width="60px" :label="t('party.info.runs')" :min="1"
                  :max="30" :disable="disable" :no-button="false" />
                <D4Counter v-model.number="partyInfo.people" max-width="60px" :label="t('party.info.people')" :min="2"
                  :max="8" :disable="disable" />
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
          <template v-if="partyInfo.service !== PartyServiceTypes.COOP">
            <q-separator inset />
            <q-card-section>
              <D4Price party :data="partyInfo.price" editable :disable="disable" :progress="progress"
                @update="updatePrice" />
            </q-card-section>
          </template>
          <q-separator />
          <q-card-section class="row justify-end items-center q-gutter-md">
            <q-btn no-caps :disable="disable" :label="t('btn.close')" color="grey-7" :aria-label="t('btn.close')"
              @click="showForm = false" />
            <q-btn no-caps :label="t('btn.open')" color="primary" type="submit" :aria-label="t('btn.open')"
              :loading="progress" />
          </q-card-section>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
  <div class="q-pt-xl"></div>
</template>

<style scoped>
.body--light .party-form {
  background-color: var(--q-light);
}

.party-wrap:deep(.party-card:last-child) {
  margin-bottom: 0;
}

.party-card {
  position: relative;
  margin: 0 12px 64px 12px;
  box-shadow: none;
  border-radius: 12px;
}

.card-title {
  position: absolute;
  z-index: 1;
  top: 20px;
  margin: -8px;
  padding: 4px;
  border-radius: 3px 5px 5px 0 !important;
  font-size: 10px;
  letter-spacing: .7px;
  background-color: var(--q-light);
  color: var(--q-dark);
  font-weight: 700;
  max-width: 30px;
}

.body--light .card-title {
  background-color: var(--q-dark);
  color: var(--q-light);
}

.card-title:after {
  content: "";
  position: absolute;
  top: 100%;
  left: 0;
  width: 0;
  height: 0;
  border: 0 solid transparent;
  border-width: 6px 0 0 7px;
  border-top-color: var(--q-light);
  opacity: .5;
}

.body--light .card-title:after {
  border-top-color: var(--q-dark);
}

.party-name {
  position: absolute;
  top: 12px;
  left: 30px;
  width: 70%;
}

.notes {
  background-color: var(--q-cloud);
  border-radius: 10px;
  padding: 10px;
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