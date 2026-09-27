<template>
  <div class="trade-placeholder" aria-busy="true">
    <div v-for="row in 3" :key="row" class="placeholder-card">
      <div class="placeholder-line"></div>
      <div class="placeholder-line short"></div>
    </div>
  </div>
</template>

<!-- Initial shell styles live in app.css to avoid a separate blocking request. -->
