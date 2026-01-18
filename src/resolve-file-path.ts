import { join } from 'node:path'

/**
 * Check if a path looks like a file path (vs a package specifier)
 *
 * @remarks
 * File paths typically contain a `/` and end with a file extension.
 * Package specifiers are bare like `lodash` or scoped like `@org/pkg`.
 * Scoped packages starting with `@` are excluded even if they have extensions.
 */
const looksLikeFilePath = (path: string): boolean => {
  // Scoped packages like @org/pkg/file.ts should use Bun.resolve()
  if (path.startsWith('@')) return false
  // Contains a slash and ends with a common source file extension
  return path.includes('/') && /\.(tsx?|jsx?|mjs|cjs|json)$/.test(path)
}

/**
 * Resolve a file path to an absolute path
 *
 * @remarks
 * Handles three types of paths:
 * - Absolute paths (starting with `/`) - returned as-is
 * - Relative paths (starting with `.` or looking like `src/foo.ts`) - resolved from cwd
 * - Package export paths (e.g., `plaited/workshop/get-paths.ts`) - resolved via Bun.resolve()
 */
export const resolveFilePath = async (filePath: string): Promise<string> => {
  const cwd = process.cwd()

  // Absolute path
  if (filePath.startsWith('/')) {
    return filePath
  }

  // Explicit relative path from cwd (starts with . or ..)
  if (filePath.startsWith('.')) {
    return join(cwd, filePath)
  }

  // Implicit relative path (looks like a file path, e.g., src/utils/foo.ts)
  if (looksLikeFilePath(filePath)) {
    return join(cwd, filePath)
  }

  // Try package export path resolution
  try {
    return await Bun.resolve(filePath, cwd)
  } catch {
    // Fall back to relative path from cwd
    return join(cwd, filePath)
  }
}
