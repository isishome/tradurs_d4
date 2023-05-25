<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { User } from 'src/types/user'
import Avatar from 'src/assets/avatar/avatar.webp'

interface IProps {
  data: User,
  type?: string,
  editable?: boolean,
  disable?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  data: () => new User(),
  type: 'column',
  editable: false,
  disable: false
})

const $q = useQuasar()

// about size
const avatarSize = computed(() => props.type === 'row' ? 24 : $q.screen.width > 600 ? 48 : 36)
const btWidth = computed(() => $q.screen.width > 600 ? '80px' : '70px')
const btHeight = computed(() => $q.screen.width > 600 ? '18px' : '14px')
const textSize = computed(() => props.type === 'row' ? 'text-caption' : $q.screen.width > 600 ? 'text-body2' : 'text-caption')

</script>

<template>
  <div v-if="editable">
  </div>
  <div v-else>
    <div class="q-gutter-xs" :class="type === 'row' ? 'row no-wrap items-center' : 'column items-start'">
      <!-- <div>
              <q-skeleton v-show="loading" type="rect" :size="`${avatarSize}px`" />
              <q-avatar v-show="!loading" rounded class="text-uppercase" :size="`${avatarSize}px`">
                <div class="avatar" :style="`background-position: -${avatarSize * data.avatar}px`"></div>
              </q-avatar>
            </div> -->
      <div>
        <q-skeleton v-show="data.loading" type="rect" :width="btWidth" :height="btHeight" />
        <div v-show="!data.loading" :class="textSize">
          <slot v-if="$slots.battleTag" name="battleTag"></slot>
          <template v-else>

            {{ data.battleTag }}
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar {
  background-image: url('src/assets/avatar/avatar.webp');
  background-repeat: no-repeat;
  background-size: cover;
  width: inherit;
  height: inherit;
}
</style>