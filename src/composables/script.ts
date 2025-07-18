import { onMounted } from 'vue'

interface ScriptLoadListener {
  (): void
}

interface ScriptOptions {
  async?: boolean,
  defer?: boolean,
  crossOrigin?: string
}

export function useScript(src: string): void
export function useScript(src: string, arg1: ScriptOptions): void
export function useScript(src: string, arg1: ScriptLoadListener): void
export function useScript(src: string, arg1: ScriptLoadListener, arg2: ScriptOptions): void
export function useScript(src: string, arg1?: ScriptOptions | ScriptLoadListener, arg2?: ScriptOptions): void {

  onMounted(() => {
    debugger
    let script = document.createElement('script')
    script.src = src
    const opt = typeof (arg1) === 'function' ? arg2 : arg1

    script.async = opt?.async || false
    script.defer = opt?.defer || false
    script.crossOrigin = opt?.crossOrigin || null

    script.onload = () => {
      if (typeof (arg1) === 'function')
        arg1()
    }

    if (!document.head.querySelector(`script[src="${src}"]`))
      document.head.appendChild(script)
    else if (typeof (arg1) === 'function')
      arg1()
  })
}