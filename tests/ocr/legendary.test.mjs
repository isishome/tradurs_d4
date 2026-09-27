import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
await build({entryPoints:[fileURLToPath(new URL('../../src/common/affix-matcher.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',outfile:fileURLToPath(new URL('.generated/legendary-matcher.mjs',import.meta.url))})
const { matchTooltip } = await import('./.generated/legendary-matcher.mjs')
const { readCatalog } = await import('../../../query/d4/docs/verification/affix-audit/catalog.mjs')
const catalog = await readCatalog()
const match = (target,language='ko') => matchTooltip({standard:catalog.filter(r=>r.language===language).map(r=>({value:r.id,label:r.label})),target,phase:language==='ko'?'가-힣':'a-z',cutoffDis:3,cutoffSim:0.6,layer:10})
async function actual(name) {
  const {ocr}=JSON.parse(await readFile(new URL(name,import.meta.url),'utf8'))
  return ocr.normalize('NFKC').replace(/[−–—]/g,'-').replace(/[^0-9%가-힣/+.\[\]\-,:\n() ]/g,'').split('\n').map(s=>s.replaceAll(' ',''))
}
test('actual ring Paddle output: Starlight uses only the cost-reduction roll, not10/2/6',async()=>{
  const found=match(await actual('ring-property-result.json')).find(r=>r.id===2048)
  assert(found,'Starlight must be found among the full catalog')
  assert.deepEqual(found.values.returnValues,[25])
  assert.deepEqual(found.values.returnRangeValues,[{min:20,max:30}])
})
test('actual boots Paddle output: Anger Management damage20 and15–20range, not fixed50/3',async()=>{
  const found=match(await actual('boots-metadata-result.json')).find(r=>r.id===2038)
  assert(found,'Anger Management must be found among the full catalog')
  assert.deepEqual(found.values.returnValues,[20])
  assert.deepEqual(found.values.returnRangeValues,[{min:15,max:20}])
})
test('reworked English effects preserve their new numeric meaning and fixed values',()=>{
  const cases=[
    [2018,'Your Damage over Time grants you 1.3% [1.0 - 1.5]% Damage Reduction for 2 seconds, stacking up to 30 times.',[1.3]],
    [2048,'Every 10% of your Life that you Heal grants you 25% [20 - 30]% Primary Resource Cost Reduction for 2 seconds, up to 6 seconds.',[25]],
    [2293,'Every 10% of your Maximum Life Healed grants you 75%[x] [60 - 90]% increased Blood Skill damage for 4 seconds.',[75]],
    [2039,'Your Shout Skill Cooldowns are reduced by 3 seconds.',[3]]
  ]
  for(const [id,line,values] of cases){
    const found=match([line],'en').find(r=>r.id===id)
    assert(found,`missing ${id}`);assert.deepEqual(found.values.returnValues,values,`${id}`)
  }
})
test('same Korean aspect name does not merge different Wrath and damage effects',()=>{
  assert(match(['진노가 최대인 동안 진노를 8 획득할 때마다 제압을 획득합니다.']).some(r=>r.id===2456))
  assert(match(['취약한 적에게 주는 피해가 45%[x] 증가하고, 넘어진 적에게 주는 피해가 15%[x] 증가합니다.']).some(r=>r.id===2491))
})
