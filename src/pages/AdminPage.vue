<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { type IUser, useAdminStore } from 'stores/admin-store'
import { onUnmounted } from 'vue';

const $q = useQuasar()
const as = useAdminStore()

let timer: ReturnType<typeof setTimeout>
const disable = ref<boolean>(false)
const selectAll = ref<boolean>(false)
const status = computed(() => (state: string) => state === '000' ? '신규' : state === '001' ? '활성' : '비 활성')
const users = reactive<Array<IUser>>([])
const selected = computed(() => users.filter(u => u.selected).map(u => u.identity))

const getUsers = async () => {
  users.splice(0, users.length)
  const result = await as.getUsers(1)
  users.push(...result)
}

onMounted(async () => {
  await Promise.all([getUsers()])
})

onUnmounted(() => {
  clearTimeout(timer)
})
</script>
<template>
  <div>
    <q-markup-table flat bordered dense class="users">
      <thead>
        <tr>
          <th><q-checkbox v-model="selectAll" @update:model-value="(val) => users.forEach(u => u.selected = val)" dense />
          </th>
          <th>고유번호</th>
          <th>이메일</th>
          <th>상태</th>
          <th class="text-center">
            <q-btn dense :disable="selected.length === 0" :loading="disable" color="primary" label="일괄 처리" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-show="users.length === 0">
          <td colspan="6">
            <div class="text-center q-py-xl">데이터가 없습니다.</div>
          </td>
        </tr>
        <tr v-for="user in users" :key="user.identity">
          <td><q-checkbox v-model="user.selected" dense /></td>
          <td class="ellipsis" style="max-width:50px">{{ user.identity }}</td>
          <td class="ellipsis" style="max-width:50px">{{ user.email }}
          </td>
          <td>{{ status(user.status) }}</td>
          <td class="text-center">
            <q-btn dense color="positive" label="변경" />
          </td>
        </tr>
      </tbody>
      <q-inner-loading :showing="disable">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>
    </q-markup-table>
  </div>
</template>

<style scoped>
.users:deep(th:not(:last-child)) {
  text-align: inherit;
}
</style>