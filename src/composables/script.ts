import { onMounted } from 'vue'

export const useScript = (src: string, callback?: () => void, options?: { async?: boolean, defer?: boolean }) => {

  onMounted(() => {
    let script = document.createElement('script')
    script.src = src
    script.async = options?.async || false
    script.defer = options?.defer || false
    script.onload = () => {
      callback?.()
    }

    if (!document.head.querySelector(`script[src="${src}"]`))
      document.head.appendChild(script)
  })
}