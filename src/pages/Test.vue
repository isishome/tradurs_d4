<script setup lang="ts">
import { ref } from 'vue'
import { useItemStore } from 'src/stores/item-store'

const is = useItemStore()
const file = ref()
const result = ref()
const scan = (files: File) => {
  is.recognize(files)
    .then((text) => {
      result.value = text
    })
}
</script>
<template>
  <q-file outlined v-model="file" @update:model-value="scan" />
  <br>
  <q-input outlined rows="20" type="textarea" v-model="result" />
</template>