<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { User } from 'src/types/user'
import { clipboard } from 'src/common'
import { icons } from 'src/common/icons'

interface IProps {
  data: User,
  label: string,
  authorized?: boolean,
  editable?: boolean,
  disable?: boolean,
  progress?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  data: () => new User(),
  authorized: false,
  editable: false,
  disable: false,
  progress: false
})

const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })

const loading = computed(() => props.data.loading || props.progress)
const allowCopy = computed(() => !props.authorized && props.data.battleTag !== '')

const copy = (battleTag: string) => {
  if (!allowCopy.value)
    return

  clipboard(battleTag)
}

</script>

<template>
  <div v-if="editable">
  </div>
  <div v-else>
    <q-skeleton v-show="loading" width="100px" :height="$q.screen.lt.sm ? '16px' : '18px'" />
    <div v-show="!loading" class="row items-center q-gutter-xs">
      <div :class="{ 'authorized': authorized, 'allow-copy': allowCopy }" @click="copy(data.battleTag)">
        {{ data.battleTag === '' ? label : data.battleTag }}
      </div>
      <q-icon class="icon" :name="`img:${icons.help}`" size="19px">
        <q-tooltip :class="['q-pa-md', $q.dark.isActive ? 'bg-grey-4 text-grey-9' : 'bg-grey-9 text-grey-4']"
          anchor="center right" self="center left" :offset="[10, 0]" transition-hide="jump-right"
          transition-show="jump-left">
          <div class="text-overline text-weight-bold">{{ t('user.temperature') }} : {{ data.temperature }}&#8451</div>
          <div class="break-keep text-caption" style="max-width:160px;">
            {{ t('user.sh1') }}
            <span class="underline text-weight-bold">{{ t('user.sh2') }}</span>
            {{ t('user.sh3') }}
            <span class="underline text-weight-bold">{{ t('user.sh4') }}</span>
            {{ t('user.sh5') }}
          </div>
        </q-tooltip>
      </q-icon>
    </div>
  </div>
</template>

<style scoped>
.avatar {
  background-image: url('src/assets/avatar/avatar.webp');
  background-repeat: no-repeat;
  background-size: cover;
  width: inherit;
  height: inherit;
}
</style>