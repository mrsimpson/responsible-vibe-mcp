# Development Plan: responsible-vibe (fix-path-kiro-windows branch)

*Generated on 2026-03-02 by Vibe Feature MCP*
*Workflow: [bugfix](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/bugfix)*

## Goal
Fix Windows path handling in conversation ID generation - paths using backslashes are not properly parsed, causing malformed directory creation.

**Error reported:**
```
ENOENT: no such file or directory, mkdir 'c:\work_knechte\cross-team-knechte.vibe\conversations\c:\work_knechte\cross-team-knechte-default-khok93'
```

**Root cause identified:**
In `packages/core/src/conversation-manager.ts` line 283:
```typescript
const projectName = projectPath.split('/').pop() || 'unknown-project';
```
This splits by forward slash `/` but Windows paths use backslashes `\`. As a result, the entire Windows path becomes the "project name".

## Reproduce
<!-- beads-phase-id: responsible-vibe-14.1 -->
### Tasks

*Tasks managed via `bd` CLI*

## Analyze
<!-- beads-phase-id: responsible-vibe-14.2 -->
### Phase Entrance Criteria:
- [x] Bug has been reproduced or confirmed via error analysis
- [x] Environment details are documented

### Tasks

*Tasks managed via `bd` CLI*

## Fix
<!-- beads-phase-id: responsible-vibe-14.3 -->
### Phase Entrance Criteria:
- [x] Root cause has been identified
- [x] Fix approach has been determined
- [x] All affected locations are identified

### Tasks

*Tasks managed via `bd` CLI*

## Verify
<!-- beads-phase-id: responsible-vibe-14.4 -->
### Phase Entrance Criteria:
- [x] Fix has been implemented
- [x] Unit tests have been written/updated

### Tasks

*Tasks managed via `bd` CLI*

## Finalize
<!-- beads-phase-id: responsible-vibe-14.5 -->
### Phase Entrance Criteria:
- [x] All tests pass
- [x] Fix has been verified manually or via test
### Tasks
- [ ] Squash WIP commits: `git reset --soft <first commit of this branch>. Then, Create a conventional commit. In the message, first summarize the intentions and key decisions from the development plan. Then, add a brief summary of the key changes and their side effects and dependencies

*Tasks managed via `bd` CLI*

## Key Decisions

### Fix Approach: DRY cross-platform utility function
**Rationale:** Instead of individually fixing each `.split('/').pop()` occurrence, created a reusable `getPathBasename()` utility function that:
1. Normalizes both `\` and `/` path separators for cross-platform support
2. Uses Node.js's `basename()` internally
3. Provides a fallback value parameter
4. Is exported from `@codemcp/workflows-core` for use across packages

### Implementation Details:
- Added `getPathBasename()` to `packages/core/src/path-validation-utils.ts`
- The function converts backslashes to forward slashes before using `basename()`
- This ensures Windows paths work correctly even when running on Unix

### Files Modified:
1. `packages/core/src/path-validation-utils.ts` - Added `getPathBasename()` utility
2. `packages/core/src/conversation-manager.ts` - Use `getPathBasename()` for project name
3. `packages/core/src/plan-manager.ts` - Use `getPathBasename()` for project name
4. `packages/mcp-server/src/components/beads/beads-plan-manager.ts` - Use `getPathBasename()`
5. `packages/mcp-server/src/plugin-system/beads-plugin.ts` - Use `getPathBasename()` for project and plan names
6. `packages/mcp-server/src/tool-handlers/start-development.ts` - Use native `basename()` (already imported)

### Tests Added:
- `packages/core/test/unit/path-utils.test.ts` - 11 tests covering Unix paths, Windows paths, mixed paths, and edge cases

## Notes
- The issue was reported on Windows with the Kiro IDE
- Node.js's native `path.basename()` only handles the path separator for the current platform
- Our custom function handles both separators regardless of platform

---
*This plan is maintained by the LLM and uses beads CLI for task management. Tool responses provide guidance on which bd commands to use for task management.*
