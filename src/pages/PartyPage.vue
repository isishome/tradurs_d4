<script setup lang="ts">
import { ref, reactive, computed, defineAsyncComponent, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalStore } from 'src/stores/global-store'
import { useAccountStore } from 'stores/account-store'
import { type IParty, usePartyStore } from 'src/stores/party-store'
import { scrollPos } from 'src/common'
import D4Dialog from 'src/components/UI/D4Dialog.vue'

const D4Items = defineAsyncComponent(() => import('components/D4Items.vue'))

// init module
const route = useRoute()
const router = useRouter()
const gs = useGlobalStore()
const as = useAccountStore()
const ps = usePartyStore()
const { t, n } = useI18n({ useScope: 'global' })
const $q = useQuasar()

// loading variable
const completeList = ref(false)
const progress = ref(false)
const disabled = ref(false)
const disable = computed(() => progress.value || disabled.value)

// variable
const page = ref<number>(1)
const over = computed(() => ps.partyPage.over)
const more = computed(() => ps.partyPage.more)
const { partyPage } = storeToRefs(ps)
const parties = reactive<Array<IParty>>([])

const temp = {
  id: 1,
  name: 'Tester',
  stamp: '10 min ago',
  avatar: 'https://cdn.quasar.dev/img/avatar4.jpg',
  text: ['Hi']
}

const getParties = () => {
  disabled.value = true
  ps.getParties(page.value)
    .then((result) => {
      Object.assign(parties, result)
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
const party = reactive<IParty>({
  type: 'bosses',
  category: 'duriel',
  name: '테스트 파티',
  runs: 1,
  people: 2,
  region: 'asia',
  notes: '테스트를 해보자'
})

const open = () => {
  progress.value = true
  ps.openParty(party)
    .then(() => {
      ps.joined = true
      showForm.value = false
      getParties()
    })
    .catch(() => { })
    .then(() => {
      progress.value = false
    })
  // ps.party?.emit('create', as.info.id, (member: Array<IUser>) => {
  //   Object.assign(partyMember, member)
  // })
}

const join = (battleTag: string) => {
  progress.value = true
  ps.joinParty(battleTag)
    .then(() => {
      showForm.value = false
      getParties()
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

onMounted(() => {
  getParties()
})

</script>

<template>
  <div>

    <q-list bordered separator>
      <q-item>
        <q-item-section>
        </q-item-section>
        <q-item-section side>
          <q-btn no-caps push :disable="disable || progress" unelevated aria-label="방 만들기" color="grey-8" label="방 만들기"
            @click="showForm = true" />
        </q-item-section>
      </q-item>
      <q-item v-for="p in parties" :key="p.battleTag">
        <q-item-section>
          <q-item-label>
            카테고리 :{{ p.category }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn :disable="disable || p.joined === 1 || (p.current || 0) >= p.people" color="green-7" label="입장"
            @click="join(p.battleTag as string)" />
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
    <D4Dialog v-model="showForm" :maximized="$q.screen.lt.sm" @submit="open">
      <template #top>

      </template>
      <template #middle>
        <q-card-section>
          <div class="row justify-between items-center">
            <q-select v-model="party.type" :disable="disable" outlined dense no-error-icon hide-bottom-space emit-value
              map-options transition-show="none" transition-hide="none" :transition-duration="0"
              :options="[{ value: 'bosses', label: '우두머리' }]" dropdown-icon="img:/images/icons/dropdown.svg"
              popup-content-class="scroll bordered" />
            <q-select v-model="party.category" :disable="disable" outlined dense no-error-icon hide-bottom-space
              emit-value map-options transition-show="none" transition-hide="none" :transition-duration="0"
              :options="[{ value: 'duriel', label: '두리엘' }]" dropdown-icon="img:/images/icons/dropdown.svg"
              popup-content-class="scroll bordered" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-input outlined dense v-model="party.name" label="파티 명" />
        </q-card-section>
        <q-card-section>
          <div class="row justify-between items-center">
            <q-input outlined dense v-model="party.runs" label="회차" />
            <q-input outlined dense v-model="party.runs" label="인원" />
            <q-select v-model="party.region" :disable="disable" outlined dense no-error-icon hide-bottom-space emit-value
              map-options transition-show="none" transition-hide="none" :transition-duration="0"
              :options="[{ value: 'asia', label: '아시아' }]" dropdown-icon="img:/images/icons/dropdown.svg"
              popup-content-class="scroll bordered" />
          </div>
        </q-card-section>
        <q-card-section class="col">
          <q-input outlined dense type="textarea" v-model="party.notes" label="설명" />
        </q-card-section>
      </template>
      <template #bottom>
        <q-card-section class="row justify-between items-center">
          <q-btn label="닫기" color="grey-9" @click="showForm = false" />
          <q-btn label="생성" color="primary" type="submit" @progress="progress" />
        </q-card-section>
      </template>
    </D4Dialog>

  </div>
  <div class="q-pt-xl"></div>
  <template v-if="completeList">

  </template>
</template>

<style scoped></style>