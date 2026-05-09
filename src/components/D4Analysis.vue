<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'
import { QFile, uid, useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { type ILabel, useItemStore } from 'src/stores/item-store'
import { Item, Property } from 'src/types/item'
import CompareWorker from 'src/common/worker?worker'
import { similarity } from 'src/common'
import { CompareParams, type Result } from 'src/common/worker'
import type Cropper from 'cropperjs'

interface DropBox {
  show: boolean
  enter: number
}

interface IProps {
  loading?: boolean
  disable?: boolean
  attrOnly?: boolean
}

interface CropBox {
  show: boolean
  origin?: string
  loading: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
  disable: false,
  attrOnly: false
})

const emit = defineEmits(['start', 'end', 'failed'])

const $q = useQuasar()
const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const is = useItemStore()

const worker = new CompareWorker()
const compare = (params: CompareParams): Promise<Array<Result>> => {
  return new Promise((resolve) => {
    worker.onmessage = (event) => resolve(event.data)
    worker.postMessage(JSON.stringify(params))
  })
}
const terminate = () => {
  worker.terminate()
}

let plainText: string
let restrictionsPhase: string[]
let cropper: Cropper
const cutoffSim = 0.6
const cutoffDis = 3
const lang: string = (route.params.lang as string) || 'ko'
const similarRate =
  is.analyze.similarRate[lang as keyof typeof is.analyze.similarRate]
const phase = is.analyze.lang[lang as keyof typeof is.analyze.lang]
const greaterSuffix =
  is.analyze.greaterSuffix[lang as keyof typeof is.analyze.lang]
const replaces = is.analyze.replaces[lang as keyof typeof is.analyze.replaces]
const timeout = 200
const showProgress = ref<boolean>(false)
const checkedItem = ref<string[]>([])
const checkList: ILabel[] = [
  { value: 'analyze', label: t('analyze.analyzingImage') },
  { value: 'text', label: t('analyze.aligningText') },
  { value: 'info', label: t('analyze.checkBasicInfo') },
  { value: 'properties', label: t('analyze.checkCharacteristics') },
  { value: 'affixes', label: t('analyze.checkAffixes') },
  { value: 'restrictions', label: t('analyze.checkRestrictions') },
  { value: 'aggregate', label: t('analyze.aggregateItemInfo') }
]
const item = new Item('')
const currentCheck = ref<string | number | null>(checkList[0].value)
const fileRef = ref<QFile>()
const file = ref()
const dropArea = ref<HTMLDivElement>()
const dropBox = reactive<DropBox>({
  show: false,
  enter: 0
})
const cropImage = ref<HTMLImageElement>()
const cropBox = reactive<CropBox>({
  show: false,
  origin: undefined,
  loading: true
})

const beforeHide = () => {
  file.value = undefined
  checkedItem.value.splice(0, checkedItem.value.length)
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
  const textArray = plainText.split(/\n/g).map((a) => a.trim())

  // check priceText
  const indexPriceText = textArray.findIndex((ta) =>
    new RegExp(priceText, 'gi').test(ta)
  )

  if (indexPriceText !== -1) textArray.splice(indexPriceText)

  // check not tradable
  const findNotTradable = textArray.filter((ta) =>
    new RegExp(notTradable, 'gi').test(ta)
  )

  if (!props.attrOnly && findNotTradable.length > 0)
    return failedScan(t('analyze.nonTradable'))

  setTimeout(() => {
    checkedItem.value.push('text')
    checkInfo(textArray)
  }, timeout)
}

