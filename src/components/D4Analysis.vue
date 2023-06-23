<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { QFile } from 'quasar'
import { useI18n } from 'vue-i18n'
import { type ILabel, useItemStore } from 'src/stores/item-store'
import { Item, type Property, type Affix, type Restriction } from 'src/types/item'

import D4Dialog from 'components/D4Dialog.vue'

interface IProps {
  loading?: boolean,
  disable?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
  disable: false
})

const emit = defineEmits(['start', 'end', 'failed'])

const is = useItemStore()
const { t } = useI18n({ useScope: 'global' })

const showProgress = ref<boolean>(false)
const checkedItem = reactive<string[]>([])
const checkList: ILabel[] = [
  { value: 'analyze', label: '이미지 분석 중' },
  { value: 'text', label: '텍스트 정렬 중' },
  { value: 'info', label: '아이템 기본 정보 체크' },
  { value: 'properties', label: '아이템 고유 특성 체크' },
  { value: 'affixes', label: '아이템 옵션 체크' },
  { value: 'restrictions', label: '아이템 제약 조건 체크' },
  { value: 'aggregate', label: '아이템 정보 취합 중' }
]
const currentCheck = ref<string | number | null>(checkList[0].value)

const lang = `가-힣ぁ-ゔァ-ヴー々〆〤一-龥a-zA-Z`

let plainText: string
const item = new Item()
const properties: Array<Property> = []
const affixes: Array<Affix> = []
const restrictions: Array<Restriction> = []
let restrictionsArea: string[]

const img = ref<HTMLDivElement>()
const fileRef = ref<QFile>()
const file = ref()

const endScan = () => {
  setTimeout(() => {
    file.value = undefined
    Object.assign(checkedItem, [])
    currentCheck.value = null
    showProgress.value = false

    emit('end', item)
  }, 1000)
}

const failedScan = (msg: string) => {
  file.value = undefined
  Object.assign(checkedItem, [])
  currentCheck.value = null
  showProgress.value = false

  emit('failed', msg)
}

const checkText = () => {
  currentCheck.value = 'text'

  const priceText = `판매가|sell value`
  const notTradable = `계정 귀속|고유 장착|거래 불가|account bound|unique equipped|not tradable`
  const textArray = plainText.split(/\n/g).map(a => a.trim())

  console.log(textArray)

  // check priceText
  const indexPriceText = textArray.findIndex(ta => (new RegExp(priceText, 'gi')).test(ta))

  if (indexPriceText !== -1)
    textArray.splice(indexPriceText)

  // check not tradable
  const findNotTradable = textArray.filter(ta => (new RegExp(notTradable, 'gi')).test(ta))

  if (findNotTradable.length > 0)
    return failedScan('거래 불가능한 아이템입니다')

  setTimeout(() => {
    checkedItem.push('text')
    checkInfo(textArray)
  }, 1000)
}

const checkInfo = (textArray: string[]) => {
  currentCheck.value = 'info'

  // check quality
  const qualityText = is.quality.map(q => q.fullName).join('|')
  const indexQuality = textArray.findIndex(ta => (new RegExp(qualityText, 'gi')).test(ta))

  if (indexQuality === -1)
    return failedScan('아이템 품질 정보를 찾지 못했습니다')

  const qualityPhase = textArray[indexQuality].split(/\s/gi)
  let typeValueIndex = -1
  for (let i = 0; i < qualityPhase.length; i++) {
    const findQualityIndex = is.quality.findIndex(q => qualityPhase[i].indexOf(q.fullName.toLowerCase()) !== -1)
    if (findQualityIndex !== -1) {
      typeValueIndex = i + 1
      item.quality = is.quality[findQualityIndex].value as string
      break
    }
  }

  // check typevalue
  if (typeValueIndex === -1)
    return failedScan('아이템 유형 정보를 찾지 못했습니다')

  const typeValue = qualityPhase.splice(typeValueIndex, qualityPhase.length).join(' ').replace(new RegExp(`[^${lang} ]`, 'gi'), '').trim()

  if (!typeValue || typeValue === '')
    return failedScan('아이템 유형 정보를 찾지 못했습니다')

  // check class
  const findClass = is.classes.find(c => typeValue.toLowerCase().indexOf(c.label.toLowerCase()) !== -1)

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
    return failedScan('아이템 정보를 찾지 못했습니다')

  // check item name
  const name = textArray.splice(0, indexQuality).join(' ').replace(new RegExp(`[^${lang} ]`, 'gi'), '').trim()

  if (name === '')
    return failedScan('아이템 명 정보를 찾지 못했습니다')

  item.name = name
  textArray.splice(0, indexQuality)

  // check item power
  const powerText = `아이템 위력|item power`
  const indexPower = textArray.findIndex(ta => (new RegExp(powerText, 'gi')).test(ta))

  if (indexPower !== -1) {
    const numPhase = textArray[indexPower].replace(/[^0-9\+]/gi, '').replace(/^([0-9]*)(\+?[0-9]*)$/gi, '$1')
    if (!isNaN(parseFloat(numPhase)))
      item.power = parseFloat(numPhase)

    textArray.splice(0, indexPower)
  }

  // check item upgrades
  const upgradesText = `업그레이드|upgrades`
  const indexUpgrades = textArray.findIndex(ta => (new RegExp(upgradesText, 'gi')).test(ta))

  if (indexUpgrades !== -1) {
    const numPhase = textArray[indexUpgrades].replace(/[^0-9\/]/gi, '').replace(/^([0-9]*)(\/?[0-9]*)$/gi, '$1')
    if (!isNaN(parseFloat(numPhase)))
      item.upgrade = parseFloat(numPhase)

    textArray.splice(0, indexUpgrades)
  }

  // check item Requires Level
  const requiresText = `요구 레벨|requires level`
  const indexRequires = textArray.findIndex(ta => (new RegExp(requiresText, 'gi')).test(ta))

  if (indexRequires === -1)
    return failedScan('아이템 요구 레벨 정보를 찾지 못했습니다')

  const levelPhase = textArray[indexRequires].replace(/[^0-9]/gi, '')
  if (!isNaN(parseFloat(levelPhase)))
    item.level = parseFloat(levelPhase)

  restrictionsArea = textArray.splice(indexRequires, textArray.length)

  setTimeout(() => {
    checkedItem.push('info')
    checkProperties(textArray)
  }, 1000)
}

