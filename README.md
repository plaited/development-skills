# development-skills

TypeScript LSP, code documentation, and validation tools. Available as both a CLI tool and as installable skills for AI coding agents.

## CLI Tool

Use these tools directly via the CLI without installation:

```bash
# Run without installing
bunx @plaited/development-skills lsp-hover src/index.ts 10 5

# Or install globally
bun add -g @plaited/development-skills
development-skills lsp-find parseConfig
```

### Commands

| Command | Description |
|---------|-------------|
| `lsp-hover <file> <line> <char>` | Get type information at position |
| `lsp-find <query> [file]` | Search for symbols across workspace |
| `lsp-refs <file> <line> <char>` | Find all references to symbol |
| `lsp-analyze <file> [options]` | Batch analysis of file |
| `validate-skill <path>` | Validate AgentSkills spec |

### Examples

```bash
# Type information
bunx @plaited/development-skills lsp-hover src/app.ts 25 10

# Symbol search
bunx @plaited/development-skills lsp-find UserConfig

# Find references
bunx @plaited/development-skills lsp-refs src/types.ts 15 8

# Module analysis
bunx @plaited/development-skills lsp-analyze src/index.ts --all

# Validate skills
bunx @plaited/development-skills validate-skill .claude/skills
```

## Skills for AI Agents

**Install skills** for use with AI coding agents:

```bash
curl -fsSL https://raw.githubusercontent.com/plaited/skills-installer/main/install.sh | bash -s -- --agent <agent-name> --project development-skills
```

Replace `<agent-name>` with your agent: `claude`, `cursor`, `copilot`, `opencode`, `amp`, `goose`, `factory`

**Update skills:**

```bash
curl -fsSL https://raw.githubusercontent.com/plaited/skills-installer/main/install.sh | bash -s -- update --agent <agent-name> --project development-skills
```

### Available Skills

### TypeScript LSP

TypeScript Language Server Protocol integration for exploring and understanding TypeScript/JavaScript codebases.

**Use LSP over Grep/Glob when:**
- Finding all usages of a function/type (LSP understands re-exports, aliases)
- Searching for symbols by name (LSP ignores strings, comments)
- Understanding file exports (LSP resolves re-exports)
- Getting type signatures (not possible with grep)

#### Commands

##### `/lsp-hover`

Get type information at a specific position.

```bash
/lsp-hover src/utils/parser.ts 42 10
```

##### `/lsp-find`

Search for symbols across the workspace.

```bash
/lsp-find parseConfig
/lsp-find validateInput src/lib/validator.ts
```

##### `/lsp-refs`

Find all references to a symbol (before refactoring).

```bash
/lsp-refs src/utils/parser.ts 42 10
```

##### `/lsp-analyze`

Batch analysis of a file.

```bash
/lsp-analyze src/utils/parser.ts --exports
/lsp-analyze src/utils/parser.ts --all
/lsp-analyze src/utils/parser.ts --hover 50:10 --refs 60:5
```

#### Path Resolution

All commands accept:
- **Absolute paths**: `/Users/name/project/src/file.ts`
- **Relative paths**: `./src/file.ts`
- **Package export paths**: `my-package/src/module.ts` (resolved via `Bun.resolve()`)

### Skill Validation

Validate skill directories against the AgentSkills specification.

#### Commands

##### `/validate-skill`

Validate skill directories.

```bash
/validate-skill .claude/skills
/validate-skill .claude/skills/typescript-lsp
```

## Development

```bash
# Install dependencies
bun install

# Run checks
bun run check

# Run tests
bun test
```

## License

ISC
