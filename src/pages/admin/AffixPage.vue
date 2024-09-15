<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useQuasar, QInput, debounce } from 'quasar'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAdminStore, type RequestAffix } from 'stores/admin-store'
import { type Affix, useItemStore } from 'stores/item-store'
import { checkAttribute } from 'src/common'

const route = useRoute()
const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })
const as = useAdminStore()
const is = useItemStore()

type AffixInfo = {
  show: boolean
  action: 'insert' | 'update'
  affixId: number | null
  affixType: string
  affixAttribute: string
  languageId: string
}

type AffixError = {
  error: boolean
  errorMessage: string
}

const disable = ref<boolean>(false)
const columns = ['affixType', 'affixAttribute']
const requestAffixes = reactive<Array<RequestAffix>>([])
const affixes = is.filterAffixes
const affixIdRef = ref<QInput>()
const affixId = ref<string>()
const wordRef = ref<QInput>()
const word = ref<string>()
const affixNeedle = ref<string>()
const availableAffixId = computed(
  () =>
    Math.max(
      ...is.affixes.data
        .filter((a) =>
          affixInfo.affixType === 'legendaryAspect'
            ? a.type === 'legendary' && (a.value as number) < 801
            : a.type === affixInfo.affixType
        )
        .map((a) => a.value as number)
    ) + 1
)
const filteredAffixes = computed(() =>
  !!affixId.value
    ? affixes().filter((a) => a.value === Number(affixId.value))
    : affixNeedle.value
    ? affixes(affixNeedle.value).filter((a) => !isNaN(Number(a.value)))
    : []
)

const filterAffixes = debounce((e: KeyboardEvent) => {
  const val = (e.target as HTMLInputElement).value.toLowerCase()
  affixNeedle.value = val
}, 500)

const attributeTypes = [
  { value: 'standard', label: '표준' },
  { value: 'legendary', label: '전설' },
  { value: 'legendaryAspect', label: '전설 위상' },
  { value: 'unique', label: '고유' }
]

const affixInfo = reactive<AffixInfo>({
  action: 'insert',
  show: false,
  affixId: null,
  affixType: 'standard',
  affixAttribute: '',
  languageId: ((route.params.lang as string) || 'ko').toLowerCase()
})

const affixError = reactive<AffixError>({
  error: false,
  errorMessage: ''
})
const refAttribute = ref<QInput>()

const deleteRequestAffix = (requestIds: Array<number>) => {
  disable.value = true
  as.deleteRequestAffix(requestIds)
    .then(() => {
      requestIds.forEach((requestId) => {
        const findRequestAffixIndex = requestAffixes.findIndex(
          (ra) => ra.requestId == requestId
        )

        if (findRequestAffixIndex !== -1)
          requestAffixes.splice(findRequestAffixIndex, 1)
      })

      $q.notify({
        message: '속성 요청이 삭제되었습니다',
        color: 'positive',
        classes: ''
      })
    })
    .catch(() => {})
    .then(async () => {
      disable.value = false
    })
}

const upsert = () => {
  let errorMessage = ''
  if (!affixInfo.affixAttribute || affixInfo.affixAttribute.trim() === '')
    errorMessage = t('attribute.enter', { attr: '속성' })
  else if (!checkAttribute(affixInfo.affixAttribute))
    errorMessage = t('attribute.invalid', { attr: '속성' })
  else if (is.matchAffixes(affixInfo.affixType, affixInfo.affixAttribute))
    errorMessage = t('attribute.exists', { attr: '속성' })

  if (errorMessage !== '') {
    affixError.error = true
    affixError.errorMessage = errorMessage
    refAttribute.value?.focus()
    return
  }

  disable.value = true
  as.upsertAffix(
    affixInfo.action,
    affixInfo.affixId,
    affixInfo.affixType,
    affixInfo.affixAttribute,
    affixInfo.languageId
  )
    .then(() => {
      $q.notify({
        message: `속성이 ${!!affixInfo.affixId ? '수정' : '추가'}되었습니다`,
        color: 'positive',
        classes: ''
      })
    })
    .catch(() => {})
    .then(async () => {
      disable.value = false
      affixInfo.show = false
    })
}

const deleteAfiix = (affix: Affix) => {
  $q.dialog({
    title: '속성 삭제',
    message:
      '<div class="text-weight-bold text-red-8">해당 속성을 삭제하시겠습니까?</div><div class="q-mt-md text-caption">속성을 완전히 삭제하면 해당 속성을 사용하는 모든 아이템 속성이 삭제됩니다.</div>',
    html: true,
    persistent: true,
    cancel: { label: '취소', color: 'grey' },
    ok: { label: '확인', color: 'red-8' }
  }).onOk(() => {
    disable.value = true
    as.deleteAffix(affix.value as number)
      .then(() => {
        $q.notify({
          message: '속성이 삭제되었습니다',
          color: 'positive',
          classes: ''
        })
      })
      .catch(() => {})
      .then(async () => {
        disable.value = false
      })
  })
}