const checkProperties = (textArray: string[]) => {
  currentCheck.value = 'properties'



  setTimeout(() => {
    checkedItem.push('properties')
    checkAffixes()
  }, 2000)
}

const checkAffixes = () => {
  currentCheck.value = 'affixes'
  setTimeout(() => {
    checkedItem.push('affixes')
    checkRestrictions()
  }, 2000)
}

const checkRestrictions = () => {
  currentCheck.value = 'restrictions'
  setTimeout(() => {
    checkedItem.push('restrictions')
    aggregate()
  }, 2000)
}

const aggregate = () => {
  currentCheck.value = 'aggregate'
  setTimeout(() => {
    checkedItem.push('aggregate')
    endScan()
  }, 2000)
}

const tempScan = (files: File) => {
  currentCheck.value = 'analyze'
  showProgress.value = true
  // plainText = ` 음흉한 달개                    
  // 선조 희귀 활                    /
  // . 아이템 위력 751             /      
  //  1,895 초당 공격력
  // 적중당 공격력 [,378 - 2,068]
  // .   초당 공격 횟수 110 빠른 무기
  //  원거리에 있는 적에게 주는 피해
  // +40.0% [40.0]%
  //      취약 피해 +47.0% [33.0 - 47.0%
  //  근거리에 있는 적에게 주는 피해
  //        +45.0% [33.0 - 47.0]%
  //   감속 적에게 주는 피해 +38.0%
  // [33.0 - 47.0]%
  //  멍해짐 적에게 주는 피해 +34.0%
  // [33.0 - 47.0]%
  // 빈홈

  //  빈 홈

  // 요구 레벨: 75
  // ,                                     도이
  // 판매가: 30,167 
  //                           내구도: 100/100
  // 크 획득                               
  // 00+ 뜨 링크`

  plainText = `
 톱니의 고리 속
선조 전설 반지 

아이템 위력 726+25 
 업그레이드: 5/5
 번개 저항 33.9% [33.9]% [
 암흑 저항 33.9% [33.9]%
 뼈 기술의 극대화 피해 +26.2% 
: [21.0 - 31.5]%
 물리 피해 +11.3% [10.5 - 21.0]% 
 극대화 확률 +4.5% [2.7 - 7.51%
 취약 피해 +27.8% [24.8 - 35.3]% 
 각인: 골화 정수 핵심 지속 효과가 50
을 초과하는 정수 1당 뼈 기술의 극대
화 피해를 1%[+]만큼, 최대 40%[+] 
[30 - 40]%까지 증가시킴니다. 강령
술사 전용 [
떫방어도 +250
요구 레벨: 76 
판매가: 49,021 
 빼 장착 해제 ]
000+ 2`

  //   plainText = `달인희 중심선          
  // 선조 희귀 반지                   내
  // 아이템 위력 764+25
  //   업그레이드: 55
  //   화염 저항 35.0% [35.0]%         
  //  암흑 저항 35.0% [35.0]%
  //  취약 피해 +33.7% [24.8 - 35.3]%
  //  극대화 확륭 +7.5% [2.7 - 7.5]%
  //  극대화 피해 +29.2% [21.0 - 31.5]%
  //  기절 적에게 주는 피해 +30.0%
  // [24.8 - 35.2]%
  //  홈

  // 요구 레벨: 97
  // 판매가: 24,666`
  checkText()
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
      canvas.width = image.width
      canvas.height = image.height
      if (ctx) {
        ctx.filter = 'contrast(160%)'
        ctx.drawImage(image, 0, 0)
        //img.value?.appendChild(canvas)
        is.recognize(canvas)
          .then((text) => {
            plainText = text
            checkedItem.push('analyze')
            checkText()
          })
          .catch(() => {
            failedScan('이미지 분석이 실패했습니다')
          })
      }
      else
        failedScan('이미지 분석이 실패했습니다')
    }
  }
}
</script>
<template>
  <div>
    <D4Btn :label="t('btn.imageAnalysis')" :loading="loading" :disable="disable" color="var(--q-light-magic)"
      @click="fileRef?.pickFiles" v-bind="$attrs" />
    <q-file v-show="false" ref="fileRef" outlined v-model="file" accept="image/*" @update:model-value="scan" />
    <D4Dialog v-model="showProgress" persistent>
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
  <!-- <div ref="img"></div> -->
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