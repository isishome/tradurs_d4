<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar, date } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useGlobalStore } from 'src/stores/global-store'
import {
  type IUser,
  type History,
  type Filter,
  useAdminStore
} from 'stores/admin-store'
import { clipboard } from 'src/common'

const props = defineProps<{
  identity?: string
}>()

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const gs = useGlobalStore()
const as = useAdminStore()
const { t } = useI18n({ useScope: 'global' })

const disable = ref<boolean>(true)
const selectAll = ref<boolean>(false)
const page = ref<number>(
  route.query.page ? parseInt(route.query.page as string) : 1
)
const searchInfo = ref<string | undefined>(
  !!route.query.keyword
    ? decodeURIComponent(route.query.keyword as string)
    : undefined
)
const filter = reactive<Filter>({
  status: 'all',
  verified: 'all',
  statusOptions: [
    { value: 'all', label: '전체' },
    { value: '000', label: '신규(비인증)', color: 'yellow-9' },
    { value: '001', label: '활성', color: 'positive' },
    { value: '002', label: '비활성', color: 'negative' }
  ],
  verifiedOptions: [
    { value: 'all', label: '전체' },
    { value: 'verified', label: '인증' },
    { value: 'unverified', label: '비인증' }
  ]
})
const status = computed(
  () => (state: string) =>
    filter.statusOptions.find((so) => so.value === state)?.label
)
const colors = computed(
  () => (state: string) =>
    filter.statusOptions.find((so) => so.value === state)?.color ?? ''
)
const users = reactive<Array<IUser>>([])
const selected = computed(() =>
  users.filter((u) => u.selected).map((u) => u.identity)
)
const getUsers = async (p?: number) => {
  if (!!p && p !== page.value)
    return router.push({
      name: 'adminUser',
      params: { lang: route.params.lang },
      query: { page: p }
    })

  disable.value = true
  users.splice(0, users.length)
  const result = await as.getUsers(
    page.value,
    props.identity,
    filter,
    searchInfo.value
  )
  users.push(...result)
  disable.value = false
}
const move = (val: number) => {
  router.push({
    name: 'adminUser',
    params: { lang: route.params.lang },
    query: {
      page: page.value + val,
      keyword: !!searchInfo.value
        ? encodeURIComponent(searchInfo.value as string)
        : undefined
    }
  })
}

const sendVerifyEmail = (identity: string, lang: string) => {
  disable.value = true
  as.resendVerify(identity, lang)
    .then(() => {
      $q.notify({
        message: '인증 메일이 발송이 완료되었습니다.',
        color: 'positive',
        classes: ''
      })
    })
    .catch(() => {})
    .then(() => {
      disable.value = false
    })
}

type Deactivate = {
  show: boolean
  identity: string | null
  hour?: number
  description?: string
}

const deactivateInfo = reactive<Deactivate>({
  show: false,
  identity: null,
  hour: 24,
  description: '관리자'
})

const showDeactivate = (identity: string) => {
  deactivateInfo.identity = identity
  deactivateInfo.show = true
}

const deactivate = () => {
  disable.value = true
  as.deactivate(
    deactivateInfo.identity as string,
    deactivateInfo.hour,
    deactivateInfo.description
  )
    .then(() => {
      $q.notify({
        message: '계정 비활성화가 완료되었습니다.',
        color: 'positive',
        classes: ''
      })
    })
    .catch(() => {})
    .then(async () => {
      disable.value = false
      deactivateInfo.show = false
      await getUsers()
    })
}

const clearDeactivateInfo = () => {
  deactivateInfo.identity = null
  deactivateInfo.hour = 24
  deactivateInfo.description = '관리자'
}

const activate = (identity: string) => {
  disable.value = true
  as.activate(identity)
    .then(() => {
      $q.notify({
        message: '계정 활성화가 완료되었습니다.',
        color: 'positive',
        classes: ''
      })
    })
    .catch(() => {})
    .then(async () => {
      disable.value = false
      await getUsers()
    })
}

const history = reactive<History>({
  show: false,
  identity: undefined,
  data: []
})
const clearHistoryInfo = () => {
  history.identity = undefined
  history.data.splice(0, history.data.length)
  as.historyParams.nextHistoryId = null
}
const getHistory = () => {
  disable.value = true
  as.getHistory(history.identity as string)
    .then((data) => {
      history.data.push(...data)
    })
    .catch(() => {})
    .then(() => {
      disable.value = false
    })
}

watch(
  () => [route.query.page, route.query.keyword],
  async ([val1, val2], [old1, old2]) => {
    if (route.name === 'adminUser') {
      if (val2 !== old2) {
        page.value = 1
        searchInfo.value = !!val2
          ? decodeURIComponent(val2 as string)
          : undefined
      } else if (val1 !== old1) page.value = val1 ? parseInt(val1 as string) : 1

      await Promise.all([getUsers()])
    }
  }
)