const checkInfo = (textArray: string[]) => {
  currentCheck.value = 'info'

  // check tier
  const tierText = is.tiers.map((t) => t.fullName.replace(/[ ]/g, '')).join('|')
  const indexTier = textArray.findIndex((ta) =>
    new RegExp(tierText, 'gi').test(ta)
  )

  if (indexTier !== -1) {
    const tierPhase = textArray[indexTier].split(/\s/gi)

    for (let i = 0; i < tierPhase.length; i++) {
      const findTierIndex = is.tiers.findIndex(
        (t) =>
          tierPhase[i].toLowerCase().indexOf(t.fullName.toLowerCase()) !== -1
      )

      if (findTierIndex !== -1) {
        item.tier = is.tiers[findTierIndex].value
        tierPhase[i] = tierPhase[i].replace(
          is.quality[findTierIndex].fullName.toLowerCase(),
          ''
        )
        break
      }
    }
  }

  // check quality
  const qualityText = is.quality.map((q) => q.fullName.split(' ')[0]).join('|')
  const indexQuality = textArray.findIndex((ta) =>
    new RegExp(qualityText, 'gi').test(ta)
  )

  if (indexQuality === -1) return failedScan(t('analyze.qualityNotFound'))

  const qualityPhase = textArray
    .slice(indexQuality, indexQuality + 5)
    .join(' ')
    .split(/\s/gi)

  let typeValueIndex = -1
  for (let i = 0; i < qualityPhase.length; i++) {
    const findQualityIndex = is.quality.findIndex(
      (q) =>
        similarity(
          qualityPhase[i]
            .replace(new RegExp(`[^ ${phase} ]`, 'gi'), '')
            .toLowerCase(),
          q.fullName.split(' ')[0].toLowerCase()
        ) > similarRate
    )

    if (findQualityIndex !== -1) {
      typeValueIndex = i
      item.quality = is.quality[findQualityIndex].value as string
      qualityPhase[i] = qualityPhase[i].replace(
        is.quality[findQualityIndex].fullName.toLowerCase(),
        ''
      )

      break
    }
  }

  // check item name
  const name = textArray
    .splice(0, indexQuality)
    .join('')
    .replace(new RegExp(`[^ ${phase} ]`, 'gi'), '')
    .replace(new RegExp(`\\s+(?:[^\\s]*[${greaterSuffix}][^\\s]*\\s*)+$`), '')
    .trim()

  if (name === '') return failedScan(t('analyze.nameNotFound'))

  item.name = name

  // check fixed item
  const findFixedItemIndex = is.fixedItems.data.findIndex(
    (fi) =>
      similarity(item.name, fi.label) > similarRate &&
      item.quality === fi.quality
  )

  if (findFixedItemIndex !== -1) {
    const findItem = is.fixedItems.data[findFixedItemIndex]
    item.fixedItemId = findItem.value as number

    const findEquipClass = is.equipClasses.find(
      (ec) => ec.value === findItem.equipmentClass
    )

    item.itemType = findEquipClass?.type as string
    item.itemTypeValue1 = findEquipClass?.value as string
  } else {
    // check typevalue
    if (typeValueIndex === -1) return failedScan(t('analyze.typeNotFound'))

    // replace for each language
    let typeValue = qualityPhase
      .splice(typeValueIndex, qualityPhase.length)
      .join(' ')
      .replace(new RegExp(`[^${phase}]`, 'gi'), '')
      .trim()

    replaces.forEach((r) => {
      typeValue = typeValue.replace(new RegExp(`${r[0]}`, 'gi'), r[1])
    })

    if (!typeValue || typeValue === '')
      return failedScan(t('analyze.typeNotFound'))

    // check class
    const findEquipClass = [...is.equipClasses]
      .sort((a, b) => b.label.length - a.label.length)
      .find(
        (c) =>
          typeValue
            .toLowerCase()
            .indexOf(
              c.label.replace(new RegExp(`[^${phase}]`, 'gi'), '').toLowerCase()
            ) !== -1
      )

    if (findEquipClass) {
      item.itemType = findEquipClass.type
      item.itemTypeValue1 = findEquipClass.value as string

      if (findEquipClass.value === 'gem') {
        const findGemQuality = is.gems.find(
          (g) =>
            typeValue.toLowerCase().indexOf(g.qualityName.toLowerCase()) !== -1
        )

        if (findGemQuality) item.itemTypeValue2 = findGemQuality.quality
      }
    }

    // check aspect
    if (item.itemTypeValue1 === '') {
      const aspectLabel = is.findType('aspect')?.label
      const matchAspect = typeValue
        .toLowerCase()
        .match(new RegExp(`^${aspectLabel}`, 'i'))

      if (!!matchAspect) {
        const name = textArray
          .splice(0, indexQuality)
          .join('')
          .replace(new RegExp(`[^ ${phase} ]`, 'gi'), '')
          .trim()

        if (!!name) {
          const filteredAspects = is.affixes.data
            .filter(
              (a) =>
                !!a.aspectName &&
                similarity(
                  a.aspectName.replace(/\s/g, ''),
                  name
                    .replace(
                      is.aspectCategories.find(
                        (ac) => ac.value === a.aspectCategory
                      )?.label ?? '',
                      ''
                    )
                    .replace(/\s/g, '')
                ) > similarRate
            )
            .map((a) => ({
              ...a,
              rate: similarity(a.aspectName as string, name)
            }))

          filteredAspects.sort((a, b) => b.rate - a.rate)

          if (filteredAspects.length > 0) {
            item.itemType = 'aspect'
            item.itemTypeValue1 = filteredAspects[0].aspectCategory as string
            item.itemTypeValue2 = `${filteredAspects[0].value}`
          }
        }
      }
    }

    if (item.itemTypeValue1 === '')
      return failedScan(t('analyze.typeValueNotFound'))

    // check item power
    const powerText = `아이템.*위력|item.*power`
    const indexPower = textArray.findIndex((ta) =>
      new RegExp(powerText, 'gi').test(ta)
    )

    if (indexPower !== -1) {
      const numPhase = textArray[indexPower]
        .replace(/[^0-9\+]/gi, '')
        .replace(/^([0-9]*)(\+?[0-9]*)$/gi, '$1')
      if (!isNaN(parseFloat(numPhase))) item.power = parseFloat(numPhase)

      textArray.splice(0, indexPower + 1)
    }
  }

  // check item Requires Level
  const requiresText = `요구.*레벨|requires.*level`
  const indexRequires = textArray.findIndex((ta) =>
    new RegExp(requiresText, 'gi').test(ta)
  )

  if (indexRequires !== -1) {
    const levelPhase = textArray[indexRequires].replace(/[^0-9]/gi, '')
    if (!isNaN(parseFloat(levelPhase))) item.level = parseFloat(levelPhase)
  }

  restrictionsPhase = textArray
    .splice(indexRequires, textArray.length)
    .map((ta: string) => ta.replace(/[\+ ]/g, ''))

  // remove lost when epuipped
  const lostText = `장착.*사라지는|lost.*when`
  const indexLost = textArray.findIndex((ta) =>
    new RegExp(lostText, 'gi').test(ta)
  )

  if (indexLost !== -1) textArray.splice(indexLost, textArray.length)

  let tArray = textArray
    .map((ta: string) =>
      ta
        .replace(/[\+ ]/g, '')
        .replace(/([0-9]*?)(\,)([0-9.]{1,})/g, '$1$3')
        .replace(/[\[]{2,}/g, '[')
        .replace(/[\]]{2,}/g, ']')
        .replace(/[%]{2,}/g, '%')
        .replace(/\]1/g, ']')
    )
    .filter((ta) => !!ta.trim())

  setTimeout(() => {
    checkedItem.value.push('info')
    checkProperties(tArray)
  }, timeout)
}

