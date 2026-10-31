export const DRAFT_PREFIX = 'd4.item-draft.'
export const DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000

// 계정마다 바뀌지 않는 배틀태그로 키를 만든다(아이템 등록은 인증된 배틀태그가 있어야 열린다).
// `/account/signed`의 `id`는 요청마다 달라지는 암호문이라 키로 쓰면 새로고침 뒤 저장본을 찾지 못한다(D4 task-csj-033).
export const draftKey = (owner?: string | null) =>
  `${DRAFT_PREFIX}${owner || 'anonymous'}`

type DraftStorage = Pick<Storage, 'length' | 'key' | 'getItem' | 'removeItem'>

const expired = (raw: string | null, now: number) => {
  try {
    const savedAt = (JSON.parse(raw ?? '') as { savedAt?: unknown }).savedAt
    return typeof savedAt !== 'number' || now - savedAt > DRAFT_MAX_AGE
  } catch {
    return true
  }
}

// 예전 키(요청마다 바뀐 id)로 남은 저장본은 다시 읽히지 않아 지워지지도 않았다.
// 기한이 지났거나 읽을 수 없는 저장본을 지운다. 기한 안의 다른 계정 저장본(같은 브라우저를 쓰는 다른 사람)은 남긴다.
export const sweepItemDrafts = (storage: DraftStorage, now: number) => {
  const keys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith(DRAFT_PREFIX)) keys.push(key)
  }
  keys
    .filter((key) => expired(storage.getItem(key), now))
    .forEach((key) => storage.removeItem(key))
}
