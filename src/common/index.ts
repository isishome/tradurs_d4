export const checkName = (name: string) => {
  return /^[0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣\s,\.'"%\(\)\+\-\:]{4,}$/gi.test(name)
}

export const checkAttribute = (attribute: string) => {
  return /^((\{x\})?[0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣\s,\.'"%\(\)\[\]\+\-\:]+(\{x\})?)+$/gi.test(attribute)
}

export const checkEmail = (email: string) => {
  return /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(email)
}

export const checkComplexity = (pw: string) => {
  let score = 0
  if (/[A-Z]+/.test(pw))
    score += 20
  if (/[a-z]+/.test(pw))
    score += 20
  if (/[`~!@#$%^&*]+/.test(pw))
    score += 20
  if (/[0-9]+/.test(pw))
    score += 20
  if (pw.length >= 12)
    score += 20

  return score
}

// sleep
export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

interface Attribute {
  type: string,
  value: number | string
}

export const parse = (label: string | undefined, value?: Array<number>): Array<Attribute> => {
  if (label)
    return label.split(/\{x\}/g).reduce((p: Array<Attribute>, c, i) => {
      p.push({ type: 'text', value: c })
      p.push({ type: 'variable', value: value ? (value[i] || 0) : 0 })
      return p
    }, []).slice(0, -1)
  else
    return []
}