const checkProperties = async (tArray: string[]) => {
  currentCheck.value = 'properties'

  if (item.fixedItemId) {
    item.properties = is.properties.data
      .filter((p) =>
        (
          is.fixedItems.data.find((fi) => fi.value === item.fixedItemId)
            ?.properties ?? []
        ).includes(p.value as number)
      )
      .map((p) => ({
        propertyId: p.value as number,
        propertyValues: Array.from(
          { length: (p.label?.match(/\{x\}/gi) || []).length },
          () => 0
        ),
        action: 2
      }))
  } else {
    const findEquipClass = is.findEquipClass(item.itemTypeValue1)

    if (findEquipClass) {
      try {
        const data = await compare({
          standard: is.properties.data,
          target: tArray,
          cutoffSim,
          cutoffDis,
          layer: 3,
          phase
        })

        let start = -1
        let end = 0

        item.properties = data.reduce((acc: Array<Property>, c: any) => {
          if (
            acc.filter((a) => a.propertyId === c.id).length === 0 &&
            start + 4 > c.index
          ) {
            if (start === -1) start = c.index

            end = c.index + c.len

            acc.push({
              valueId: uid(),
              propertyId: c.id,
              propertyValues: c.values.returnValues,
              action: 2
            })
          }

          return acc
        }, [])

        tArray.splice(0, end)
      } catch (e) {
        terminate()
        console.log(e)
        return failedScan(t('analyze.failedAnalyze'))
      }
    }
  }

  setTimeout(() => {
    checkedItem.value.push('properties')
    checkAffixes(tArray)
  }, timeout)
}

