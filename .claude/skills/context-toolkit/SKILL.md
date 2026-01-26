---
name: context-toolkit
description: Manage project context, session state, and progress tracking. Use this skill when starting a new session, resuming work, or needing to understand the current project state.
license: MIT
---

# Context Toolkit

This skill helps maintain project continuity across sessions by managing context files and progress tracking.

## When to Use

Activate this skill when:
- Starting a new coding session
- Resuming work after a break
- Needing to understand current project state
- Updating progress documentation
- Planning next steps

## Context Files Structure

### SESSION_CONTEXT.md
Location: `planning/SESSION_CONTEXT.md`
Purpose: Current session state, what was just completed, immediate next steps

Update this file:
- At the start of each session with current focus
- After completing significant milestones
- Before ending a session with handoff notes

### PROGRESS_REPORT.md
Location: `planning/PROGRESS_REPORT.md`
Purpose: Comprehensive implementation summary, completed features, pending work

### PRD Files
Location: `planning/PRD_*.md`
Purpose: Product requirements, feature specifications, acceptance criteria

## Session Start Protocol

1. Read `planning/SESSION_CONTEXT.md` for immediate context
2. Read `planning/PROGRESS_REPORT.md` for overall status
3. Check git status for uncommitted changes
4. Summarize current state to user
5. Ask what to work on next

## Session End Protocol

1. Update `planning/SESSION_CONTEXT.md` with:
   - What was accomplished
   - Current state of any in-progress work
   - Recommended next steps
2. Update `planning/PROGRESS_REPORT.md` if milestones completed
3. Ensure all changes are committed with clear messages

## Progress Tracking

Use TodoWrite tool for:
- Breaking down complex tasks
- Tracking completion status
- Maintaining visibility for the user

## Best Practices

- Always read before writing to understand existing context
- Keep updates concise but complete
- Include specific file paths and line numbers
- Note any blockers or dependencies
- Provide clear handoff notes for future sessions
