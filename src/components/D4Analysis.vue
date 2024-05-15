<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { QFile, uid, useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { type ILabel, useItemStore } from 'src/stores/item-store'
import { Property, Affix, Item } from 'src/types/item'

interface IProps {
  loading?: boolean,
  disable?: boolean
}

withDefaults(defineProps<IProps>(), {
  loading: false,
  disable: false
})

const emit = defineEmits(['start', 'end', 'failed'])

const $q = useQuasar()
const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const is = useItemStore()

const lang: string = route.params.lang as string || 'ko'
const similarRate = .8
const phase = is.analyze.lang[lang as keyof typeof is.analyze.lang]
const replaces = is.analyze.replaces[lang as keyof typeof is.analyze.replaces]
const timeout = 400
const showProgress = ref<boolean>(false)
const checkedItem = reactive<string[]>([])
const checkList: ILabel[] = [
  { value: 'analyze', label: t('analyze.analyzingImage') },
  { value: 'text', label: t('analyze.aligningText') },
  { value: 'info', label: t('analyze.checkBasicInfo') },
  { value: 'properties', label: t('analyze.checkCharacteristics') },
  { value: 'affixes', label: t('analyze.checkAffixes') },
  { value: 'restrictions', label: t('analyze.checkRestrictions') },
  { value: 'aggregate', label: t('analyze.aggregateItemInfo') }
]
const currentCheck = ref<string | number | null>(checkList[0].value)

let plainText: string
const item = new Item('')
let restrictionsPhase: string[]

const fileRef = ref<QFile>()
const file = ref()

const beforeHide = () => {
  file.value = undefined
  checkedItem.splice(0, checkedItem.length)
  currentCheck.value = null
}

const endScan = () => {
  setTimeout(() => {
    showProgress.value = false

    emit('end', item)
  }, timeout)
}

const failedScan = (msg: string) => {
  showProgress.value = false

  emit('failed', msg)
}

const editDistance = (s1: string, s2: string) => {
  s1 = s1.toLowerCase()
  s2 = s2.toLowerCase()

  var costs = new Array()
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j
      else {
        if (j > 0) {
          var newValue = costs[j - 1]
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue
  }
  return costs[s2.length]
}

const similarity = (s1: string, s2: string) => {
  var longer = s1
  var shorter = s2
  if (s1.length < s2.length) {
    longer = s2
    shorter = s1
  }
  var longerLength = longer.length
  if (longerLength == 0) {
    return 1.0
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength.toString())
}

const checkText = () => {
  currentCheck.value = 'text'

  const priceText = `판매가|sell.*value`
  const notTradable = `계정.*귀속|거래.*불가|account.*bound|not.*tradable`
  const textArray = plainText.split(/\n/g).map(a => a.trim())

  // check priceText
  const indexPriceText = textArray.findIndex(ta => (new RegExp(priceText, 'gi')).test(ta))

  if (indexPriceText !== -1)
    textArray.splice(indexPriceText)

  // check not tradable
  const findNotTradable = textArray.filter(ta => (new RegExp(notTradable, 'gi')).test(ta))

  if (findNotTradable.length > 0)
    return failedScan(t('analyze.nonTradable'))

  setTimeout(() => {
    checkedItem.push('text')
    checkInfo(textArray)
  }, timeout)
}

const checkInfo = (textArray: string[]) => {
  currentCheck.value = 'info'

  // check tier
  const tierText = is.tiers.map(t => t.fullName.replace(/[ ]/g, '')).join('|')
  const indexTier = textArray.findIndex(ta => (new RegExp(tierText, 'gi')).test(ta))

  if (indexTier !== -1) {
    const tierPhase = textArray[indexTier].split(/\s/gi)

    for (let i = 0; i < tierPhase.length; i++) {
      const findTierIndex = is.tiers.findIndex(t => tierPhase[i].toLowerCase().indexOf(t.fullName.toLowerCase()) !== -1)

      if (findTierIndex !== -1) {
        item.tier = is.tiers[findTierIndex].value
        tierPhase[i].replace(is.quality[findTierIndex].fullName.toLowerCase(), '')
        break
      }
    }
  }

  // check quality
  const qualityText = is.quality.map(q => q.fullName.replace(/[ ]/g, '')).join(' |')
  const indexQuality = textArray.findIndex(ta => (new RegExp(qualityText, 'gi')).test(ta))

  if (indexQuality === -1)
    return failedScan(t('analyze.qualityNotFound'))

  const qualityPhase = textArray.slice(indexQuality, indexQuality + 2).join(' ').split(/\s/gi)

  let typeValueIndex = -1
  for (let i = 0; i < qualityPhase.length; i++) {
    const findQualityIndex = is.quality.findIndex(q => qualityPhase[i].toLowerCase().indexOf(q.fullName.toLowerCase()) !== -1)

    if (findQualityIndex !== -1) {
      typeValueIndex = i
      item.quality = is.quality[findQualityIndex].value as string
      qualityPhase[i].replace(is.quality[findQualityIndex].fullName.toLowerCase(), '')
      break
    }
  }

  // check typevalue
  if (typeValueIndex === -1)
    return failedScan(t('analyze.typeNotFound'))

  let typeValue = qualityPhase.splice(typeValueIndex, qualityPhase.length).join(' ').replace(new RegExp(`[^${phase}]`, 'gi'), '').trim()

  // replace for each language  
  replaces.forEach((r => {
    typeValue = typeValue.replace(new RegExp(`${r[0]}`, 'gi'), r[1])
  }))

  if (!typeValue || typeValue === '')
    return failedScan(t('analyze.typeNotFound'))

  // check class
  const findClass = [...is.classes].sort((a, b) => b.label.length - a.label.length).find(c => typeValue.toLowerCase().indexOf(c.label.replace(new RegExp(`[^${phase}]`, 'gi'), '').toLowerCase()) !== -1)

  if (findClass) {
    item.itemType = findClass.type
    item.itemTypeValue1 = findClass.value as string

    if (findClass.value === 'gem') {
      const findGemQuality = is.gems.find(g => typeValue.toLowerCase().indexOf(g.qualityName.toLowerCase()) !== -1)

      if (findGemQuality)
        item.itemTypeValue2 = findGemQuality.quality
    }
  }

  // check aspect
  if (item.itemTypeValue1 === '') {
    const findAspect = is.aspectCategories.find(a => a.label.toLocaleLowerCase() === typeValue.toLowerCase())

    if (findAspect) {
      item.itemType = 'aspect'
      item.itemTypeValue1 = findAspect.value as string
    }
  }

  if (item.itemTypeValue1 === '')
    return failedScan(t('analyze.typeValueNotFound'))

  // check item name
  const name = textArray.splice(0, indexQuality).join(' ').replace(new RegExp(`[^ ${phase} ]`, 'gi'), '').trim()
  if (name === '')
    return failedScan(t('analyze.nameNotFound'))

  item.name = name

  // check item power
  const powerText = `아이템.*위력|item.*power`
  const indexPower = textArray.findIndex(ta => (new RegExp(powerText, 'gi')).test(ta))

  if (indexPower !== -1) {
    const numPhase = textArray[indexPower].replace(/[^0-9\+]/gi, '').replace(/^([0-9]*)(\+?[0-9]*)$/gi, '$1')
    if (!isNaN(parseFloat(numPhase)))
      item.power = parseFloat(numPhase)

    textArray.splice(0, indexPower + 1)
  }

  // check item upgrades
  // const upgradesText = `업그레이드|upgrades`
  // const indexUpgrades = textArray.findIndex(ta => (new RegExp(upgradesText, 'gi')).test(ta))

  // if (indexUpgrades !== -1) {
  //   const numPhase = textArray[indexUpgrades].replace(/[^0-9\/]/gi, '').replace(/^([0-9]*)(\/?[0-9]*)$/gi, '$1')
  //   if (!isNaN(parseFloat(numPhase)))
  //     item.upgrade = parseFloat(numPhase)

  //   textArray.splice(0, indexUpgrades + 1)
  // }

  // check item Requires Level
  const requiresText = `요구.*레벨|requires.*level`
  const indexRequires = textArray.findIndex(ta => (new RegExp(requiresText, 'gi')).test(ta))

  // if (indexRequires === -1)
  //   return failedScan(t('analyze.requireNotFound'))

  if (indexRequires !== -1) {
    const levelPhase = textArray[indexRequires].replace(/[^0-9]/gi, '')
    if (!isNaN(parseFloat(levelPhase)))
      item.level = parseFloat(levelPhase)
  }

  restrictionsPhase = textArray.splice(indexRequires, textArray.length).map((ta: string) => ta.replace(/[\+ ]/g, ''))

  // remove lost when epuipped
  const lostText = `장착.*사라지는|lost.*when`
  const indexLost = textArray.findIndex(ta => (new RegExp(lostText, 'gi')).test(ta))

  if (indexLost !== -1)
    textArray.splice(indexLost, textArray.length)

  let tArray = textArray.map((ta: string) => ta.replace(/[\+ ]/g, '').replace(/([0-9]*?)(\,)([0-9.]{1,})/g, '$1$3').replace(/[\[]{2,}/g, '[').replace(/[\]]{2,}/g, ']').replace(/\]1/g, ']'))

  setTimeout(() => {
    checkedItem.push('info')
    checkProperties(tArray)
  }, timeout)
}

interface IMatch {
  id: number,
  length: number,
  rate: number
}

interface ISimilar {
  index: number,
  match: Array<IMatch>
}

const checkAttributes = (tArray: string[], index: number, id: number, label: string) => {
  const result: Array<IMatch> = []

  let l = 0
  let prevSimilar = 0
  while (l < 5) {
    const text = tArray.slice(index, index + l + 1).join(' ').replace(/\([^\)]*\)?/g, '').replace(new RegExp(`[^${phase}]`, 'g'), '')
    const similar = similarity(text, label)

    if (similar >= similarRate) {
      result.push({ id, length: l, rate: similar })
      l++

      if (text.length < label.length) {
        prevSimilar = similar
        continue
      }
      else
        break
    }
    else if (similar > prevSimilar && text.length < label.length) {
      prevSimilar = similar
      l++
    }
    else
      break
  }

  return result
}