const checkAffixes = async (tArray: string[]) => {
  currentCheck.value = 'affixes'

  if (item.fixedItemId) {
    item.affixes = is.affixes.data
      .filter((a) =>
        (
          is.fixedItems.data.find((fi) => fi.value === item.fixedItemId)
            ?.affixes ?? []
        ).includes(a.value as number)
      )
      .map((a) => ({
        ...a,
        values: Array.from(
          { length: (a.label?.match(/\{x\}/gi) || []).length },
          () => 0
        )
      }))
      .map((a) => ({
        valueId: uid(),
        affixId: a.value as number,
        affixValues: Array.from({ length: a.values.length }, () => {
          const tempRangeId = uid()
          return { valueRangeId: tempRangeId, value: 0, min: 0, max: 0 }
        }),
        action: 2
      }))
  } else {
    try {
      const data = await compare({
        standard: is.affixes.data,
        target: tArray,
        cutoffSim,
        cutoffDis,
        layer: 10,
        phase
      })

      item.affixes = data.map((r: Result) => ({
        valueId: uid(),
        affixId: r.id,
        affixValues: r.values.returnValues.map((rv, i) => ({
          valueRangeId: uid(),
          value: rv,
          min: r.values.returnRangeValues[i].min,
          max: r.values.returnRangeValues[i].max
        })),
        action: 2
      }))
    } catch (e) {
      terminate()
      console.log(e)
      return failedScan(t('analyze.failedAnalyze'))
    }
  }

  setTimeout(() => {
    checkedItem.value.push('affixes')
    checkRestrictions()
  }, timeout)
}

const checkRestrictions = async () => {
  currentCheck.value = 'restrictions'

  if (item.fixedItemId) {
    item.restrictions = is.restrictions.data
      .filter((r) =>
        (
          is.fixedItems.data.find((fi) => fi.value === item.fixedItemId)
            ?.restrictions ?? []
        ).includes(r.value as number)
      )
      .map((r) => ({
        restrictId: r.value as number,
        restrictValues: Array.from(
          { length: (r.label?.match(/\{x\}/gi) || []).length },
          () => 0
        ),
        action: 2
      }))
  } else {
    try {
      const plainTArray = restrictionsPhase.map((rp) =>
        rp
          .replace(/\([^\)]*\)?/g, '')
          .replace(new RegExp(`[^%${phase}]`, 'g'), '')
      )

      const data = await compare({
        standard: is.restrictions.data,
        target: plainTArray,
        cutoffSim,
        cutoffDis,
        layer: 3,
        phase
      })

      item.restrictions = data.map((r: Result) => ({
        valueId: uid(),
        restrictId: r.id,
        restrictValues: r.values.returnValues,
        action: 2
      }))
    } catch (e) {
      console.log(e)
      return failedScan(t('analyze.failedAnalyze'))
    } finally {
      terminate()
    }
  }

  setTimeout(() => {
    checkedItem.value.push('restrictions')
    aggregate()
  }, timeout)
}

const aggregate = () => {
  currentCheck.value = 'aggregate'
  setTimeout(() => {
    checkedItem.value.push('aggregate')
    endScan()
  }, timeout)
}

const scan = async (f: File) => {
  dropBox.show = false
  cropBox.origin = URL.createObjectURL(f)

  await nextTick()

  cropBox.show = true
}

