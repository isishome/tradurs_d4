<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { QInput, useQuasar, debounce, date, format } from 'quasar'
import { useI18n } from 'vue-i18n'
import { clipboard } from 'src/common'
import { useAccountStore } from 'src/stores/account-store'
import { usePartyStore, PartyMessageTypes, type IPartyMessage, IPartyUser } from 'src/stores/party-store'

// global variable
const { pad } = format
const { t } = useI18n({ useScope: 'global' })
const $q = useQuasar()
const as = useAccountStore()
const ps = usePartyStore()
const joined = computed(() => ps.joined && !ps.minimum)

// about party
const textRef = ref<QInput>()
const areaRef = ref<HTMLDivElement>()
const text = ref<string>()
const position = computed(() => !$q.screen.lt.sm ? 'right' : 'bottom')
const tShow = computed(() => !$q.screen.lt.sm ? 'slide-left' : 'slide-up')
const tHide = computed(() => !$q.screen.lt.sm ? 'slide-right' : 'slide-down')
const owner = computed(() => !!ps.partyMember.find((m: IPartyUser) => m.owner && m.battleTag === as.info.battleTag))
const me = computed(() => (m: IPartyUser) => as.info.battleTag === m.battleTag)
const sent = computed(() => (pm: IPartyMessage) => as.info.battleTag === pm.battleTag)
const receive = computed(() => (pm: IPartyMessage) => as.info.battleTag !== pm.battleTag && pm.type === PartyMessageTypes.DEFAULT)
const system = computed(() => (pm: IPartyMessage) => pm.type === PartyMessageTypes.SYSTEM)
const remainProgress = computed(() => ps.remainSeconds / ps.totalSeconds)
const remainColor = computed(() => ps.remainSeconds < 600 ? 'negative' : ps.remainSeconds < 1800 ? 'orange' : 'positive')
const remainHour = computed(() => pad(Math.floor(ps.remainSeconds / 3600).toString(), 2))
const remainTime = computed(() => date.formatDate((ps.remainSeconds % 3600) * 1000, 'mm:ss'))

const send = () => {
  const message: IPartyMessage = { type: PartyMessageTypes.DEFAULT, battleTag: as.info.battleTag, message: text.value! }
  ps.party?.emit('send', { id: as.info.id, message: text.value! }, (result: boolean) => {
    if (result) {
      message.regDate = Date.now()
      ps.push(message)
      text.value = ''
      nextTick(() => {
        textRef.value?.resetValidation()
        areaRef.value!.scrollTop = areaRef.value?.scrollHeight as number
      })
    }
  })
}

const typing = debounce((e) => {
  ps.party?.emit('typing', { id: as.info.id, typing: e.target.value.length > 0 })
}, 300)

const show = () => {
  textRef.value?.nativeEl.addEventListener('input', typing)
}

const hide = () => {
  textRef.value?.nativeEl.removeEventListener('input', typing)
}

const copy = (battleTag?: string) => {
  if (battleTag)
    clipboard(battleTag, t('user.battleTag'))
}

const tab = ref<string>('chat')

const leave = () => {
  $q.dialog({
    title: t('party.leave.title'),
    message: `<div class='column q-gutter-y-sm'><div>${t('party.leave.message')}</div><div class='text-caption text-negative text-weight-bold'>${t('party.leave.description')}</div></div>`,
    html: true,
    ok: {
      label: t('btn.leave'),
      color: 'negative'
    },
    cancel: {
      label: t('btn.cancel'),
      color: 'grey-6'
    },
  }).onOk(() => {
    ps.party?.emit('leave', { id: as.info.id }, (result: boolean) => {
      if (result)
        ps.dispose()
    })
  })
}

const kick = (battleTag: string) => {
  ps.party?.emit('kick', { id: as.info.id, battleTag }, (result: boolean) => {
    if (result)
      ps.kick(battleTag)
  })
}
</script>