const openUpdate = (affix: Affix) => {
  affixInfo.action = 'update'
  affixInfo.affixId = affix.value as number
  affixInfo.affixType = affix.type
  affixInfo.affixAttribute = affix.label
  affixInfo.show = true
}

const clearAffixInfo = () => {
  affixInfo.action = 'insert'
  affixInfo.affixId = null
  affixInfo.affixType = 'standard'
  affixInfo.affixAttribute = ''
  affixError.error = false
  affixError.errorMessage = ''
}

const beforeShow = () => {
  if (affixInfo.action === 'insert') affixInfo.affixId = availableAffixId.value
}

const refreshAffixes = async () => {
  disable.value = true
  try {
    await as.refreshAffixes()
    is.affixes.request = 0
    await is.getAffixes()
    $q.notify({
      message: '아이템 속성 데이터가 정상적으로 적용되었습니다.',
      color: 'positive',
      classes: ''
    })
  } catch {}
  disable.value = false
}

watch(availableAffixId, (val, old) => {
  if (affixInfo.action === 'insert' && val !== old) affixInfo.affixId = val
})

onMounted(() => {
  as.getRequestAffixes().then((result) => {
    requestAffixes.splice(0, requestAffixes.length)
    requestAffixes.push(...result.map((r) => ({ ...r, selected: false })))
  })
})
</script>

