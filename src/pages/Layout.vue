<script setup lang="ts">
import { inject, ref, computed, watch, onMounted, onUnmounted, nextTick, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar, uid, Screen } from 'quasar'
import { useAccountStore } from '@/stores/account'
import type { AxiosInstance } from 'axios'

const Filter = defineAsyncComponent(() => import('@/components/Filter.vue'))

const prod: boolean = import.meta.env.PROD
const tradurs: string = import.meta.env.VITE_APP_TRADURS_ORIGIN || `${document.location.protocol}//${document.location.hostname}:6081`

const axios = inject('axios') as AxiosInstance
const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const accountStore = useAccountStore()

const leftDrawerOpen = ref<boolean>(false)
const signed = computed<boolean>(() => accountStore.signed)
const screen = computed<Screen>(() => $q.screen)
const offsetTop = ref<number>(0)
const asideHeight = computed<string>(() => `calc(100vh - ${screen.value.gt.sm ? offsetTop.value : 0}px)`)
const asideTop = computed<string>(() => `${offsetTop.value + 10}px`)

const myTweak = (offset: number): void => {
  offsetTop.value = offset || 0
}

const sign = (): void => {
  if (!signed.value) {
    document.location.href = `${tradurs}/sign?redirect=${encodeURIComponent(document.location.href)}`
    return
  }

  axios.get('/account/signOut')
    .then(() => {
      accountStore.signed = false
      router.go(0)
    })
    .catch(() => {
    })
}

const key = ref(uid())
const reload = () => {
  key.value = uid()
  nextTick(() => {
    onWindowLoad()
  })
}

watch(() => route.name, (val, old) => {
  if (val && val !== old)
    reload()
})



const onWindowLoad = () => {
  if (prod) {
    const adsbygoogle = window.adsbygoogle || []
    adsbygoogle.push({})
    adsbygoogle.push({})
  }
}

onMounted(() => {
  if (document.readyState !== 'complete')
    window.addEventListener("load", onWindowLoad)
  else {
    nextTick(() => {
      onWindowLoad()
    })
  }
})

onUnmounted(() => {
  window.removeEventListener("load", onWindowLoad)
})
</script>
<template>
  <q-layout view="hHh lpR lFf">
    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" :behavior="screen.gt.sm ? 'desktop' : 'mobile'"
      class="row justify-end scroll" :width="300">
      <div class="q-py-lg" :class="screen.gt.md ? 'q-px-lg' : 'q-px-md'">
        <div v-for="c in 50" :key="c">test</div>
        <!-- <Filter /> -->
      </div>
    </q-drawer>
    <q-header class="q-py-sm header row justify-center">
      <q-toolbar class="toolbar">
        <div class="col-3 row items-center">
          <q-btn class="gt-sm no-hover" dense flat padding="0" :ripple="false" :to="{ name: 'Main' }">
            <img v-show="$q.dark.isActive" src="@/assets/logo.webp" height="48" />
            <img v-show="!$q.dark.isActive" src="@/assets/logo_light.webp" height="48" />
          </q-btn>
          <q-btn dense flat round class="lt-md" :ripple="false" @click="leftDrawerOpen = !leftDrawerOpen">
            <img src="@/assets/icons/filter.svg" class="icon" width="24" />
          </q-btn>
        </div>
        <div class="col row justify-center">
          <q-btn class="lt-md no-hover" dense flat padding="0" :ripple="false" :to="{ name: 'Main' }">
            <img v-show="$q.dark.isActive" src="@/assets/logo.webp" height="48" />
            <img v-show="!$q.dark.isActive" src="@/assets/logo_light.webp" height="48" />
          </q-btn>
          <q-tabs dense class="gt-sm q-px-md bg-transparent no-hover">
            <q-route-tab :ripple="false" label="일반" exact />
            <q-route-tab :ripple="false" content-class="text-indigo-12" label="마법" exact />
            <q-route-tab :ripple="false" content-class="text-yellow-4" label="희귀" exact />
            <!-- <q-route-tab :ripple="false" content-class="text-amber-8" label="전설" exact />
            <q-route-tab :ripple="false" content-class="text-light-green-13" label="세트" exact />
            <q-route-tab :ripple="false" content-class="text-brown-12" label="고유" exact /> -->
          </q-tabs>
        </div>
        <div class="col-3 row justify-end" :class="screen.gt.sm ? 'q-gutter-x-md' : 'q-gutter-x-sm'">
          <q-btn round flat dense :ripple="false" @click="$q.dark.set(!$q.dark.isActive)">
            <img v-show="$q.dark.isActive" class="icon" width="24" src="@/assets/icons/light.svg" />
            <img v-show="!$q.dark.isActive" class="icon" width="24" src="@/assets/icons/dark.svg" />
          </q-btn>
          <q-btn round flat dense :ripple="false" @click="sign">
            <img v-if="signed" class="icon" width="24" src="@/assets/icons/logout.svg" />
            <img v-else class="icon" width="24" src="@/assets/icons/login.svg" />
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <q-page :style-fn="myTweak">
        <div class="row">
          <div :class="screen.gt.md ? 'q-pa-xl' : 'q-pa-sm'" :style="screen.gt.md ? 'width:830px' : 'width:100%'">
            <div style="min-height:40vh">
              <RouterView />
            </div>
            <div class="q-py-xl"></div>
            <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-5110777286519562"
              data-ad-slot="8610177982" data-ad-format="auto" data-full-width-responsive="true"
              :data-adtest="prod ? 'off' : 'on'" :key="key"></ins>
            <q-separator />
            <div class="q-pt-lg">
              <div class="row justify-center items-center q-gutter-x-xs text-caption bottom">
                <div>Copyright</div>
                <div>@</div>
                <div>2022</div>
                <div>SeraSome</div>
              </div>
            </div>
          </div>
          <div class="gt-md col">
            <div class="full-height q-px-lg q-py-xl" :style="`width:280px;height:${asideHeight}`">
              <div :style="`position:sticky;top:${asideTop}`">

                <ins class="adsbygoogle" style="display:inline-block;width:160px;height:600px"
                  data-ad-client="ca-pub-5110777286519562" data-ad-slot="7240136439" :data-adtest="prod ? 'off' : 'on'"
                  :key="key"></ins>
              </div>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
<style scoped>
.header {
  background-color: var(--q-dark);
  color: var(--q-light);
  box-shadow: inset 0 -1px 0 0 var(--q-dark-border);
}

.body--light .header {
  box-shadow: inset 0 -1px 0 0 var(--q-light-border);
}

.body--light .header {
  background-color: var(--q-light);
  color: var(--q-dark);
}

.header:deep(.q-btn .icon) {
  filter: contrast(0%);
}

.toolbar {
  min-height: inherit;
  width: 100vw;
  max-width: 1400px;
}

ins {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, .05);
  background-color: rgba(255, 255, 255, .05);
  position: relative;
  min-height: 200px;
}

.body--light ins {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .05);
  background-color: rgba(0, 0, 0, .05);
}

ins::after {
  content: 'AD';
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: -1;
  transform: translate(-50%, -50%);
  color: var(--q-light);
}

.body--light ins::after {
  color: var(--q-dark);
}
</style>