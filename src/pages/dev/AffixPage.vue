<script setup lang="ts">
import { ref } from 'vue'
import normalKo from './../../../affix/normal.ko.json'
import normalEn from './../../../affix/normal.en.json'
import { useItemStore } from 'stores/item-store'
import similarity from 'similarity'
import { sleep } from 'src/common'

const is = useItemStore()

const normalQuery = ref()
const convertNormal = async () => {
  const result = [
    'insert into affix_attributes (affix_id, affix_attribute, language_id) values'
  ]
  const genKo: Array<any> = []
  const genEn: Array<any> = []
  let normal = normalKo.map((nk) => ({ ...nk, idx: 0, rate: 0, distance: 0 }))

  normal.forEach((nk, i) => {
    const rates: Array<any> = []
    is.affixes.data.forEach((a) => {
      rates.push({
        rate: similarity(
          (a.label.match(/[가-힣]/g) ?? []).join(''),
          (nk.desc.match(/[가-힣]/g) ?? []).join('')
        ),
        distance: Math.abs(
          (a.label.match(/[가-힣]/g) ?? []).join('').length -
            (nk.desc.match(/[가-힣]/g) ?? []).join('').length
        ),
        label: a.label,
        desc: nk.desc
      })
    })
    rates.sort((a, b) => b.rate - a.rate)
    nk.idx = i
    nk.rate = rates[0].rate
    nk.distance = rates[0].distance
  })

  normal = normal.filter((n) => n.rate < 1 && n.distance < 3)

  normal.forEach((nk) => {
    if (
      !!nk.desc &&
      (nk.desc.match(/[가-힣]+/) ?? []).length > 0 &&
      nk.desc.length > 5
    ) {
      genKo.push(nk)
      genEn.push(normalEn[nk.idx])
    }
  })
  const genData = [
    ...genKo.map(
      (gk, i) =>
        `(${i + 606}, '${gk.desc
          .replace(/\s{1,}/g, ' ')
          .replace(/'/g, `''`)}', 'ko')`
    ),
    ...genEn.map(
      (ge, i) =>
        `(${i + 606}, '${ge.desc
          .replace(/\s{1,}/g, ' ')
          .replace(/'/g, `''`)}', 'en')`
    )
  ]
  result.push(genData.join(',\n'))

  const affixQuery = `insert into affixes (affix_id, affix_type, user_id) (select seq as affix_id, 'standard' as affix_type, 1 as user_id from seq_606_to_${
    genKo.length + 605
  });`

  result.unshift(affixQuery)
  result.unshift('use diablo_4;')

  normalQuery.value = `${result.join('\n')};}`
}

// const aspectQuery = ref()
// const convertAspect = async () => {
//   const result = [
//     'insert into affix_attributes (affix_id, affix_attribute, aspect_name, language_id) values'
//   ]
//   const genKo: Array<any> = []
//   const genEn: Array<any> = []
//   aspectKo.forEach((uk, i) => {
//     if (
//       !!uk.desc &&
//       !!uk.name &&
//       (uk.desc.match(/[가-힣]+/) ?? []).length > 0 &&
//       !uk.name.split(' ').includes('test') &&
//       !uk.name.split(' ').includes('테스트') &&
//       !uk.name.split(' ').includes('PH') &&
//       !uk.name.split(' ').includes('미정') &&
//       !uk.name.split(' ').includes('미친') &&
//       uk.desc.length > 5
//     ) {
//       genKo.push(uk)
//       genEn.push(aspectEn[i])
//     }
//   })
//   const genData = [
//     ...genKo.map(
//       (gk, i) =>
//         `(${i + 1001}, '${gk.desc
//           .replace(/\s{1,}/g, ' ')
//           .replace(/'/g, `''`)}', '${gk.name
//           .replace(/\s{1,}/g, ' ')
//           .replace(/'/g, `''`)}', 'ko')`
//     ),
//     ...genEn.map(
//       (ge, i) =>
//         `(${i + 1001}, '${ge.desc
//           .replace(/\s{1,}/g, ' ')
//           .replace(/'/g, `''`)}', '${ge.name
//           .replace(/\s{1,}/g, ' ')
//           .replace(/'/g, `''`)}', 'en')`
//     )
//   ]
//   result.push(genData.join(',\n'))
//   const updateQuery = genKo.map(
//     (gk, i) =>
//       `update affixes set affix_class = ${
//         is.classes.find((c) => c.label === gk.classes)?.value
//           ? `'${is.classes.find((c) => c.label === gk.classes)?.value}'`
//           : 'null'
//       }, aspect_category = ${
//         is.aspectCategories.find((ac) => ac.label === gk.category)?.value
//           ? `'${
//               is.aspectCategories.find((ac) => ac.label === gk.category)?.value
//             }'`
//           : 'null'
//       }, equipment_classes = '${is.equipClasses
//         .filter((ec) => gk.equip.includes(ec.label))
//         .map((ec) => ec.value)
//         .join('|')}' where affix_id = ${i + 1001};`
//   )

