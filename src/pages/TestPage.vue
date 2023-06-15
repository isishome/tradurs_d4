<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import Tesseract from 'tesseract.js'

const $q = useQuasar()

const analyze = () => {
  Tesseract.recognize(
    file.value as Tesseract.ImageLike,
    'kor',
    { logger: (m: any) => console.log(m) }
  ).then(({ data: { text } }: { data: any }) => {
    console.log(text)
  })
}

const file = ref<File | FileList | Array<File> | null | undefined>(null)
</script>
<template>
  <q-file dense outlined v-model="file" label="이미지" @update:model-value="analyze" />
</template>