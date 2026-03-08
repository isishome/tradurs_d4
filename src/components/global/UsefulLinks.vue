<script setup lang="ts">
type Props = {
  mode?: 'hyperlink' | 'listitem'
}

withDefaults(defineProps<Props>(), {
  mode: 'hyperlink'
})

const links = [
  {
    href: 'https://d2r.tradurs.com',
    label: 'Diablo® II Tradurs',
    color: 'red-6'
  },
  {
    href: 'https://mobalytics.gg/diablo-4',
    label: 'Mobalytics Diablo IV'
  },
  {
    href: 'https://maxroll.gg/d4',
    label: 'maxroll Diablo IV'
  },
  {
    href: 'https://d4builds.gg/build-planner',
    label: 'D4Builds.gg'
  },
  {
    href: 'https://aziraell3.github.io/GAME/D4/?job=dru',
    label: 'Aspect Simulator'
  }
]
</script>
<template>
  <div class="column items-start useful" v-if="mode === 'hyperlink'">
    <q-btn
      v-for="(link, idx) in links"
      :key="idx"
      flat
      no-caps
      padding="0"
      :ripple="false"
      class="text-overline no-hover text-weight-bold"
      :color="link.color"
      type="a"
      :href="link.href"
      :label="link.label"
      target="_blank"
      rel="noopener noreferrer"
    />
  </div>
  <q-list v-else class="q-mx-md q-py-xl q-mt-xl text-overline useful" dense>
    <q-item
      v-for="(link, idx) in links"
      :key="idx"
      clickable
      :class="[
        'no-margin text-weight-bold no-hover-item',
        link.color ? `text-${link.color}` : ''
      ]"
      tag="a"
      :href="link.href"
      target="_blank"
      rel="noopener noreferrer"
    >
      <q-item-section>
        <q-item-label>{{ link.label }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<style lang="scss" scoped>
.useful {
  color: currentColor;

  &:deep(.no-hover-item .q-focus-helper) {
    display: none;
  }

  & a {
    text-decoration: underline;
    text-underline-offset: 3px;
    border-radius: 0;
    line-height: 1rem;
    margin-bottom: 10px;
    opacity: 0.5;

    &:hover {
      opacity: 1;
    }
  }
}
</style>
