<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar, date } from 'quasar'
import { useI18n } from 'vue-i18n'
import { scrollPos } from 'src/common'
import { useGlobalStore } from 'src/stores/global-store'
import { useAccountStore } from 'src/stores/account-store'
import { IBlock } from 'src/types/user'

const $q = useQuasar()
const gs = useGlobalStore()
const as = useAccountStore()
const { t } = useI18n({ useScope: 'global' })

as.newMessages = false

const blocks = reactive<Array<IBlock>>([])
const selected = ref<boolean>(false)
const disable = computed(() => blocks.length === 0 || blocks.filter(b => !b.disable).length === 0)
const loading = ref<boolean>(true)
const progress = ref<boolean>(false)
const page = ref<number>(1)
const over = computed(() => as.blockPage.over)
const more = computed(() => as.blockPage.more)

const getList = () => {
  selected.value = false
  blocks.splice(0, blocks.length)
  loading.value = true
  as.getBlocks(page.value)
    .then((result) => {
      Object.assign(blocks, result)
    })
    .catch(() => { })
    .then(() => {
      loading.value = false
      scrollPos()
    })
}

const unblock = (block: IBlock) => {
  progress.value = true
  block.disable = true
  as.unblock([block.battleTag])
    .then(() => {
      $q.notify({
        icon: 'img:/images/icons/check.svg',
        color: 'positive',
        classes: '',
        message: t('blockUser.unblockComplete')
      })

      getList()
    })
    .catch(() => { })
    .then(() => {
      progress.value = false
    })
}

const unblocks = () => {
  const selectedBlocks = blocks.filter(b => b.selected)
  if (selectedBlocks.length > 0) {
    progress.value = true
    selectedBlocks.forEach(b => b.disable = true)
    as.unblock(selectedBlocks.map(b => b.battleTag))
      .then(() => {
        $q.notify({
          icon: 'img:/images/icons/check.svg',
          color: 'positive',
          classes: '',
          message: t('blockUser.unblockComplete')
        })

        getList()
      })
      .catch(() => { })
      .then(() => {
        selected.value = false
        progress.value = false
      })
  }
}

const prev = () => {
  if (page.value > 1) {
    gs.reloadAdKey++
    page.value--
    getList()
  }
}

const next = () => {
  gs.reloadAdKey++
  page.value++
  getList()
}

onMounted(() => {
  getList()
})
</script>

<template>
  <div>
    <div class="text-right text-caption q-pa-xs">{{ t('blockUser.caption') }}</div>
    <q-list bordered class="rounded-borders">
      <q-item>
        <q-item-section side>
          <q-checkbox size="xs" color="grey-secondary" v-model="selected" :disable="disable || progress"
            @update:model-value="val => blocks.filter(b => !b.disable).forEach(b => b.selected = val)" />
        </q-item-section>
        <q-item-section>
        </q-item-section>
        <q-item-section side>
          <q-btn no-caps push :disable="disable || progress" unelevated aria-label="Tradurs Read Button" color="grey-8"
            :label="t('btn.bulkUnblock')" @click="unblocks" />
        </q-item-section>
      </q-item>
      <template v-for="block in blocks" :key="block.battleTag">
        <q-separator />
        <q-item class="q-py-lg">
          <q-item-section side>
            <q-checkbox size="xs" color="grey-10" v-model="block.selected" :disable="block.disable" />
          </q-item-section>
          <q-item-section avatar v-show="!$q.screen.lt.sm">
            <q-avatar size="md" color="grey-4 text-dark">
              D4
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold" lines="1">
              {{ block.battleTag }}
            </q-item-label>
          </q-item-section>
          <q-item-section side top class="column items-end q-gutter-y-sm">
            <q-item-label lines="2" style="max-width:60px" class="text-right">
              {{ date.isSameDate(block.regDate, Date.now(), 'date') ? date.formatDate(block.regDate, 'HH:mm') :
                date.formatDate(block.regDate, 'YY.MM.DD HH:mm') }}
            </q-item-label>
            <q-btn no-caps unelevated :title="t('blockUser.caption')" aria-label="Tradurs UnBlock Button" size="12px"
              color="positive" :disable="disable || block.disable" :progress="progress" @click="unblock(block)">
              <div class="row items-center q-gutter-x-xs">
                <q-icon class="invert" name="img:/images/icons/check.svg" size="19px" />
                <div>{{ t('blockUser.unblock') }}</div>
              </div>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
      <template v-if="loading" v-for="c in blocks.length || as.blockPage.rows" :key="c">
        <q-separator />
        <q-item class="q-py-md">
          <q-item-section side>
            <q-skeleton type="rect" width="18px" height="18px" class="q-mx-xs" />
          </q-item-section>
          <q-item-section avatar v-show="!$q.screen.lt.sm">
            <q-skeleton type="QAvatar" width="36px" height="36px" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold" lines="1">
              <q-skeleton type="text" width="100px" height="24px" />
            </q-item-label>
          </q-item-section>
          <q-item-section side top>
            <q-item-label class="column items-end">
              <q-skeleton type="text" width="60px" height="24px" />
              <q-skeleton type="text" width="40px" height="24px" />
              <q-skeleton type="QBtn" width="106px" height="32px" />
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
      <q-item v-show="!loading && blocks.length === 0">
        <q-item-section>
          <q-item-label class="row justify-center q-pt-md q-pb-xl">{{ t('blockUser.noData') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <div class="row justify-between q-mt-md q-px-sm paging">
      <div>{{ t('message.page', { page }) }}</div>
      <div class="row justify-end items-center q-gutter-x-md">
        <q-btn flat dense round padding="0" aria-label="Tradurs Prev Button" :disable="!over || loading"
          :shadow="!$q.dark.isActive">
          <img src="/images/icons/prev.svg" width="24" height="24" class="icon" alt="icon_prev" @click="prev" />
        </q-btn>
        <q-btn flat dense round padding="0" aria-label="Tradurs Next Button" :disable="!more || loading"
          :shadow="!$q.dark.isActive" @click="next">
          <img src="/images/icons/next.svg" width="24" height="24" class="icon" alt="icon_next" />
        </q-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.read,
.read:deep(.q-item__label--caption),
.read:deep(.q-item__section--side),
.body--light .read:deep(.q-checkbox__inner) {
  color: rgb(100, 100, 100);
}

.body--light .read,
.body--light .read:deep(.q-item__label--caption),
.body--light .read:deep(.q-item__section--side),
.body--light .read:deep(.q-checkbox__inner) {
  color: rgb(150, 150, 150);
}

.read .q-avatar {
  opacity: .4;
}

.paging:deep(.q-btn.disabled) {
  opacity: .2 !important;
}
</style>