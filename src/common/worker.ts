import { matchProperties, matchTooltip, type CompareParams } from './affix-matcher'
export type { CompareParams, Result, ResultValue } from './affix-matcher'

self.onmessage = (event) => {
  const params: CompareParams = JSON.parse(event.data)
  self.postMessage(params.propertyAffixes ? matchProperties(params) : matchTooltip(params))
}