const onShowCropBox = async () => {
  const Cropper = (await import('cropperjs')).default

  if (!Cropper || !cropImage.value) {
    cropBox.show = false
    dropBox.show = true

    return
  }

  if (cropper) cropper.destroy()

  cropper = new Cropper(cropImage.value, {
    container: cropImage.value.parentElement as HTMLElement
  })

  const selection = cropper.getCropperSelection()

  if (selection) {
    selection.initialAspectRatio =
      cropImage.value.width / cropImage.value.height
    selection.initialCoverage = 0.98
    selection.zoomable = false
  }

  cropBox.loading = false
}

const onBeforeHideCropBox = () => {
  if (cropBox.origin) URL.revokeObjectURL(cropBox.origin)
  cropBox.loading = true
  cropper.destroy()
  file.value = undefined
}

const onStartFilter = async () => {
  const selection = cropper.getCropperSelection()
  const cropperImage = cropper.getCropperImage()

  if (!selection || !cropperImage) return

  const image = await cropperImage.$ready()

  const imageRect = cropperImage.getBoundingClientRect()

  const scaleX = image.naturalWidth / imageRect.width
  const scaleY = image.naturalHeight / imageRect.height

  const realCanvas = await selection.$toCanvas({
    width: Math.round(selection.width * scaleX),
    height: Math.round(selection.height * scaleY)
  })

  realCanvas?.toBlob((blob) => {
    if (blob) {
      emit('start')
      filtering(blob)
    }

    cropBox.show = false
  })
}

const binarize = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    const threshold = 140
    const color = avg > threshold ? 255 : 0
    data[i] = data[i + 1] = data[i + 2] = color
  }
  ctx.putImageData(imgData, 0, 0)
}

const filtering = (f: Blob) => {
  checkedItem.value.splice(0, checkedItem.value.length)
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
      const isTransparent = f.type.toLowerCase().match(/image\/(png|webp)/g)
      const scale = Math.round((700 / image.width) * 1000) / 1000
      const iWidth = image.width
      const iHeight = image.height
      const predictWidth = Math.ceil(iWidth * 0.32)
      const predictHeight = Math.ceil(iWidth * 0.36)
      canvas.width = iWidth * scale
      canvas.height = iHeight * scale

      if (!ctx) {
        failedScan(t('analyze.failedAnalyze'))
        return
      }

      if (isTransparent) {
        ctx.fillStyle = '#443322'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(
        image,
        0,
        0,
        iWidth - predictWidth,
        predictHeight,
        0,
        0,
        Math.round((iWidth - predictWidth) * scale),
        Math.round(predictHeight * scale)
      )

      ctx.drawImage(
        image,
        0,
        predictHeight,
        iWidth,
        iHeight - predictHeight,
        0,
        Math.round(predictHeight * scale),
        iWidth * scale,
        Math.round((iHeight - predictHeight) * scale)
      )

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      let colorSum = 0

      for (let i = 0; i < data.length; i += 4) {
        colorSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      }

      const brightness = colorSum / (canvas.width * canvas.height)

      ctx.filter =
        brightness < 60
          ? 'brightness(1) contrast(1.4) blur(.6px) sepia(1)'
          : 'grayscale(1) contrast(2) brightness(1.2)'
      ctx.drawImage(canvas, 0, 0)

      if (brightness >= 60) binarize(ctx, canvas.width, canvas.height)

      is.recognize(canvas, lang)
        .then((text) => {
          plainText = text
          checkedItem.value.push('analyze')
          checkText()
        })
        .catch(() => {
          failedScan(t('analyze.failedAnalyze'))
        })
    }
  }
}

const click = () => {
  if ($q.platform.is.mobile) fileRef.value?.pickFiles()
  else dropBox.show = true
}