onMounted(async () => {
  await Promise.all([getUsers()])
})
</script>
<template>
  <div>
    <div class="row justify-between items-center q-mb-sm q-col-gutter-sm">
      <div class="col-12 col-sm row jusitfy-start items-center q-gutter-x-sm">
        <q-select
          v-model="filter.status"
          :options="filter.statusOptions"
          emit-value
          map-options
          outlined
          dense
          class="col"
          popup-content-class="bordered"
          label="계정 상태"
          dropdown-icon="img:/images/icons/dropdown.svg"
          :disable="!!identity"
          @update:model-value="getUsers(1)"
        />
        <q-select
          v-model="filter.verified"
          :options="filter.verifiedOptions"
          emit-value
          map-options
          outlined
          dense
          class="col"
          popup-content-class="bordered"
          label="배틀 태그 활성상태"
          dropdown-icon="img:/images/icons/dropdown.svg"
          :disable="!!identity"
          @update:model-value="getUsers(1)"
        />
      </div>
      <div class="col-12 col-sm row justify-end items-center q-gutter-x-sm">
        <q-input
          dense
          outlined
          :disable="disable || !!identity"
          v-model="searchInfo"
          @keyup.enter="
            () =>
              router.push({
                name: 'adminUser',
                params: { identity, lang: route.params.lang },
                query: { page: 1, keyword: !!searchInfo ? encodeURIComponent(searchInfo as string) : undefined }
              })
          "
        >
          <template #append>
            <q-btn
              :class="{ invisible: !!!searchInfo }"
              flat
              dense
              size="sm"
              :ripple="false"
              class="no-hover icon"
              padding="0"
              icon="img:/images/icons/close.svg"
              :disable="!!!searchInfo || disable || !!identity"
              :to="{
                name: 'adminUser',
                params: { identity, lang: route.params.lang },
                query: { page }
              }"
            />
          </template>
        </q-input>
        <q-btn
          unelevated
          dense
          color="primary"
          label="검색"
          :disable="!!!searchInfo || disable || !!identity"
          :to="{
                name: 'adminUser',
                params: { identity, lang: route.params.lang },
                query: { page: 1, keyword: !!searchInfo ? encodeURIComponent(searchInfo as string) : undefined }
              }"
        />
      </div>
    </div>
    <q-markup-table flat bordered class="users overflow-hidden">
      <thead>
        <tr>
          <th>
            <q-checkbox
              v-model="selectAll"
              @update:model-value="
                (val) => users.forEach((u) => (u.selected = val))
              "
              dense
            />
          </th>
          <th></th>
          <th>정보</th>
          <th>기능</th>
        </tr>
      </thead>
      <tbody v-show="users.length === 0 && !disable">
        <tr>
          <td colspan="6">
            <div class="text-center q-py-xl">사용자 데이터가 없습니다.</div>
          </td>
        </tr>
      </tbody>
      <tbody v-for="user in users" :key="user.identity">
        <tr>
          <td rowspan="2" style="width: 50px">
            <q-checkbox v-model="user.selected" dense />
          </td>
          <td colspan="2">
            <div class="row items-center q-gutter-md">
              <div
                class="cursor-pointer underline"
                @click="clipboard(user.email, '사용자 이메일')"
              >
                {{ user.email }}
              </div>
              <div
                class="cursor-pointer underline"
                @click="clipboard(user.battleTag, '사용자 배틀 태그')"
              >
                {{ user.battleTag }}
              </div>
            </div>
          </td>
          <td rowspan="2">
            <q-btn-dropdown
              label="기능"
              dense
              outline
              unelevated
              content-class="bordered"
              class="no-hover"
              :ripple="false"
              dropdown-icon="img:/images/icons/dropdown.svg"
            >
              <q-list dense>
                <q-item v-if="user.status === '000'" clickable>
                  <q-item-section>
                    <q-item-label>인증 메일 재 전송</q-item-label>
                  </q-item-section>
                  <q-menu
                    auto-close
                    class="no-shadow"
                    anchor="top right"
                    self="top left"
                    transition-show="jump-right"
                    transition-hide="jump-left"
                  >
                    <q-list bordered class="rounded-borders">
                      <q-item
                        v-for="lang in gs.localeOptions"
                        :key="lang.value"
                        clickable
                        @click="sendVerifyEmail(user.identity, lang.value)"
                      >
                        {{ lang.label }}</q-item
                      >
                    </q-list>
                  </q-menu>
                </q-item>
                <q-item
                  v-if="user.status === '001'"
                  clickable
                  v-close-popup
                  @click="showDeactivate(user.identity)"
                >
                  <q-item-section>
                    <q-item-label>계정 비활성화</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="user.status === '002'"
                  clickable
                  v-close-popup
                  @click="activate(user.identity)"
                >
                  <q-item-section>
                    <q-item-label>계정 활성화</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  :to="{
                    name: 'adminItem',
                    params: { lang: route.params.lang, identity: user.identity }
                  }"
                >
                  <q-item-section>
                    <q-item-label>아이템 보기</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="
                    () => {
                      history.identity = user.identity
                      history.show = true
                    }
                  "
                >
                  <q-item-section>
                    <q-item-label>활동 내역 보기</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <div class="row items-center q-gutter-md">
              <div>
                계정 :
                <span :class="`text-${colors(user.status)}`">{{
                  status(user.status)
                }}</span>
              </div>
              <div>
                배틀 태그 :
                <span
                  :class="`text-${user.verified ? 'positive' : 'warning'}`"
                  >{{ user.verified ? '인증' : '비 인증' }}</span
                >
              </div>
            </div>
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
        <q-btn
          flat
          dense
          round
          padding="0"
          aria-label="Tradurs Prev Button"
          :disable="!as.over || disable || !!identity"
          :shadow="!$q.dark.isActive"
          @click="move(-1)"
        >
          <img
            src="/images/icons/prev.svg"
            width="24"
            height="24"
            class="icon"
            alt="Tradurs Prev Icon"
          />
        </q-btn>
        <q-btn
          flat
          dense
          round
          padding="0"
          aria-label="Tradurs Next Button"
          :disable="!as.more || disable || !!identity"
          :shadow="!$q.dark.isActive"
          @click="move(1)"
        >
          <img
            src="/images/icons/next.svg"
            width="24"
            height="24"
            class="icon"
            alt="Tradurs Next Icon"
          />
        </q-btn>
      </div>
    </div>
    <D4Dialog
      v-model="deactivateInfo.show"
      persistent
      @submit="deactivate"
      @before-hide="clearDeactivateInfo"
    >
      <template #top>
        <q-card-section class="text-h6">계정 비활성화</q-card-section>
      </template>
      <template #middle>
        <q-card-section class="row items-center q-gutter-sm">
          <div class="col-3">비활성 시간 (hour)</div>
          <div class="col">
            <q-input dense outlined v-model="deactivateInfo.hour"></q-input>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="row items-center q-gutter-sm">
          <div class="col-3">비활성 사유</div>
          <div class="col">
            <q-input
              dense
              outlined
              type="textarea"
              v-model="deactivateInfo.description"
            ></q-input>
          </div>
        </q-card-section>
      </template>
      <template #bottom>
        <q-card-section class="row justify-end q-gutter-sm">
          <q-btn
            unelevated
            color="negative"
            class="text-weight-bold"
            label="차단"
            type="submit"
          />
          <q-btn
            unelevated
            color="grey-7"
            label="취소"
            @click="() => (deactivateInfo.show = false)"
          />
        </q-card-section>
      </template>
    </D4Dialog>
    <D4Dialog
      v-model="history.show"
      @before-hide="clearHistoryInfo"
      @show="getHistory"
      :maximized="$q.screen.lt.sm"
    >
      <template #top>
        <q-card-section class="text-h6">활동 내역</q-card-section>
      </template>
      <template #middle>
        <q-card-section
          class="col scroll"
          :style="
            $q.screen.lt.sm
              ? 'height:100%;width:100%;'
              : 'min-height:40vh !important;max-height:50vh !important'
          "
        >
          <q-markup-table flat bordered class="full-width">
            <q-inner-loading
              :showing="disable"
              class="fixed"
              style="z-index: 1"
            >
              <q-spinner class="fixed-center" size="50px" color="primary" />
            </q-inner-loading>
            <thead>
              <tr>
                <th>히스토리 유형</th>
                <th>활동 유형</th>
                <th>활동 정보</th>
                <th>날짜</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in history.data" :key="h.historyId">
                <td>{{ h.typeName }}</td>
                <td>{{ h.actionName }}</td>
                <td style="white-space: normal">{{ h.contents }}</td>
                <td>{{ date.formatDate(h.regDate, 'YYYY.MM.DD HH:mm') }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </template>
      <template #bottom>
        <q-card-section class="row justify-between q-gutter-sm">
          <div>
            <q-btn
              v-if="!!as.historyParams.nextHistoryId"
              label="더보기"
              unelevated
              color="primary"
              :disable="disable"
              @click="getHistory"
            />
          </div>
          <q-btn
            unelevated
            :disable="disable"
            color="grey-7"
            label="닫기"
            @click="() => (history.show = false)"
          />
        </q-card-section>
      </template>
    </D4Dialog>
  </div>
</template>

<style scoped>
.users:deep(th:not(:last-child)) {
  text-align: inherit;
}

.users:deep(td:last-child) {
  text-align: center;
}

.users:deep(tbody td:before) {
  background: none;
}

.users:deep(tbody tr:not(:last-child) > td:not(:first-child, :last-child)) {
  border-bottom-width: 0;
}

.users:deep(tbody:last-child tr:not(:last-child) > td:first-child),
.users:deep(tbody:last-child tr:not(:last-child) > td:last-child) {
  border-bottom-width: 0;
}

.users:deep(tbody:not(:last-child) tr:first-child > td:first-child),
.users:deep(tbody:not(:last-child) tr:first-child > td:last-child) {
  border-bottom-width: 1px;
}

.users:deep(tbody:not(:last-child) tr:last-child > td) {
  border-bottom-width: 1px;
}
</style>
