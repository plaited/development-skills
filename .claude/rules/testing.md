<!--
RULE TEMPLATE - Distributed via /scaffold-rules
Variables: {{#if agent:claude}}
-->

# Testing

Use Bun's built-in test runner for unit and integration tests.

## Test Types

### Unit/Integration Tests (`*.spec.ts`)

Standard Bun tests using `*.spec.ts` extension:
- Run with `bun test` command
- Used for testing business logic, utilities, and non-visual functionality

## Running Tests

```bash
# Run all unit tests
bun test

# Run a specific spec test file
bun test path/to/file.spec.ts

# Run tests matching a pattern
bun test pattern
```

## Test Style Conventions

### Use `test` Instead of `it`

Use `test` instead of `it` in test files for consistency:

```typescript
// ✅ Good
test('should create ACP client correctly', () => {
  // ...
})

// ❌ Avoid
it('should create ACP client correctly', () => {
  // ...
})
```

## Anti-Patterns

### No Conditionals Around Assertions

Never wrap assertions in conditionals. Tests should fail explicitly, not silently skip assertions.

```typescript
// ❌ WRONG: Conditional assertion
if (result) {
  expect(result.value).toBe(expected)
}

// ❌ WRONG: Optional chaining with assertion
result?.value && expect(result.value).toBe(expected)

// ✅ CORRECT: Assert the condition, then assert the value
expect(result).toBeDefined()
expect(result.value).toBe(expected)

// ✅ CORRECT: Use type narrowing assertion
expect(result).not.toBeNull()
expect(result!.value).toBe(expected)
```

If a value might not exist, the test should either:
1. Assert that it exists first, then check its value
2. Assert that it doesn't exist (if that's the expected behavior)
3. Restructure the test to ensure the value is always present

## Docker Integration Tests

Tests that require external services or API keys can run in Docker containers for consistent, isolated execution.

### File Naming

- **`*.docker.ts`**: Tests that run in Docker containers
- These are excluded from `bun test` and run separately via Docker Compose

### Running Docker Tests

```bash
# Run with Docker Compose (requires API key)
ANTHROPIC_API_KEY=sk-... docker compose -f docker-compose.test.yml run --rm test

# Or using an npm script if configured
ANTHROPIC_API_KEY=sk-... bun run test:docker
```

### CI Workflow Pattern

Docker tests can use path filtering to reduce API costs:

```yaml
# .github/workflows/ci.yml
jobs:
  changes:
    # Detects which paths changed
    steps:
      - uses: dorny/paths-filter@v3
        with:
          filters: |
            integration:
              - 'src/**'

  test-integration:
    needs: changes
    if: ${{ needs.changes.outputs.integration == 'true' }}
    # Only runs when src/ files change
```

### When to Use Docker Tests

Use Docker for tests that:
- Require external API calls (Anthropic, OpenAI, etc.)
- Need specific environment configurations
- Should be isolated from the local development environment
- Are expensive to run and should be gated in CI
