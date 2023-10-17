<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar, QSelect, QForm } from 'quasar'
import { useI18n } from 'vue-i18n'
import { type IPreset } from 'stores/item-store'

interface IProps {
  modelValue: number | null,
  options: Array<IPreset>,
  disable?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  disable: false
})

const emit = defineEmits(['update:modelValue', 'add', 'remove'])

const $q = useQuasar()
const { t } = useI18n({ useScope: 'global' })

const presetLabel = computed(() => props.options.length === 0 ? t('filter.noPreset') : !preset.value ? t('filter.selectPreset') : undefined)
const optionStyle = computed(() => !$q.platform.is.mobile ? { maxWidth: `${presetRef.value?.$el.offsetWidth}px` } : {})
const preset = ref<number | null>(props.modelValue)

const presetRef = ref<QSelect>()

const done = () => {
  showAddPreset.value = false
  presetName.value = null
  progress.value = false
}

const error = () => {
  progress.value = false
}

const update = (val: number) => {
  emit('update:modelValue', val)
}

const showAddPreset = ref<boolean>(false)
const presetName = ref<string | null>(null)
const progress = ref<boolean>(false)

const add = () => {
  progress.value = true

  emit('add', { name: presetName.value, done, error })
}

const remove = (id: number) => {
  $q.dialog({
    title: t('preset.title'),
    message: t('preset.message'),
    persistent: true,
    cancel: { label: t('btn.cancel'), color: 'grey', outline: true },
    ok: { label: t('btn.delete'), color: 'negative', unelevated: true, class: 'text-weight-bold invert-icon' },
    transitionShow: 'fade',
    transitionHide: 'fade',
    noRouteDismiss: true,
    class: 'q-pa-sm'
  }).onOk(() => {
    progress.value = true

    emit('remove', { id, done, error })
  })
}

watch(() => props.modelValue, (val: number | null) => {
  preset.value = val
})

</script>
<template>
  <q-item-label header>
    <div class="row items-center q-gutter-sm">
      <div>
        {{ t('filter.preset') }}
      </div>
      <q-icon class="icon" name="img:/images/icons/help.svg" size="19px">
        <D4Tooltip>
          <div style="max-width:200px" class="text-caption break-keep">
            {{ t('filter.presetDescription') }}
          </div>
        </D4Tooltip>
      </q-icon>
    </div>
    <div>
      <q-popup-proxy v-model="showAddPreset" no-parent-event transition-show="flip-down" transition-hide="flip-up"
        @hide="done" style="width:276px">
        <q-card :dark="!$q.dark.isActive">
          <q-card-section>
            <q-form autofocus class="row items-center justify-between q-gutter-x-sm" @submit="add">
              <q-input :dark="false" :disable="disable || progress" dense no-error-icon hide-bottom-space autofocus
                v-model="presetName" outlined :label="t('filter.presetName')" maxlength="32"
                :rules="[val => val && val.trim() !== '' || '']" class="col" />
              <q-btn no-caps :disable="disable" :progress="progress" unelevated :label="t('btn.add')" color="primary"
                aria-label="Tradurs Add Button" type="submit" />
            </q-form>
          </q-card-section>
        </q-card>
      </q-popup-proxy>
    </div>
  </q-item-label>
  <q-item :disable="disable">
    <q-item-section>
      <q-item-label>
        <q-select ref="presetRef" v-model="preset" :disable="disable" :label="presetLabel" stack-label outlined dense
          no-error-icon hide-bottom-space emit-value map-options transition-show="none" transition-hide="none"
          :transition-duration="0" dropdown-icon="img:/images/icons/dropdown.svg" :options="options"
          popup-content-class="scroll bordered" @update:model-value="update">
          <template #selected-item="scope">
            <div class="ellipsis">{{ scope.opt.label }}</div>
          </template>
          <template #option="scope">
            <q-item clickable :style="optionStyle" v-bind="scope.itemProps">
              <q-item-section side>
                <q-btn size="xs" :disable="disable" :progress="progress" unelevated dense round outline color="negative"
                  aria-label="Tradurs Remove Button" @click.stop="remove(scope.opt.value)">
                  <img class="negative" width="13" height="13" src="/images/icons/remove.svg" alt="icon_remove" />
                </q-btn>
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ scope.opt.label }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <q-btn size="sm" :disable="disable || options.length === 5" unelevated dense round
        :color="$q.dark.isActive ? 'grey-4' : 'grey-9'" :ripple="false" aria-label="Tradurs Add Button"
        @click="showAddPreset = true">
        <img :class="{ 'invert': !$q.dark.isActive }" width="16" height="16" src="/images/icons/add.svg" alt="icon_add" />
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<style scoped>
.negative {
  filter: invert(11%) sepia(78%) saturate(7404%) hue-rotate(349deg) brightness(75%) contrast(105%);
}
</style>