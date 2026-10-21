<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAccountStore } from 'stores/account-store'

const { t, locale } = useI18n({ useScope: 'global' })
const as = useAccountStore()

// 배틀태그 등록·Battle.net 인증은 Account 사이트 내 정보의 배틀태그 구역에서 한다(front_v2 ROUTE-03).
const infoUrl = computed(
  () =>
    `${import.meta.env.VITE_APP_TRADURS}/${locale.value === 'ko' ? 'ko-kr' : 'en-us'}/info#battletag`
)

const close = () => {
  as.battleTagGuide = false
}

const move = () => {
  close()
  document.location.href = infoUrl.value
}
</script>

<template>
  <D4Dialog v-model="as.battleTagGuide" max-width="480px">
    <template #top>
      <q-card-section>
        <div
          class="text-weight-bold"
          :class="$q.screen.gt.sm ? 'q-pa-md text-h6' : 'q-pa-sm text-body2'"
        >
          {{ t('battleTagGuide.title') }}
        </div>
      </q-card-section>
    </template>
    <template #middle>
      <q-card-section>
        <div
          class="q-px-md"
          :class="$q.screen.gt.sm ? 'text-body1' : 'text-body2'"
        >
          {{ t('battleTagGuide.message') }}
        </div>
      </q-card-section>
    </template>
    <template #bottom>
      <q-card-section>
        <div class="row justify-end items-center q-gutter-sm q-px-md">
          <D4Btn
            :label="t('btn.cancel')"
            color="rgb(150,150,150)"
            @click="close"
          />
          <D4Btn
            data-cy="battletag-guide-move-button"
            :label="t('battleTagGuide.move')"
            @click="move"
          />
        </div>
      </q-card-section>
    </template>
  </D4Dialog>
</template>
