<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { QInput, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from 'src/stores/admin-store'

const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })
const as = useAdminStore()

const messageKoRef = ref<QInput>()
const messageEnRef = ref<QInput>()
const messageKo = ref<string>('')
const messageEn = ref<string>('')

const send = () => {
  if (!!!messageKo.value.trim() || !!!messageEn.value.trim()) return

  $q.dialog({
    title: '공지 알림 전송',
    dark: !$q.dark.isActive,
    class: `text-${$q.dark.isActive ? 'dark' : 'light'}`,
    message: '공지 알림을 전송하시겠습니까?',
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey' },
    ok: { label: t('btn.confirm') }
  })
    .onOk(() => {
      as.sendNotice({ ko: messageKo.value, en: messageEn.value })
        .then(() => {
          $q.notify({
            message: '공지 알림 전송 완료',
            color: 'positive',
            icon: 'img:/images/icons/check.svg'
          })
          messageKo.value = ''
          messageEn.value = ''

          nextTick(() => {
            messageKoRef.value?.resetValidation()
            messageEnRef.value?.resetValidation()
          })
        })
        .catch(() => {
          $q.notify({
            message: '공지 알림 실패',
            color: 'negative',
            icon: 'img:/images/icons/alert.svg'
          })
        })
    })
    .onCancel(() => {
      // console.log('>>>> Cancel')
    })
}
</script>
<template>
  <q-card bordered class="notice">
    <q-form @submit="send">
      <q-card-section>
        <q-input
          ref="messageKoRef"
          v-model="messageKo"
          type="textarea"
          class="no-padding"
          input-class="scroll"
          placeholder="한글"
          outlined
          no-error-icon
          :rules="[(val) => !!val.trim() || '한글 공지 내용을 입력하세요']"
        />
      </q-card-section>
      <q-card-section>
        <div v-html="messageKo"></div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-input
          ref="messageEnRef"
          v-model="messageEn"
          type="textarea"
          class="no-padding"
          input-class="scroll"
          placeholder="영문"
          outlined
          no-error-icon
          :rules="[(val) => !!val.trim() || '영문 공지 내용을 입력하세요']"
        />
      </q-card-section>
      <q-card-section>
        <div v-html="messageEn"></div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn color="primary" label="전송" type="submit" />
      </q-card-actions>
    </q-form>
  </q-card>
</template>
<style scoped>
.notice:deep(.q-field--outlined .q-field__control) {
  padding: 0 2px 0 12px;
}
</style>