<template>
  <div>
    <template v-if="requestAffixes.length > 0">
      <div class="row justify-end items-center q-mb-sm">
        <q-btn
          :disable="
            disable || requestAffixes.filter((ra) => ra.selected).length === 0
          "
          unelevated
          dense
          color="negative"
          label="일괄 삭제"
          @click="
            deleteRequestAffix(
              requestAffixes
                .filter((ra) => ra.selected)
                .map((ra) => ra.requestId)
            )
          "
        />
      </div>
      <q-virtual-scroll
        type="table"
        style="max-height: 500px"
        :virtual-scroll-item-size="48"
        :virtual-scroll-sticky-size-start="48"
        :virtual-scroll-sticky-size-end="32"
        :items="requestAffixes"
        class="no-shadow q-mb-xl"
        v-slot="{ item: row, index }"
      >
        <tr :key="index">
          <td style="width: 40px">
            <q-checkbox dense v-model="row['selected']" />
          </td>
          <td
            v-for="col in columns"
            :key="index + '-' + col"
            style="white-space: normal; min-width: 60px"
          >
            {{
              col === 'affixType'
                ? attributeTypes.find((at) => at.value === row[col])?.label
                : row[col]
            }}
          </td>
          <td style="width: 50px">
            <q-btn
              :disable="disable"
              unelevated
              dense
              color="negative"
              label="삭제"
              @click="deleteRequestAffix([row['requestId']])"
            />
          </td>
        </tr>
      </q-virtual-scroll>
    </template>
    <div class="row justify-between q-mb-sm">
      <div>
        <q-btn
          :disable="disable"
          unelevated
          color="positive"
          label="데이터 적용"
          @click="refreshAffixes"
        />
      </div>
      <div class="col-6 row justify-end q-gutter-x-sm">
        <div class="col">
          <q-input
            ref="wordRef"
            autofocus
            dense
            outlined
            :disable="disable"
            v-model.number="affixId"
            label="속성 아이디"
          >
            <template #append>
              <q-btn
                :class="{ invisible: !!!affixId }"
                flat
                dense
                size="sm"
                :ripple="false"
                class="no-hover icon"
                padding="0"
                icon="img:/images/icons/close.svg"
                :disable="!!!affixId || disable"
                @click="
                  () => {
                    affixId = ''
                    affixIdRef?.focus()
                  }
                "
              />
            </template>
          </q-input>
        </div>
        <div class="col-7">
          <q-input
            ref="wordRef"
            autofocus
            dense
            outlined
            v-model="word"
            label="속성 내용"
            :disable="disable"
            @input.capture="filterAffixes"
          >
            <template #append>
              <q-btn
                :class="{ invisible: !!!word }"
                flat
                dense
                size="sm"
                :ripple="false"
                class="no-hover icon"
                padding="0"
                icon="img:/images/icons/close.svg"
                :disable="!!!word || disable"
                @click="
                  () => {
                    word = ''
                    affixNeedle = ''
                    wordRef?.focus()
                  }
                "
              />
            </template>
          </q-input>
        </div>
      </div>
    </div>
    <q-list bordered separator>
      <q-item
        v-show="(!!!affixId || !!!affixNeedle) && filteredAffixes.length === 0"
      >
        <q-item-section class="text-center">
          <q-item-label>{{
            !!!affixId && !!!affixNeedle
              ? '속성을 검색해주세요'
              : filteredAffixes.length === 0
              ? '속성을 찾을 수 없습니다'
              : ''
          }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-virtual-scroll
        v-show="(!!affixId || !!affixNeedle) && filteredAffixes.length > 0"
        style="max-height: 50vh"
        :items="filteredAffixes"
        separator
        v-slot="{ item }"
      >
        <q-item :key="item.value">
          <q-item-section avatar>
            <q-item-label> #{{ item.value }} </q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label
              style="line-height: 1.6 !important"
              v-html="
                !!affixId
                  ? item.label.replace(
                      /(\{x\})/g,
                      `<span class='text-primary text-weight-bold'>$1</span>`
                    )
                  : item.label

                      .replace(
                        new RegExp(`(${affixNeedle})`, 'gi'),
                        `<span class='bg-yellow text-weight-bold q-px-xs text-black rounded-borders'>$1</span>`
                      )
                      .replace(
                        /(\{x\})/g,
                        `<span class='text-primary text-weight-bold'>$1</span>`
                      )
              "
            ></q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn unelevated dense outline label="기능">
              <q-menu
                anchor="top end"
                self="top left"
                transition-duration="0"
                transition-show="none"
                transition-hide="none"
                :disable="disable"
              >
                <q-list dense separator>
                  <q-item
                    clickable
                    v-close-popup
                    class="bg-red-8"
                    :disable="disable"
                    @click="deleteAfiix(item)"
                  >
                    <q-item-section>
                      <q-item-label class="text-weight-bold">삭제</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    :disable="disable"
                    @click="openUpdate(item)"
                  >
                    <q-item-section>
                      <q-item-label>수정</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-virtual-scroll>
    </q-list>
    <div class="row justify-between items-center q-mt-sm">
      <div></div>
      <div>
        <q-btn
          :disable="disable"
          unelevated
          color="primary"
          label="추가"
          @click="
            () => {
              affixInfo.show = true
            }
          "
        />
      </div>
    </div>
    <D4Dialog
      v-model="affixInfo.show"
      persistent
      @submit="upsert"
      @before-hide="clearAffixInfo"
      @before-show="beforeShow"
    >
      <template #top>
        <q-card-section class="text-h6"
          >속성
          {{ affixInfo.action === 'update' ? '수정' : '추가' }}</q-card-section
        >
      </template>
      <template #middle>
        <q-card-section class="row items-center q-gutter-sm">
          <div class="col-3">속성 아이디</div>
          <div class="col">
            <q-input
              :disable="disable || affixInfo.action === 'update'"
              dense
              outlined
              :autofocus="affixInfo.action === 'insert'"
              v-model.number="affixInfo.affixId"
            />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="row items-center q-gutter-sm">
          <div class="col-3">속성 유형</div>
          <div class="col">
            <q-option-group
              :disable="disable || affixInfo.action === 'update'"
              v-model="affixInfo.affixType"
              :options="attributeTypes"
              color="primary"
              size="xs"
              inline
            />
          </div>
          <template v-if="affixInfo.action === 'insert'">
            <q-separator inset vertical />
            <div class="col row justify-between items-center">
              <div>추가 속성 아이디</div>
              <div>
                {{ availableAffixId }}
              </div>
            </div>
          </template>
        </q-card-section>
        <q-separator />
        <q-card-section class="row items-center q-gutter-sm">
          <div class="col-3">속성 내용</div>
          <div class="col">
            <q-input
              ref="refAttribute"
              v-model="affixInfo.affixAttribute"
              type="textarea"
              :placeholder="t('attribute.placeholder')"
              :disable="disable"
              :error="affixError.error"
              :error-message="affixError.errorMessage"
              outlined
              dense
              no-error-icon
              hide-hint
              :autofocus="affixInfo.action === 'update'"
              @keydown.exact.enter.prevent="upsert"
            />
          </div>
        </q-card-section>
      </template>
      <template #bottom>
        <q-card-section class="row justify-end q-gutter-sm">
          <q-btn
            unelevated
            color="negative"
            class="text-weight-bold"
            label="확인"
            :loading="disable"
            type="submit"
          />
          <q-btn
            unelevated
            color="grey-6"
            :disable="disable"
            label="취소"
            @click="() => (affixInfo.show = false)"
          />
        </q-card-section>
      </template>
    </D4Dialog>
  </div>
</template>
