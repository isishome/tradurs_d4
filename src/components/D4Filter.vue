<script setup>
import { ref } from 'vue'

const platformOptions = [
  { label: 'PC', value: 'pc' },
  { label: 'PlayStation', value: 'ps' },
  { label: 'XBOX', value: 'xbox' }
]

const regionOptions = [
  { label: 'Asia', value: 'asia' },
  { label: 'Americas', value: 'americas' },
  { label: 'Europe', value: 'europe' }
]

const filter = ref({
  platform: ['pc'],
  region: ['asia'],
  ethereal: false
})
</script>

<template>
  <div class="column q-gutter-y-lg">
    <div>
      <span class="text-weight-bold">플랫폼</span>
      <q-option-group dense class="q-pl-sm" :options="platformOptions" type="checkbox" v-model="filter.platform" />
    </div>
    <div>
      <span class="text-weight-bold">서버</span>
      <q-option-group dense class="q-pl-sm" :options="regionOptions" type="checkbox" v-model="filter.region" />
    </div>
    <q-checkbox dense v-model="filter.ethereal" label="무형" />
  </div>
</template>