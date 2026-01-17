---
description: Scaffold or merge development rules for your AI coding agent
allowed-tools: Glob, Read, Write, Edit, AskUserQuestion
---

# Scaffold Rules

Generate development rules adapted to the user's AI coding agent environment.

**Arguments:** $ARGUMENTS (optional: rule categories to scaffold)

## Instructions

### Step 1: Get Processed Templates from CLI

Call the CLI to get rule templates with variables already processed:

```bash
bunx @plaited/development-skills scaffold-rules --format=json
```

The CLI will:
- Read bundled rule templates from the package
- Process template variables ({{LINK:*}}, {{#if}}, etc.)
- Output JSON with processed content

Parse the JSON output to get available templates. The output structure is:
```json
{
  "templates": {
    "accuracy": {
      "filename": "accuracy.md",
      "content": "# Accuracy and Confidence Standards\n...",
      "description": "95% confidence threshold, verification protocols"
    },
    "testing": { ... },
    ...
  }
}
```

### Step 2: Detect Agent & Scan Existing Rules

Determine target rules location based on agent environment:

Check for existing agent configuration files:
```
.claude/          → Claude Code (.claude/rules/)
.cursorrules      → Cursor (.cursorrules or .cursor/rules/)
.cursor/rules/    → Cursor (multi-file)
.github/copilot-instructions.md → GitHub Copilot
.windsurfrules    → Windsurf
.clinerules       → Cline/Roo
.aider.conf.yml   → Aider
```

**Always scan for existing rules before writing.** Use Read tool to check what's already there.

Analyze existing content to understand:
- What conventions are already defined
- What sections/topics are covered
- The writing style and format used

### Step 3: Ask User Preferences

Present available templates from CLI output and ask which to scaffold (if not provided in $ARGUMENTS):

```
? Select rule categories to scaffold:
  ◉ accuracy - 95% confidence threshold, verification protocols
  ◉ bun-apis - Prefer Bun over Node.js APIs
  ◉ git-workflow - Conventional commits, multi-line messages
  ◉ github - GitHub CLI patterns for PRs/issues
  ◉ code-review - TypeScript conventions, module organization
  ◉ testing - Bun test runner conventions
```

### Step 4: Propose Merges (If Existing Rules Found)

If existing rules were found in Step 2, compare with CLI output:

1. **Identify overlaps**: Which templates already exist as files
2. **Show what would be added**: Preview the content from CLI
3. **Ask for approval**:

```
? Existing rules found. How would you like to proceed?

  For "git-workflow.md" (exists):
  ◯ Keep existing (skip)
  ◉ Merge (add missing sections)
  ◯ Replace entirely

  For "testing.md" (new):
  ◉ Add to rules
  ◯ Skip
```

For merges:
- Use Read to get existing content
- Show diff of what would change
- Get approval before writing

### Step 5: Write Rules

After user approval, write the rules using the content from CLI output:

- Use Write tool with `content` from CLI JSON
- Create directories if needed (`.claude/rules/`, etc.)
- Write/merge files as approved
- Report what was created/modified

### Rule Content Guidelines

The CLI processes template variables automatically. The content in the JSON output is ready to write to files.

**Template Processing:**
The CLI handles:
- Template variable substitution ({{LINK:*}}, {{AGENT_NAME}}, etc.)
- Conditional blocks ({{#if development-skills}}, {{#if agent:*}})
- Template header removal
- Cross-reference formatting for detected agent

**Available Rule Topics:**

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

### Step 6: Output Summary

After completion, summarize what was done:

```
✅ Rules scaffolded for Claude Code:

  Created:
    • .claude/rules/testing.md - Bun test conventions
    • .claude/rules/bun-apis.md - Prefer Bun over Node.js

  Merged:
    • .claude/rules/git-workflow.md - Added commit message formats

  Skipped:
    • accuracy.md - Already exists, user chose to keep

💡 Review the generated rules at .claude/rules/ and customize as needed.
```

### CLI Usage

The scaffold-rules CLI can be called with options:

```bash
# Default: outputs all rules for Claude Code
bunx @plaited/development-skills scaffold-rules --format=json

# Specify agent
bunx @plaited/development-skills scaffold-rules --agent=cursor --format=json

# Filter specific rules
bunx @plaited/development-skills scaffold-rules --rules testing --rules bun-apis
```

**Options:**
- `--agent` / `-a`: Target agent (claude, cursor, copilot, windsurf, cline, aider)
- `--format` / `-f`: Output format (json)
- `--rules` / `-r`: Specific rules to include (can be used multiple times)
