<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
    label: {
        type: String,
        default: null
    },
    color: {
        type: String,
        default: null
    },
    textColor: {
        type: String,
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    }
})
const $q = useQuasar()
const bg = computed<string>(() => $q.dark.isActive ? `background: radial-gradient(ellipse at top, ${props.color ? props.color : 'var(--q-primary)'}, 50%, var(--q-dark-page));` : `background-color: ${props.color ? props.color : 'rgb(200, 200, 200)'};`)
const tc = computed<string>(() => `color:${props.textColor ? props.textColor : 'inherit'};`)

</script>

<template>
    <div>
        <q-skeleton v-show="loading" type="QBtn" />
        <div v-show="!loading" class="btn-wrap">
            <button class="btn" :style="`${bg}${tc}`">
                <div class="label">{{ label }}</div>
            </button>
        </div>
    </div>
</template>

<style scoped>
.btn {
    position: relative;
    padding: 8px 14px;
    border: none;
    cursor: pointer;
    transition: filter .3s ease;
    font-size: 12px;
    font-weight: 700;
    text-shadow: 0 0 4px var(--q-dark);
}

.body--light .btn {
    text-shadow: none;
}

.body--light .btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, .6);
}

.btn-wrap:active {
    transform: translateY(1px);
}

.btn:hover {
    filter: brightness(150%);
}

.body--light .btn:hover {
    filter: brightness(110%);
}

@media (max-width:600px) {
    .btn {
        font-size: 10px;
    }
}

.btn-wrap {
    position: relative;
    padding: 3px;
    cursor: pointer;
}

.body--light .btn-wrap::before {
    border-radius: 10px;
    /* box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px; */
}

.btn-wrap::after {
    content: '';
    max-height: 100%;
    box-sizing: border-box;
    position: absolute;
    z-index: 0;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-style: solid;
    border-image-width: 9px !important;
    border-image: url(@/assets/frames/outer.webp) 30;
    filter: brightness(160%);
    pointer-events: none;
}

.body--light .btn-wrap::after {
    border-image: url(@/assets/frames/outer_normal.webp) 30;
    filter: brightness(1);
}

.btn-wrap::before {
    box-shadow: none;
    content: '';
    position: absolute;
    z-index: 1;
    top: 4px;
    bottom: 4px;
    left: 4px;
    right: 4px;
    border-style: solid;
    border-image: url(@/assets/frames/inner.webp) 36;
    border-image-width: 30px;
    pointer-events: none;
    filter: invert(50%);
}

.body--light .btn-wrap::before {
    filter: invert(0);
}

.label {
    position: relative;
    z-index: 1;
}
</style>