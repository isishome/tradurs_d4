import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchTooltip, parseValues } from './.generated/matcher.mjs'
import { readCatalog } from '../../../query/d4/docs/verification/affix-audit/catalog.mjs'
import { readFile } from 'node:fs/promises'
const match = (standard, target, phase = 'a-z') => matchTooltip({ standard, target, phase, cutoffDis: 3, cutoffSim: 0.6, layer: 10 })

test('actual browser Paddle output recovers all seven Elegy affix/socket-effect lines',async()=>{
  const {ocr}=JSON.parse(await readFile(new URL('elegy-live-result.json',import.meta.url),'utf8'))
  const dictionary=(await readCatalog()).filter(r=>r.language==='ko'&&(r.type==='standard'||r.id===3212)).map(r=>({value:r.id,label:r.label}))
  assert.deepEqual(match(dictionary,ocr.split('\n'),'가-힣').map(r=>[r.id,...r.values.returnValues]),
    [[977,235],[25,270],[980,38],[950,5],[27,10],[3212,48],[1131,24]])
})

test('Enigma cost is read from the image and Sheol duration stays a literal',async()=>{
  const rows=await readCatalog()
  const enigma=rows.find(r=>r.id===3312&&r.language==='ko')
  assert.deepEqual(match([{value:3312,label:enigma.label}],['피하기가 원소술사의 순간이동이 되고 주 자원을 27 소모합니다.'],'가-힣')[0].values.returnValues,[27])
  const sheol=rows.find(r=>r.id===3216&&r.language==='ko')
  assert.deepEqual(parseValues(sheol.label,sheol.label.replace('{x}','48').replace('{x}','720')).returnValues,[48,720])
})

test('live Elegy matches canonical wording and roll without item-specific OCR aliases', async () => {
  const row = (await readCatalog()).find(r => r.id === 3212 && r.language === 'ko')
  const lines = ['타오르는 비명이 대마귀 기술이 되고', '주는 피해가 48%[x] [30 - 50]% 증',
    '가합니다. 타오르는 비명이 두개골 절', '단기 변화형을 무료로 획득하고, 하',
    '급 악마 두개골이 주 두개골과 같은', '피해를 줍니다.']
  const result = match([{value:row.id,label:row.label}],lines,'가-힣')
  assert.equal(result.length,1)
  assert.deepEqual(result[0].values.returnValues,[48])
  assert.deepEqual(result[0].values.returnRangeValues,[{min:30,max:50}])
  const stale = row.label.replace('대마귀','상급 악마') + ' 두개골이 벽에 적중해도 사라지지 않습니다.'
  assert.deepEqual(match([{value:3212,label:stale}],lines,'가-힣'),[])
})
test('wrapped description includes its own numeric line, not the next affix', () => {
  const result = match([{value: 1,label: 'Damage increased by {x}%'},{value:2,label:'+{x} Life'}], ['Damage increased by','40% [30 - 40]%','+500 Life'])
  assert.deepEqual(result.map(r=>r.values.returnValues), [[40],[500]])
  assert.deepEqual(result[0].values.returnRangeValues, [{min:30,max:40}])
})
test('flat and percent variants resolve to different dictionary IDs', () => {
  const standard = [{value:25,label:'+{x} Willpower'},{value:495,label:'+{x}% Willpower'}]
  assert.equal(match(standard,['+6.7% Willpower'])[0].id,495)
  assert.equal(match(standard,['+67 Willpower'])[0].id,25)
})
test('fixed numbers do not steal equal variable values; signs and commas survive', () => {
  assert.deepEqual(parseValues('Gain {x}% for 5 seconds','Gain 5% [3-6] for 5 seconds').returnValues,[5])
  assert.deepEqual(parseValues('Life +{x}','Life -2,200').returnValues,[-2200])
})
test('weapon min/max are values, ordinary roll brackets are ranges', () => {
  assert.deepEqual(parseValues('[{x}-{x}] Damage per Hit','[1,860 - 2,488] Damage per Hit').returnValues,[1860,2488])
})
test('short item names and DPS do not invent affixes', () => {
  const result = match([{value:242,label:'뼈 영혼 +{x}'},{value:331,label:'초당 기력 +{x}'}],['영혼','2,391 초당 공격력'],'가-힣')
  assert.deepEqual(result,[])
})
test('equivalent resource-on-kill and legacy passive wording retain current IDs', () => {
  assert.equal(match([{value:1078,label:'처치 시 주 자원 +{x}'}],['처치시주자원생성+2[2]'],'가-힣')[0].id,1078)
  assert.equal(match([{value:168,label:'+{x} to Gloom'}],['+2RanksoftheGloomPassive'])[0].id,168)
})
test('roll ranges on a separate line and split brackets remain attached', () => {
  const standard = [{value:7,label:'공격 속도 +{x}%'}]
  for (const lines of [['공격속도+40.0%','[30.0-40.0]%'],['공격속도+40.0%[30.0-','40.0]%']]) {
    assert.deepEqual(match(standard,lines,'가-힣')[0].values.returnRangeValues,[{min:30,max:40}])
  }
})
test('Leoric live wording preserves actual affixes and duplicate sockets, not catalog defaults', async () => {
  const standard = [
    {value:25,label:'의지력 +{x}'}, {value:7,label:'공격 속도 +{x}%'},
    {value:925,label:'모든 저항 +{x}'}, {value:338,label:'모든 원소 저항 +{x}%'},
    {value:105,label:'최대 생명력 +{x}'}, {value:1030,label:'주 능력치 +{x}'},
    {value:1023,label:'암흑 저항 +{x}'}, {value:128,label:'화염 저항 {x}%'},
    ...(await readCatalog()).filter(r=>[3303,1130].includes(r.id)&&r.language==='ko').map(r=>({value:r.id,label:r.label})),
    {value:1,label:'빈 홈'}
  ]
  const lines = ['의지력+151(+13)','공격속도+12.5%(+4.0%)','모든원소저항+500(+500)',
    '저항+3,500화염(+3,500)','이아이템은장신구로취급됩니다.',
    '이투구에끼운보석의효과가38%','[x][35-50]%증가합니다.','빈홈','빈홈']
  const actual = match(standard,lines,'가-힣')
  assert.deepEqual(actual.map(r=>[r.id,...r.values.returnValues]),[[25,151],[7,12.5],[925,500],[1130,3500],[3303,38],[1],[1]])
  assert.deepEqual(actual.find(r=>r.id===3303).values.returnRangeValues,[{min:35,max:50}])
  // Flat Fire Resistance has its own ID, never percent or Shadow resistance.
  assert.ok(!actual.some(r=>[105,1030,1023,128,338].includes(r.id)))
})
