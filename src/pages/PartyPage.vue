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
  ps.setParty(party)
    .then((id: number) => {
      ps.partyId = id
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

const join = (id?: number) => {
  if (id)
    ps.party?.emit('join', id, () => {
      ps.joined = true
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
      <q-item v-for="p in parties" :key="p.id">
        <q-item-section>
          <q-item-label>
            카테고리 :{{ p.category }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn v-if="(p.current || 0) < p.people" color="green-7" label="입장" @click="join(p.id)" />
        </q-item-section>
      </q-item>
    </q-list>
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
    <div class="sticky-place row justify-end">
      <div v-if="as.signed" class="row items-center q-gutter-x-xs shadow-depth-5 relative-position">
        <D4Btn round @click="showForm = true" color="var(--q-secondary)" :disable="disable" shadow>
          <img src="/images/icons/add.svg" width="24" height="24" class="invert" alt="Tradurs Add Icon" />
        </D4Btn>
      </div>
      <D4Btn v-else style="visibility: hidden;" />
    </div>
    <div class="row q-gutter-xs items-center paging">
      <D4Btn round @click="prev" color="var(--q-light-magic)" :disable="!partyPage.over || disable"
        :shadow="!$q.dark.isActive">
        <img src="/images/icons/prev.svg" width="24" height="24" class="invert" alt="Tradurs Prev Icon" />
      </D4Btn>
      <D4Btn round @click="next" color="var(--q-light-magic)" :disable="!partyPage.more || disable"
        :shadow="!$q.dark.isActive">
        <img src="/images/icons/next.svg" width="24" height="24" class="invert" alt="Tradurs Next Icon" />
      </D4Btn>
    </div>
  </template>
</template>

<style scoped>
.sticky-place {
  position: sticky;
  bottom: 8%;
  z-index: 1;
  pointer-events: none;
}

.shadow-depth-5::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
}

.body--dark .shadow-depth-5::before {
  box-shadow: rgb(0, 0, 0) 0 0 60px 60px;
}

.body--light .shadow-depth-5::before {
  box-shadow: rgb(38, 57, 77) 0 20px 30px 0;
}


.paging {
  position: absolute;
  transform: translateY(-90%);
}

.item-list:deep(.item:not(.reward) .card-item:not(.editable) .filtered) {
  background-color: rgba(250, 200, 0);
  color: black;
  font-weight: 700;
  border-radius: 4px;
  padding-right: 6px;
}

.item-list:deep(.item:not(.reward) .card-item:not(.editable) .filtered .minmax-text) {
  color: rgba(110, 110, 110, 1) !important;
}

@media (max-width:600px) {
  .sticky-place {
    bottom: 10px;
  }

  .item-list:deep(.item:not(.reward) .card-item:not(.editable) .filtered) {
    line-height: 14px;
  }
}
</style>