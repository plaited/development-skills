#!/usr/bin/env bun
/**
 * Module scanner using Bun.Transpiler.scan()
 *
 * Fast analysis of module imports and exports without full TypeScript compilation.
 * Uses Bun's native transpiler to parse imports and exports.
 *
 * Usage: bun scan-module.ts <file> [options]
 *
 * Options:
 *   --imports, -i      Show imports and exports (default)
 *   --graph, -g        Show dependency graph with exports
 *   --reverse, -r      Show reverse dependencies (what imports this file)
 *   --tree, -t         Show dependency tree with exports
 *   --help, -h         Show this help
 */

import { parseArgs } from 'node:util'
import { Glob } from 'bun'
import { resolveFilePath } from './resolve-file-path.ts'

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    imports: { type: 'boolean', short: 'i' },
    graph: { type: 'boolean', short: 'g' },
    reverse: { type: 'boolean', short: 'r' },
    tree: { type: 'boolean', short: 't' },
    debug: { type: 'boolean', short: 'd' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
})

if (values.help || positionals.length === 0) {
  console.log(`
Scan Module - Fast import/export analysis using Bun.Transpiler.scan()

Usage: bun scan-module.ts <file> [options]

Options:
  --imports, -i      Show imports and exports from the file (default)
  --graph, -g        Show full dependency graph with exports
  --reverse, -r      Show reverse dependencies (what imports this file)
  --tree, -t         Show dependency tree with exports
  --debug, -d        Enable debug logging
  --help, -h         Show this help

Examples:
  bun scan-module.ts src/index.ts              # Show imports & exports
  bun scan-module.ts src/utils.ts -g           # Dependency graph with exports
  bun scan-module.ts src/config.ts -r          # Find what imports this
  bun scan-module.ts src/app.ts -t             # Dependency tree with exports
`)
  process.exit(values.help ? 0 : 1)
}

// Safe: positionals.length >= 1 guaranteed by exit above, but TypeScript can't infer through process.exit()
const filePath = positionals[0]!
const absolutePath = await resolveFilePath(filePath)

type ImportInfo = {
  path: string
  kind: Bun.ImportKind
}

type ScanResult = {
  imports: ImportInfo[]
  exports: string[]
}

type DependencyGraph = {
  file: string
  imports: ImportInfo[]
  exports?: string[]
  dependencies?: Map<string, DependencyGraph>
}

type DependencyTree = {
  file: string
  imports: ImportInfo[]
  children: Array<{ import: string } & DependencyTree>
}

const scanFile = async (path: string, debug = false): Promise<ScanResult> => {
  try {
    const file = Bun.file(path)
    if (!(await file.exists())) {
      return { imports: [], exports: [] }
    }

    const content = await file.text()

    // Determine loader based on file extension
    const loader = path.endsWith('.tsx') ? 'tsx' : path.endsWith('.ts') ? 'ts' : path.endsWith('.jsx') ? 'jsx' : 'js'

    const transpiler = new Bun.Transpiler({ loader })
    const result = transpiler.scan(content)

    return {
      imports: result.imports.map((imp) => ({
        path: imp.path,
        kind: imp.kind,
      })),
      exports: result.exports,
    }
  } catch (error) {
    if (debug) {
      console.error(`[DEBUG] Failed to scan ${path}: ${error}`)
    }
    return { imports: [], exports: [] }
  }
}

const buildDependencyGraph = async (
  path: string,
  visited = new Set<string>(),
  depth = 0,
  maxDepth = 10,
  debug = false,
): Promise<DependencyGraph> => {
  if (visited.has(path) || depth > maxDepth) {
    return { file: path, imports: [], exports: [] }
  }

  visited.add(path)
  const { imports, exports } = await scanFile(path, debug)
  const dependencies = new Map<string, DependencyGraph>()

  for (const imp of imports) {
    // Skip node built-ins and external packages
    if (imp.path.startsWith('node:') || !imp.path.startsWith('.')) {
      continue
    }

    try {
      // Resolve relative imports
      const resolved = await resolveFilePath(imp.path, path)
      const childGraph = await buildDependencyGraph(resolved, visited, depth + 1, maxDepth, debug)
      dependencies.set(imp.path, childGraph)
    } catch (error) {
      if (debug) {
        console.error(`[DEBUG] Failed to resolve import ${imp.path} from ${path}: ${error}`)
      }
    }
  }

  return { file: path, imports, exports, dependencies }
}

const findReverseDependencies = async (
  targetPath: string,
  debug = false,
): Promise<Array<{ file: string; imports: ImportInfo[] }>> => {
  const glob = new Glob('**/*.{ts,tsx,js,jsx}')
  const reverseDeps: Array<{ file: string; imports: ImportInfo[] }> = []
  const cwd = process.cwd()

  for await (const filePath of glob.scan({ cwd, absolute: true })) {
    const { imports } = await scanFile(filePath, debug)

    for (const imp of imports) {
      try {
        const resolved = await resolveFilePath(imp.path, filePath)
        if (resolved === targetPath) {
          reverseDeps.push({ file: filePath, imports })
          break
        }
      } catch (error) {
        if (debug) {
          console.error(`[DEBUG] Failed to resolve import ${imp.path} from ${filePath}: ${error}`)
        }
      }
    }
  }

  return reverseDeps
}

const graphToTree = (graph: DependencyGraph, depth = 0): DependencyTree => {
  return {
    file: graph.file,
    imports: graph.imports,
    children: graph.dependencies
      ? Array.from(graph.dependencies.entries()).map(([path, child]) => ({
          import: path,
          ...graphToTree(child, depth + 1),
        }))
      : [],
  }
}

const debug = values.debug ?? false

try {
  const file = Bun.file(absolutePath)
  if (!(await file.exists())) {
    console.error(`Error: File not found: ${absolutePath}`)
    process.exit(1)
  }

  if (values.reverse) {
    const reverseDeps = await findReverseDependencies(absolutePath, debug)
    console.log(
      JSON.stringify(
        {
          file: filePath,
          reverseDependencies: reverseDeps.map((dep) => ({
            file: dep.file,
            importCount: dep.imports.length,
          })),
          count: reverseDeps.length,
        },
        null,
        2,
      ),
    )
  } else if (values.graph || values.tree) {
    const graph = await buildDependencyGraph(absolutePath, new Set(), 0, 10, debug)
    const output = values.tree ? graphToTree(graph) : graph

    console.log(
      JSON.stringify(
        {
          file: filePath,
          graph: output,
        },
        (_key, value) => {
          // Convert Map to object for JSON serialization
          if (value instanceof Map) {
            return Object.fromEntries(value)
          }
          return value
        },
        2,
      ),
    )
  } else {
    // Default: show imports and exports
    const { imports, exports } = await scanFile(absolutePath, debug)
    console.log(
      JSON.stringify(
        {
          file: filePath,
          imports,
          exports,
          importCount: imports.length,
          exportCount: exports.length,
        },
        null,
        2,
      ),
    )
  }
} catch (error) {
  console.error(`Error: ${error}`)
  process.exit(1)
}
