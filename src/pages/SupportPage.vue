<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useQuasar, scroll, QExpansionItem } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGlobalStore } from 'stores/global-store'
import { useAccountStore } from 'stores/account-store'

interface Answer {
  type: string
  contents: string
  classes?: string
  name?: string
}

interface Support {
  id: string
  question: string
  answer: Array<Answer>
  show: boolean
}

const props = defineProps<{
  section?: string
}>()

const $q = useQuasar()
const { getScrollTarget, setVerticalScrollPosition } = scroll
const route = useRoute()
const router = useRouter()
const { t, tm } = useI18n({ useScope: 'global' })
const gs = useGlobalStore()
const as = useAccountStore()

const supportRefs = ref<Array<QExpansionItem>>([])
const support = computed(() => tm('support') as Array<Support>)
const findSection = ref<string>(props.section || 'basic')
const contact = reactive<{
  show: boolean
  open: boolean
  contents: string | null
  disable: boolean
}>({
  show: true,
  open: false,
  contents: null,
  disable: false
})

const afterShow = () => {
  const findSectionIndex = support.value.findIndex(
    (s) => s.id === findSection.value
  )

  if (findSectionIndex !== -1 && supportRefs.value[findSectionIndex]) {
    const el = supportRefs.value[findSectionIndex].$el
    const scrollTarget = getScrollTarget(el)
    const offset = findSection.value === 'basic' ? 0 : el.offsetTop
    setVerticalScrollPosition(scrollTarget, offset, 100)
  }
}

const selectSection = async (s: Support) => {
  if (s.show)
    await router.push({
      name: 'support',
      params: { lang: route.params.lang, section: s.id },
      state: { noScrollTop: true }
    })
}

watch(
  () => route.params.section,
  (val, old) => {
    if (val !== old && route.name === 'support') {
      findSection.value = (val as string) ?? 'basic'
    }
  }
)

onMounted(() => {
  const activeSection = support.value.find((s) => s.id === findSection.value)

  if (activeSection) activeSection.show = true
})
</script>

<template>
  <div>
    <div class="top-space"></div>
    <q-list bordered class="rounded-borders">
      <template v-for="s, idx in (support as Array<Support>)" :key="idx">
        <q-separator v-show="idx !== 0" />
        <q-expansion-item
          ref="supportRefs"
          v-model="s.show"
          :class="{ 'no-hover': s.show }"
          expand-icon="img:/images/icons/dropdown.svg"
          :label="s.question"
          @update:model-value="selectSection(s)"
          @after-show="afterShow"
        >
          <q-item
            class="row justify-center items-center"
            :class="$q.screen.lt.sm ? 'q-px-md' : 'q-px-xl'"
            style="background-color: var(--q-cloud)"
          >
            <q-item-label>
              <div
                v-for="(a, aIdx) in s.answer"
                :key="aIdx"
                class="answer text-center"
                :class="a.type"
              >
                <img
                  v-if="a.type === 'image'"
                  :src="`/images/help/${s.id}/${a.contents}.webp`"
                  alt="Tradurs Notice Image"
                />
                <div
                  v-else-if="a.type === 'text'"
                  class="text-area"
                  :class="a.classes"
                >
                  {{ a.contents }}
                </div>
                <div
                  v-else-if="a.type === 'question'"
                  class="text-area text-subtitle1 q-mt-lg text-left text-primary text-weight-bold"
                >
                  {{ a.contents }}
                </div>
                <div
                  v-else-if="a.type === 'answer'"
                  class="text-area text-body2 q-ma-sm text-left"
                >
                  {{ a.contents }}
                </div>
                <a
                  v-else-if="a.type === 'link'"
                  :href="a.contents"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ a.name }}</a
                >
              </div>
              <div class="q-py-lg q-my-lg"></div>
            </q-item-label>
          </q-item>
        </q-expansion-item>
      </template>

      <q-separator />
      <q-expansion-item
        v-model="contact.show"
        :class="{ 'no-hover': contact.show }"
        expand-icon="img:/images/icons/dropdown.svg"
        :label="t('contact.question')"
      >
        <q-item
          class="row justify-center items-center q-py-xl"
          style="background-color: var(--q-cloud)"
        >
          <q-btn
            aria-label="Tradurs Discord Button"
            :ripple="!$q.dark.isActive"
            tag="a"
            href="https://discord.gg/dwRuWq4enx"
            target="_blank"
            rel="noopener noreferrer"
            color="indigo-6"
            no-caps
          >
            <div class="row items-center q-gutter-sm">
              <img
                class="icon"
                width="24"
                height="24"
                style="padding: 1px"
                src="/images/icons/discord.svg"
                alt="Discord Icon"
              />
              <div>{{ t('contact.title') }}</div>
            </div>
          </q-btn>
        </q-item>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<style scoped>
.answer.text {
  min-height: 22px;
}

.answer.image {
  min-height: 60px;
}

.answer:deep(.text-area) {
  min-height: 14px;
}

.answer:deep(img) {
  margin-top: 72px;
  margin-bottom: 10px;
  max-width: 100%;
  object-fit: cover;
  object-position: 0;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 0 1px 1px currentColor;
}

.answer:deep(a) {
  color: var(--q-secondary);
}
</style>
