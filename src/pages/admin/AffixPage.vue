<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useQuasar, QInput, debounce } from 'quasar'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from 'stores/admin-store'
import { type Affix, useItemStore } from 'stores/item-store'
import { checkAttribute } from 'src/common'

const route = useRoute()
const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })
const as = useAdminStore()
const is = useItemStore()
const affixes = is.filterAffixes
const wordRef = ref<QInput>()
const word = ref<string>()
const affixNeedle = ref<string>()

const filterAffixes = debounce((e: KeyboardEvent) => {
  const val = (e.target as HTMLInputElement).value.toLowerCase()
  affixNeedle.value = val
}, 500)

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
  languageId: ((route.params.lang as string) ?? 'ko').toLowerCase()
})

const affixError = reactive<AffixError>({
  error: false,
  errorMessage: ''
})
const refAttribute = ref<QInput>()

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
}

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
  <div>
    <div class="row justify-between q-mb-sm">
      <div>
        <q-btn
          unelevated
          color="secondary"
          label="데이터 적용"
          @click="refreshAffixes"
        />
      </div>
      <div class="col-6">
        <q-input
          ref="wordRef"
          autofocus
          dense
          outlined
          v-model="word"
          label="검색어"
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
              :disable="!!!word"
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
    <q-list bordered separator>
      <q-item v-show="!!!affixNeedle || affixes(affixNeedle).length === 0">
        <q-item-section class="text-center">
          <q-item-label>{{
            !!!affixNeedle
              ? '속성을 검색해주세요'
              : !!affixNeedle && affixes(affixNeedle).length === 0
              ? '속성을 찾을 수 없습니다'
              : ''
          }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-virtual-scroll
        v-show="!!affixNeedle && affixes(affixNeedle).length > 0"
        style="max-height: 50vh"
        :items="affixes(affixNeedle)"
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
                item.label
                  .replace(
                    /(\{x\})/g,
                    `<span class='text-primary text-weight-bold'>$1</span>`
                  )
                  .replaceAll(
                    new RegExp(`(${affixNeedle})`, 'gi'),
                    `<span class='bg-yellow text-weight-bold q-px-xs text-black rounded-borders'>$1</span>`
                  )
              "
            ></q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              unelevated
              dense
              outline
              label="수정"
              @click="() => openUpdate(item)"
            />
          </q-item-section>
        </q-item>
      </q-virtual-scroll>
    </q-list>
    <div class="row justify-between items-center q-mt-sm">
      <div></div>
      <div>
        <q-btn
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
    >
      <template #top>
        <q-card-section class="text-h6"
          >속성 {{ !!affixInfo.affixId ? '수정' : '삭제' }}</q-card-section
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
            type="submit"
          />
          <q-btn
            unelevated
            color="grey-6"
            label="취소"
            @click="() => (affixInfo.show = false)"
          />
        </q-card-section>
      </template>
    </D4Dialog>
  </div>
</template>
