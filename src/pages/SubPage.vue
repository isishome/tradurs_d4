<script setup lang="ts">
import { nanoid } from 'nanoid'
import { useQuasar } from 'quasar'
import { ref, onMounted } from 'vue'
import { Offer } from 'src/types/item'
import { Manager } from 'socket.io-client'
import D4Price from 'components/D4Price.vue'
import D4User from 'components/D4User.vue'

const $q = useQuasar()

const manager = new Manager('ws://localhost:6081', {
  reconnectionDelayMax: 10000
})

// socket.io
const initSocket = () => {
  socket = manager.socket('/messenger')
  socket.on('connect', () => {
    console.log('connected server')
  })

  socket.on('message', (data: string) => {
    $q.notify({
      position: 'top',
      message: data,
    })
  })

  socket.on('alarm', () => {
    badge.value = true
  })
}

let socket: any
const rooms = ref(new Set())
const room = ref<string>()
const join = () => {
  if (!rooms.value.has(room.value)) {
    socket.emit('join', room.value)
    rooms.value.add(room.value)
  }
}
const leave = () => {
  if (rooms.value.has(room.value)) {
    socket.emit('leave', room.value)
    rooms.value.delete(room.value)
    room.value = ''
  }
}

const refMsg = ref()
const msg = ref<string>()
const send = () => {
  if (rooms.value.size > 0 && msg.value !== '') {
    socket.emit('message', msg.value)
    msg.value = ''
    refMsg.value.focus()
  }
}

const badge = ref<boolean>(false)
const notice = ref<string>()
const alarm = () => {
  if (rooms.value.size > 0 && notice.value !== '')
    socket.emit('alarm', notice.value)
}

// images
const img = ref<string>('')

let reader: FileReader

const imgToBase64 = (imgFile: any) => {
  reader.readAsDataURL(imgFile as Blob)
}

const selectedImage = (e: Event): void => {
  const files = Array.from((e.target as HTMLInputElement).files as ArrayLike<File>)
  for (const file of files) {
    imgToBase64(file)
  }
}

const offer = ref<Offer>(new Offer('1', nanoid()))
offer.value.getInfo()
offer.value.currency = 'rune'
offer.value.currencyValue = 'vex'
offer.value.quantity = 10
offer.value.accepted = true
offer.value.user.getInfo()

const offer2 = ref<Offer>(new Offer('123', nanoid()))
offer2.value.loading = true
offer2.value.user.loading = true

onMounted(() => {
  reader = new FileReader()
  reader.addEventListener('load', () => {
    img.value = reader.result as string
  }, false)

  reader.addEventListener('loadend', () => {
    reader.abort()
  }, false)

  initSocket()
})
</script>

<template>
  <div class="column q-gutter-y-md">
    <div>
      <q-btn dense icon="notifications" @click="badge = false">
        <q-badge v-show="badge" floating color="red" rounded />
      </q-btn>
    </div>
    <input type="file" accept="image/*" @change="selectedImage" style="width:150px">
    <q-avatar size="sm" color="red" text-color="white">
      <img v-if="img !== ''" :src="img" />
      <div v-else>M</div>
    </q-avatar>
    <q-card>
      <q-card-section>
        <D4Price offer :data="offer2" :loading="offer2.loading">
          <template #user>
            <D4User :data="offer2.user" :loading="offer2.user.loading" />
          </template>
        </D4Price>
      </q-card-section>
      <q-separator inset />
      <q-card-section>
        <D4Price offer :data="offer" :loading="offer.loading">
          <template #user>
            <D4User :data="offer.user" :loading="offer.user.loading" />
          </template>
        </D4Price>
      </q-card-section>
    </q-card>
    <q-card>
      <q-card-section>
        <div class="row items-center q-gutter-sm">
          <q-input :disable="rooms.size !== 0" v-model="room" outlined />
          <q-btn v-if="rooms.size === 0" icon="login" color="green" dense @click="join" />
          <q-btn v-else icon="logout" color="red" dense @click="leave" />
        </div>
      </q-card-section>
    </q-card>
    <q-card>
      <q-card-section>
        <q-form @submit="send" class="row items-center q-gutter-sm">
          <q-input ref="refMsg" :disable="rooms.size === 0" v-model="msg" outlined />
          <q-btn :disable="rooms.size === 0" icon="send" color="blue" dense type="submit" />
        </q-form>
      </q-card-section>
    </q-card>
    <q-card>
      <q-card-section>
        <q-form @submit="alarm" class="row items-center q-gutter-sm">
          <q-input :disable="rooms.size === 0" v-model="notice" outlined />
          <q-btn :disable="rooms.size === 0" icon="notifications_active" color="brown" dense type="submit" />
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>