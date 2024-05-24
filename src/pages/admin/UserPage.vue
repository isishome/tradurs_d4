<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { type IUser, useAdminStore } from 'stores/admin-store'
import { clipboard } from 'src/common'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const as = useAdminStore()
const { t } = useI18n({ useScope: 'global' })

const disable = ref<boolean>(true)
const selectAll = ref<boolean>(false)
const page = ref<number>(route.query.page ? parseInt(route.query.page as string) : 1)
const status = computed(() => (state: string) => state === '000' ? '신규(미 인증)' : state === '001' ? '활성' : '비 활성')
const colors = computed(() => (state: string) => state === '000' ? 'yellow-9' : state === '001' ? 'positive' : 'negative')
const users = reactive<Array<IUser>>([])
const selected = computed(() => users.filter(u => u.selected).map(u => u.identity))

const getUsers = async (p?: number) => {
  if (!!p && p !== page.value)
    return router.push({ name: 'adminUser', params: { lang: route.params.lang }, query: { page: p } })

  disable.value = true
  users.splice(0, users.length)
  const result = await as.getUsers(page.value, searchInfo.value)
  users.push(...result)
  disable.value = false
}

const move = (val: number) => {
  router.push({ name: 'adminUser', params: { lang: route.params.lang }, query: { page: page.value + val } })
}

const searchInfo = ref<string>()
const sendVerifyEmail = (identity: string) => {
  disable.value = true
  as.resendVerify(identity).then(() => {
    $q.notify({ message: '인증 메일이 발송이 완료되었습니다.', color: 'positive', classes: '' })
  }).catch(() => { }).then(() => {
    disable.value = false
  })
}

watch(() => route.query.page, async (val, old) => {
  if (val !== old && route.name === 'adminUser') {
    page.value = val ? parseInt(val as string) : 1
    await Promise.all([getUsers()])
  }
})

onMounted(async () => {
  await Promise.all([getUsers()])
})

</script>
<template>
  <div>
    <div class="row justify-between items-center q-mb-sm">
      <div></div>
      <div class="row justify-end items-center q-gutter-x-sm">
        <q-input dense outlined v-model="searchInfo" />
        <q-btn unelevated dense color="primary" label="검색" @click="getUsers(1)" />
      </div>
    </div>
    <q-markup-table flat bordered dense class="users overflow-hidden">
      <thead>
        <tr>
          <th><q-checkbox v-model="selectAll" @update:model-value="(val) => users.forEach(u => u.selected = val)"
              dense />
          </th>
          <th>고유번호</th>
          <th>이메일</th>
          <th>배틀 태그</th>
          <th>상태</th>
          <th>기능</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.identity">
          <td><q-checkbox v-model="user.selected" dense /></td>
          <td class="ellipsis" style="max-width:50px">
            <span class="cursor-pointer underline" @click="clipboard(user.identity, '사용자 고유값')">
              {{ user.identity }}
            </span>
          </td>
          <td class="ellipsis cursor-pointer" style="max-width:50px">
            <span class="cursor-pointer underline" @click="clipboard(user.identity, '사용자 이메일')">
              {{ user.email }}
            </span>
          </td>
          <td class="ellipsis cursor-pointer" style="max-width:50px">
            <span class="cursor-pointer underline" @click="clipboard(user.battleTag, '사용자 배틀 태그')">
              {{ user.battleTag }}
            </span>
          </td>
          <td :class="`text-${colors(user.status)}`">{{ status(user.status) }}</td>
          <td>
            <q-btn-dropdown color="primary" label="기능" dense unelevated content-class="bordered" class="no-hover"
              :ripple="false" dropdown-icon="img:/images/icons/dropdown.svg">
              <q-list dense>
                <q-item clickable v-close-popup @click="sendVerifyEmail(user.identity)">
                  <q-item-section>
                    <q-item-label>인증 메일 재 전송</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </td>
        </tr>
        <tr v-show="users.length === 0 && !disable">
          <td colspan="6">
            <div class="text-center q-py-xl">사용자 데이터가 없습니다.</div>
          </td>
        </tr>
      </tbody>
      <q-inner-loading :showing="disable">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>
    </q-markup-table>
    <div class="row justify-between q-mt-md q-px-sm paging">
      <div>{{ t('message.page', { page }) }}</div>
      <div class="row justify-end items-center q-gutter-x-md">
        <q-btn flat dense round padding="0" aria-label="Tradurs Prev Button" :disable="!as.over || disable"
          :shadow="!$q.dark.isActive" @click="move(-1)">
          <img src="/images/icons/prev.svg" width="24" height="24" class="icon" alt="Tradurs Prev Icon" />
        </q-btn>
        <q-btn flat dense round padding="0" aria-label="Tradurs Next Button" :disable="!as.more || disable"
          :shadow="!$q.dark.isActive" @click="move(1)">
          <img src="/images/icons/next.svg" width="24" height="24" class="icon" alt="Tradurs Next Icon" />
        </q-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users:deep(th:not(:last-child)) {
  text-align: inherit;
}

.users:deep(td:last-child) {
  text-align: center;
}
</style>