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

const presetLabel = computed(() => props.options.length === 0 ? t('filter.noPreset') : undefined)
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
    {{ t('filter.preset') }}
    <q-popup-proxy v-model="showAddPreset" no-parent-event transition-show="none" transition-hide="none"
      transition-duration="0" @hide="done">
      <q-card>
        <q-card-section>
          <q-form autofocus class="row items-center justify-between q-gutter-x-sm" @submit="add">
            <q-input :disable="disable || progress" dense no-error-icon hide-bottom-space autofocus v-model="presetName"
              outlined :label="t('filter.presetName')" maxlength="32" :rules="[val => val && val.trim() !== '' || '']" />
            <q-btn no-caps :disable="disable" :progress="progress" unelevated :label="t('btn.add')" color="primary"
              aria-label="Tradurs Add Button" type="submit" />
          </q-form>
        </q-card-section>
      </q-card>
    </q-popup-proxy>
  </q-item-label>
  <q-item :disable="disable">
    <q-item-section>
      <q-item-label>
        <q-select ref="presetRef" v-model="preset" :disable="disable || options.length === 0" :label="presetLabel"
          outlined dense no-error-icon hide-bottom-space emit-value map-options transition-show="none"
          transition-hide="none" :transition-duration="0" dropdown-icon="img:/images/icons/dropdown.svg"
          :options="options" popup-content-class="scroll bordered" @update:model-value="update">
          <template #selected-item="scope">
            <div class="ellipsis">{{ scope.opt.label }}</div>
          </template>
          <template #option="scope">
            <q-item clickable :style="optionStyle" v-bind="scope.itemProps">
              <q-item-section side>
                <q-btn size="xs" :disable="disable" :progress="progress" unelevated dense round outline
                  aria-label="Tradurs Remove Button" @click.stop="remove(scope.opt.value)">
                  <img class="icon" width="13" height="13" src="/images/icons/remove.svg" alt="icon_remove" />
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
      <q-btn size="sm" :disable="disable || options.length === 3" unelevated dense round outline :ripple="false"
        aria-label="Tradurs Add Button" @click="showAddPreset = true">
        <img class="icon" width="16" height="16" src="/images/icons/add.svg" alt="icon_add" />
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<style scoped></style>