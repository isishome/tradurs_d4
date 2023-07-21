<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { QFile, uid } from 'quasar'
import { useI18n } from 'vue-i18n'
import { type ILabel, type Affix as IAffix, useItemStore } from 'src/stores/item-store'
import { Affix, Item } from 'src/types/item'

interface IProps {
  loading?: boolean,
  disable?: boolean
}

withDefaults(defineProps<IProps>(), {
  loading: false,
  disable: false
})

const emit = defineEmits(['start', 'end', 'failed'])

const is = useItemStore()
const { t } = useI18n({ useScope: 'global' })

const timeout = 1000
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
let restrictionsPhase: string

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

  // check quality
  const qualityText = is.quality.map(q => q.fullName.replace(/[ ]/g, '')).join('|')
  const indexQuality = textArray.findIndex(ta => (new RegExp(qualityText, 'gi')).test(ta.replace(/[ ]/g, '')))

  if (indexQuality === -1)
    return failedScan(t('analyze.qualityNotFound'))

  const qualityPhase = textArray[indexQuality].split(/\s/gi)

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

  const typeValue = qualityPhase.splice(typeValueIndex, qualityPhase.length).join(' ').replace(new RegExp(`[^${is.analyze.lang} ]`, 'gi'), '').trim()

  if (!typeValue || typeValue === '')
    return failedScan(t('analyze.typeNotFound'))

  // check class
  const findClass = [...is.classes].sort((a, b) => b.label.length - a.label.length).find(c => typeValue.toLowerCase().indexOf(c.label.toLowerCase()) !== -1)

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
  const name = textArray.splice(0, indexQuality).join(' ').replace(new RegExp(`[^${is.analyze.lang} ]`, 'gi'), '').trim()
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
  const upgradesText = `업그레이드|upgrades`
  const indexUpgrades = textArray.findIndex(ta => (new RegExp(upgradesText, 'gi')).test(ta))

  if (indexUpgrades !== -1) {
    const numPhase = textArray[indexUpgrades].replace(/[^0-9\/]/gi, '').replace(/^([0-9]*)(\/?[0-9]*)$/gi, '$1')
    if (!isNaN(parseFloat(numPhase)))
      item.upgrade = parseFloat(numPhase)

    textArray.splice(0, indexUpgrades + 1)
  }

  // check item Requires Level
  const requiresText = `요구.*레벨|requires.*level`
  const indexRequires = textArray.findIndex(ta => (new RegExp(requiresText, 'gi')).test(ta))

  if (indexRequires === -1)
    return failedScan(t('analyze.requireNotFound'))

  const levelPhase = textArray[indexRequires].replace(/[^0-9]/gi, '')
  if (!isNaN(parseFloat(levelPhase)))
    item.level = parseFloat(levelPhase)

  restrictionsPhase = textArray.splice(indexRequires, textArray.length).join('').replace(/[\+ ]/g, '').replace(/([0-9.]{1,})(\,)([0-9.]{1,})/g, '$1$3').replace(/(\[)([0-9.]{1,})(\s\-\s)([0-9.]{1,})(\])/g, '$1$2-$4$5')

  let textStr = textArray.join('').replace(/[\+ ]/g, '').replace(/([0-9.]{1,})(\,)([0-9.]{1,})/g, '$1$3').replace(/(\[)([0-9.]{1,})(\s\-\s)([0-9.]{1,})(\])/g, '$1$2-$4$5')
  //let textStr = textArray.join('').replace(/[\+ ]/g, '').replace(/([0-9.]{1,})(\,)([0-9.]{1,})/g, '$1$3').replace(/(\[)([0-9.]{1,})([^\-\[]*\-[^\-\[]*)([0-9.]{1,})([1\]]{1})/g, '$1$2-$4$5')

  setTimeout(() => {
    checkedItem.push('info')
    checkProperties(textStr)
  }, timeout)
}

