<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    default: null
  },
  to: {
    type: Object,
    default: () => {
      return {}
    }
  },
  prev: {
    type: Boolean,
    default: false
  },
  next: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: 'primary'
  },
  disable: {
    type: Boolean,
    default: false
  }
})
</script>
<template>
  <q-btn no-caps outline :disable="disable" :text-color="color" class="back" padding="1em" :to="to"
    style="max-width:48%">
    <div class="column q-gutter-y-sm">
      <div class="row justify-between items-center q-gutter-x-sm no-wrap keep">
        <q-icon v-if="prev" name="chevron_left" />
        <div class="text-subtitle1 text-weight-bold">
          {{ label }}
        </div>
        <q-icon v-if="next" name="chevron_right" />
      </div>
    </div>
  </q-btn>
</template>
<style scoped>
.back {
  background-color: rgba(0, 0, 0, .03) !important;
}

.body--dark .back {
  background-color: rgba(255, 255, 255, .05) !important;
}

.keep {
  word-break: keep-all;
}
</style>