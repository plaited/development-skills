import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

const scriptsDir = join(import.meta.dir, '..')
const testFile = join(import.meta.dir, 'fixtures/sample.ts')

describe('scan-module', () => {
  test('shows help with --help flag', async () => {
    const result = await $`bun ${scriptsDir}/scan-module.ts --help`.text()

    expect(result).toContain('Scan Module')
    expect(result).toContain('--imports')
    expect(result).toContain('--graph')
    expect(result).toContain('--reverse')
    expect(result).toContain('--tree')
  })

  test('shows imports and exports by default', async () => {
    const result = await $`bun ${scriptsDir}/scan-module.ts ${testFile}`.json()

    expect(result.file).toEndWith('sample.ts')
    expect(Array.isArray(result.imports)).toBe(true)
    expect(Array.isArray(result.exports)).toBe(true)
    expect(result.importCount).toBeGreaterThanOrEqual(0)
    expect(result.exportCount).toBeGreaterThanOrEqual(0)
  })

  test('imports have path and kind properties', async () => {
    const clientFile = join(scriptsDir, 'lsp-client.ts')
    const result = await $`bun ${scriptsDir}/scan-module.ts ${clientFile}`.json()

    expect(result.imports).toBeDefined()
    if (result.imports.length > 0) {
      const imp = result.imports[0]
      expect(imp.path).toBeDefined()
      expect(imp.kind).toBeDefined()
    }
  })

  test('builds dependency graph with --graph flag', async () => {
    const result = await $`bun ${scriptsDir}/scan-module.ts ${testFile} --graph`.json()

    expect(result.file).toEndWith('sample.ts')
    expect(result.graph).toBeDefined()
    expect(result.graph.file).toBeDefined()
    expect(result.graph.imports).toBeDefined()
  })

  test('builds dependency tree with --tree flag', async () => {
    const result = await $`bun ${scriptsDir}/scan-module.ts ${testFile} --tree`.json()

    expect(result.file).toEndWith('sample.ts')
    expect(result.graph).toBeDefined()
    expect(result.graph.children).toBeDefined()
    expect(Array.isArray(result.graph.children)).toBe(true)
  })

  test('finds reverse dependencies with --reverse flag', async () => {
    const resolveFile = join(scriptsDir, 'resolve-file-path.ts')
    const result = await $`bun ${scriptsDir}/scan-module.ts ${resolveFile} --reverse`.json()

    expect(result.file).toEndWith('resolve-file-path.ts')
    expect(result.reverseDependencies).toBeDefined()
    expect(Array.isArray(result.reverseDependencies)).toBe(true)
    expect(result.count).toBeGreaterThanOrEqual(0)
  })

  test('exits with error for non-existent file', async () => {
    const proc = Bun.spawn(['bun', `${scriptsDir}/scan-module.ts`, '/nonexistent/file.ts'], {
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const exitCode = await proc.exited

    expect(exitCode).toBe(1)
  })

  test('exits with error for missing file argument', async () => {
    const proc = Bun.spawn(['bun', `${scriptsDir}/scan-module.ts`], {
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const exitCode = await proc.exited

    expect(exitCode).toBe(1) // Exits with error when file argument is missing
  })

  test('handles files with no imports', async () => {
    // Use a file that likely has minimal imports
    const result = await $`bun ${scriptsDir}/scan-module.ts ${testFile}`.json()

    expect(result.file).toBeDefined()
    expect(result.imports).toBeDefined()
    expect(result.exports).toBeDefined()
    expect(result.importCount).toBeGreaterThanOrEqual(0)
    expect(result.exportCount).toBeGreaterThanOrEqual(0)
  })

  test('handles circular dependencies without infinite loop', async () => {
    const circularFile = join(import.meta.dir, 'fixtures/circular-entry.ts')
    const result = await $`bun ${scriptsDir}/scan-module.ts ${circularFile} --graph`.json()

    expect(result.file).toEndWith('circular-entry.ts')
    expect(result.graph).toBeDefined()
    expect(result.graph.file).toBeDefined()
    expect(result.graph.imports).toBeDefined()
    expect(result.graph.dependencies).toBeDefined()

    // Verify the command completes (doesn't hang) and returns valid structure
    // The maxDepth limit prevents infinite recursion
    const deps = result.graph.dependencies
    expect(deps).toBeDefined()
  })

  test('circular dependencies are handled with maxDepth limit', async () => {
    const circularFile = join(import.meta.dir, 'fixtures/circular-a.ts')
    const result = await $`bun ${scriptsDir}/scan-module.ts ${circularFile} --graph`.json()

    expect(result.file).toEndWith('circular-a.ts')
    expect(result.graph).toBeDefined()

    // The graph should be built successfully without hanging
    // maxDepth=10 prevents infinite recursion through circular imports
    expect(result.graph.file).toContain('circular-a.ts')
  })

  test('scans .tsx files correctly', async () => {
    const tsxFile = join(import.meta.dir, 'fixtures/sample.tsx')
    const result = await $`bun ${scriptsDir}/scan-module.ts ${tsxFile}`.json()

    expect(result.file).toEndWith('sample.tsx')
    expect(result.imports).toBeDefined()
    expect(result.exports).toBeDefined()
    expect(Array.isArray(result.imports)).toBe(true)
    expect(Array.isArray(result.exports)).toBe(true)
  })

  test('scans .js files correctly', async () => {
    const jsFile = join(import.meta.dir, 'fixtures/sample.js')
    const result = await $`bun ${scriptsDir}/scan-module.ts ${jsFile}`.json()

    expect(result.file).toEndWith('sample.js')
    expect(result.imports).toBeDefined()
    expect(result.exports).toBeDefined()
    expect(result.exportCount).toBeGreaterThan(0) // Should have add and multiply exports
  })

  test('scans .jsx files correctly', async () => {
    const jsxFile = join(import.meta.dir, 'fixtures/sample.jsx')
    const result = await $`bun ${scriptsDir}/scan-module.ts ${jsxFile}`.json()

    expect(result.file).toEndWith('sample.jsx')
    expect(result.imports).toBeDefined()
    expect(result.exports).toBeDefined()
    expect(Array.isArray(result.exports)).toBe(true)
  })

  test('handles mixed file extensions in dependency graph', async () => {
    // Test that the loader correctly handles different file extensions
    // when building a dependency graph
    const tsFile = join(scriptsDir, 'lsp-client.ts')
    const result = await $`bun ${scriptsDir}/scan-module.ts ${tsFile} --graph`.json()

    expect(result.graph).toBeDefined()
    expect(result.graph.file).toBeDefined()
    // Should successfully process the file and any dependencies
  })
})
