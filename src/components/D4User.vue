<script setup lang="ts">
import { User } from 'src/types/user'

interface IProps {
  data: User,
  editable?: boolean,
  loading?: boolean,
  disable?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  offer: false,
  editable: false,
  loading: false,
  disable: false
})
</script>

<template>
  <div v-if="editable">
  </div>
  <div v-else>
    <template v-if="loading">
      <q-item-section avatar class="column items-center">
        <q-item-label>
          <q-skeleton type="circle" size="40px" />
        </q-item-label>
        <q-item-label>
          <q-skeleton type="rect" width="40px" height="12px" />
        </q-item-label>
      </q-item-section>
    </template>
    <template v-else>
      <q-item-section avatar>
        <q-avatar class="text-uppercase">
          <q-img src="https://cdn.quasar.dev/img/avatar.png" />
        </q-avatar>
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ data.name }}</q-item-label>
      </q-item-section>
    </template>
  </div>
</template>

<style scoped></style>