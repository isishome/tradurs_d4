<script lang="ts">
import { useAccountStore } from 'stores/account-store'
import { useItemStore } from 'stores/item-store'

export default {
  preFetch({ store }) {
    const as = useAccountStore(store)
    const is = useItemStore(store)
    //return Promise.all([as.checkSign(), as.getEvaluations(), is.getBase(), is.getProperties(), is.getAffixes(), is.getRestrictions()])
    return Promise.all([as.getEvaluations(), is.getBase(), is.getProperties(), is.getAffixes(), is.getRestrictions()])
  }
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

const $q = useQuasar()
const as = useAccountStore()
const { t, locale } = useI18n({ useScope: 'global' })

await as.checkSign()

const view = ref<boolean>(false)
const isDark = ref($q.cookies.has('d4.dark') ? $q.cookies.get('d4.dark') === 'true' : $q.dark.isActive)
$q.dark.set(isDark.value)
const lang = $q.cookies.has('d4.lang') ? $q.cookies.get('d4.lang') as string : 'ko'
locale.value = lang

const battleTag = ref<string>('')
const showBT = computed(() => (as.signed as boolean && !(as.info.battleTag && as.info.battleTag !== '') && view.value))
const loading = ref<boolean>(false)
const updateBattleTag = () => {
  as.updateBattleTag(battleTag.value)
    .then(() => {
      as.info.battleTag = `#${battleTag.value}`
    })
}

onMounted(() => {
  view.value = true
})
</script>

<template>
  <q-dialog v-model="showBT" persistent transition-show="none" transition-hide="none">
    <q-card class="card-item dialog normal">
      <q-form class="inner column full-height" @submit="updateBattleTag">
        <q-card-section>
          <div class="q-pa-md text-h6">{{ t('battlenet.title') }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="q-px-lg" :class="$q.screen.gt.sm ? 'text-body1' : 'text-body2'">
            {{ t('battlenet.msg1') }}
            <strong class="text-amber">Tradurs Diablo IV</strong>
            {{ t('battlenet.msg2') }}
          </div>
        </q-card-section>
        <q-card-section class="text-center">
          <div class="q-px-lg" :class="$q.screen.gt.sm ? 'text-body2' : 'text-caption'">
            {{ t('battlenet.desc') }}
          </div>
        </q-card-section>
        <q-card-section>
          <div class="q-px-lg q-py-md">
            <q-input autofocus v-model="battleTag" label="BattleTag™" :placeholder="t('battlenet.placeholder')" prefix="#"
              fill-mask :disable="loading"
              :rules="[val => val && (/^([ㄱ-ㅎㅏ-ㅣ가-힣]{1}[ㄱ-ㅎㅏ-ㅣ가-힣0-9]{1,12}|[a-zA-Z]{1}[a-zA-Z0-9]{2,16})$/g).test(val) || '']"
              outlined no-error-icon hide-hint maxlength="17" />
          </div>
        </q-card-section>
        <q-separator inset />
        <q-card-section :class="{ 'col-1': $q.screen.lt.sm }">
          <div class="row justify-end items-center q-gutter-sm q-px-md" :class="{ 'q-pt-lg': $q.screen.lt.sm }">
            <D4Btn :label="t('btn.apply')" :progress="loading" type="submit" />
          </div>
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
  <router-view v-if="!showBT && view" />
</template>