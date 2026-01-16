# development-skills

Development skills for Claude Code - TypeScript LSP, code documentation, and validation tools.

## Installation

Install via the Plaited marketplace:

```bash
/plugin marketplace add plaited/marketplace
```

**Other AI coding agents:**

```bash
curl -fsSL https://raw.githubusercontent.com/plaited/marketplace/main/install.sh | bash -s -- --agent <agent-name> --plugin development-skills

Supported agents: gemini, copilot, cursor, opencode, amp, goose, factory
```

## Skills

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
