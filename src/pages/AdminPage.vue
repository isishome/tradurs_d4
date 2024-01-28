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
const low = ref<number>(0)
const total = ref<number>(0)
const complete = computed(() => total.value === 0 ? 0 : Math.round(low.value / total.value * 100))
const status = computed(() => (state: string) => state === '000' ? '신규' : state === '001' ? '활성' : '비 활성')
const users = reactive<Array<IUser>>([])
const selected = computed(() => users.filter(u => u.selected).map(u => u.identity))

const getLow = async () => {
  const { low: resultLow, total: resultTotal } = await as.getLow()
  low.value = resultLow
  total.value = resultTotal
}

const getUsers = async () => {
  users.splice(0, users.length)
  const result = await as.getUsers(1)
  users.push(...result)
}

const enhance = async (identities: Array<string>) => {
  disable.value = true
  const result = await as.enhance(identities)

  if (!!!result)
    $q.notify({ message: '실패' })

  timer = setTimeout(async () => {
    await Promise.all([getLow(), getUsers()])
    disable.value = false
  }, 5000)
}

onMounted(async () => {
  await Promise.all([getLow(), getUsers()])
})

onUnmounted(() => {
  clearTimeout(timer)
})
</script>
<template>
  <div>
    <div class="row justify-end q-gutter-sm full-width">
      <div>{{ low }} / {{ total }}</div>
      <q-chip square dense color="blue-7" :label="`${complete}%`" />
    </div>
    <q-markup-table flat bordered dense class="users">
      <thead>
        <tr>
          <th><q-checkbox v-model="selectAll" @update:model-value="(val) => users.forEach(u => u.selected = val)" dense />
          </th>
          <th>고유번호</th>
          <th>이메일</th>
          <th>상태</th>
          <th class="text-center">
            <q-btn dense :disable="selected.length === 0" :loading="disable" color="primary" label="일괄 처리"
              @click="enhance(selected)" />
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
            <q-btn dense color="positive" label="변경" @click="enhance([user.identity])" />
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