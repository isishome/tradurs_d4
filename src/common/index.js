export const checkName = (name) => {
  return /^[0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣\s,\.'"%\(\)\+\-\:]{4,}$/gi.test(name)
}

export const checkAttribute = (attribute) => {
  return /^((\{x\})?[0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣\s,\.'"%\(\)\[\]\+\-\:]+(\{x\})?)+$/gi.test(attribute)
}

export const checkEmail = (email) => {
  return /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(email)
}

export const checkComplexity = (pw) => {
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
export const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}