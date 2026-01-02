<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useGlobalStore } from 'src/stores/global-store'
import Logo from '/images/logo.webp'
import LogoLight from '/images/logo_light.webp'

const $q = useQuasar()
const { t, locale } = useI18n({ useScope: 'global' })
const gs = useGlobalStore()
const brLoc = gs.localeOptions.map(lo => lo.value).includes($q.lang.getLocale()?.substring(0, 2) || '') ? $q.lang.getLocale()?.substring(0, 2) || 'ko' : 'ko'
locale.value = brLoc
</script>

<template>
  <div class="absolute-center column items-center q-gutter-sm full-width">
    <div class="row justify-center items-center q-gutter-sm">
      <img class="logo" :src="$q.dark.isActive ? Logo : LogoLight" width="48" height="48" alt="Tradurs Logo Image" />
      <div class="letter text-secondary">Tradurs</div>
    </div>
    <div class="text-h6">{{ t('page.ftc') }}
    </div>
  </div>
</template>

<style scoped>
.logo {
  animation: opacity 1.4s ease-out forwards;
}

.letter {
  transition: fill .3s ease;
  animation: slidein .3s ease-out .3s forwards;
  opacity: 0;
  font-size: 40px;
  font-weight: bold;
}

@keyframes opacity {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slidein {
  0% {
    transform: translateX(2%);
    opacity: 0;
  }

  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (hover: hover) {
  .bw:deep(.btn) {
    filter: none !important;
  }
}
</style>