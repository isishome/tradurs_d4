<script setup lang="ts">
import { computed } from 'vue'
import { useItemStore } from 'src/stores/item-store'
import { sleep } from 'src/common/index'

const is = useItemStore()
const datas = computed(() =>
  is.affixes.data.map((a) =>
    a.label.replace(/[^가-힣 ]+/gi, '').replace(/[ ]+/gi, ' ')
  )
)
const enDatas = computed(() =>
  is.affixes.data.map((a) =>
    a.label
      .replace('{x}', '')
      .replace(/[^a-z ]+/gi, '')
      .replace(/[ ]+/gi, ' ')
  )
)
const download = async (lang: string, data: Array<string>) => {
  let idx = 1
  for (const a of data) {
    const link = document.createElement('a')
    link.download = `${lang}.d4.${idx.toString().padStart(3, '0')}.gt.txt`
    const blob = new Blob([`${a}\n`], { type: 'text/plain' })
    link.href = window.URL.createObjectURL(blob)
    link.click()
    idx++
    await sleep(100)
  }
}
</script>

<template>
  <!-- <textarea class="fit" rows="10">{{ datas.join('\n') }}</textarea> -->
  <textarea class="fit" rows="30">{{ enDatas.join('\n') }}</textarea>
  <q-btn label="다운로드" @click="download('eng', enDatas)" />
</template>
