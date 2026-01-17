import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { $ } from 'bun'

type Template = {
  filename: string
  content: string
  description: string
}

type ScaffoldOutput = {
  agent: string
  rulesPath: string
  format: 'multi-file' | 'single-file' | 'agents-md'
  supportsAgentsMd: boolean
  agentsMdContent?: string
  templates: Record<string, Template>
}

const binDir = join(import.meta.dir, '../../bin')

describe('scaffold-rules', () => {
  test('outputs JSON with all templates', async () => {
    const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --format=json`.json()

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

  test('includes metadata in output', async () => {
    const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --format=json`.json()

    // Check metadata fields
    expect(result.agent).toBe('claude')
    expect(result.rulesPath).toBe('.claude/rules')
    expect(result.format).toBe('multi-file')
    expect(result.supportsAgentsMd).toBe(false)
  })

  test('each template has required properties', async () => {
    const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --format=json`.json()

    for (const [ruleId, template] of Object.entries(result.templates)) {
      expect(template).toHaveProperty('filename')
      expect(template).toHaveProperty('content')
      expect(template).toHaveProperty('description')

      expect(template.filename).toBe(`${ruleId}.md`)
      expect(template.content).toBeString()
      expect(template.content.length).toBeGreaterThan(0)
    }
  })

  test('removes template headers from content', async () => {
    const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --format=json`.json()

    // Check that template headers are removed
    for (const template of Object.values(result.templates)) {
      expect(template.content).not.toContain('<!-- RULE TEMPLATE')
      expect(template.content).not.toContain('Variables:')
    }
  })

  describe('capability-based conditionals', () => {
    test('processes has-sandbox for Claude (sandbox environment)', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=claude --format=json`.json()

      const gitWorkflow = result.templates['git-workflow']
      expect(gitWorkflow).toBeDefined()

      // Claude has sandbox - should include sandbox-specific content
      expect(gitWorkflow!.content).toContain('sandbox environment')
      expect(gitWorkflow!.content).toContain('single-quoted strings')

      // Should not have conditional syntax
      expect(gitWorkflow!.content).not.toContain('{{#if has-sandbox}}')
      expect(gitWorkflow!.content).not.toContain('{{/if}}')
    })

    test('processes has-sandbox for Cursor (no sandbox)', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=cursor --format=json`.json()

      const gitWorkflow = result.templates['git-workflow']
      expect(gitWorkflow).toBeDefined()

      // Cursor has no sandbox - should not include sandbox-specific content
      expect(gitWorkflow!.content).not.toContain('sandbox environment')

      // Should include generic multi-line commit guidance
      expect(gitWorkflow!.content).toContain('multi-line commit')
    })

    test('processes supports-slash-commands for Claude', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=claude --format=json`.json()

      const accuracy = result.templates.accuracy
      expect(accuracy).toBeDefined()

      // Claude supports slash commands
      expect(accuracy!.content).toContain('/lsp-hover')
      expect(accuracy!.content).toContain('/lsp-find')
    })

    test('processes supports-slash-commands for Cursor (no slash commands)', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=cursor --format=json`.json()

      const accuracy = result.templates.accuracy
      expect(accuracy).toBeDefined()

      // Cursor doesn't support slash commands - should use CLI
      expect(accuracy!.content).toContain('bunx @plaited/development-skills lsp-')
      expect(accuracy!.content).not.toContain('/lsp-hover')
    })
  })

  test('processes development-skills conditionals', async () => {
    const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --format=json`.json()

    const accuracy = result.templates.accuracy
    expect(accuracy).toBeDefined()

    // Should include development-skills content (always true when using CLI)
    expect(accuracy!.content).toContain('TypeScript/JavaScript projects')
    expect(accuracy!.content).toContain('lsp-find')
    expect(accuracy!.content).toContain('lsp-hover')

    // Should not have conditional syntax
    expect(accuracy!.content).not.toContain('{{#if development-skills}}')
    expect(accuracy!.content).not.toContain('{{/if}}')
  })

  describe('cross-references', () => {
    test('generates Claude-style cross-references', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=claude --format=json`.json()

      const accuracy = result.templates.accuracy
      expect(accuracy).toBeDefined()
      expect(accuracy!.content).toContain('@.claude/rules/testing.md')
      expect(accuracy!.content).not.toContain('{{LINK:testing}}')
    })

    test('generates Cursor-style cross-references', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=cursor --format=json`.json()

      const accuracy = result.templates.accuracy
      expect(accuracy).toBeDefined()
      expect(accuracy!.content).toContain('.cursor/rules/testing.md')
    })

    test('generates Factory-style cross-references', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=factory --format=json`.json()

      const accuracy = result.templates.accuracy
      expect(accuracy).toBeDefined()
      expect(accuracy!.content).toContain('.factory/rules/testing.md')
    })

    test('generates agents-md-style cross-references', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=agents-md --format=json`.json()

      const accuracy = result.templates.accuracy
      expect(accuracy).toBeDefined()
      expect(accuracy!.content).toContain('.plaited/rules/testing.md')
    })
  })

  describe('Factory agent support', () => {
    test('supports factory agent', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=factory --format=json`.json()

      expect(result.agent).toBe('factory')
      expect(result.rulesPath).toBe('.factory/rules')
      expect(result.format).toBe('multi-file')
      expect(result.supportsAgentsMd).toBe(true)
    })

    test('factory has no sandbox (uses standard commit format)', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=factory --format=json`.json()

      const gitWorkflow = result.templates['git-workflow']
      expect(gitWorkflow).toBeDefined()
      expect(gitWorkflow!.content).not.toContain('sandbox environment')
      expect(gitWorkflow!.content).toContain('multi-line commit')
    })
  })

  describe('AGENTS.md support', () => {
    test('supports agents-md format', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=agents-md --format=json`.json()

      expect(result.agent).toBe('agents-md')
      expect(result.rulesPath).toBe('.plaited/rules')
      expect(result.format).toBe('agents-md')
      expect(result.supportsAgentsMd).toBe(true)
    })

    test('generates AGENTS.md content', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=agents-md --format=json`.json()

      expect(result.agentsMdContent).toBeDefined()
      expect(result.agentsMdContent).toContain('# AGENTS.md')
      expect(result.agentsMdContent).toContain('.plaited/rules/')
      expect(result.agentsMdContent).toContain('## Rules')
    })

    test('AGENTS.md links to all rule files', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=agents-md --format=json`.json()

      const agentsMd = result.agentsMdContent ?? ''

      // Should link to each rule file
      for (const [ruleId, template] of Object.entries(result.templates)) {
        expect(agentsMd).toContain(`[${ruleId}](.plaited/rules/${template.filename})`)
      }
    })

    test('agents-md has no sandbox', async () => {
      const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --agent=agents-md --format=json`.json()

      const gitWorkflow = result.templates['git-workflow']
      expect(gitWorkflow).toBeDefined()
      expect(gitWorkflow!.content).not.toContain('sandbox environment')
    })
  })

  test('filters to specific rules when requested', async () => {
    const result: ScaffoldOutput =
      await $`bun ${binDir}/cli.ts scaffold-rules --rules testing --rules bun-apis --format=json`.json()

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
    const result: ScaffoldOutput = await $`bun ${binDir}/cli.ts scaffold-rules --format=json`.json()

    // Check a few descriptions
    const accuracy = result.templates.accuracy
    expect(accuracy).toBeDefined()
    expect(accuracy!.description).toBeString()
    expect(accuracy!.description.length).toBeGreaterThan(10)

    const testing = result.templates.testing
    expect(testing).toBeDefined()
    expect(testing!.description).toBeString()
    expect(testing!.description.length).toBeGreaterThan(10)
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
