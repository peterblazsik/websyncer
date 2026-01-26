# Git Commit Helper

A skill for creating clean, standardized git commits following conventional commit standards.

## When to Use

Use this skill when:
- Creating git commits
- Writing commit messages
- Reviewing commit history for consistency
- Preparing commits for professional repositories (e.g., ING Bank, enterprise codebases)

## Invocation

This skill is automatically applied when the user asks to commit changes or when `/commit` is invoked.

## Commit Message Format

Follow the **Conventional Commits** specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Code style changes (formatting, semicolons, etc.) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `build` | Changes to build system or dependencies |
| `ci` | Changes to CI configuration |
| `chore` | Other changes that don't modify src or test files |
| `revert` | Reverts a previous commit |

### Rules

1. **Subject line**: Max 50 characters, imperative mood, no period
2. **Body**: Wrap at 72 characters, explain *what* and *why* (not *how*)
3. **Scope**: Optional, indicates the module/component affected
4. **Breaking changes**: Add `!` after type/scope or `BREAKING CHANGE:` in footer

### Examples

```bash
# Simple feature
feat(auth): add Google OAuth2 sign-in

# Bug fix with scope
fix(cart): resolve quantity update race condition

# Breaking change
feat(api)!: change authentication endpoint structure

BREAKING CHANGE: /auth/login is now /auth/sign-in

# With body
fix(payment): handle Stripe webhook timeout

The webhook handler was timing out on high-latency responses.
Added retry logic with exponential backoff (max 3 attempts).

Closes #142
```

### Pre-Commit Checklist

Before committing, verify:

- [ ] All tests pass (`npm test` or equivalent)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No sensitive data (API keys, passwords, tokens)
- [ ] Commit is atomic (single logical change)
- [ ] Related changes are grouped together

### Co-Author Attribution

When AI assists with code:

```
feat(component): implement user dashboard

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Branch Naming Convention

```
<type>/<ticket-id>-<short-description>

Examples:
feat/PROJ-123-user-authentication
fix/PROJ-456-cart-total-calculation
chore/PROJ-789-update-dependencies
```

## Integration

This skill integrates with the standard git workflow:

1. Stage changes: `git add .`
2. Review staged: `git diff --staged`
3. Commit with message following this format
4. Push to remote (if appropriate)
