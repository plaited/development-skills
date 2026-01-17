<!--
RULE TEMPLATE - Distributed via /scaffold-rules
Variables: {{#if agent:claude}}
-->

# Git Workflow

## Commit Message Format

{{#if agent:claude}}
When creating commits with multi-line messages, use single-quoted strings instead of heredocs. The sandbox environment restricts temp file creation needed for heredocs.
{{/if}}
{{^if agent:claude}}
Use multi-line commit messages for detailed changes:
{{/if}}

{{#if agent:claude}}
```bash
# ✅ CORRECT: Single-quoted multi-line string
git commit -m 'refactor: description here

Additional context on second line.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>'

# ❌ WRONG: Heredoc syntax (fails in sandbox)
git commit -m "$(cat <<'EOF'
refactor: description here
EOF
)"
```

The heredoc approach fails with:
```
(eval):1: can't create temp file for here document: operation not permitted
```
{{/if}}
{{^if agent:claude}}
```bash
git commit -m "refactor: description here

Additional context on second line."
```
{{/if}}

## Pre-commit Hooks

**Never use `--no-verify`** to bypass pre-commit hooks. If hooks fail, it indicates a real issue that must be fixed:

1. Investigate the error message
2. Fix the underlying issue (lint errors, format issues, test failures)
3. Re-run the commit

Using `--no-verify` masks problems and defeats the purpose of automated quality checks.

## Commit Conventions

Follow conventional commits format:
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code changes that neither fix bugs nor add features
- `docs:` - Documentation only changes
- `chore:` - Maintenance tasks
- `test:` - Adding or updating tests