const checkProperties = (tArray: string[]) => {
  currentCheck.value = 'properties'

  const findClass = is.findClass(item.itemTypeValue1)

  if (findClass) {
    try {
      const matchAttribute: Array<ISimilar> = []

      let cut = 0
      for (let pi = 0; pi < findClass.properties.length; pi++) {
        const pid = findClass.properties[pi]
        const propertyLabel = is.findProperty(pid)?.label.replace(/{x}/g, '').replace(/[ \+\-%\[\]\:,0-9]/g, '').replace(/\([a-zA-Z가-힣 ]*\)/g, '') as string

        for (let i = 0; i < tArray.length; i++) {
          const result = checkAttributes(tArray, i + cut, pid, propertyLabel)

          if (result.length > 0) {
            const findAttribute = matchAttribute.find((ma: ISimilar) => ma.index === i + cut)

            if (findAttribute)
              findAttribute.match.push(...result)
            else
              matchAttribute.push({ index: i + cut, match: result })

            cut++

            break
          }
        }
      }

      let maxIL: [number, number] = [0, 1]
      matchAttribute.forEach((ma: ISimilar) => {
        ma.match.sort((a, b) => b.rate - a.rate)

        const attrStr = tArray.slice(ma.index, ma.index + (ma.match[0]?.length ?? 0) + 2).join('-')
        const matchValues = attrStr.match(/[0-9.]{1,}/g)?.filter(mv => !isNaN(parseFloat(mv))).map(mv => parseFloat(mv))
        const plainMatch = is.findProperty(ma.match[0]?.id)?.label.match(/[0-9]{1,}[.]?[0-9]*|\{x\}/g)
        const values: Array<number> = []

        plainMatch?.forEach((pm: number | string, index: number) => {
          if (pm === '{x}' && matchValues?.[index])
            values.push(matchValues?.[index])
        })

        if (item.properties.filter(p => p.propertyId === ma.match[0]?.id).length === 0) {
          maxIL = maxIL[0] < ma.index ? [ma.index, ma.match[0].length + 1] : maxIL
          item.properties.push({ valueId: uid(), propertyId: ma.match[0]?.id, propertyValues: values, action: 2 })
        }
      })

      tArray.splice(0, maxIL[0] + maxIL[1])

      // sort by property id
      item.properties.sort((a: Property, b: Property) => a.propertyId - b.propertyId)
    }
    catch (e) {
      console.log(e)
      return failedScan(t('analyze.failedAnalyze'))
    }
  }

  setTimeout(() => {
    checkedItem.push('properties')
    checkAffixes(tArray)
  }, timeout)
}

