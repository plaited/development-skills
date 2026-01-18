import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { resolveFilePath } from '../resolve-file-path.ts'

describe('resolveFilePath', () => {
  test('returns absolute path as-is', async () => {
    const absolutePath = '/Users/test/file.ts'
    const result = await resolveFilePath(absolutePath)
    expect(result).toBe(absolutePath)
  })

  test('resolves relative path from cwd', async () => {
    const relativePath = './src/resolve-file-path.ts'
    const result = await resolveFilePath(relativePath)
    // join() normalizes paths, removing the ./
    expect(result).toBe(join(process.cwd(), relativePath))
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

    expect(result).toBe(join(process.cwd(), invalidPath))
  })

  test('resolves implicit relative path (src/foo.ts format) from cwd', async () => {
    // Paths that look like file paths (contain / and end with extension)
    // should resolve from cwd without trying Bun.resolve()
    const implicitRelative = 'src/utils/parser.ts'
    const result = await resolveFilePath(implicitRelative)

    expect(result).toBe(join(process.cwd(), implicitRelative))
  })

  test('resolves various file extensions as implicit relative paths', async () => {
    const extensions = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json']

    for (const ext of extensions) {
      const path = `src/file.${ext}`
      const result = await resolveFilePath(path)
      expect(result).toBe(join(process.cwd(), path))
    }
  })

  test('treats bare package names without extensions as package specifiers', async () => {
    // A path like 'typescript' (no slash, no extension) should try Bun.resolve()
    const barePkg = 'typescript'
    const result = await resolveFilePath(barePkg)

    // Should resolve to node_modules, not cwd/typescript
    expect(result).toContain('node_modules/typescript')
  })

  test('treats scoped packages as package specifiers, not implicit file paths', async () => {
    // Scoped packages like @org/pkg/file.ts should NOT be treated as implicit
    // relative paths, even if they contain / and end with an extension.
    // They should go through Bun.resolve() first, falling back to cwd if not found.
    const scopedPkg = '@nonexistent/pkg/src/file.ts'
    const result = await resolveFilePath(scopedPkg)

    // Falls back to cwd since package doesn't exist, but importantly it tried
    // Bun.resolve() first (doesn't match looksLikeFilePath due to @ prefix)
    expect(result).toBe(join(process.cwd(), scopedPkg))
  })
})
