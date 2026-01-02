<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Attr } from 'src/stores/item-store'
import { parseMinMax, focus } from 'src/common'
import { useI18n } from 'vue-i18n'

interface IProps {
  data: Attr
  label?: string
  disable?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  label: '',
  disable: false
})

const emit = defineEmits(['update'])

const { t } = useI18n({ useScope: 'global' })
const _data = ref<Attr | undefined>(JSON.parse(JSON.stringify(props.data)))
const parseData = computed(() =>
  props.label.split('|').map((l) => parseMinMax(l, _data.value?.minmax))
)
const update = () => {
  const min = parseData.value.flat().filter((pd) => pd.type === 'min')
  const max = parseData.value.flat().filter((pd) => pd.type === 'max')

  emit(
    'update',
    min.map((m, i) => {
      const minv = parseFloat(m.value.toString()) || 0
      const maxv = parseFloat(max[i].value.toString()) || 9999
      return {
        min: minv < 0 ? 0 : minv > 9999 ? 9999 : minv,
        max: maxv < 0 ? 0 : maxv > 9999 ? 9999 : maxv
      }
    })
  )
}

watch(
  () => props.data.minmax,
  (val) => {
    if (_data.value) _data.value.minmax = JSON.parse(JSON.stringify(val))
  }
)
</script>
<template>
  <q-item-label
    v-for="(pd, idx) in parseData"
    :key="idx"
    class="break-all"
    caption
  >
    <template v-for="(d, idx2) in pd" :key="idx2">
      <template v-if="d.type === 'text'">{{ d.value }}</template>
      <!--<template v-else-if="d.type === 'min'">{x}</template>-->
      <q-input
        v-else-if="['min', 'max'].includes(d.type)"
        class="var inline"
        input-class="text-center text-caption no-padding"
        dense
        hide-bottom-space
        hide-hint
        no-error-icon
        outlined
        :placeholder="t(d.type)"
        v-model.number="d.value"
        maxlength="6"
        debounce="500"
        :disable="disable"
        :rules="[
          (val) =>
            (!disable &&
              (parseFloat(val) % 1 !== 0 || parseInt(val) % 1 === 0)) ||
            ''
        ]"
        @update:model-value="update"
        @focus="focus"
      />
      <template v-if="d.type === 'min'"> ~ </template>
    </template>
  </q-item-label>
</template>
