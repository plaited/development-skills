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
 * - {{#if capability}}...{{/if}} - Capability-based conditional
 * - {{^if condition}}...{{/if}} - Inverse conditional
 * - <!-- RULE TEMPLATE ... --> - Template header (removed)
 *
 * Capabilities:
 * - has-sandbox: Agent runs in sandboxed environment (e.g., Claude Code)
 * - multi-file-rules: Agent supports rules directory structure
 * - supports-slash-commands: Agent has /command syntax
 * - supports-agents-md: Agent reads AGENTS.md format
 *
 * @example
 * ```bash
 * bunx @plaited/development-skills scaffold-rules --agent=claude --format=json
 * bunx @plaited/development-skills scaffold-rules --agent=agents-md --format=json
 * ```
 */

import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

type Agent = 'claude' | 'cursor' | 'factory' | 'copilot' | 'windsurf' | 'cline' | 'aider' | 'agents-md'

type AgentCapabilities = {
  hasSandbox: boolean
  multiFileRules: boolean
  supportsSlashCommands: boolean
  supportsAgentsMd: boolean
}

type TemplateContext = {
  agent: Agent
  capabilities: AgentCapabilities
  hasDevelopmentSkills: boolean
  rulesPath: string
}

type ProcessedTemplate = {
  filename: string
  content: string
  description: string
}

type ScaffoldOutput = {
  agent: Agent
  rulesPath: string
  format: 'multi-file' | 'single-file' | 'agents-md'
  supportsAgentsMd: boolean
  agentsMdContent?: string
  templates: Record<string, ProcessedTemplate>
}

/**
 * Agent capabilities matrix
 *
 * @remarks
 * - hasSandbox: Runs in restricted environment (affects git commands, temp files)
 * - multiFileRules: Supports directory of rule files vs single file
 * - supportsSlashCommands: Has /command syntax for invoking tools
 * - supportsAgentsMd: Reads AGENTS.md format (most modern agents do)
 */
const AGENT_CAPABILITIES: Record<Agent, AgentCapabilities> = {
  claude: {
    hasSandbox: true,
    multiFileRules: true,
    supportsSlashCommands: true,
    supportsAgentsMd: false, // Claude Code uses .claude/ directory
  },
  cursor: {
    hasSandbox: false,
    multiFileRules: true,
    supportsSlashCommands: false,
    supportsAgentsMd: true,
  },
  factory: {
    hasSandbox: false,
    multiFileRules: true,
    supportsSlashCommands: false,
    supportsAgentsMd: true,
  },
  copilot: {
    hasSandbox: false,
    multiFileRules: false,
    supportsSlashCommands: false,
    supportsAgentsMd: true,
  },
  windsurf: {
    hasSandbox: false,
    multiFileRules: false,
    supportsSlashCommands: false,
    supportsAgentsMd: false, // Uses .windsurfrules
  },
  cline: {
    hasSandbox: false,
    multiFileRules: false,
    supportsSlashCommands: false,
    supportsAgentsMd: false, // Uses .clinerules
  },
  aider: {
    hasSandbox: false,
    multiFileRules: false,
    supportsSlashCommands: false,
    supportsAgentsMd: true,
  },
  'agents-md': {
    hasSandbox: false,
    multiFileRules: true, // Uses .plaited/rules/ with AGENTS.md linking
    supportsSlashCommands: false,
    supportsAgentsMd: true,
  },
}

/**
 * Evaluate a single condition against context
 */
const evaluateCondition = (condition: string, context: TemplateContext): boolean => {
  // Check development-skills
  if (condition === 'development-skills') {
    return context.hasDevelopmentSkills
  }

  // Check capability-based conditions
  if (condition === 'has-sandbox') {
    return context.capabilities.hasSandbox
  }
  if (condition === 'multi-file-rules') {
    return context.capabilities.multiFileRules
  }
  if (condition === 'supports-slash-commands') {
    return context.capabilities.supportsSlashCommands
  }
  if (condition === 'supports-agents-md') {
    return context.capabilities.supportsAgentsMd
  }

  // Check agent-specific conditions (legacy: agent:name)
  const agentMatch = condition.match(/^agent:(\w+)$/)
  if (agentMatch) {
    return context.agent === agentMatch[1]
  }

  return false
}

/**
 * Process template conditionals
 *
 * Handles:
 * - {{#if development-skills}}...{{/if}}
 * - {{#if capability}}...{{/if}} (has-sandbox, multi-file-rules, etc.)
 * - {{#if agent:name}}...{{/if}} (legacy, still supported)
 * - {{^if condition}}...{{/if}} (inverse)
 *
 * Processes iteratively to handle nested conditionals correctly.
 */
const processConditionals = (content: string, context: TemplateContext): string => {
  let result = content
  let previousResult = ''

  // Process iteratively until no more changes (handles nested conditionals)
  while (result !== previousResult) {
    previousResult = result

    // Process positive conditionals {{#if condition}}...{{/if}}
    // Use non-greedy match that doesn't cross other conditional boundaries
    result = result.replace(
      /\{\{#if ([\w:-]+)\}\}((?:(?!\{\{#if )(?!\{\{\^if )(?!\{\{\/if\}\})[\s\S])*?)\{\{\/if\}\}/g,
      (_, condition, block) => {
        return evaluateCondition(condition, context) ? block : ''
      },
    )

    // Process inverse conditionals {{^if condition}}...{{/if}}
    result = result.replace(
      /\{\{\^if ([\w:-]+)\}\}((?:(?!\{\{#if )(?!\{\{\^if )(?!\{\{\/if\}\})[\s\S])*?)\{\{\/if\}\}/g,
      (_, condition, block) => {
        return evaluateCondition(condition, context) ? '' : block
      },
    )
  }

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
      return `.cursor/rules/${ruleId}.md`
    case 'factory':
      return `.factory/rules/${ruleId}.md`
    case 'agents-md':
      // AGENTS.md links to .plaited/rules/
      return `.plaited/rules/${ruleId}.md`
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
    case 'factory':
      return '.factory/rules'
    case 'agents-md':
      return '.plaited/rules'
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
 * Get output format for agent
 */
const getOutputFormat = (agent: Agent): 'multi-file' | 'single-file' | 'agents-md' => {
  if (agent === 'agents-md') {
    return 'agents-md'
  }
  const capabilities = AGENT_CAPABILITIES[agent]
  return capabilities.multiFileRules ? 'multi-file' : 'single-file'
}

/**
 * Generate AGENTS.md content that links to .plaited/rules/
 */
const generateAgentsMd = (templates: Record<string, ProcessedTemplate>): string => {
  const lines = [
    '# AGENTS.md',
    '',
    'Development rules for AI coding agents.',
    '',
    '## Rules',
    '',
    'This project uses modular development rules stored in `.plaited/rules/`.',
    'Each rule file covers a specific topic:',
    '',
  ]

  for (const [ruleId, template] of Object.entries(templates)) {
    lines.push(`- [${ruleId}](.plaited/rules/${template.filename}) - ${template.description}`)
  }

  lines.push('')
  lines.push('## Quick Reference')
  lines.push('')
  lines.push('For detailed guidance on each topic, see the linked rule files above.')
  lines.push('')

  return lines.join('\n')
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
  const validAgents: Agent[] = ['claude', 'cursor', 'factory', 'copilot', 'windsurf', 'cline', 'aider', 'agents-md']
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
  const capabilities = AGENT_CAPABILITIES[agent]
  const rulesPath = getRulesPath(agent)

  const context: TemplateContext = {
    agent,
    capabilities,
    hasDevelopmentSkills: true, // Always true when using our CLI
    rulesPath,
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

  // Build output
  const output: ScaffoldOutput = {
    agent,
    rulesPath,
    format: getOutputFormat(agent),
    supportsAgentsMd: capabilities.supportsAgentsMd,
    templates,
  }

  // Generate AGENTS.md content for agents-md format
  if (agent === 'agents-md') {
    output.agentsMdContent = generateAgentsMd(templates)
  }

  console.log(JSON.stringify(output, null, 2))
}

// CLI entry point
if (import.meta.main) {
  await scaffoldRules(Bun.argv.slice(2))
}
