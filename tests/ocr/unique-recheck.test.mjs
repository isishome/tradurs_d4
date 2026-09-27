import {test} from 'node:test'
import assert from 'node:assert/strict'
import {matchTooltip} from './.generated/matcher.mjs'
import {readCatalog} from '../../../query/d4/docs/verification/affix-audit/catalog.mjs'
const catalog=await readCatalog()
const match=(target,language='ko')=>matchTooltip({
 standard:catalog.filter(r=>r.language===language).map(r=>({value:r.id,label:r.label})),
 target:target.map(s=>s.replaceAll(' ','')),phase:language==='ko'?'가-힣':'a-z',layer:10,cutoffSim:0.6,cutoffDis:3
})

test('Jordan user screenshot transcription recovers3305,18,[15,25], not general damage663',()=>{
 // Manually transcribed from the supplied image; not claimed as actual Paddle output.
 const result=match(['플레이어의 저항이 각각 가장 높은 저','항과 동일해지고, 해당 원소로 주는',
  '피해가 18%[x] [15 - 25]% 증가합니','다.'])
 assert.deepEqual(result.map(r=>r.id),[3305])
 assert.deepEqual(result[0].values.returnValues,[18])
 assert.deepEqual(result[0].values.returnRangeValues,[{min:15,max:25}])
})

test('Arioc chance50 is fixed and must not consume the damage-roll slot',()=>{
 for(const [language,text] of [
  ['ko','치명적 공격 확률을 50% 얻습니다. 치명적 공격으로 주는 피해가 42%[x] [35 - 50]% 증가합니다.'],
  ['en','Gain 50% Deadly Strike Chance. Your Deadly Strikes deal 42%[x] [35 - 50]% increased damage.']]) {
  const found=match([text],language).find(r=>r.id===3307)
  assert(found,language);assert.deepEqual(found.values.returnValues,[42])
  assert.deepEqual(found.values.returnRangeValues,[{min:35,max:50}])
 }
})

test('re-reviewed Unique numeric contracts exclude fixed values and preserve roll order',()=>{
 // Source-based synthetic rolls, not additional user captures or inferred default ranges.
 const cases=[
  [3201,'최근 55초 내에 처치한 적 15마리당 공격력이 2%, 공격 속도가 1% 증가합니다.',[55]],
  [3207,'어둠의 감옥이 최대 생명력의 35%를 소모하여 재사용 대기시간을 초기화합니다. 어둠의 감옥이 활성화되어 있는 동안 피해 감소를 25% 획득합니다.',[35,25]],
  [3268,'암흑의 오라가 플레이어를 감싸, 주변의 적에게 노화와 가시 박힌 철관을 걸고, 플레이어가 근거리에 있는 적에게 주는 피해가 12% 증가합니다. 이렇게 유발된 저주는 매초 주위의 다른 대상에게 퍼져 나갑니다.',[12]],
  [3272,'해골 전사와 해골 마법학자의 최대 수가 4 증가하고 소환수의 공격력이 20% 증가합니다. 해골 전사에게 명령을 하면 해골 마법학자도 5초 동안 같은 대상에게 초점을 맞춥니다.',[20]],
  [3306,'피해를 받지 않는 동안 받는 피해가 최대 50%, 주는 피해가 최대 42% 증가합니다. 생명력을 잃으면 이 보너스가 초기화됩니다.',[42]]
 ]
 for(const [id,text,values] of cases){const found=match([text]).find(r=>r.id===id);assert(found,`missing${id}`);assert.deepEqual(found.values.returnValues,values,`${id}`)}
})