<template>
  <q-dialog v-model="joined" :seamless="!$q.screen.lt.sm" :maximized="$q.screen.lt.sm" :position="position"
    :transition-show="tShow" :transition-hide="tHide" @show="show" @before-hide="hide">
    <q-card class="party-chat column" :class="$q.dark.isActive ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4'">
      <div class="column">
        <q-tooltip v-for="(em, idx) in ps.errorMessages" :key="em.id" v-model="em.show" class="bg-transparent"
          :transition-duration="500" :offset="[0, 0]">
          <div class="text-caption error-message shadow-1">
            {{ em.message }}
          </div>
        </q-tooltip>
      </div>
      <q-card-section class="no-padding">
        <q-bar class="bg-primary text-white">
          <div>
            채팅방 이름
          </div>
          <q-space />
          <div class="row justify-end q-gutter-x-xs">
            <q-btn unelevated dense aria-label="Tradurs Close Button" class="no-hover invert" :ripple="false">
              <img src="/images/icons/minimize.svg" width="18" height="18" @click="ps.hide" alt="Tradurs Minimize Icon" />
            </q-btn>
            <q-btn unelevated dense aria-label="Tradurs Close Button" class="no-hover invert" :ripple="false">
              <img src="/images/icons/close.svg" width="18" height="18" @click="leave" alt="Tradurs Close Icon" />
            </q-btn>
          </div>
        </q-bar>
      </q-card-section>
      <q-card-section class="no-padding">
        <q-linear-progress stripe size="20px" track-color="grey-5" :value="remainProgress" :color="remainColor">
          <div class="absolute-full flex flex-center">
            <q-badge color="white" text-color="black"
              :label="remainHour !== '00' ? `${remainHour}:${remainTime}` : remainTime" />
          </div>
        </q-linear-progress>
      </q-card-section>
      <q-tab-panels v-model="tab" class="col" animated
        :class="$q.dark.isActive ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4'">
        <q-tab-panel name="chat" class="column q-pa-xs" :dark="false">
          <q-card-section class="q-pa-sm">
            <div class="row q-gutter-xs items-center">
              <div class="q-mr-xs">{{ t('party.member.title') }}</div>
              <q-chip square v-for="member in ps.partyMember" class="text-caption member no-padding"
                style="margin-bottom:0" :clickable="as.info.battleTag !== member.battleTag" :ripple="!me(member)">
                <div v-if="me(member)" class="row items-center q-gutter-x-xs q-px-sm">
                  <div v-show="member.online">
                    <img src="/images/icons/online.svg" class="online" alt="Tradurs Online Status Icon" />
                  </div>
                  <div>{{ t('party.chat.me') }}</div>
                  <div v-if="member.owner">
                    <img class="crown" width="12" src="/images/icons/crown.svg" />
                  </div>
                </div>
                <q-btn-dropdown v-else flat dense class="no-hover q-px-sm" :ripple="false" :menu-offset="[0, -4]"
                  :dropdown-icon="me(member) ? 'none' : 'img:/images/icons/dropdown.svg'">
                  <template #label>
                    <div class="row q-gutter-x-xs items-center">
                      <div v-show="member.online">
                        <img src="/images/icons/online.svg" class="online" alt="Tradurs Online Status Icon" />
                      </div>
                      <div :class="{ 'offline': !member.online }" class="text-caption">
                        {{ member.battleTag }}
                      </div>
                      <div v-if="member.owner">
                        <img class="crown" width="12" src="/images/icons/crown.svg" />
                      </div>
                    </div>
                  </template>
                  <template v-if="member.battleTag !== as.info.battleTag" #default>
                    <q-list dense class="text-caption">
                      <q-item clickable v-close-popup @click="copy(member.battleTag)">
                        <q-item-section>
                          <q-item-label>{{ t('party.member.copy') }}</q-item-label>
                        </q-item-section>
                      </q-item>
                      <!-- <q-item clickable v-close-popup>
                        <q-item-section>
                          <q-item-label>신고</q-item-label>
                        </q-item-section>
                      </q-item> -->
                      <q-item v-if="owner" clickable v-close-popup @click="kick(member.battleTag as string)">
                        <q-item-section>
                          <q-item-label>{{ t('party.member.kick') }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </template>
                </q-btn-dropdown>
              </q-chip>
            </div>
          </q-card-section>
          <q-card-section class="col body--light q-pa-sm">
            <div ref="areaRef" class="rounded-borders message-area column reverse no-wrap scroll">
              <template v-for="pm in ps.partyMember" :key="pm.battleTag">
                <q-chat-message v-show="pm.typing" text-color="black" bg-color="white" size="8" class="typing">
                  <template #name>{{ pm.battleTag }}</template>
                  <template #avatar>
                    <img class="q-message-avatar q-message-avatar--received" :src="`/images/avatar/${pm.avatar}.webp`">
                  </template>
                  <q-spinner-dots size="2rem" />
                </q-chat-message>
              </template>
              <q-chat-message v-for="pm, idx in ps.partyMessages" :key="idx" :text="[pm.message]" :sent="sent(pm)"
                :text-color="receive(pm) || system(pm) ? 'black' : 'white'" :bg-color="receive(pm) ? 'white' : 'blue-7'"
                size="8" :class="{ 'system': system(pm) }">
                <template v-if="receive(pm)" #name>
                  <div class="text-caption">{{ pm.battleTag }}</div>
                </template>
                <template #stamp>
                  <div class="text-caption">{{ date.formatDate(pm.regDate, 'HH:mm:ss') }}</div>
                </template>
                <template v-if="receive(pm)" #avatar>
                  <img class="q-message-avatar q-message-avatar--received" :src="`/images/avatar/${pm.avatar}.webp`">
                </template>
              </q-chat-message>
            </div>
          </q-card-section>
          <q-card-actions class="q-pa-sm">
            <div class="full-width">
              <q-form @submit="send" class="row justify-between items-center q-gutter-x-sm">
                <q-input rounded autocomplete="off" ref="textRef" no-error-icon hide-bottom-space
                  :dark="!$q.dark.isActive" class="col" outlined borderless dense v-model="text"
                  :rules="[(val) => !!val && !!val.trim() || '']" />
              </q-form>
            </div>
          </q-card-actions>
        </q-tab-panel>
        <q-tab-panel name="info">
          <q-card-section></q-card-section>
        </q-tab-panel>
      </q-tab-panels>
      <q-separator :dark="!$q.dark.isActive" />
      <q-tabs v-model="tab" dense active-class="text-white bg-primary" class="shadow-2"
        :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-7'" indicator-color="transparent" align="justify">
        <q-tab name="chat" :label="t('party.category.chat')" />
        <q-tab name="info" :label="t('party.category.info')" />
      </q-tabs>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.party-chat {
  width: 420px;
  height: 560px;
}

.message-area {
  padding: 10px;
  background-color: var(--q-half);
  width: 100%;
  height: 100%;
}

@media (max-width:600px) {
  .party-chat {
    min-width: 300px;
    height: 100%;
  }
}

.member {
  background-color: var(--q-shadow);
  color: var(--q-dark-page);
}

.member:deep(.q-icon) {
  filter: invert(1);
  margin-left: 0;
}

.body--light .member {
  background-color: var(--q-dark);
  color: var(--q-light-page);
}

.member:deep(.crown) {
  filter: invert(75%) sepia(69%) saturate(864%) hue-rotate(359deg) brightness(103%) contrast(103%);
  width: 12px;
  height: 12px;
}

.online {
  width: 10px;
  height: 10px;
  margin: 0 -4px 0 0;
  filter: invert(39%) sepia(100%) saturate(1473%) hue-rotate(89deg) brightness(110%) contrast(110%);
}

.offline {
  opacity: .4;
}

.message-area:deep(.system .q-message-container) {
  justify-content: center !important;
}

.message-area:deep(.system .q-message-container >div) {
  width: 100% !important;
  text-align: center;
}

.message-area:deep(.system .q-message-container .q-message-text) {
  color: transparent !important;
  min-height: inherit !important;
}

.q-message-received:deep(.q-message-text--received) {
  border-radius: 16px 16px 16px 0;
}

.q-message-sent:deep(.q-message-text--sent) {
  border-radius: 16px 16px 0 16px;
}

.error-message {
  border-radius: 4px;
  background-color: var(--q-negative);
  padding: 10px;
  max-width: 300px;
  word-break: keep-all;
}
</style>