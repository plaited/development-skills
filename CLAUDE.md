# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository hosts the **development-skills** Claude Code plugin, providing development tools including TypeScript LSP integration, code documentation utilities, and skill validation.

## Essential Commands

### Development Setup
```bash
# Install dependencies (requires bun >= v1.2.9)
bun install

# Type, lint, and format check (check only, no fixes)
bun run check

# Lint and format fix (auto-fix issues)
bun run check:write

# Run unit tests
bun test
```

## Project Organization

This project uses `.claude/rules/` for project-specific guidance:

- **Testing**: @.claude/rules/testing.md - Test commands and workflow
- **Code Review**: @.claude/rules/code-review.md - Review standards
- **Accuracy**: @.claude/rules/accuracy.md - Confidence thresholds
- **Bun APIs**: @.claude/rules/bun-apis.md - Bun platform API preferences
- **Git Workflow**: @.claude/rules/git-workflow.md - Commit conventions
- **GitHub**: @.claude/rules/github.md - GitHub CLI integration

## Quick Reference

### Plugin Overview

This repository hosts the **development-skills** Claude Code plugin with the following skills:

**TypeScript LSP** (`/lsp-*` commands):
- `/lsp-hover` - Get type information at a position
- `/lsp-find` - Search for symbols across workspace
- `/lsp-refs` - Find all references to a symbol
- `/lsp-analyze` - Batch analysis of a file

**Code Documentation** - Documentation generation utilities

**Skill Validation** (`/validate-skill`) - Validate skills against AgentSkills spec

**Scaffold Rules** (`/scaffold-rules`) - Scaffold development rules for AI coding agents

### Code Style Essentials

- Prefer arrow functions and `type` over `interface`
- Use `test` instead of `it` in test files
- Prefer Bun native APIs over Node.js equivalents
- Object parameters for functions with 2+ parameters
- JSON imports require `with { type: 'json' }` attribute

For complete conventions, see `.claude/rules/code-review.md`

### Plugin Development

This project is a Claude Code plugin. Structure:
- `.claude/skills/typescript-lsp/` - TypeScript LSP skill
- `.claude/skills/code-documentation/` - Code documentation skill
- `.claude/skills/validate-skill/` - Skill validation skill
- `.claude/skills/scaffold-rules/` - Scaffold development rules skill
- `.claude/commands/` - Slash command definitions
- `.claude/rules/` - Development guidance (not published)

When working on the plugin:
- Clear cache after changes: `rm -rf ~/.claude/plugins-cache`
- Restart Claude Code to see updates
- Skills are auto-invoked (won't show in `/plugins` UI)

### Documentation

- Public APIs require comprehensive TSDoc documentation
- No `@example` sections - tests are living examples
- Use `@internal` marker for non-public APIs
- Always use `type` over `interface`
- Use Mermaid diagrams only (not ASCII art)

## Important Constraints

1. **No Open Contribution**: This is open-source but not open-contribution
2. **Bun Required**: Development requires bun >= v1.2.9
3. **ES2024 Features**: Uses modern APIs

## Plugin

The **development-skills** plugin provides:

**TypeScript LSP** (`.claude/skills/typescript-lsp/`):
- Type-aware symbol search across workspace
- Hover information (type signatures, docs)
- Reference finding before refactoring
- Batch analysis for efficiency

**Code Documentation** (`.claude/skills/code-documentation/`):
- Documentation generation utilities

**Skill Validation** (`.claude/skills/validate-skill/`):
- Validate skills against AgentSkills spec

**Scaffold Rules** (`.claude/skills/scaffold-rules/`):
- Scaffold development rules for AI coding agents

Install via marketplace: `github:plaited/marketplace`

See individual skill SKILL.md files for complete documentation.
