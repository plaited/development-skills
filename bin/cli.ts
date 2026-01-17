#!/usr/bin/env bun
/**
 * Development Skills CLI
 *
 * Provides TypeScript LSP tools, skill validation, and code documentation utilities.
 *
 * Usage:
 *   development-skills <command> [args...] [options]
 *
 * Commands:
 *   lsp-hover <file> <line> <char>    Get type information at position
 *   lsp-find <query> [file]            Search for symbols
 *   lsp-refs <file> <line> <char>     Find all references
 *   lsp-symbols <file>                 List all symbols in file
 *   lsp-analyze <file>                 Batch analysis
 *   validate-skill <path>              Validate AgentSkills spec
 *   scaffold-rules [options]           Generate development rules
 *
 * Examples:
 *   bunx @plaited/development-skills lsp-hover src/index.ts 10 5
 *   bunx @plaited/development-skills lsp-find parseConfig
 *   bunx @plaited/development-skills validate-skill .claude/skills/my-skill
 *   bunx @plaited/development-skills scaffold-rules --agent=claude --format=json
 */

import { lspAnalyze } from '../src/lsp-analyze.ts'
import { lspFind } from '../src/lsp-find.ts'
import { lspHover } from '../src/lsp-hover.ts'
import { lspRefs } from '../src/lsp-references.ts'
import { lspSymbols } from '../src/lsp-symbols.ts'
import { scaffoldRules } from '../src/scaffold-rules.ts'
import { validateSkill } from '../src/validate-skill.ts'

// Get raw args (everything after script name)
const rawArgs = Bun.argv.slice(2)

// Extract command (first non-option arg)
const command = rawArgs.find((arg) => !arg.startsWith('-')) || ''

// Get args after command (everything except the command itself)
const commandIndex = rawArgs.indexOf(command)
const args = commandIndex >= 0 ? rawArgs.slice(commandIndex + 1) : []

if (!command || command === '--help' || command === '-h') {
  console.log(`
Development Skills CLI

Usage:
  development-skills <command> [args...] [options]

Commands:
  lsp-hover <file> <line> <char>    Get type information at position
  lsp-find <query> [file]            Search for symbols
  lsp-refs <file> <line> <char>     Find all references
  lsp-symbols <file>                 List all symbols in file
  lsp-analyze <file>                 Batch analysis
  validate-skill <path>              Validate AgentSkills spec
  scaffold-rules [options]           Generate development rules

Examples:
  bunx @plaited/development-skills lsp-hover src/index.ts 10 5
  bunx @plaited/development-skills lsp-find parseConfig
  bunx @plaited/development-skills lsp-refs src/types.ts 15 8
  bunx @plaited/development-skills lsp-symbols src/app.ts
  bunx @plaited/development-skills lsp-analyze src/app.ts
  bunx @plaited/development-skills validate-skill .claude/skills/my-skill
  bunx @plaited/development-skills scaffold-rules --agent=claude --format=json

Options:
  -h, --help    Show this help
`)
  process.exit(0)
}

// Route to appropriate command
try {
  switch (command) {
    case 'lsp-hover':
      await lspHover(args)
      break
    case 'lsp-find':
      await lspFind(args)
      break
    case 'lsp-refs':
    case 'lsp-references':
      await lspRefs(args)
      break
    case 'lsp-symbols':
      await lspSymbols(args)
      break
    case 'lsp-analyze':
      await lspAnalyze(args)
      break
    case 'validate-skill':
      await validateSkill(args)
      break
    case 'scaffold-rules':
      await scaffoldRules(args)
      break
    default:
      console.error(`Unknown command: ${command}`)
      console.error('Run `development-skills --help` for usage')
      process.exit(1)
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Error: ${message}`)
  process.exit(1)
}
