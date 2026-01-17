#!/usr/bin/env bun
/**
 * Scaffold development rules from templates
 *
 * Reads bundled rule templates, processes template variables and conditionals,
 * and outputs JSON for agent consumption.
 *
 * Template syntax:
 * - {{LINK:rule-id}} - Cross-reference to another rule
 * - {{#if development-skills}}...{{/if}} - Conditional block
 * - {{#if agent:name}}...{{/if}} - Agent-specific block
 * - {{^if condition}}...{{/if}} - Inverse conditional
 * - <!-- RULE TEMPLATE ... --> - Template header (removed)
 *
 * @example
 * ```bash
 * bunx @plaited/development-skills scaffold-rules --agent=claude --format=json
 * ```
 */

import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

type Agent = 'claude' | 'cursor' | 'copilot' | 'windsurf' | 'cline' | 'aider'

type TemplateContext = {
  agent: Agent
  hasDevelopmentSkills: boolean
  rulesPath: string
}

type ProcessedTemplate = {
  filename: string
  content: string
  description: string
}

type ScaffoldOutput = {
  templates: Record<string, ProcessedTemplate>
}

/**
 * Process template conditionals
 *
 * Handles:
 * - {{#if development-skills}}...{{/if}}
 * - {{#if agent:name}}...{{/if}}
 * - {{^if condition}}...{{/if}} (inverse)
 */
const processConditionals = (content: string, context: TemplateContext): string => {
  let result = content

  // Process {{#if development-skills}}...{{/if}}
  const devSkillsRegex = /\{\{#if development-skills\}\}([\s\S]*?)\{\{\/if\}\}/g
  result = result.replace(devSkillsRegex, (_, block) => {
    return context.hasDevelopmentSkills ? block : ''
  })

  // Process {{^if development-skills}}...{{/if}} (inverse)
  const notDevSkillsRegex = /\{\{\^if development-skills\}\}([\s\S]*?)\{\{\/if\}\}/g
  result = result.replace(notDevSkillsRegex, (_, block) => {
    return context.hasDevelopmentSkills ? '' : block
  })

  // Process {{#if agent:name}}...{{/if}}
  const agentRegex = /\{\{#if agent:(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  result = result.replace(agentRegex, (_, agentName, block) => {
    return context.agent === agentName ? block : ''
  })

  // Process {{^if agent:name}}...{{/if}} (inverse)
  const notAgentRegex = /\{\{\^if agent:(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  result = result.replace(notAgentRegex, (_, agentName, block) => {
    return context.agent !== agentName ? block : ''
  })

  return result
}

/**
 * Process template variables
 *
 * Handles:
 * - {{LINK:rule-id}} - Generate cross-reference
 * - {{AGENT_NAME}} - Agent name
 * - {{RULES_PATH}} - Rules path
 */
const processVariables = (content: string, context: TemplateContext): string => {
  let result = content

  // Replace {{LINK:rule-id}} with appropriate cross-reference
  result = result.replace(/\{\{LINK:(\w+)\}\}/g, (_, ruleId) => {
    return generateCrossReference(ruleId, context)
  })

  // Replace {{AGENT_NAME}}
  result = result.replace(/\{\{AGENT_NAME\}\}/g, context.agent)

  // Replace {{RULES_PATH}}
  result = result.replace(/\{\{RULES_PATH\}\}/g, context.rulesPath)

  return result
}

/**
 * Generate cross-reference based on agent format
 */
const generateCrossReference = (ruleId: string, context: TemplateContext): string => {
  switch (context.agent) {
    case 'claude':
      // Claude Code uses @ syntax for file references
      return `@${context.rulesPath}/${ruleId}.md`
    case 'cursor':
      // Cursor uses relative paths
      return `.cursor/rules/${ruleId}.md`
    case 'copilot':
      // Copilot uses section references within single file
      return `See "${ruleId}" section`
    default:
      return `${ruleId}.md`
  }
}

/**
 * Remove template headers
 */
const removeTemplateHeaders = (content: string): string => {
  return content.replace(/<!--[\s\S]*?-->\n*/g, '')
}

/**
 * Extract description from rule content
 */
const extractDescription = (content: string): string => {
  // Look for first paragraph or heading after main title
  const lines = content.split('\n')
  let description = ''

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim()
    if (line && !line.startsWith('#') && !line.startsWith('**')) {
      description = line
      break
    }
  }

  return description || 'Development rule'
}

/**
 * Process a template with context
 */
const processTemplate = (content: string, context: TemplateContext): string => {
  let result = content

  // 1. Remove template headers
  result = removeTemplateHeaders(result)

  // 2. Process conditionals
  result = processConditionals(result, context)

  // 3. Process variables
  result = processVariables(result, context)

  // 4. Clean up extra blank lines
  result = result.replace(/\n{3,}/g, '\n\n')

  return result
}

/**
 * Get rules path for agent
 */
const getRulesPath = (agent: Agent): string => {
  switch (agent) {
    case 'claude':
      return '.claude/rules'
    case 'cursor':
      return '.cursor/rules'
    case 'copilot':
      return '.github/copilot-instructions.md'
    case 'windsurf':
      return '.windsurfrules'
    case 'cline':
      return '.clinerules'
    case 'aider':
      return '.aider.conf.yml'
    default:
      return '.claude/rules'
  }
}

/**
 * Main scaffold-rules function
 */
export const scaffoldRules = async (args: string[]): Promise<void> => {
  const { values } = parseArgs({
    args,
    options: {
      agent: {
        type: 'string',
        short: 'a',
        default: 'claude',
      },
      format: {
        type: 'string',
        short: 'f',
        default: 'json',
      },
      rules: {
        type: 'string',
        short: 'r',
        multiple: true,
      },
    },
    allowPositionals: true,
    strict: false,
  })

  const agent = values.agent as Agent
  const rulesFilter = values.rules as string[] | undefined

  // Validate agent
  const validAgents: Agent[] = ['claude', 'cursor', 'copilot', 'windsurf', 'cline', 'aider']
  if (!validAgents.includes(agent)) {
    console.error(`Error: Invalid agent "${agent}". Must be one of: ${validAgents.join(', ')}`)
    process.exit(1)
  }

  // Get bundled templates directory
  const packageRulesDir = join(import.meta.dir, '../.claude/rules')

  // Read template files
  const templateFiles = await readdir(packageRulesDir)

  // Filter to .md files
  const mdFiles = templateFiles.filter((f) => f.endsWith('.md'))

  // Filter if specific rules requested
  const rulesToProcess = rulesFilter ? mdFiles.filter((f) => rulesFilter.includes(f.replace('.md', ''))) : mdFiles

  // Process each template
  const templates: Record<string, ProcessedTemplate> = {}

  const context: TemplateContext = {
    agent,
    hasDevelopmentSkills: true, // Always true when using our CLI
    rulesPath: getRulesPath(agent),
  }

  for (const file of rulesToProcess) {
    const templatePath = join(packageRulesDir, file)
    const content = await Bun.file(templatePath).text()
    const ruleId = file.replace('.md', '')

    // Process template
    const processed = processTemplate(content, context)

    templates[ruleId] = {
      filename: file,
      content: processed,
      description: extractDescription(processed),
    }
  }

  // Output as JSON
  const output: ScaffoldOutput = { templates }
  console.log(JSON.stringify(output, null, 2))
}

// CLI entry point
if (import.meta.main) {
  await scaffoldRules(Bun.argv.slice(2))
}
