<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAdminStore } from 'stores/admin-store'

const $q = useQuasar()
const as = useAdminStore()

const disable = ref<boolean>(false)

const refreshAffixes = async () => {
  disable.value = true
  try {
    await as.refreshAffixes()
    $q.notify({
      message: '아이템 속성 데이터가 정상적으로 새로고침 되었습니다.',
      color: 'positive',
      classes: ''
    })
  } catch {}
  disable.value = false
}
</script>
<template>
  <q-list bordered>
    <q-item clickable :disable="disable" @click="refreshAffixes">
      <q-item-section>
        <q-item-label>아이템 속성 데이터 새로고침</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<style scoped></style>
