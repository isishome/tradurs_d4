<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { User } from 'src/types/user'
import { clipboard } from 'src/common'
import { useAccountStore } from 'src/stores/account-store'
import { ILabel, IStorage, useItemStore } from 'src/stores/item-store'

interface IProps {
  data: User
  storage?: IStorage
  label?: string
  info?: boolean
  authorized?: boolean
  editable?: boolean
  disable?: boolean
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

const emit = defineEmits(['update'])

const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const as = useAccountStore()
const is = useItemStore()

const soundOptions: Array<ILabel> = [
  { value: 0, label: t('user.notifySound.sound0') },
  { value: 1, label: t('user.notifySound.sound1') },
  { value: 2, label: t('user.notifySound.sound2') }
]

const tradurs: string =
  import.meta.env.VITE_APP_TRADURS + `/${route.params.lang || 'ko'}`
const loading = computed(() => props.data.loading || props.progress)
const userProgress = ref<boolean>(false)
const isProgress = computed(() => props.progress || userProgress.value)
const allowCopy = computed(
  () => !props.authorized && props.data.battleTag !== ''
)
const blocked = computed(() => !props.data.blockable && !props.authorized)
const _notify = reactive<IStorage>({
  notifyNew: props.storage?.notifyNew ?? false,
  notifyPrivate: props.storage?.notifyPrivate ?? false,
  notifyEmail: props.storage?.notifyEmail ?? false,
  sound: props.storage?.sound ?? 0,
  volume: (props.storage?.volume ?? 1) * 10
})

const copy = (battleTag: string) => {
  if (!allowCopy.value) return

  clipboard(battleTag, t('user.battleTag'))
}

const notifyNew = () => {
  userProgress.value = true

  is.setStorage({
    notifyNew: _notify.notifyNew
  })
    .then(() => {
      is.storage.data.notifyNew = _notify.notifyNew
    })
    .catch(() => {
      _notify.notifyNew = !_notify.notifyNew
    })
    .then(() => {
      userProgress.value = false
    })
}

const notifyPrivate = () => {
  userProgress.value = true

  is.setStorage({
    notifyPrivate: _notify.notifyPrivate
  })
    .then(() => {
      is.storage.data.notifyPrivate = _notify.notifyPrivate
    })
    .catch(() => {
      _notify.notifyPrivate = !_notify.notifyPrivate
    })
    .then(() => {
      userProgress.value = false
    })
}

const notifyEmail = () => {
  userProgress.value = true

  is.setStorage({
    notifyEmail: _notify.notifyEmail
  })
    .then(() => {
      is.storage.data.notifyEmail = _notify.notifyEmail
    })
    .catch(() => {
      _notify.notifyEmail = !_notify.notifyEmail
    })
    .then(() => {
      userProgress.value = false
    })
}

const sound = new Audio()
const ring = () => {
  sound.pause()
  sound.src = `/sounds/${is.storage.data.sound ?? '0'}.wav`
  sound.volume = is.storage.data.volume ?? 1.0
  sound.play()
}

const updateSound = () => {
  userProgress.value = true

  is.setStorage({
    sound: _notify.sound
  })
    .then(() => {
      is.storage.data.sound = _notify.sound
      ring()
    })
    .catch(() => {
      _notify.sound = is.storage.data.sound
    })
    .then(() => {
      userProgress.value = false
    })
}

const updateVolume = (val: number) => {
  userProgress.value = true
  const volume = Math.round(val) / 10

  is.setStorage({
    volume
  })
    .then(() => {
      is.storage.data.volume = volume
      ring()
    })
    .catch(() => {
      _notify.sound = (is.storage.data.volume ?? 1) * 10
    })
    .then(() => {
      userProgress.value = false
    })
}

const block = () => {
  $q.dialog({
    title: t('blockUser.title'),
    message: `${t('blockUser.message')}\n${t('blockUser.caption')}`,
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey', outline: true },
    ok: {
      label: t('btn.block'),
      color: 'negative',
      unelevated: true,
      class: 'text-weight-bold invert-icon'
    },
    transitionShow: 'fade',
    transitionHide: 'fade',
    noRouteDismiss: true,
    class: 'q-pa-sm text-area'
  }).onOk(() => {
    userProgress.value = true
    as.block(props.data.battleTag)
      .then(() => {
        $q.notify({
          icon: 'img:/images/icons/check.svg',
          color: 'positive',
          classes: '',
          message: t('blockUser.complete')
        })
        emit('update')
      })
      .catch(() => {})
      .then(() => {
        userProgress.value = false
      })
  })
}

const unblock = () => {
  $q.dialog({
    title: t('blockUser.unblockTitle'),
    message: t('blockUser.unblockMessage'),
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey', outline: true },
    ok: {
      label: t('btn.unblock'),
      color: 'positive',
      unelevated: true,
      class: 'text-weight-bold invert-icon'
    },
    transitionShow: 'fade',
    transitionHide: 'fade',
    noRouteDismiss: true,
    class: 'q-pa-sm text-area'
  }).onOk(() => {
    userProgress.value = true
    as.unblock([props.data.battleTag])
      .then(() => {
        $q.notify({
          icon: 'img:/images/icons/check.svg',
          color: 'positive',
          classes: '',
          message: t('blockUser.unblockComplete')
        })

        emit('update')
      })
      .catch(() => {})
      .then(() => {
        userProgress.value = false
      })
  })
}

const goInfo = () => {
  document.location.href = `${tradurs}/info`
}
</script>

<template>
  <div v-if="editable"></div>
  <q-list
    v-else-if="info"
    :bordered="$q.dark.isActive"
    class="rounded-borders relative-position"
  >
    <q-item class="bg-primary text-dark" style="padding-bottom: 30px">
      <q-item-section>
        <q-item-label class="text-center text-subtitle1 text-weight-bold">
          {{ data.battleTag }}
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item class="avatar">
      <q-item-section>
        <q-btn flat dense round @click="goInfo">
          <img
            :src="`/images/avatar/${as.info.avatar}.webp`"
            width="48"
            height="48"
            alt="Tradurs Avatar Image"
          />
        </q-btn>
      </q-item-section>
    </q-item>
    <q-item class="row items-center justify-between no-padding">
      <div class="col text-center q-pa-md">
        <div
          class="text-caption row justify-center items-center"
          style="height: 50px"
        >
          {{ t('user.yolk') }}
        </div>
        <div class="text-weight-bold text-amber-8 text-body2">
          {{ data.yolk }}
        </div>
      </div>
      <q-separator vertical inset class="q-mt-xl" />
      <div class="col text-center q-pa-md">
        <div
          class="text-caption row justify-center items-center"
          style="height: 50px"
        >
          {{ t('user.temperature') }}
        </div>
        <div class="text-weight-bold text-body2">
          {{ data.temperature }}&#8451;
        </div>
      </div>
    </q-item>
    <q-separator />
    <div class="q-pt-sm text-center text-subtitle1 text-weight-bold">
      {{ t('user.notify.title') }}
    </div>
    <q-item
      class="row justify-center items-center q-gutter-md text-caption q-pt-sm q-pb-md"
    >
      <q-toggle
        left-label
        v-model="_notify.notifyNew"
        :disable="isProgress"
        color="secondary"
        :label="t('user.notify.new')"
        size="xs"
        dense
        @update:model-value="notifyNew"
      />
      <q-toggle
        left-label
        v-model="_notify.notifyPrivate"
        :disable="isProgress"
        color="secondary"
        :label="t('user.notify.private')"
        size="xs"
        dense
        @update:model-value="notifyPrivate"
      />
      <q-toggle
        left-label
        v-model="_notify.notifyEmail"
        :disable="isProgress"
        color="secondary"
        :label="t('user.notify.email')"
        size="xs"
        dense
        @update:model-value="notifyEmail"
      />
    </q-item>
    <q-separator />
    <div class="q-pt-xs text-center text-subtitle1 text-weight-bold">
      {{ t('user.notify.sound') }}
    </div>
    <q-item
      class="row justify-center items-center q-gutter-md text-caption q-pt-sm q-pb-md"
    >
      <q-option-group
        v-model="_notify.sound"
        :options="soundOptions"
        :disable="isProgress"
        color="primary"
        inline
        size="sm"
        dense
        @update:model-value="updateSound"
      />
    </q-item>
    <q-separator />
    <div class="q-pt-sm text-center text-subtitle1 text-weight-bold">
      {{ t('user.notify.volume') }}
    </div>
    <q-item
      class="row justify-center items-center q-gutter-md text-caption q-pt-sm q-pb-md"
    >
      <q-slider
        v-model="_notify.volume"
        marker-labels
        :min="0"
        :max="10"
        markers
        dense
        :step="1"
        :disable="isProgress"
        @update:model-value="(v) => updateVolume(v ?? 10)"
      />
    </q-item>

