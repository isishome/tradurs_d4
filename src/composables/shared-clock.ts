import { getCurrentInstance, onMounted, onUnmounted, readonly, ref, watch } from 'vue'
import type { WatchStopHandle } from 'vue'

type Scheduler = {
  now: () => number
  everySecond: (tick: () => void) => () => void
}

const scheduler: Scheduler = {
  now: () => Date.now(),
  everySecond: (tick) => {
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }
}

export function createSharedClock(source: Scheduler = scheduler) {
  const now = ref(source.now())
  let subscribers = 0
  let stop: (() => void) | undefined
  return {
    now: readonly(now),
    acquire() {
      if (subscribers++ === 0) {
        now.value = source.now()
        stop = source.everySecond(() => { now.value = source.now() })
      }
      let released = false
      return () => {
        if (released) return
        released = true
        if (--subscribers === 0) {
          stop?.()
          stop = undefined
        }
      }
    }
  }
}

// Keep independent SSR requests/apps isolated. No timer starts during SSR.
const clocks = new WeakMap<object, ReturnType<typeof createSharedClock>>()

export function useSharedClock(active: () => boolean) {
  const app = getCurrentInstance()!.appContext.app
  let clock = clocks.get(app)
  if (!clock) {
    clock = createSharedClock()
    clocks.set(app, clock)
  }
  const currentClock = clock
  let release: (() => void) | undefined
  let stopWatch: WatchStopHandle | undefined
  onMounted(() => {
    stopWatch = watch(active, (enabled) => {
      if (enabled && !release) release = currentClock.acquire()
      else if (!enabled && release) {
        release()
        release = undefined
      }
    }, { immediate: true })
  })
  onUnmounted(() => {
    stopWatch?.()
    release?.()
  })
  return currentClock.now
}
