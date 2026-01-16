import { dirname, join } from 'node:path'

/**
 * Resolve a file path to an absolute path
 *
 * @remarks
 * Handles three types of paths:
 * - Absolute paths (starting with `/`) - returned as-is
 * - Relative paths (starting with `.`) - resolved from basePath or cwd
 * - Package export paths (e.g., `plaited/workshop/get-paths.ts`) - resolved via Bun.resolve()
 *
 * @param filePath - Path to resolve
 * @param basePath - Base path for relative resolution (defaults to cwd)
 */
export const resolveFilePath = async (filePath: string, basePath?: string): Promise<string> => {
  const base = basePath ? dirname(basePath) : process.cwd()

  // Absolute path
  if (filePath.startsWith('/')) {
    return filePath
  }

  // Relative path from base
  if (filePath.startsWith('.')) {
    return join(base, filePath)
  }

  // Try package export path resolution
  try {
    return await Bun.resolve(filePath, base)
  } catch {
    // Fall back to relative path from base
    return `${base}/${filePath}`
  }
}
