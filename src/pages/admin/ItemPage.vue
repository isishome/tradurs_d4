<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { type Search, type Item, useAdminStore } from 'src/stores/admin-store'
import { useItemStore } from 'src/stores/item-store'
import { checkName } from 'src/common'
import { param } from 'cypress/types/jquery'

const props = defineProps<{
  identity?: string
}>()

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })
const as = useAdminStore()
const is = useItemStore()

const disable = ref<boolean>(true)
const selectAll = ref<boolean>(false)
const page = ref<number>(
  route.query.page ? parseInt(route.query.page as string) : 1
)
const searchInfo = reactive<Search>({
  itemName: !!route.query.keyword
    ? decodeURIComponent(route.query.keyword as string)
    : undefined
})
const items = reactive<Array<Item>>([])
const status = is.findItemStatus
const statusColor = computed(
  () => (statusCode: string) =>
    statusCode === '001'
      ? 'text-positive'
      : statusCode === '004'
      ? 'text-warning'
      : ''
)
const selectedItems = computed(() =>
  items.filter((i) => i.statusCode !== '009' && i.selected).map((i) => i.itemId)
)
const qualifiable = computed(
  () => (item: Item) =>
    !['rune', 'inventory', 'consumables'].includes(item.itemType)
)
const itemName = computed(
  () => (item: Item) =>
    (item.itemType === 'rune'
      ? `${is.findRune(item.itemTypeValue2)?.label} ${
          is.findType('rune')?.label
        }`
      : qualifiable.value(item)
      ? item.itemName
      : item.itemTypeValue1 === 'gem'
      ? is.gems.find((g) => g.value === item.itemTypeValue2)?.label
      : item.itemTypeValue1 === 'elixir'
      ? is.elixirs.find((e) => e.value === item.itemTypeValue2)?.label
      : item.itemTypeValue1 === 'summoning'
      ? is.summonings.find((s) => s.value === item.itemTypeValue2)?.label
      : item.itemName) ?? t('item.unknown')
)

const getItems = async (p?: number) => {
  if (!!p && p !== page.value)
    return router.push({
      name: 'adminItem',
      params: { lang: route.params.lang, identity: props.identity },
      query: { page: p }
    })

  disable.value = true
  items.splice(0, items.length)
  const result = await as.getItems(page.value, props.identity, searchInfo)
  items.push(...result)
  disable.value = false
}

const move = (val: number) => {
  router.push({
    name: 'adminItem',
    params: {
      lang: route.params.lang,
      identity: props.identity
    },
    query: {
      page: page.value + val,
      keyword: !!searchInfo.itemName
        ? encodeURIComponent(searchInfo.itemName as string)
        : undefined
    }
  })
}

const updateItemName = (itemId: number, itemName: string, oldName: string) => {
  if (checkName(itemName)) {
    const findItem = items.find((i) => i.itemId === itemId)
    if (findItem) {
      disable.value = true
      const trimName = itemName.replace(/\n/g, '')
      as.updateItemName(itemId, trimName)
        .then(() => {
          selectAll.value = false
          $q.notify({
            message: '아이템명이 변경되었습니다',
            color: 'positive',
            classes: ''
          })
          findItem.itemName = trimName
        })
        .catch(() => {
          findItem.itemName = oldName
        })
        .then(() => {
          disable.value = false
        })
    }
  }

  return false
}

const deleteItems = async (itemIds: Array<number>) => {
  if (itemIds.length === 0) return

  $q.dialog({
    title: '아이템 삭제',
    message:
      '<div class="text-weight-bold text-red-8">선택한 아이템(들)을 삭제하시겠습니까?</div>',
    html: true,
    persistent: true,
    cancel: { label: '취소', color: 'grey' },
    ok: { label: '확인', color: 'red-8' }
  }).onOk(async () => {
    try {
      disable.value = true
      await as.deleteItems(itemIds)
      selectAll.value = false

      $q.notify({
        message: '아이템이 삭제되었습니다',
        color: 'positive',
        classes: ''
      })

      await getItems()
    } catch {
    } finally {
      disable.value = false
    }
  })
}

watch(
  () => [route.query.page, route.query.keyword],
  async ([val1, val2], [old1, old2]) => {
    if (route.name === 'adminItem') {
      if (val2 !== old2) {
        page.value = 1
        searchInfo.itemName = !!val2
          ? decodeURIComponent(val2 as string)
          : undefined
      } else if (val1 !== old1) page.value = val1 ? parseInt(val1 as string) : 1

      await getItems()
    }
  }
)

