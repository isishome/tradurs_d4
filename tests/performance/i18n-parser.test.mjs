import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parse, parseAndGenerateServices } from '@typescript-eslint/typescript-estree'

test('i18n TypeScript parser retains syntax and default-project glob support with the security override', () => {
  const source = 'export default { greeting: "안녕하세요 {name}" } as const'
  assert.equal(parse(source, { range: true }).body[0].type, 'ExportDefaultDeclaration')

  // Exercise the parser's actual minimatch consumer, not just its module API.
  const root = fileURLToPath(new URL('./.generated/i18n-parser/', import.meta.url))
  mkdirSync(path.join(root, 'app'), { recursive: true })
  writeFileSync(path.join(root, 'tsconfig.json'), JSON.stringify({ include: ['app/**/*.ts'] }))
  writeFileSync(path.join(root, 'app/main.ts'), 'export {}')
  const filePath = path.join(root, 'translation-config.ts')
  writeFileSync(filePath, source)
  const result = parseAndGenerateServices(source, {
    filePath,
    tsconfigRootDir: root,
    projectService: { allowDefaultProject: ['translation-*.ts'] }
  })
  assert.ok(result.services.program)
  assert.equal(result.ast.body[0].type, 'ExportDefaultDeclaration')
})
