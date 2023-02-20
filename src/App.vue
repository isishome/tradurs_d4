<script lang="ts">
import { useItemStore } from 'stores/item-store'

export default {
  preFetch({ store }) {
    const s = useItemStore(store)
    return s.getBase()
  }
}
</script>

<script setup lang="ts">

</script>

<template>
  <router-view />
</template>