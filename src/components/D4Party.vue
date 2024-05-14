<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAccountStore } from 'src/stores/account-store'
import { usePartyStore, PartyServiceTypes, Party } from 'src/stores/party-store'

import D4Price from 'components/D4Price.vue'
import D4User from 'components/D4User.vue'

interface IProps {
  data: Party,
  disable?: boolean,
  progress?: boolean,
  history?: boolean
}

withDefaults(defineProps<IProps>(), {
  disable: false,
  progress: false,
  history: false
})

const emit = defineEmits(['update', 'join'])

// init module
const { t } = useI18n({ useScope: 'global' })
const as = useAccountStore()
const ps = usePartyStore()
</script>
<template>
  <q-card bordered class="party-card" :class="{ 'history': history }">
    <div class="card-title">{{ t(`party.service.${data.service}`) }}</div>
    <div class="text-weight-bold ellipsis party-name" :class="$q.screen.lt.sm ? 'text-subtitle2' : 'text-subtitle1'">
      {{ data.name }}
    </div>
    <q-card-section class="q-pt-lg q-pb-none">
      <div class="text-caption row justify-end">
        <div :class="`text-${data.remainColor}`">{{ data.remain }}</div>
      </div>
    </q-card-section>
    <q-card-section class="q-py-none">
      <div class="text-caption row justify-end q-gutter-sm text-grey-6">
        <q-breadcrumbs active-color="grey-6" gutter="xs">
          <template v-slot:separator>
            <q-icon class="icon" name="img:/images/icons/chevron_right.svg" size="16px" />
          </template>
          <q-breadcrumbs-el v-if="data.hardcore" :label="t('item.hardcore')" />
          <q-breadcrumbs-el v-if="data.ladder" :label="t('item.ladder')" />
          <q-breadcrumbs-el :label="ps.getRegion(data.region)?.[0]?.label" />
        </q-breadcrumbs>
      </div>
    </q-card-section>
    <q-card-section class="q-py-none">
      <div class="text-caption row justify-end q-gutter-sm text-grey-6">
        <q-breadcrumbs active-color="grey-6" gutter="xs">
          <template v-slot:separator>
            <q-icon class="icon" name="img:/images/icons/chevron_right.svg" size="16px" />
          </template>
          <q-breadcrumbs-el :label="ps.getType(data.type)?.[0]?.label" />
          <q-breadcrumbs-el :label="ps.getCategory(data.category)?.[0]?.label" />
          <q-breadcrumbs-el>
            {{ t('party.info.runs') }}<span class="q-ml-xs" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-9'">{{
    data.runs
  }}</span>
          </q-breadcrumbs-el>
          <q-breadcrumbs-el>
            {{ t('party.info.people') }}<span class="q-ml-xs" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-9'">
              {{ data.current ? `${data.current} / ` : '' }}{{ data.people }}
            </span>
          </q-breadcrumbs-el>
        </q-breadcrumbs>
      </div>
    </q-card-section>
    <q-card-section v-if="data.service !== PartyServiceTypes.COOP" class="q-py-none">
      <div class="row justify-end items-center">
        <D4Price :data="data.price" :disable="disable" />
      </div>
    </q-card-section>
    <q-card-section v-if="!history" class="q-pt-none">
      <div class="row justify-end items-center">
        <D4User :data="data.user" :disable="disable" :progress="progress" :authorized="data.authorized"
          @update="() => emit('update', data.user.battleTag as string)" />
      </div>
    </q-card-section>
    <q-card-section v-if="!!data.notes">
      <q-expansion-item v-model="data.showNotes" dense dense-toggle expand-separator
        expand-icon="img:/images/icons/dropdown.svg" :label="t('party.info.notes')"
        class="overflow-hidden text-caption no-hover" style="border-radius: 10px"
        :style="{ 'backgroundColor': 'var(--q-tiny)' }">
        <div class="q-pa-sm text-grey-6">
          {{ data.notes }}
        </div>
      </q-expansion-item>
    </q-card-section>
    <q-card-section class="q-py-xs"></q-card-section>
    <template v-if="!history && (data.user?.battleTag !== as.info.battleTag && as.signed)">
      <q-separator />
      <q-card-section>
        <div class="row justify-end">
          <q-btn unelevated :disable="disable || data.people === data.current" color="primary" :label="t('btn.join')"
            :aria-label="t('btn.join')" @click="() => emit('join', data.user.battleTag as string)" />
        </div>
      </q-card-section>
    </template>
  </q-card>
</template>

<style scoped>
.party-card {
  position: relative;
  margin: 0 12px 64px 12px;
  box-shadow: none;
  border-radius: 12px;
}

.party-card.history {
  margin-bottom: 0;
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
</style>