const removeUnnecessary = (attr: string | undefined) => {
  return attr?.replace(/[\(]{1}[^\(]{1,}[\)]{1}/g, '').replace(new RegExp(`[^${is.analyze.lang}0-9\\,\\.\\-#\\[\\]]`, 'g'), '')
}

const attrToRegex = (attr: string | undefined) => {
  return removeUnnecessary(attr?.replace(/\{x\}/g, '#'))?.replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/\-/g, '\\-').replace(/#/g, '[0-9.]{1,}')
}

const checkProperties = (textStr: string) => {
  currentCheck.value = 'properties'

  const findClass = is.findClass(item.itemTypeValue1)

  if (findClass) {
    try {
      findClass.properties.forEach((cp: number) => {
        const matchProperty = removeUnnecessary(textStr)?.match(new RegExp(attrToRegex(is.findProperty(cp)?.label) as string, 'i'))
        const matchValues = matchProperty?.[0].match(/[0-9.]{1,}/g)?.map(mv => parseFloat(mv))

        if (matchProperty && matchValues && item.properties.filter(p => p.propertyId === cp).length === 0) {
          item.properties.push({ valueId: uid(), propertyId: cp, propertyValues: matchValues, action: 2 })
          textStr = textStr.replace(matchProperty[0], '')
        }
      })
    }
    catch (e) {
      console.log(e)
      return failedScan(t('analyze.failedAnalyze'))
    }
  }

  setTimeout(() => {
    checkedItem.push('properties')
    checkAffixes(textStr)
  }, timeout)
}

const checkAffixes = (textStr: string) => {
  currentCheck.value = 'affixes'

  try {
    const affixData: Array<IAffix> = JSON.parse(JSON.stringify(is.affixes.data)).sort((a: IAffix, b: IAffix) => { return b.label.length - a.label.length })

    for (const affix of affixData) {
      const matchAffix = textStr.match(new RegExp(attrToRegex(affix.label) as string, 'i'))

      matchAffix?.forEach((ma: string) => {
        const matchMinMax = textStr.substring(textStr.indexOf(ma), textStr.length).match(/[1\[]{1}[0-9.]{1,}[^\-\[]*\-[^\-\[]*[0-9.]{1,}[1\]]{1}/)?.map(mmm => mmm.replace(/1$/, '').replace(/[^0-9.-]/g, '').split(/\-/).map(mm => !isNaN(parseFloat(mm)) ? parseFloat(mm) : 0))
        const matchValues = ma.match(/[0-9.]{1,}/g)?.map(mv => parseFloat(mv))
        if (matchValues) {
          const a: Affix = { valueId: uid(), affixId: affix.value as number, affixValues: [], action: 2 }
          matchValues.forEach((mv: number) => {
            a.affixValues.push({ valueRangeId: uid(), value: mv, min: matchMinMax?.[0]?.[0] as number, max: matchMinMax?.[0]?.[1] as number })
          })
          item.affixes.push(a)
          textStr = textStr.replace(ma, '')
        }
      })
    }
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
    for (const restriction of is.restrictions.data) {
      const matchRestriction = restrictionsPhase.match(new RegExp(attrToRegex(restriction.label) as string, 'i'))

      matchRestriction?.forEach((mr: string) => {
        const matchValues = mr.match(/[0-9.]{1,}/g)?.map(mv => parseFloat(mv))
        if (matchValues) {
          item.restrictions.push({ valueId: uid(), restrictId: restriction.value as number, restrictValues: matchValues, action: 2 })
          restrictionsPhase = restrictionsPhase.replace(mr, '')
        }
      })
    }
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

const scan = (files: File) => {
  emit('start')
  currentCheck.value = 'analyze'
  showProgress.value = true
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const fr = new FileReader()
  fr.readAsDataURL(files)

  fr.onload = () => {
    const image = new Image()
    image.src = fr.result as string
    image.onload = () => {
      const ratio = Math.round(500 / image.width * 10) / 10
      canvas.width = 500
      canvas.height = image.height * ratio
      if (ctx) {
        ctx.scale(ratio, ratio)
        ctx.filter = 'sepia(.5) saturate(4) contrast(2) grayscale(.5) blur(.4px)'
        ctx.drawImage(image, 4, 4)
        is.recognize(canvas)
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
</script>
<template>
  <div>
    <D4Btn :label="t('btn.imageAnalysis')" :loading="loading" :disable="disable" color="var(--q-light-magic)"
      @click="fileRef?.pickFiles" v-bind="$attrs" />
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
          <q-option-group v-model="checkedItem" disable :options="checkList" color="primary" class="check-item" size="xs"
            type="checkbox">
            <template #label="opt">
              <div class="row items-center q-gutter-x-sm" :class="{ 'checked': checkedItem.includes(opt.value) }">
                <div class="text-body2" :class="{ 'text-weight-bold': currentCheck === opt.value }">{{ opt.label }}</div>
                <q-spinner-dots v-show="opt.value === currentCheck" size="18px" />
              </div>
            </template>
          </q-option-group>
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
</style>