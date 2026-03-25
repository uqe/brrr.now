# Repository Guidelines

## Semantic Commit Messages

Format: `<type>(<scope>): <subject>` (`<scope>` optional)

**Rules:**

- Commit messages **must be in English only**
- Keep them brief and concise (up to 50 characters in the subject)
- Use `git commit -S` for signed commits
- When committing at the user's request, **always** include files from `bot-data/` in the commit

**Commit Types:**

- `feat`: new functionality
- `fix`: bug fix
- `docs`: documentation changes
- `style`: code formatting
- `refactor`: code refactoring
- `test`: adding tests
- `chore`: dependency/configuration updates

**Examples:** `feat: add webhook URL normalization`, `fix: throw on empty webhook input`, `docs: document sendNotification usage`

## Project Structure & Module Organization

`src/index.ts` is the library entry point and currently holds the full public API for the package. Keep user-facing exports here unless the codebase grows into internal modules. `test/index.test.ts` contains Bun unit tests for request payloads, URL resolution, and error handling. `dist/` is generated build output published to npm; treat it as derived code and do not edit it manually. Repository automation lives in `.github/`, including CI, release workflows, and issue/PR templates.

## Build, Test, and Development Commands

Use Bun for local work:

- `bun install`: install dependencies from `bun.lock`.
- `bun run dev`: watch and rebuild the package with `bunup`.
- `bun run build`: produce the distributable files in `dist/`.
- `bun run test`: run the Bun test suite.
- `bun run test:watch`: rerun tests while editing.
- `bun run test:coverage`: collect coverage locally.
- `bun run lint`: run `oxlint`.
- `bun run format`: format files with `oxfmt`.
- `bun run type-check`: run `tsc --noEmit`.

## Coding Style & Naming Conventions

Write TypeScript as ESM with strict typing; `tsconfig.json` enables strict checks and declaration generation. Follow the existing source style: 2-space indentation in `.ts` files, double quotes, semicolons, trailing commas in multiline structures, and concise exported helpers. Use `PascalCase` for types/interfaces such as `SendNotificationParams`, `camelCase` for functions and variables such as `sendNotification`, and keep API field mapping explicit when converting to webhook payload keys.

## Testing Guidelines

Tests use `bun:test`. Add or update tests in `test/*.test.ts` for every behavior change, especially around request serialization, webhook normalization, and thrown errors. Prefer descriptive test names written as full behavior statements, for example `test("throws when webhook is empty after trimming", ...)`. Run `bun run test`, `bun run lint`, and `bun run type-check` before opening a PR; CI runs the same checks on Ubuntu, macOS, and Windows.

## Commit & Pull Request Guidelines

Follow Conventional Commits; current history uses messages like `feat: add brrr.now webhook client`. Keep scopes concise when useful, for example `fix(api): handle empty webhook`. PRs should match `.github/PULL_REQUEST_TEMPLATE.md`: include a short description, change type, related issues, test notes, and documentation updates when behavior changes. Add screenshots only when they clarify docs or workflow changes.

## Security & Configuration Tips

Never commit real webhook secrets. Use environment variables such as `BRRR_WEBHOOK` in examples, fixtures, and local testing.
