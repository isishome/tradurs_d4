<script lang="ts">
import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'

export default {
  preFetch({ store }) {
    const as = useAccountStore(store)
    const is = useItemStore(store)
    return Promise.all([as.checkSign(), is.getBase()])
  }
}
</script>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const store = useAccountStore()

const battleTag = ref<string>('')
const showBT = computed(() => (store.signed as boolean && !(store.info.battleTag && store.info.battleTag !== '')))
const loading = ref<boolean>(false)
const updateBattleTag = () => {
  store.updateBattleTag(battleTag.value)
    .then(() => {
      store.info.battleTag = battleTag.value
    })
}
</script>

<template>
  <q-dialog v-model="showBT" persistent transition-show="none" transition-hide="none">
    <q-card class="card-item dialog normal">
      <q-form class="inner column full-height" @submit="updateBattleTag">
        <q-card-section>
          <div class="q-pa-md text-h6">BattleTag™ 입력</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="q-px-lg text-subtitle2 break-keep">
            <span class="text-weight-bold text-subtitle1 text-secondary">Tradurs Diablo4</span> 의
            정상적인 서비스 이용을 위해 Battle.net 에서 사용하는 BattleTag™를 입력해야 합니다.
          </div>
        </q-card-section>
        <q-card-section class="text-center">
          <div class="q-px-lg text-caption break-keep">
            배틀 태그는 Tradurs 사용자 정보 페이지에서 언제나 수정 가능합니다
          </div>
        </q-card-section>
        <q-card-section>
          <div class="q-px-lg q-py-md">
            <q-input autofocus v-model="battleTag" label="BattleTag™" placeholder="레비아탄5112" prefix="#" fill-mask
              :disable="loading"
              :rules="[val => val && (/^([ㄱ-ㅎㅏ-ㅣ가-힣]{1}[ㄱ-ㅎㅏ-ㅣ가-힣0-9]{1,12}|[a-zA-Z]{1}[a-zA-Z0-9]{2,16})$/g).test(val) || '']"
              outlined no-error-icon hide-hint maxlength="17" />
          </div>
        </q-card-section>
        <q-separator inset />
        <q-card-section :class="$q.screen.lt.sm ? 'col-1' : ''">
          <div class="row justify-end items-center q-gutter-x-sm q-px-md" :class="$q.screen.lt.sm ? '' : 'q-pt-lg'">
            <D4Btn label="적용" :progress="loading" type="submit" />
          </div>
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
  <router-view v-if="!showBT" />
</template>