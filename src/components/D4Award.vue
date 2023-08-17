<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script setup lang="ts">
interface IProps {
  loading?: boolean
}

withDefaults(defineProps<IProps>(), {
  loading: false
})
</script>

<template>
  <q-card v-show="loading" v-bind="$attrs" flat class="award" :class="{ 'loading': loading }">
    <q-card-section class="text-body1 row justify-center q-pb-xl q-px-none">
      <q-skeleton width="200px" height="24px" />
    </q-card-section>
    <q-card-section class="row justify-center items-center q-px-none">
      <q-skeleton type="circle" width="200px" height="200px" />
    </q-card-section>
    <q-card-section class="row justify-center q-pt-none q-px-none">
      <q-skeleton type="QChip" width="200px" height="32px" />
    </q-card-section>
    <q-card-section class="column items-center q-gutter-y-xs">
      <q-skeleton v-for="c in 3" :key="c" type="text" width="200px" height="16px" />
    </q-card-section>
  </q-card>
  <q-card v-show="!loading" v-bind="$attrs" flat class="award">
    <q-card-section class="text-body1 text-center q-pb-xl q-px-none">
      <slot name="category"></slot>

    </q-card-section>
    <q-card-section v-if="$slots['item-name']">
      <slot name="item-name"></slot>
    </q-card-section>
    <q-card-section class="row justify-center items-center q-px-none">
      <q-avatar size="200px" color="white" class="egg">
        <q-avatar color="amber-8" text-color="white" size="120px">
          <div class="text-h5 text-weight-bold">
            <slot name="detail"></slot>
          </div>
        </q-avatar>
      </q-avatar>
    </q-card-section>
    <q-card-section class="text-center q-pt-none q-px-none">
      <q-chip size="md" color="blue-grey-1" text-color="blue-8" class="text-overline text-weight-bold">
        <slot name="battleTag"></slot>
      </q-chip>
    </q-card-section>
    <q-card-section class="q-py-none">
      <div class="etc column q-gutter-y-xs">
        <slot name="etc"></slot>
      </div>
      <div class="text-area">
        <slot name="desc"></slot>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.award {
  border-radius: 20px;
  margin-bottom: 10%;
  padding: 20px;
  width: 400px;
  max-width: 90%;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(50, 50, 50, 1), 0 10px 0 1px rgba(20, 30, 30, .6) !important;
}

.body--light .award {
  box-shadow: inset 0 0 0 1px rgba(255, 200, 0, 1), 0 10px 0 1px rgba(255, 200, 0, .6) !important;
}

.award::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: .6;
  background-image: url('/images/awards/laurel.webp');
  background-size: 280px;
  background-repeat: no-repeat;
  background-position: 50% 140px;
  filter: invert(77%) sepia(77%) saturate(1453%) hue-rotate(360deg) brightness(104%) contrast(104%);
}

.award.loading::before {
  filter: contrast(0) opacity(.1);
  ;
}

.egg {
  box-shadow: 0 0 4px 4px rgba(0, 0, 0, .1);
}

.egg::after {
  content: '';
  position: absolute;
  top: -26px;
  left: 50%;
  transform: translateX(-50%);
  background-image: url('/images/tradurs.svg');
  background-size: contain;
  background-position: 50%;
  background-repeat: no-repeat;
  width: 80px;
  height: 80px;
  z-index: 1;
}

.award:deep(.etc) {
  min-height: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: keep-all;
}

.award:deep(.text-area) {
  min-height: 14px;
}
</style>