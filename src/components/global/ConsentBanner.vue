<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import {
  loadGoogleAnalytics,
  readConsent,
  saveConsent
} from 'src/common/consent'

const { t, locale } = useI18n({ useScope: 'global' })

// Google 계정의 광고 맞춤 설정. 광고 쿠키는 이 선택과 관계없이 쓰이므로 끄는 곳을 안내한다.
const GOOGLE_AD_SETTINGS = 'https://myadcenter.google.com/'
// 선택 변경은 Account 사이트 쿠키 정책 화면의 "쿠키 설정 변경"에서 한다(같은 공통 쿠키).
const policyUrl = computed(
  () =>
    `${import.meta.env.VITE_APP_TRADURS}/${locale.value === 'ko' ? 'ko-kr' : 'en-us'}/join/policy/cookies`
)
const open = ref(false)

// 두 선택은 같은 크기·같은 채움 버튼으로 두고 색만 구분한다(거부를 동의보다 어렵게 만들지 않는다).
const choose = (analytics: boolean) => {
  saveConsent(analytics)
  open.value = false
  if (analytics) loadGoogleAnalytics()
  Notify.create({ message: t('consent.success'), color: 'positive', timeout: 3000 })
}

// 동의 쿠키는 브라우저에서만 읽는다(서버 렌더링 결과에는 배너가 없다). 분석 동의가 있으면 GA를 넣고, 아직 고르지 않았으면 배너를 연다.
onMounted(() => {
  const consent = readConsent()
  if (consent?.analytics) loadGoogleAnalytics()
  open.value = !consent
})
</script>

<template>
  <section
    v-if="open"
    class="consent-banner"
    role="region"
    aria-labelledby="consent-banner-title"
  >
    <h2 id="consent-banner-title" class="consent-title">
      {{ t('consent.title') }}
    </h2>
    <p>{{ t('consent.body') }}</p>
    <p>
      {{ t('consent.ads') }}
      <a :href="GOOGLE_AD_SETTINGS" target="_blank" rel="noopener noreferrer">{{
        t('consent.adsLink')
      }}</a>
    </p>
    <div class="consent-actions">
      <a class="consent-policy" :href="policyUrl">{{ t('consent.policy') }}</a>
      <D4Btn
        :label="t('consent.necessaryOnly')"
        color="var(--q-secondary)"
        @click="choose(false)"
      />
      <D4Btn :label="t('consent.acceptAll')" @click="choose(true)" />
    </div>
  </section>
</template>

<style scoped>
.consent-banner {
  position: fixed;
  left: 50%;
  bottom: 16px;
  z-index: 5000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(calc(100% - 32px), 640px);
  padding: 20px;
  border: 1px solid var(--q-dark-border);
  border-radius: 8px;
  background: var(--q-dark);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transform: translateX(-50%);
}

.body--light .consent-banner {
  border-color: var(--q-light-border);
  background: #ffffff;
  box-shadow: 0 8px 24px var(--q-shadow);
}

.consent-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
}

.consent-banner p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  opacity: 0.85;
}

.consent-banner a {
  color: inherit;
  text-decoration: underline;
}

.consent-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.consent-policy {
  margin-right: auto;
  font-size: 0.875rem;
}

@media (max-width: 599px) {
  .consent-banner {
    padding: 16px;
  }

  .consent-actions > :not(.consent-policy) {
    flex: 1 1 0;
  }
}
</style>
