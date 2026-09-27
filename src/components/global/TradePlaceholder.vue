<template>
  <div class="trade-placeholder" aria-busy="true">
    <div v-for="row in 3" :key="row" class="placeholder-card">
      <div class="placeholder-line"></div>
      <div class="placeholder-line short"></div>
    </div>
  </div>
</template>

<style scoped>
.trade-placeholder { width: 100%; padding-top: 40px; }
.placeholder-card {
  height: 220px;
  margin-bottom: 48px;
  padding: 24px;
  border: 1px solid var(--q-primary-cloud);
  border-radius: 4px;
}
.placeholder-line {
  height: 16px;
  width: 60%;
  margin-bottom: 16px;
  background: var(--q-primary-cloud);
  border-radius: 3px;
}
.placeholder-line.short { width: 35%; }
@media (max-width: 599px) {
  .placeholder-card { height: 170px; margin-bottom: 24px; }
}
</style>