const checkAffixes = (tArray: string[]) => {
  currentCheck.value = 'affixes'

  try {
    const matchAttribute: Array<ISimilar> = []

    for (const affix of is.availableAffixes()) {
      const affixLabel = affix.label.replace(/{x}/g, '').replace(/[ \+\-%\:,0-9]/g, '').replace(/\([a-zA-Z가-힣 ]*\)/g, '') as string

      for (let i = 0; i < tArray.length; i++) {
        const result = checkAttributes(tArray, i, affix.value as number, affixLabel)

        if (result.length > 0) {
          const findAttribute = matchAttribute.find((ma: ISimilar) => ma.index === i)

          if (findAttribute)
            findAttribute.match.push(...result)
          else
            matchAttribute.push({ index: i, match: result })
        }
      }
    }

    matchAttribute.forEach((ma: ISimilar) => {
      ma.match.sort((a, b) => b.rate - a.rate)

      const attrStr = tArray.slice(ma.index, ma.index + (ma.match[0]?.length ?? 0) + 2).join('-')
      const matchMinMax = attrStr.match(/[\[]{1}[0-9.]{1,}[^\-\[]*[\-]*[0-9.]{1,}[\]]?/g)?.map(mmm => mmm.replace(/[^0-9.-]/g, '').split(/[\-]{1,2}/).map(mm => !isNaN(parseFloat(mm)) ? parseFloat(mm) : 0))
      const matchValues = attrStr.replace(/[\[]{1}[0-9.]{1,}[^\-\[]*[\-]*[0-9.]{1,}[\]]?/g, '').match(/[0-9.]{1,}/g)?.filter(mv => !isNaN(parseFloat(mv))).map(mv => parseFloat(mv))
      const plainMatch = is.findAffix(ma.match[0]?.id)?.label.match(/[0-9]{1,}[.]?[0-9]*|\{x\}/g)
      const values: Array<number> = []

      plainMatch?.forEach((pm: number | string, index: number) => {
        if (pm === '{x}' && matchValues?.[index])
          values.push(matchValues?.[index])
      })

      const a: Affix = { valueId: uid(), affixId: ma.match[0]?.id as number, affixValues: [], action: 2 }

      values.forEach((mv: number, idx: number) => {
        a.affixValues.push({ valueRangeId: uid(), value: mv, min: matchMinMax?.[idx]?.[0] as number, max: matchMinMax?.[idx]?.[1] || matchMinMax?.[idx]?.[0] as number })
      })

      item.affixes.push(a)
    })

    // sort by affix id
    item.affixes.sort((a: Affix, b: Affix) => a.affixId - b.affixId)
  }
  catch (e) {
    console.log(e)
    return failedScan(t('analyze.failedAnalyze'))
  }

  setTimeout(() => {
    checkedItem.push('affixes')
    checkRestrictions()
  }, timeout)
}

const checkRestrictions = () => {
  currentCheck.value = 'restrictions'

  try {
    const matchAttribute: Array<ISimilar> = []

    for (const restriction of is.restrictions.data) {
      const restrictLabel = restriction.label.replace(/{x}/g, '').replace(/[ \+\-%\[\]\:,0-9]/g, '').replace(/\([a-zA-Z가-힣 ]*\)/g, '') as string

      for (let i = 0; i < restrictionsPhase.length; i++) {
        const result = checkAttributes(restrictionsPhase, i, restriction.value as number, restrictLabel)

        if (result.length > 0) {
          const findAttribute = matchAttribute.find((ma: ISimilar) => ma.index === i)

          if (findAttribute)
            findAttribute.match.push(...result)
          else
            matchAttribute.push({ index: i, match: result })
        }
      }
    }

    matchAttribute.forEach((ma: ISimilar) => {
      ma.match.sort((a, b) => b.rate - a.rate)

      const matchValues = restrictionsPhase.slice(ma.index + ma.match[0]?.length, restrictionsPhase.length).join('-').match(/[0-9.]{1,}/g)?.map(mv => parseFloat(mv)) || []
      item.restrictions.push({ valueId: uid(), restrictId: ma.match[0]?.id, restrictValues: matchValues, action: 2 })
      restrictionsPhase.splice(ma.index, ma.match[0]?.length + 1)
    })
  }
  catch (e) {
    console.log(e)
    return failedScan(t('analyze.failedAnalyze'))
  }

  setTimeout(() => {
    checkedItem.push('restrictions')
    aggregate()
  }, timeout)
}

const aggregate = () => {
  currentCheck.value = 'aggregate'
  setTimeout(() => {
    checkedItem.push('aggregate')
    endScan()
  }, timeout)
}

const scan = (f: File) => {
  dropBox.show = false
  emit('start')

  filtering(f)
}

const filtering = (f: File) => {
  checkedItem.splice(0, checkedItem.length)
  currentCheck.value = 'analyze'
  showProgress.value = true

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const fr = new FileReader()
  fr.readAsDataURL(f)

  fr.onload = () => {
    const image = new Image()
    image.src = fr.result as string
    image.onload = () => {
      const isTransparent = f.name.toLowerCase().match(/\.(png|webp)/g)
      const ratio = Math.round(430 / image.width * 10000) / 10000
      const iWidth = image.width
      const iHeight = image.height
      const predictItem = Math.ceil(iWidth * 0.28)
      canvas.width = iWidth * ratio
      canvas.height = iHeight * ratio

      if (ctx) {
        if (isTransparent) {
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        //ctx.filter = isTransparent ? 'contrast(1.4) blur(.4px)' : 'invert(1) contrast(1.4) blur(.4px)'
        ctx.filter = 'invert(1) contrast(1.4) blur(.4px)'
        ctx.drawImage(image, 0, 0, iWidth - predictItem, predictItem, 0, 0, (iWidth - predictItem) * ratio, predictItem * ratio)
        ctx.drawImage(image, 0, predictItem, iWidth, iHeight - predictItem, 0, predictItem * ratio, iWidth * ratio, (iHeight - predictItem) * ratio)

        is.recognize(canvas, lang)
          .then((text) => {
            plainText = text
            checkedItem.push('analyze')
            checkText()
          })
          .catch(() => {
            failedScan(t('analyze.failedAnalyze'))
          })
      }
      else
        failedScan(t('analyze.failedAnalyze'))
    }
  }
}

const click = () => {
  if ($q.platform.is.mobile)
    fileRef.value?.pickFiles()
  else
    dropBox.show = true
}

interface DropBox {
  show: boolean,
  enter: number
}

const dropArea = ref<HTMLDivElement>()
const dropBox = reactive<DropBox>({
  show: false,
  enter: 0
})

const fileCheckAndScanStart = (f?: File) => {
  if (f && f.type.indexOf('image') !== -1)
    scan(f)
  else {
    $q.notify({
      icon: 'img:/images/icons/alert.svg',
      color: 'negative',
      classes: '',
      message: t('analyze.notImageFormat')
    })
  }
}

const drop = (event: DragEvent) => {
  event.preventDefault()
  fileCheckAndScanStart(event.dataTransfer?.files[0])
}

const paste = (event: ClipboardEvent) => {
  event.preventDefault()
  fileCheckAndScanStart(event.clipboardData?.files[0])
}

const showDropBox = () => {
  dropArea.value?.addEventListener('drop', drop)
  document.body.addEventListener('paste', paste)
}

const beforeHideDropBox = () => {
  dropArea.value?.removeEventListener('drop', drop)
  document.body.removeEventListener('paste', paste)
}
</script>
<template>
  <div>
    <D4Btn :label="t('btn.imageAnalysis')" :loading="loading" :disable="disable" color="var(--q-light-magic)"
      @click="click" v-bind="$attrs" />
    <q-file v-show="false" ref="fileRef" outlined v-model="file" accept="image/*" @update:model-value="scan" />
    <D4Dialog v-model="showProgress" persistent width="400px" max-width="80vw" @before-hide="beforeHide">
      <template #top>
        <q-card-section>
          <div class="text-h6 q-px-sm text-center">
            {{ t('analyze.title') }}
          </div>
        </q-card-section>
      </template>
      <template #middle>
        <div class="q-pa-lg">
          <q-option-group v-model="checkedItem" disable :options="checkList" color="primary" class="check-item"
            size="xs" type="checkbox">
            <template #label="opt">
              <div class="row items-center q-gutter-x-sm" :class="{ 'checked': checkedItem.includes(opt.value) }">
                <div class="text-body2" :class="{ 'text-weight-bold': currentCheck === opt.value }">{{ opt.label }}
                </div>
                <q-spinner-dots v-show="opt.value === currentCheck" size="18px" />
              </div>
            </template>
          </q-option-group>
        </div>
      </template>
    </D4Dialog>
    <D4Dialog v-model="dropBox.show" width="600px" max-width="80vw" @show="showDropBox"
      @before-hide="beforeHideDropBox">
      <template #middle>
        <div ref="dropArea" class="drop-area q-ma-xl q-pa-xl column items-center q-gutter-y-sm text-h6"
          :class="{ 'enter': dropBox.enter > 0 }" @dragenter.prevent="dropBox.enter++"
          @dragleave.prevent="dropBox.enter--" @dragover.prevent @click="fileRef?.pickFiles">
          <img src="/images/icons/image.svg" class="icon" width="48" height="48" alt="Tradurs Image Icon" />
          <div>{{ t('analyze.dragAndDrop') }}</div>
          <div class="row q-gutter-x-sm items-baseline">
            <div>{{ t('analyze.or') }}</div>
            <div class="text-primary">{{ t('analyze.browse') }}</div>
          </div>
          <div class="text-caption q-px-xl break-keep text-center">
            {{ t('analyze.dragMessage') }}
          </div>
        </div>
      </template>
    </D4Dialog>
  </div>
</template>
<style scoped>
.check-item:deep(.checked) {
  opacity: .6;
}

.check-item:deep(.q-checkbox__bg) {
  border: none !important;
  background: none !important;
}

.drop-area {
  border: dashed 2px currentColor;
  border-radius: 10px;
  cursor: pointer;
}

.drop-area.enter {
  background-color: var(--q-dark-page);
}

.body--light .drop-area.enter {
  background-color: var(--q-cloud);
}
</style>