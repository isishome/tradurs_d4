<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAdminStore } from 'stores/admin-store'

const $q = useQuasar()
const as = useAdminStore()

const disable = ref<boolean>(false)

const resetCore = async () => {
  disable.value = true
  try {
    const result = await as.resetCore()
    $q.notify({ message: '전역 코어 데이터가 정상적으로 초기화 되었습니다.', color: 'positive', classes: '' })
  }
  catch { }
  disable.value = false
}
</script>
<template>
  <q-list bordered>
    <q-item clickable :disable="disable" @click="resetCore">
      <q-item-section>
        <q-item-label>
          코어 데이터 초기화
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<style scoped></style>