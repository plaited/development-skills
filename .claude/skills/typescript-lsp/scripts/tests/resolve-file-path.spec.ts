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
    // path.join normalizes by removing './' prefix
    expect(result).toBe(`${process.cwd()}/plugin/skills/typescript-lsp/scripts/tests/fixtures/sample.ts`)
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

    // Falls back to joining with cwd
    expect(result).toBe(`${process.cwd()}/nonexistent-package/file.ts`)
  })

  test('resolves relative path from basePath', async () => {
    const basePath = '/Users/test/src/module.ts'
    const relativePath = './utils.ts'
    const result = await resolveFilePath(relativePath, basePath)

    // path.join normalizes by removing './' prefix
    expect(result).toBe('/Users/test/src/utils.ts')
  })

  test('resolves parent relative path from basePath', async () => {
    const basePath = '/Users/test/src/deep/module.ts'
    const relativePath = '../utils.ts'
    const result = await resolveFilePath(relativePath, basePath)

    // path.join normalizes by resolving '../' sequences
    expect(result).toBe('/Users/test/src/utils.ts')
  })

  test('ignores basePath for absolute paths', async () => {
    const basePath = '/Users/test/src/module.ts'
    const absolutePath = '/Users/other/file.ts'
    const result = await resolveFilePath(absolutePath, basePath)

    expect(result).toBe(absolutePath)
  })

  test('uses cwd when basePath not provided', async () => {
    const relativePath = './file.ts'
    const result = await resolveFilePath(relativePath)

    // path.join normalizes by removing './' prefix
    expect(result).toBe(`${process.cwd()}/file.ts`)
  })
})
