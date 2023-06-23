<script setup lang="ts">
import { ref } from 'vue'
import { useItemStore } from 'src/stores/item-store'

const is = useItemStore()
const img = ref<HTMLDivElement>()
const file = ref()
const result = ref()
const scan = (files: File) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const fr = new FileReader()
  fr.readAsDataURL(files)

  fr.onload = () => {
    const image = new Image()
    image.src = fr.result as string
    image.onload = () => {
      canvas.width = image.width
      canvas.height = image.height
      if (ctx) {
        ctx.filter = 'contrast(200%)'
        ctx.drawImage(image, 0, 0)
        //img.value?.appendChild(canvas)
        is.recognize(canvas)
          .then((text) => {
            result.value = text
          })
      }
    }
  }
}
</script>
<template>
  <q-file v-show="false" outlined v-model="file" accept="image/*" @update:model-value="scan" />
  <!-- <br>
  <div ref="img"></div>
  <q-input outlined rows="20" type="textarea" v-model="result" /> -->
</template>