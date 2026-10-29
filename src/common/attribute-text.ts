// 옵션 추가 요청 문구 검사. back `modules/routes/diablo4/attribute-text.js`와 같은 규칙(task-csj-032).
// 허용: 값 자리 {x}와 한글·영문·숫자·공백, 기호 , . ' " % ( ) [ ] + - :
//
// 기존 식 /^((\{x\})?[…]+(\{x\})?)+$/는 반복 안에 반복이 있어, 맞지 않는 30자 남짓한 입력에도
// 검사가 수십 초 걸려 브라우저 탭이 멈췄다(ReDoS). 한 겹 반복으로 바꾸고 {x}만 있는 값과 {x}{x}는 따로 거부한다.
const ATTRIBUTE_TEXT = /^(?:\{x\}|[0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣\s,.'"%()[\]+\-:])+$/

export const isValidAttributeText = (text: unknown): boolean =>
  typeof text === 'string' &&
  ATTRIBUTE_TEXT.test(text) &&
  text.replaceAll('{x}', '') !== '' &&
  !text.includes('{x}{x}')