onMounted(async () => {
  await getItems()
})
</script>
<template>
  <div>
    <div class="row justify-between items-center q-mb-sm">
      <div class="row jusitfy-start items-center q-gutter-x-sm"></div>
      <div class="row justify-end items-center q-gutter-x-sm">
        <q-input
          dense
          outlined
          :disable="disable"
          v-model="searchInfo.itemName"
          @keyup.enter="
            () =>
              router.push({
                name: 'adminItem',
                params: { identity, lang: route.params.lang },
                query: { page: 1, keyword: !!searchInfo.itemName ? encodeURIComponent(searchInfo.itemName as string) : undefined }
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
              :disable="!!!searchInfo.itemName || disable"
              :to="{
                name: 'adminItem',
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
          :disable="!!!searchInfo.itemName || disable"
          :to="{
                name: 'adminItem',
                params: { identity, lang: route.params.lang },
                query: { page: 1, keyword: !!searchInfo.itemName ? encodeURIComponent(searchInfo.itemName as string) : undefined }
              }"
        />
      </div>
    </div>
    <q-markup-table flat bordered>
      <thead>
        <tr>
          <th style="width: 50px">
            <q-checkbox
              v-model="selectAll"
              @update:model-value="
                (val) =>
                  items
                    .filter((i) => i.statusCode !== '009')
                    .forEach((i) => (i.selected = val))
              "
              dense
            />
          </th>
          <th></th>
          <th></th>
          <th class="text-right">
            <q-btn
              unelevated
              dense
              color="red-8"
              class="text-weight-bold"
              :disable="items.filter((i) => i.selected).length === 0"
              :loading="disable"
              label="일괄 삭제"
              @click="deleteItems(selectedItems)"
            />
          </th>
        </tr>
      </thead>
      <tbody v-if="items.length === 0 && !disable">
        <tr>
          <td colspan="4">
            <div class="text-center q-py-xl">아이템 데이터가 없습니다.</div>
          </td>
        </tr>
      </tbody>
      <template v-else>
        <tbody v-for="item in items" :key="item.itemId">
          <tr :style="item.statusCode === '009' ? 'opacity:.3' : ''">
            <td style="width: 50px">
              <q-checkbox
                v-model="item.selected"
                :disable="item.statusCode === '009'"
                dense
              />
            </td>
            <td style="white-space: normal">
              <div
                :class="{ 'text-underline cursor-pointer': qualifiable(item) }"
              >
                {{ itemName(item) }}
                <q-menu class="no-shadow">
                  <q-list bordered class="rounded-borders">
                    <q-item
                      clickable
                      :to="{
                        name: 'itemInfo',
                        params: {
                          itemid: item.itemId,
                          lang: route.params.lang
                        }
                      }"
                    >
                      <q-item-section>아이템 바로가기</q-item-section>
                    </q-item>
                    <q-item v-if="qualifiable(item)" clickable>
                      <q-item-section>아이템 명 수정</q-item-section>
                      <q-popup-edit
                        v-if="qualifiable(item)"
                        v-model="item.itemName"
                        v-slot="scope"
                        :disable="item.statusCode === '009'"
                        cover
                        class="no-shadow bg-transparent"
                        :validate="(val) => checkName(val)"
                        @save="
                          (val, init) => updateItemName(item.itemId, val, init)
                        "
                      >
                        <q-input
                          type="textarea"
                          v-model="scope.value"
                          :disable="disable"
                          dense
                          autofocus
                          outlined
                          maxlength="256"
                          @keyup.enter="scope.set"
                        />
                      </q-popup-edit>
                    </q-item>
                  </q-list>
                </q-menu>
              </div>
            </td>
            <td v-if="item.statusCode === '009'">삭제된 아이템</td>
            <td v-else :class="statusColor(item.statusCode)">
              {{ status(item.statusCode)?.label }}
            </td>
            <td class="text-right">
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
                  <q-item
                    clickable
                    v-close-popup
                    @click="deleteItems([item.itemId])"
                  >
                    <q-item-section>
                      <q-item-label class="text-red-8">삭제</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    :to="{
                      name: 'adminUser',
                      params: {
                        identity: item.userIdentity,
                        lang: route.params.lang
                      }
                    }"
                  >
                    <q-item-section>
                      <q-item-label>사용자 정보</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </td>
          </tr>
        </tbody>
      </template>
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
          :disable="!as.over || disable"
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
          :disable="!as.more || disable"
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
  </div>
</template>
