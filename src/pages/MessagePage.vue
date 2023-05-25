<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAccountStore } from 'src/stores/account-store'

const store = useAccountStore()

// images
const img = ref<string>('')

let reader: FileReader

const imgToBase64 = (imgFile: any) => {
  reader.readAsDataURL(imgFile as Blob)
}

const selectedImage = (e: Event): void => {
  const files = Array.from((e.target as HTMLInputElement).files as ArrayLike<File>)
  for (const file of files) {
    imgToBase64(file)
  }
}

onMounted(() => {
  store.badge = false
  reader = new FileReader()
  reader.addEventListener('load', () => {
    img.value = reader.result as string
  }, false)

  reader.addEventListener('loadend', () => {
    reader.abort()
  }, false)
})
</script>

<template>
  <div class="column q-gutter-y-md">
    <input type="file" accept="image/*" @change="selectedImage" style="width:150px">
    <q-avatar size="sm" color="red" text-color="white">
      <img v-if="img !== ''" :src="img" />
      <div v-else>M</div>
    </q-avatar>
  </div>
</template>