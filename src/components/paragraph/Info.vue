<script setup>
defineProps({
  label: {
    type: String,
    required: null
  },
  color: {
    type: String,
    default: 'primary'
  },
  advice: {
    type: Boolean,
    default: false
  },
  example: {
    type: Boolean,
    default: false
  }
})
</script>
<template>
  <div>
    <div class="outer q-my-md" :class="`bg-${color}`">
      <div class="info q-pt-md q-px-md">
        <div v-if="label" class="row items-center q-gutter-x-xs q-mb-sm">
          <q-icon flat name="o_info" :color="color" />
          <b>{{ label }}</b>
        </div>
        <div v-else-if="advice" class="row items-center q-gutter-x-xs q-mb-sm">
          <q-avatar size="28px">
            <img src="@/assets/images/seraq.svg" />
          </q-avatar>
          <div class="text-subtitle1 text-weight-bold text-teal-4">Sera's Advice</div>
        </div>
        <div class="contents" :class="example ? 'example' : ''">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.info {
  position: relative;
  padding: 20px 24px 4px 24px;
  background-color: rgb(245, 245, 245);
  border-radius: 7px;
  overflow-x: auto;
}

.body--dark .info {
  background-color: rgb(40, 40, 40);
}

.body--light .info:deep(em) {
  background-color: var(--q-primary);
  color: var(--q-dark-text);
}

.outer {
  border-radius: 8px;
  margin: 28px 0;
  padding: 1px !important;
}

@media (max-width: 480px) {
  .info {
    padding: 10px 12px 2px 12px;
  }
}

.example:deep(.row),
.example:deep(.column) {
  background-color: rgba(0, 0, 0, .08);
  margin-bottom: 16px;
}

.body--dark .example:deep(.row),
.body--dark .example:deep(.column) {
  background-color: rgba(255, 255, 255, .08);
}

.example:deep(.row>div),
.example:deep(.column>div) {
  padding: 10px 15px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .1);
}

.body--dark .example:deep(.row>div),
.body--dark .example:deep(.column>div) {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .1);
}

.example:deep(.row>div:nth-child(8n+1)),
.example:deep(.column>div:nth-child(1)) {
  background-color: rgba(244, 67, 54, .3);
}

.example:deep(.row>div:nth-child(8n+2)),
.example:deep(.column>div:nth-child(2)) {
  background-color: rgba(255, 152, 0, .3);
}

.example:deep(.row>div:nth-child(8n+3)),
.example:deep(.column>div:nth-child(3)) {
  background-color: rgba(76, 175, 80, .3);
}

.example:deep(.row>div:nth-child(8n+4)),
.example:deep(.column>div:nth-child(4)) {
  background-color: rgba(33, 150, 243, .3);
}

.example:deep(.row>div:nth-child(8n+5)),
.example:deep(.column>div:nth-child(5)) {
  background-color: rgba(63, 81, 181, .3);
}

.example:deep(.row>div:nth-child(8n+6)),
.example:deep(.column>div:nth-child(6)) {
  background-color: rgba(156, 39, 176, .3);
}

.example:deep(.row>div:nth-child(8n+7)),
.example:deep(.column>div:nth-child(7)) {
  background-color: rgba(121, 85, 72, .3);
}

.example:deep(.row>div:nth-child(8n+8)),
.example:deep(.column>div:nth-child(8)) {
  background-color: rgba(96, 125, 139, .3);
}
</style>