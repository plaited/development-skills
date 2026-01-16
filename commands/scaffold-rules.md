---
description: Scaffold or merge development rules for your AI coding agent
allowed-tools: Glob, Read, Write, Edit, AskUserQuestion
---

# Scaffold Rules

Generate development rules adapted to the user's AI coding agent environment.

**Arguments:** $ARGUMENTS (optional: rule categories to scaffold)

## Instructions

### Step 1: Detect Agent Environment

Check for existing agent configuration files to detect the environment:

```
.claude/          → Claude Code
.cursorrules      → Cursor
.cursor/rules/    → Cursor (multi-file)
.github/copilot-instructions.md → GitHub Copilot
.windsurfrules    → Windsurf
.clinerules       → Cline/Roo
.aider.conf.yml   → Aider
```

If multiple or none detected, ask the user:

```
? Which AI coding agent are you using?
  - Claude Code
  - Cursor
  - GitHub Copilot
  - Windsurf
  - Cline/Roo
  - Aider
  - Other (describe)
```

### Step 2: Scan Existing Rules

**Always scan for existing rules before generating.** Read any existing rule files in the detected location.

For Claude Code, scan `.claude/rules/*.md`
For Cursor, read `.cursorrules` or `.cursor/rules/*.md`
For Copilot, read `.github/copilot-instructions.md`
etc.

Analyze existing content to understand:
- What conventions are already defined
- What sections/topics are covered
- The writing style and format used

### Step 3: Ask User Preferences

Ask what rule categories they want (if not provided in $ARGUMENTS):

```
? Select rule categories to scaffold:
  ◉ Bun APIs (prefer Bun over Node.js APIs)
  ◉ Git workflow (conventional commits, sandbox workarounds)
  ◉ GitHub CLI (PR/issue patterns)
  ◉ TypeScript conventions (type > interface, arrow functions)
  ◉ Testing patterns (Bun test runner conventions)
```

### Step 4: Generate Rules

Generate rule content for each selected category. Adapt the content based on:

1. **Agent capabilities**:
   - Remove sandbox-specific guidance for agents without sandboxing
   - Adjust tool references (e.g., "Bash tool" → "terminal" for generic agents)

2. **Agent format**:
   - Claude Code: Separate markdown files in `.claude/rules/`
   - Cursor: Single `.cursorrules` file or `.cursor/rules/*.md`
   - Copilot: Single `.github/copilot-instructions.md`
   - Others: Appropriate format for that agent

3. **Existing content**:
   - If user has existing rules, generate content that complements rather than duplicates

### Step 5: Propose Merges (If Existing Rules Found)

If existing rules were found in Step 2, compare generated content with existing:

1. **Identify overlaps**: Sections covering the same topic
2. **Show diff**: Present what would be added/changed
3. **Ask for approval**:

```
? Existing rules found. How would you like to proceed?

  For "Git Workflow" (exists in your rules):
  ◯ Keep existing (skip)
  ◉ Merge (add missing sections)
  ◯ Replace entirely

  For "TypeScript Conventions" (new):
  ◉ Add to rules
  ◯ Skip
```

For merges, show the proposed combined content before writing.

### Step 6: Write Rules

After user approval, write the rules to the appropriate location:

- Create directories if needed
- Write/merge files as approved
- Report what was created/modified

### Rule Content Guidelines

When generating rules, include these topics per category:

**Bun APIs:**
- Prefer `Bun.file()` over `fs` APIs
- Use `Bun.$` for shell commands
- Use `Bun.write()` for file writes
- Use `import.meta.dir` for current directory

**Git Workflow:**
- Conventional commit prefixes (feat, fix, refactor, docs, chore, test)
- Multi-line commit message format
- Sandbox workarounds (if applicable to agent)

**GitHub CLI:**
- Prefer `gh` CLI over WebFetch for GitHub URLs
- PR review patterns
- Issue/PR JSON field references

**TypeScript Conventions:**
- Prefer `type` over `interface`
- No `any` types (use `unknown` with guards)
- Arrow functions preferred
- Object parameter pattern for 2+ params
- PascalCase for types, `PascalCaseSchema` for Zod schemas

**Testing Patterns:**
- Use `test()` instead of `it()`
- `*.spec.ts` naming convention
- No conditionals around assertions
- Assert existence before checking values

### Output Format

After completion, summarize:

```
✅ Rules scaffolded for [Agent Name]:

  Created:
    • [file path] - [categories included]

  Merged:
    • [file path] - [sections added]

  Skipped:
    • [category] - [reason]

💡 Review the generated rules and customize as needed.
```
