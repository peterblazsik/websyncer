# Session Ending Skill

Use this skill when the context window is getting full and you need to wrap up the session properly.

## When to Use
- When context window is ~70%+ full
- When the user types `/ending`
- When the user says "wrap up" or "end session"

## Instructions

Execute all of the following steps:

### Step 1: Write Tests for Everything Implemented

Review the session and identify all features/changes that were implemented.

For each change that doesn't already have tests:

**Web changes (`orthoscan-web/`):**
1. Create test files in `src/__tests__/`
2. Use Jest + React Testing Library
3. Cover main functionality and edge cases
4. Run `npm test` to verify

**API changes (`orthoscan-api/`):**
1. Create/update test files
2. Test endpoints, error handling

### Step 2: Browser Testing with Chrome Extension

1. Deploy the latest changes:
```bash
cd /Users/peterblazsik/DevApps/O_S_v2/orthoscan-web && npm run build && npm run deploy
```

2. Use MCP browser tools to test:
   - `mcp__Claude_in_Chrome__tabs_context_mcp` - Get tab context
   - `mcp__Claude_in_Chrome__tabs_create_mcp` - Create new tab if needed
   - `mcp__Claude_in_Chrome__navigate` - Navigate to the deployed site
   - `mcp__Claude_in_Chrome__read_page` - Verify page content
   - `mcp__Claude_in_Chrome__computer` - Interact with elements
   - Take screenshots of key features

3. Test each implemented feature in the browser

### Step 3: Update PRD and Progress Notes

1. **Update `planning/PRD_iOS_IMPROVEMENTS.md`:**
   - Mark completed tasks with ✅ COMPLETE
   - Add completion dates
   - Add implementation notes where relevant

2. **Update `planning/SESSION_CONTEXT.md`:**
   - What was accomplished this session
   - Current state of any in-progress work
   - Files created/modified
   - Any issues discovered
   - Recommended next steps

3. **Update `planning/PROGRESS_REPORT.md`:**
   - Add session entry with date
   - List all completed tasks
   - Note any blockers or follow-ups

### Step 4: Generate Session Handoff Prompt

Create a comprehensive prompt for starting the next session. Include:

```
## Session Handoff Prompt

Copy this to start your next session:

---

I'm continuing work on the ARTIN Insoles project. Here's what was completed in the last session:

**Completed:**
- [List of completed tasks]

**Current State:**
- [Describe current state of any in-progress work]

**Files Modified:**
- [List of key files changed]

**Recommended Next Steps:**
1. [First priority]
2. [Second priority]
3. [Third priority]

Please read the planning files (SESSION_CONTEXT.md, PRD_iOS_IMPROVEMENTS.md) and let me know what you'd like to work on.

---
```

### Step 5: Ask About Git Push

Use the AskUserQuestion tool to ask:

"Would you like me to commit and push these changes to git?"

Options:
- Yes, commit and push
- Just commit, don't push
- No, I'll handle git myself

If user wants to commit:
1. Run `git status` to see changes
2. Run `git diff` to review
3. Create a descriptive commit message
4. Commit with co-author tag
5. Push if requested

## Summary Output

At the end, provide a summary:
- Number of tests written
- Browser test results
- Files updated
- Git status
- The handoff prompt for next session
