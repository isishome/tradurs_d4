<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { User } from 'src/types/user'
import { clipboard } from 'src/common'
import { icons } from 'src/common/icons'
import { useAccountStore } from 'src/stores/account-store'

import D4Tooltip from 'components/D4Tooltip.vue'

interface IProps {
  data: User,
  label?: string,
  info?: boolean,
  authorized?: boolean,
  editable?: boolean,
  disable?: boolean,
  progress?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  data: () => new User(),
  label: '',
  info: false,
  authorized: false,
  editable: false,
  disable: false,
  progress: false
})

const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })
const as = useAccountStore()

const loading = computed(() => props.data.loading || props.progress)
const allowCopy = computed(() => !props.authorized && props.data.battleTag !== '')
const _notify = ref<boolean>(props.data.notify)

const copy = (battleTag: string) => {
  if (!allowCopy.value)
    return

  clipboard(battleTag, t('user.battleTag'))
}

const notify = () => {
  as.notify(_notify.value)
    .then(() => {
      as.info.notify = _notify.value
    })
    .catch(() => {
      _notify.value = !_notify.value
    })
}
</script>

<template>
  <div v-if="editable">
  </div>
  <q-list v-else-if="info" :bordered="$q.dark.isActive" class="rounded-borders relative-position">
    <q-item class="bg-primary text-dark" style="padding-bottom:30px">
      <q-item-section>
        <q-item-label class="text-center text-subtitle1 text-weight-bold">{{ data.battleTag
        }}</q-item-label>
      </q-item-section>
    </q-item>
    <q-item class="avatar">
      <q-item-section>
        <q-avatar>
          <img src="~/assets/avatar/boy-avatar.png" alt="Tradurs Avatar Image">
        </q-avatar>
      </q-item-section>
    </q-item>
    <q-item class="row items-center justify-between" style="padding-top:30px">
      <div class="col text-center">
        <div class="text-caption ellipsis">
          <!-- <img width="24" src="~assets/tradurs.svg" alt="Tradurs Logo" /> -->
          {{ t('user.yolk') }}
        </div>
        <div class="text-weight-bold text-amber-8 text-body2">{{ data.yolk }}</div>
      </div>
      <q-separator vertical inset />
      <div class="col text-center">
        <div class="text-caption ellipsis">
          <!-- <img width="24" src="~assets/tradurs.svg" alt="Tradurs Logo" /> -->
          {{ t('user.temperature') }}
        </div>
        <div class="text-weight-bold text-body2">{{ data.temperature }}&#8451</div>
      </div>
    </q-item>
    <q-separator />
    <q-item class="row justify-center items-center">
      <q-toggle left-label v-model="_notify" :disable="disable" color="secondary" :label="t('user.notify')" dense
        @update:model-value="notify" />
    </q-item>
    <q-separator />
    <q-item v-if="$slots.actions" class="q-pa-md row justify-center">
      <slot name="actions">
      </slot>
    </q-item>
  </q-list>
  <div v-else>
    <q-skeleton v-show="loading" width="100px" :height="$q.screen.lt.sm ? '16px' : '18px'" />
    <div v-show="!loading" class="row items-center q-gutter-xs">
      <div :class="{ 'authorized': authorized, 'allow-copy': allowCopy }" @click="copy(data.battleTag)">
        {{ data.battleTag === '' ? label : data.battleTag }}
      </div>
      <q-icon class="icon" :name="`img:${icons.help}`" size="19px">
        <D4Tooltip>
          <div class="text-overline text-weight-bold">{{ t('user.temperature') }} : {{ data.temperature }}&#8451</div>
          <div class="break-keep text-caption" style="max-width:160px;">
            {{ t('user.sh1') }}
            <span class="underline text-weight-bold">{{ t('user.sh2') }}</span>
            {{ t('user.sh3') }}
            <span class="underline text-weight-bold">{{ t('user.sh4') }}</span>
            {{ t('user.sh5') }}
          </div>
        </D4Tooltip>
      </q-icon>
    </div>
  </div>
</template>

<style scoped>
.avatar {
  padding: 0;
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
}

.avatar:deep(.q-avatar) {
  box-shadow: 0 0 0 3px var(--q-dark);
}

.body--light .avatar:deep(.q-avatar) {
  box-shadow: 0 0 0 3px var(--q-light-page);
}
</style>