    <q-separator />
    <q-item
      v-if="$slots.actions"
      class="q-pa-md row justify-center q-gutter-md"
    >
      <slot name="actions"> </slot>
    </q-item>
  </q-list>
  <div v-else>
    <q-skeleton
      v-show="loading"
      width="100px"
      :height="$q.screen.lt.sm ? '16px' : '18px'"
    />
    <div v-show="!loading" class="row items-center q-gutter-xs">
      <img
        v-show="data.online"
        src="/images/icons/online.svg"
        class="online"
        alt="Tradurs Online Status Icon"
      />
      <div
        :class="{ authorized: authorized, 'allow-copy': allowCopy }"
        @click="copy(data.battleTag)"
      >
        {{ data.battleTag === '' ? label : data.battleTag }}
      </div>
      <q-icon
        v-if="as.signed"
        class="icon"
        :name="
          blocked ? 'img:/images/icons/block.svg' : 'img:/images/icons/info.svg'
        "
        size="19px"
      >
        <D4Tooltip keep>
          <svg
            v-show="data.verified"
            class="battletag"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="0"
            aria-labelledby="blz-icon-title-battlenet-logo"
            viewBox="0 0 196 32"
            part="icon blz-icon"
          >
            <title id="blz-icon-title-battlenet-logo">Battle.net</title>
            <path
              fill="#148EFF"
              stroke="none"
              d="M26.193 11.848c.895-2.755 1.063-5.267.453-7.17l-.017-.054c-.037-.103-.128-.321-.243-.321-.088 0-.089.146-.084.22l.006.043c.194 1.7-.326 4.124-1.371 6.663-2.143-.973-4.717-1.75-7.573-2.208-2.566-.413-5.023-.504-7.25-.322.264-1.752.919-2.971 1.993-3.229 1.478-.353 3.09.619 4.627 2.388a34.717 34.717 0 0 1 3.032.552c-2.803-5.272-6.562-8.227-9.421-7.136-2.176.83-3.287 3.823-3.155 7.846-2.833.603-5.093 1.713-6.436 3.193l-.037.041c-.072.084-.215.272-.157.372.043.075.17.003.233-.038l.034-.026c1.375-1.018 3.735-1.78 6.456-2.145.229 2.343.843 4.96 1.873 7.662.926 2.429 2.076 4.602 3.348 6.44-1.65.648-3.034.69-3.793-.111-1.046-1.103-1.01-2.985-.246-5.202a34.626 34.626 0 0 1-1.038-2.901c-3.165 5.063-3.844 9.796-1.47 11.727 1.806 1.47 4.955.935 8.372-1.19 1.939 2.152 4.03 3.554 5.983 3.977l.055.012c.108.02.342.05.4-.05.044-.076-.082-.15-.149-.183a3.123 3.123 0 0 1-.04-.017c-1.569-.681-3.409-2.344-5.085-4.518 1.914-1.37 3.874-3.21 5.699-5.454 1.64-2.016 2.947-4.098 3.904-6.119 1.385 1.106 2.113 2.282 1.8 3.34-.433 1.458-2.08 2.368-4.382 2.814a34.57 34.57 0 0 1-1.994 2.35c5.967.21 10.405-1.57 10.89-4.59.37-2.3-1.667-4.759-5.217-6.656Zm-5.183 6.026c-2.104 2.587-4.727 4.789-7.06 6.062a26.423 26.423 0 0 1-2.248-4.496c-1.188-3.116-1.784-6.489-1.72-9.146a26.42 26.42 0 0 1 5.018.301c3.292.53 6.511 1.7 8.78 3.083a26.4 26.4 0 0 1-2.77 4.196Z"
            ></path>
            <path
              stroke="none"
              d="M75.328 22.603 68.972 9.915a1.858 1.858 0 0 0-1.638-1.002h-3.3c-.685 0-1.32.391-1.638 1.002l-6.307 12.688c-.123.22.048.489.293.489h2.836a.446.446 0 0 0 .415-.244l1.394-2.787h9.362l1.394 2.787c.073.17.22.244.415.244h2.836c.22 0 .367-.269.294-.489ZM62.42 17.249l2.64-5.304a.381.381 0 0 1 .318-.196h.66c.147 0 .269.073.318.195l2.64 5.305H62.42Zm133.256-7.994v2.152a.35.35 0 0 1-.343.342h-5.72v12.859a.24.24 0 0 1-.391.195l-2.836-2.42a.99.99 0 0 1-.342-.733v-9.901h-4.596a.696.696 0 0 1-.611-.391l-1.1-2.2c-.049-.123.024-.245.146-.245h15.401c.22 0 .392.171.392.342Zm-30.68 2.738v2.616h10.438a1.419 1.419 0 0 1 0 2.836h-10.438V19.4c0 .489.415.904.904.904h11.759a.35.35 0 0 1 .342.342V22.8a.368.368 0 0 1-.342.342h-12.712a3.625 3.625 0 0 1-3.618-3.618v-8.776c0-1.003.807-1.81 1.809-1.81h14.521a.35.35 0 0 1 .342.343v2.151a.368.368 0 0 1-.342.342h-12.443c-.147-.024-.22.074-.22.22Zm-6.747-2.64v12.443c0 1.492-1.736 2.323-2.909 1.345l-10.977-9.314v8.85c0 .244-.195.44-.44.44h-2.762c-.245 0-.465-.196-.465-.44v-12.42c0-1.49 1.736-2.322 2.909-1.344l10.977 9.314v-8.85c0-.244.195-.464.44-.464h2.762c.318 0 .465.22.465.44Zm-34.2 2.64v2.616h7.285a1.418 1.418 0 0 1 0 2.836h-7.261V19.4c0 .489.416.904.905.904h11.758a.35.35 0 0 1 .342.342V22.8a.35.35 0 0 1-.342.342h-12.712a3.626 3.626 0 0 1-3.618-3.618v-8.776c0-1.003.807-1.81 1.809-1.81h14.521a.35.35 0 0 1 .342.343v2.151a.35.35 0 0 1-.342.342h-12.443c-.147-.024-.244.074-.244.22Zm-5.183 8.605v2.152a.35.35 0 0 1-.342.342h-10.219a3.626 3.626 0 0 1-3.618-3.618V9.255a.35.35 0 0 1 .343-.342h3.006a.35.35 0 0 1 .343.342v10.097c0 .489.415.904.904.904h9.241c.22 0 .342.171.342.342ZM102.781 9.255v2.152a.35.35 0 0 1-.343.342h-5.329v12.859a.24.24 0 0 1-.391.195l-2.86-2.445a1.002 1.002 0 0 1-.343-.757v-9.876H90.02a.696.696 0 0 1-.611-.392l-1.1-2.2c-.05-.098.024-.22.17-.22h13.959a.35.35 0 0 1 .343.342Zm-50.604 6.6c.66-.244 2.005-.88 2.005-2.688 0-3.105-2.298-4.254-5.036-4.254h-10.56c-.148 0-.343.147-.343.342V22.75a.35.35 0 0 0 .342.342h11.881c1.736-.024 4.23-1.002 4.23-4.205.024-2.004-1.785-2.835-2.519-3.031ZM41.885 11.97c0-.147.098-.22.22-.22h6.503c.684 0 2.176 0 2.176 1.418s-1.516 1.418-2.176 1.418h-6.723V11.97Zm7.505 8.263h-7.285c-.146 0-.22-.098-.22-.22V17.42h7.53c.733 0 1.907 0 1.907 1.418 0 1.443-1.345 1.394-1.932 1.394ZM86.548 9.255v2.152a.35.35 0 0 1-.342.342h-4.18v12.859a.24.24 0 0 1-.391.195l-2.86-2.445a.99.99 0 0 1-.343-.733v-9.9h-4.547a.696.696 0 0 1-.61-.392l-1.1-2.2c-.025-.098.048-.22.17-.22h13.861c.147 0 .342.147.342.342Z"
            ></path>
            <path
              fill="#148EFF"
              stroke="none"
              d="M134.805 16.003c0-.978.782-1.785 1.784-1.785.978 0 1.785.807 1.785 1.785 0 .978-.782 1.785-1.785 1.785a1.778 1.778 0 0 1-1.784-1.785Z"
            ></path>
            <path
              stroke="none"
              d="M192.975 22.187a1.418 1.418 0 1 1-.003-2.837 1.418 1.418 0 0 1 .003 2.837Zm0-2.613a1.197 1.197 0 1 0-.004 2.398 1.197 1.197 0 0 0 .004-2.4v.002Zm.363 2.014-.5-.673h-.173v.673h-.283v-1.634h.586c.425 0 .611.138.611.46a.443.443 0 0 1-.437.477l.545.693-.349.004Zm-.141-1.376a.67.67 0 0 0-.269-.037h-.263v.542h.263c.251 0 .372-.093.372-.294a.237.237 0 0 0-.103-.212v.002Z"
            ></path>
          </svg>
          <div class="text-overline text-weight-bold">
            {{ t('user.temperature') }} : {{ data.temperature }}&#8451;
          </div>
          <div
            v-show="data.battleTag === ''"
            class="break-keep text-caption"
            style="max-width: 160px"
          >
            {{ t('user.sh1') }}
            <span class="underline text-weight-bold">{{ t('user.sh2') }}</span>
            {{ t('user.sh3') }}
            <span class="underline text-weight-bold">{{ t('user.sh4') }}</span>
            {{ t('user.sh5') }}
          </div>
          <template v-if="data.battleTag !== '' && as.signed">
            <div
              v-if="data.blockable"
              class="q-mt-lg row justify-center items-center"
            >
              <q-btn
                no-caps
                unelevated
                aria-label="Tradurs Block Button"
                padding="4px"
                size="12px"
                color="negative"
                :disable="disable"
                :progress="isProgress"
                @click="block"
              >
                <div class="row items-center q-gutter-x-xs">
                  <q-icon
                    class="invert"
                    name="img:/images/icons/block.svg"
                    size="19px"
                  />
                  <div>{{ t('blockUser.block') }}</div>
                </div>
              </q-btn>
            </div>
            <div
              v-else-if="blocked"
              class="q-mt-lg row justify-center items-center"
            >
              <q-btn
                no-caps
                unelevated
                :title="t('blockUser.caption')"
                aria-label="Tradurs UnBlock Button"
                padding="4px"
                size="12px"
                color="positive"
                :disable="disable || !data.unblockable"
                :progress="isProgress"
                @click="unblock"
              >
                <div class="row items-center q-gutter-x-xs">
                  <q-icon
                    class="invert"
                    name="img:/images/icons/check.svg"
                    size="19px"
                  />
                  <div>{{ t('blockUser.unblock') }}</div>
                </div>
              </q-btn>
            </div>
          </template>
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
  z-index: 1;
}

.avatar:deep(.q-btn) {
  box-shadow: 0 0 0 3px var(--q-dark);
  z-index: 2;
}

.body--light .avatar:deep(.q-btn) {
  box-shadow: 0 0 0 3px var(--q-light-page);
}

.online {
  width: 10px;
  height: 10px;
  margin: 0 -4px 0 0;
  filter: invert(39%) sepia(100%) saturate(1473%) hue-rotate(89deg)
    brightness(110%) contrast(110%);
}

.allow-copy {
  cursor: pointer;
}

.allow-copy:hover {
  text-decoration: underline;
}

.authorized {
  color: var(--q-primary);
  font-weight: 700;
}

.battletag {
  width: 100px;
  height: 17px;
}
</style>
