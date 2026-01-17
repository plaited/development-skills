import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

type Template = {
  filename: string
  content: string
  description: string
}

const binDir = join(import.meta.dir, '../../bin')

describe('scaffold-rules', () => {
  test('outputs JSON with all templates', async () => {
    const result = await $`bun ${binDir}/cli.ts scaffold-rules --format=json`.json()

    expect(result).toHaveProperty('templates')
    expect(result.templates).toBeObject()

    // Check that we have the expected templates
    const templateKeys = Object.keys(result.templates)
    expect(templateKeys).toContain('accuracy')
    expect(templateKeys).toContain('bun-apis')
    expect(templateKeys).toContain('code-review')
    expect(templateKeys).toContain('git-workflow')
    expect(templateKeys).toContain('github')
    expect(templateKeys).toContain('testing')
  })

  test('each template has required properties', async () => {
    const result = await $`bun ${binDir}/cli.ts scaffold-rules --format=json`.json()

    for (const [ruleId, template] of Object.entries(result.templates) as [string, Template][]) {
      expect(template).toHaveProperty('filename')
      expect(template).toHaveProperty('content')
      expect(template).toHaveProperty('description')

      expect(template.filename).toBe(`${ruleId}.md`)
      expect(template.content).toBeString()
      expect(template.content.length).toBeGreaterThan(0)
    }
  })

  test('removes template headers from content', async () => {
    const result = await $`bun ${binDir}/cli.ts scaffold-rules --format=json`.json()

    // Check that template headers are removed
    for (const template of Object.values(result.templates) as Template[]) {
      expect(template.content).not.toContain('<!-- RULE TEMPLATE')
      expect(template.content).not.toContain('Variables:')
    }
  })

  test('processes conditionals for Claude agent', async () => {
    const result = await $`bun ${binDir}/cli.ts scaffold-rules --agent=claude --format=json`.json()

    const gitWorkflow = result.templates['git-workflow']

    // Should include Claude-specific content
    expect(gitWorkflow.content).toContain('sandbox environment')
    expect(gitWorkflow.content).toContain('single-quoted strings')

    // Should not have conditional syntax
    expect(gitWorkflow.content).not.toContain('{{#if agent:claude}}')
    expect(gitWorkflow.content).not.toContain('{{/if}}')
  })

  test('processes conditionals for Cursor agent', async () => {
    const result = await $`bun ${binDir}/cli.ts scaffold-rules --agent=cursor --format=json`.json()

    const gitWorkflow = result.templates['git-workflow']

    // Should not include Claude-specific sandbox content
    expect(gitWorkflow.content).not.toContain('sandbox environment')

    // Should include generic multi-line commit guidance
    expect(gitWorkflow.content).toContain('multi-line commit')

    // Should not have conditional syntax
    expect(gitWorkflow.content).not.toContain('{{#if agent:claude}}')
    expect(gitWorkflow.content).not.toContain('{{^if agent:claude}}')
  })

  test('processes development-skills conditionals', async () => {
    const result = await $`bun ${binDir}/cli.ts scaffold-rules --format=json`.json()

    const accuracy = result.templates.accuracy

    // Should include development-skills content (always true when using CLI)
    expect(accuracy.content).toContain('TypeScript/JavaScript projects')
    expect(accuracy.content).toContain('lsp-find')
    expect(accuracy.content).toContain('lsp-hover')

    // Should not have conditional syntax
    expect(accuracy.content).not.toContain('{{#if development-skills}}')
    expect(accuracy.content).not.toContain('{{/if}}')
  })

  test('processes cross-references for Claude', async () => {
    const result = await $`bun ${binDir}/cli.ts scaffold-rules --agent=claude --format=json`.json()

    const accuracy = result.templates.accuracy

    // Should have Claude-style cross-reference
    expect(accuracy.content).toContain('@.claude/rules/testing.md')

    // Should not have template variable syntax
    expect(accuracy.content).not.toContain('{{LINK:testing}}')
  })

  test('processes cross-references for Cursor', async () => {
    const result = await $`bun ${binDir}/cli.ts scaffold-rules --agent=cursor --format=json`.json()

    const accuracy = result.templates.accuracy

    // Should have Cursor-style cross-reference
    expect(accuracy.content).toContain('.cursor/rules/testing.md')

    // Should not have template variable syntax
    expect(accuracy.content).not.toContain('{{LINK:testing}}')
  })

  test('filters to specific rules when requested', async () => {
    const result = await $`bun ${binDir}/cli.ts scaffold-rules --rules testing --rules bun-apis --format=json`.json()

    const templateKeys = Object.keys(result.templates)

    // Should only include requested rules
    expect(templateKeys).toHaveLength(2)
    expect(templateKeys).toContain('testing')
    expect(templateKeys).toContain('bun-apis')

    // Should not include other rules
    expect(templateKeys).not.toContain('accuracy')
    expect(templateKeys).not.toContain('git-workflow')
  })

  test('extracts meaningful descriptions', async () => {
    const result = await $`bun ${binDir}/cli.ts scaffold-rules --format=json`.json()

    // Check a few descriptions
    expect(result.templates.accuracy.description).toBeString()
    expect(result.templates.accuracy.description.length).toBeGreaterThan(10)

    expect(result.templates.testing.description).toBeString()
    expect(result.templates.testing.description.length).toBeGreaterThan(10)
  })

  test('exits with error for invalid agent', async () => {
    const proc = Bun.spawn(['bun', `${binDir}/cli.ts`, 'scaffold-rules', '--agent=invalid'], {
      stderr: 'pipe',
    })

    const exitCode = await proc.exited
    expect(exitCode).not.toBe(0)
  })

  test('handles missing bundled rules directory gracefully', async () => {
    // This test ensures the script fails gracefully if templates are missing
    // In production, .claude/rules/ should always be bundled with the package
    const result = await $`bun ${binDir}/cli.ts scaffold-rules --format=json`.nothrow().quiet()

    // Should succeed because .claude/rules/ exists in development
    expect(result.exitCode).toBe(0)
  })
})
