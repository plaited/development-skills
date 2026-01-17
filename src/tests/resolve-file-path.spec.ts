import { describe, expect, test } from 'bun:test'
import { resolveFilePath } from '../resolve-file-path.ts'

describe('resolveFilePath', () => {
  test('returns absolute path as-is', async () => {
    const absolutePath = '/Users/test/file.ts'
    const result = await resolveFilePath(absolutePath)
    expect(result).toBe(absolutePath)
  })

  test('resolves relative path from cwd', async () => {
    const relativePath = './plugin/skills/typescript-lsp/scripts/tests/fixtures/sample.ts'
    const result = await resolveFilePath(relativePath)
    expect(result).toBe(`${process.cwd()}/${relativePath}`)
  })

  test('resolves package export path via Bun.resolve', async () => {
    // Use typescript package which is installed as devDependency
    const packagePath = 'typescript'
    const result = await resolveFilePath(packagePath)

    // Should resolve to node_modules/typescript/...
    expect(result).toContain('node_modules/typescript')
    expect(result.startsWith('/')).toBe(true)
  })

  test('falls back to cwd for non-existent package', async () => {
    const invalidPath = 'nonexistent-package/file.ts'
    const result = await resolveFilePath(invalidPath)

    expect(result).toBe(`${process.cwd()}/${invalidPath}`)
  })
})
