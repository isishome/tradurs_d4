<script setup lang="ts">
import { ref, computed } from 'vue'
import { QInput, useQuasar, debounce } from 'quasar'
import { useAccountStore } from 'src/stores/account-store'
import { usePartyStore } from 'src/stores/party-store'

// global variable
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

const send = () => {
  ps.sendParty({ msg: text.value as string })
    .then(() => { })
    .catch(() => { })
    .then(() => {
      text.value = ''
      textRef.value?.focus()
    })
}

const typing = debounce((e) => {
  ps.party?.emit('typing', { battleTag: as.info.battleTag, typing: e.target.value.length > 0 })
}, 300)

const show = () => {
  textRef.value?.nativeEl.addEventListener('input', typing)
}

const hide = () => {
  textRef.value?.nativeEl.removeEventListener('input', typing)
}
</script>

<template>
  <q-dialog v-model="joined" :seamless="!$q.screen.lt.sm" :maximized="$q.screen.lt.sm" :position="position"
    :transition-show="tShow" :transition-hide="tHide" @show="show" @before-hide="hide">
    <q-card class="party-chat column" :class="$q.dark.isActive ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4'">
      <q-card-section class="no-padding">
        <q-bar class="bg-primary text-white">
          <div>
            채팅방 이름
          </div>
          <q-space />
          <div class="row justify-end q-gutter-x-xs">
            <q-btn unelevated dense aria-label="Tradurs Close Button" class="no-hover invert" :ripple="false">
              <img src="/images/icons/minimize.svg" width="18" height="18" @click="ps.minimum = true"
                alt="Tradurs Minimize Icon" />
            </q-btn>
            <q-btn unelevated dense aria-label="Tradurs Close Button" class="no-hover invert" :ripple="false">
              <img src="/images/icons/close.svg" width="18" height="18" @click="ps.minimum = true"
                alt="Tradurs Close Icon" />
            </q-btn>
          </div>
        </q-bar>
      </q-card-section>
      <q-card-section>
        참여자
      </q-card-section>
      <q-card-section class="col body--light">
        <div ref="areaRef" class="rounded-borders message-area column reverse no-wrap scroll">
          <template v-for="pm in ps.partyMember" :key="pm.id">
            <q-chat-message v-show="pm.typing" text-color="black" bg-color="white" size="6">
              <template v-slot:name>{{ pm.battleTag }}</template>
              <template v-slot:avatar>
                <img class="q-message-avatar q-message-avatar--sent" src="https://cdn.quasar.dev/img/avatar5.jpg">
              </template>
              <q-spinner-dots size="2rem" />
            </q-chat-message>
          </template>
          <q-chat-message v-for="pm in ps.partyMessages" :key="pm.id" :text="[pm.message]"
            :sent="as.info.battleTag === pm.battleTag" text-color="black" bg-color="white" size="6">
            <template v-slot:name>{{ pm.battleTag }}</template>
            <template v-slot:stamp>{{ pm.regDate }}</template>
            <template v-slot:avatar>
              <img class="q-message-avatar q-message-avatar--sent" src="https://cdn.quasar.dev/img/avatar5.jpg">
            </template>
          </q-chat-message>
        </div>
      </q-card-section>
      <q-card-actions>
        <q-form @submit="send" class="row justify-between items-center q-gutter-x-sm full-width">
          <q-input ref="textRef" :dark="!$q.dark.isActive" class="col" outlined dense v-model="text" />
          <q-btn label="전송" type="submit" />
        </q-form>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.party-chat {
  min-width: 360px;
}

.message-area {
  padding: 10px;
  background-color: var(--q-half);
  min-height: 200px !important;
  height: 100%;
  width: 100%;
  max-height: 360px;
}

@media (max-width:600px) {
  .party-chat {
    min-width: 300px;
  }

  .message-area {
    max-height: inherit;
  }
}
</style>