//   const affixQuery = `insert into affixes (affix_id, affix_type, user_id) (select seq as affix_id, 'legendary' as affix_type, 1 as user_id from seq_1001_to_${
//     genKo.length + 1000
//   });`

//   result.unshift(affixQuery)
//   result.unshift('use diablo_4;')

//   aspectQuery.value = `${result.join('\n')};\n${updateQuery.join('\n')}`

//   for (let i = 0; i < genKo.length; i++) {
//     await sleep(1000)
//     fetch(genKo[i].img)
//       .then((res) => res.blob())
//       .then((blob) => {
//         const objURL = URL.createObjectURL(blob)
//         const link = document.createElement('a')
//         document.body.append(link)

//         link.setAttribute('download', `${i + 1001}.webp`)
//         link.href = objURL

//         link.click()
//         URL.revokeObjectURL(objURL)
//       })
//   }
// }

// const uniqueQuery = ref()
// const convertUnique = () => {
//   const result = [
//     'insert into affix_attributes (affix_id, affix_attribute, language_id) values'
//   ]
//   const genKo: Array<any> = []
//   const genEn: Array<any> = []
//   uniqueKo.forEach((uk, i) => {
//     if (
//       !!uk.desc &&
//       !!uk.name &&
//       (uk.desc.match(/[가-힣]+/) ?? []).length > 0 &&
//       !uk.name.split(' ').includes('test') &&
//       !uk.name.split(' ').includes('테스트') &&
//       !uk.name.split(' ').includes('PH') &&
//       !uk.name.split(' ').includes('미정') &&
//       !uk.name.split(' ').includes('미친') &&
//       uk.desc.length > 5
//     ) {
//       genKo.push(uk)
//       genEn.push(uniqueEn[i])
//     }
//   })
//   const genData = [
//     ...genKo.map(
//       (gk, i) =>
//         `(${i + 2001}, '${gk.desc
//           .replace(/\s{1,}/g, ' ')
//           .replace(/'/g, `''`)}', 'ko')`
//     ),
//     ...genEn.map(
//       (ge, i) =>
//         `(${i + 2001}, '${ge.desc
//           .replace(/\s{1,}/g, ' ')
//           .replace(/'/g, `''`)}', 'en')`
//     )
//   ]
//   result.push(genData.join(',\n'))

//   const affixQuery = `insert into affixes (affix_id, affix_type, user_id) (select seq as affix_id, 'unique' as affix_type, 1 as user_id from seq_2001_to_${
//     genKo.length + 2000
//   });`

//   result.unshift(affixQuery)
//   result.unshift('use diablo_4;')

//   uniqueQuery.value = `${result.join('\n')};`
// }

// const mythicQuery = ref()
// const convertMythic = () => {
//   const result = [
//     'insert into affix_attributes (affix_id, affix_attribute, language_id) values'
//   ]
//   const genKo: Array<any> = []
//   const genEn: Array<any> = []
//   mythicKo.forEach((uk, i) => {
//     if (
//       !!uk.desc &&
//       !!uk.name &&
//       (uk.desc.match(/[가-힣]+/) ?? []).length > 0 &&
//       !uk.name.split(' ').includes('test') &&
//       !uk.name.split(' ').includes('테스트') &&
//       !uk.name.split(' ').includes('PH') &&
//       !uk.name.split(' ').includes('미정') &&
//       !uk.name.split(' ').includes('미친') &&
//       uk.desc.length > 5
//     ) {
//       genKo.push(uk)
//       genEn.push(mythicEn[i])
//     }
//   })
//   const genData = [
//     ...genKo.map(
//       (gk, i) =>
//         `(${i + 3001}, '${gk.desc
//           .replace(/\s{1,}/g, ' ')
//           .replace(/'/g, `''`)}', 'ko')`
//     ),
//     ...genEn.map(
//       (ge, i) =>
//         `(${i + 3001}, '${ge.desc
//           .replace(/\s{1,}/g, ' ')
//           .replace(/'/g, `''`)}', 'en')`
//     )
//   ]
//   result.push(genData.join(',\n'))

//   const affixQuery = `insert into affixes (affix_id, affix_type, user_id) (select seq as affix_id, 'mythic' as affix_type, 1 as user_id from seq_3001_to_${
//     genKo.length + 3000
//   });`

//   result.unshift(affixQuery)
//   result.unshift('use diablo_4;')

//   mythicQuery.value = `${result.join('\n')};`
// }
</script>
<template>
  <div>
    <button @click="convertNormal">일반 속성 변환</button>
    <textarea v-model="normalQuery" class="fit" rows="10"></textarea>
    <!-- <button @click="convertAspect">위상 변환</button>
    <textarea v-model="aspectQuery" class="fit" rows="10"></textarea>
    <button @click="convertUnique">고유 속성 변환</button>
    <textarea v-model="uniqueQuery" class="fit" rows="10"> </textarea>
    <button @click="convertMythic">신화 고유 속성 변환</button>
    <textarea v-model="mythicQuery" class="fit" rows="10"></textarea> -->
  </div>
</template>
