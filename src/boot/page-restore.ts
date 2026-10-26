import { boot } from 'quasar/wrappers'
import { useAccountStore } from 'src/stores/account-store'
import { useItemStore } from 'src/stores/item-store'
import { initMessenger } from 'src/sockets/messenger'

// 뒤로 가기 캐시(bfcache)로 되살아난 화면은 떠날 때 상태 그대로다. 다른 사이트(tradurs.com 내 정보 등)에서
// 바꾼 로그인·계정 정보를 다시 확인하고, 떠날 때 닫은 메신저 소켓을 다시 연다.
export default boot(({ store }) => {
  if (process.env.SERVER) return

  const as = useAccountStore(store)

  window.addEventListener('pagehide', (event) => {
    // 브라우저가 강제로 끊기 전에 직접 닫는다(콘솔의 "Page entered Back-Forward Cache" 오류 방지).
    if (event.persisted) as.messenger?.disconnect()
  })

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return

    void as
      .checkSign()
      .catch(() => undefined)
      .then(async () => {
        if (!as.signed) {
          as.messenger?.disconnect()
          as.messenger = null
          return
        }

        // 다시 연결하면 back이 현재 세션의 사용자 room에 넣는다(다른 계정으로 바뀐 경우 포함).
        if (as.messenger) as.messenger.connect()
        else await initMessenger(as, useItemStore(store)).catch(() => undefined)
      })
  })
})
