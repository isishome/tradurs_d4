<script setup lang="ts">
interface IProps {
  type?: "left" | "full"
}

withDefaults(defineProps<IProps>(), {
  type: "full"
})
</script>
<template>
  <div class="separator relative-position" :class="type"></div>
</template>
<style scoped>
.separator {
  width: 100%;
  height: 10px;
  background-image: url("/images/frames/separator_center.webp");
  background-repeat: no-repeat;
  background-size: auto 100%;
  background-position-x: center;
}

.separator::before {
  background-image: url("/images/frames/separator_left.webp");
  background-repeat: no-repeat;
  background-size: 100% 100%;
  content: "";
  top: 0;
  left: 10px;
  right: calc(50% + 14px);
  bottom: 0;
  position: absolute;
  transform: translate(0, 0);
}

.separator::after {
  background-image: url("/images/frames/separator_right.webp");
  background-repeat: no-repeat;
  background-size: 100% 100%;
  overflow: hidden;
  content: "";
  top: 0;
  bottom: 0;
  left: calc(50% + 14px);
  right: 10px;
  position: absolute;
  transform: translate(0, 0);
}

.separator.left {
  background-image: none;
}

.separator.left::after {
  background-image: url("/images/frames/separator_center.webp");
  background-position: 9px;
  right: 0;
  left: calc(50% - 23px);
  width: 28px;
  transform: translate(0, 0);
}

@media (max-width: 600px) {
  .separator {
    height: 8px;
  }

  .separator::before {
    right: calc(50% + 10px);
  }

  .separator::after {
    left: calc(50% + 10px);
  }

  .separator.left::after {
    background-position: 9px;
    left: calc(50% - 23px);
    width: 26px;
  }
}

.body--light .separator {
  opacity: 0.4;
}
</style>