const fileCheckAndScanStart = (f?: File) => {
  if (f && f.type.indexOf('image') !== -1) scan(f)
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
  <div class="analysis">
    <svg xmlns="http://www.w3.org/2000/svg">
      <filter id="svgThreshold">
        <feColorMatrix
          type="matrix"
          values="0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0"
        />
        <feComponentTransfer>
          <feFuncR
            type="discrete"
            tableValues=" 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1"
          />
          <feFuncG
            type="discrete"
            tableValues=" 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1"
          />
          <feFuncB
            type="discrete"
            tableValues=" 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1"
          />
        </feComponentTransfer>
      </filter>
    </svg>
    <D4Btn
      :label="t('btn.imageAnalysis')"
      :loading="loading"
      :disable="disable"
      color="var(--q-light-magic)"
      @click="click"
      v-bind="$attrs"
    />
    <q-file
      v-show="false"
      ref="fileRef"
      outlined
      v-model="file"
      accept="image/*"
      @update:model-value="scan"
    />
    <D4Dialog
      v-model="showProgress"
      persistent
      width="400px"
      max-width="80vw"
      @before-hide="beforeHide"
    >
      <template #top>
        <q-card-section>
          <div class="text-h6 q-px-sm text-center">
            {{ t('analyze.title') }}
          </div>
        </q-card-section>
      </template>
      <template #middle>
        <div class="q-pa-lg">
          <q-option-group
            v-model="checkedItem"
            disable
            :options="checkList"
            color="primary"
            class="check-item"
            size="xs"
            type="checkbox"
          >
            <template #label="opt">
              <div
                class="row items-center q-gutter-x-sm"
                :class="{ checked: checkedItem.includes(opt.value) }"
              >
                <div
                  class="text-body2"
                  :class="{ 'text-weight-bold': currentCheck === opt.value }"
                >
                  {{ opt.label }}
                </div>
                <q-spinner-dots
                  v-show="opt.value === currentCheck"
                  size="18px"
                />
              </div>
            </template>
          </q-option-group>
        </div>
      </template>
    </D4Dialog>
    <D4Dialog
      v-model="dropBox.show"
      width="600px"
      max-width="80vw"
      @show="showDropBox"
      @before-hide="beforeHideDropBox"
    >
      <template #middle>
        <div
          ref="dropArea"
          class="drop-area q-ma-xl q-pa-xl column items-center q-gutter-y-sm text-h6"
          :class="{ enter: dropBox.enter > 0 }"
          @dragenter.prevent="dropBox.enter++"
          @dragleave.prevent="dropBox.enter--"
          @dragover.prevent
          @click="fileRef?.pickFiles"
        >
          <img
            src="/images/icons/image.svg"
            class="icon"
            width="48"
            height="48"
            alt="Tradurs Image Icon"
          />
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
    <D4Dialog
      v-model="cropBox.show"
      width="700px"
      max-width="100%"
      persistent
      @show="onShowCropBox"
      @before-hide="onBeforeHideCropBox"
    >
      <template #top>
        <div class="text-h6 q-pa-md">
          {{ t('analyze.cropArea') }}
        </div>
      </template>
      <template #middle>
        <div class="crop-area">
          <img ref="cropImage" :src="cropBox.origin" />
          <q-inner-loading :showing="cropBox.loading">
            <q-spinner size="50px" color="primary" />
          </q-inner-loading>
        </div>
      </template>
      <template #bottom>
        <div class="row justify-end q-gutter-x-sm q-pa-sm">
          <D4Btn
            :label="t('btn.cancel')"
            :disable="loading"
            color="rgb(150,150,150)"
            v-close-popup
          />
          <D4Btn
            :label="t('btn.recognizeSelectedArea')"
            :loading="loading"
            :disable="disable"
            color="var(--q-light-unique)"
            @click="onStartFilter"
          />
        </div>
      </template>
    </D4Dialog>
  </div>
</template>
<style lang="scss" scoped>
.analysis:deep(svg) {
  display: none;
}
.check-item:deep(.checked) {
  opacity: 0.6;
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

.crop-area {
  height: 800px;
  max-height: 60vh;

  & img {
    max-width: 100%;
    max-height: 100%;
    visibility: hidden;
  }

  &:deep(cropper-canvas) {
    width: 100%;
    height: 100%;
  }
}
</style>
