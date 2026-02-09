# Development Plan: responsible-vibe (fix-auto-beads-integration branch)

*Generated on 2026-02-09 by Vibe Feature MCP*
*Workflow: [bugfix](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/bugfix)*

## Goal
Fix the beads auto-detection bug: The `BeadsPlugin.isEnabled()` method checks `process.env.TASK_BACKEND === 'beads'` but when auto-detection is used (no env var set), the variable is never set. The `server-config.ts` correctly auto-detects beads and creates BeadsPlanManager/BeadsInstructionGenerator, but the BeadsPlugin's `isEnabled()` check fails because it only checks the env variable.

**Root Cause**: The auto-detection result from `TaskBackendManager.detectTaskBackend()` is not being used by `BeadsPlugin.isEnabled()`. The plugin checks `process.env.TASK_BACKEND` directly instead of using the detection result.

**Solution**: Pass the detection result to the plugin or have the plugin use the same detection logic.

## Reproduce
<!-- beads-phase-id: responsible-vibe-10.1 -->
### Tasks

*Tasks managed via `bd` CLI*

## Analyze
<!-- beads-phase-id: responsible-vibe-10.2 -->

### Phase Entrance Criteria:
- [ ] Bug has been successfully reproduced
- [ ] Root cause location has been identified

### Tasks

*Tasks managed via `bd` CLI*

## Fix
<!-- beads-phase-id: responsible-vibe-10.3 -->

### Phase Entrance Criteria:
- [ ] Root cause is fully understood
- [ ] Fix approach has been determined

### Tasks

*Tasks managed via `bd` CLI*

## Verify
<!-- beads-phase-id: responsible-vibe-10.4 -->

### Phase Entrance Criteria:
- [ ] Fix has been implemented
- [ ] Code compiles without errors

### Tasks

*Tasks managed via `bd` CLI*

## Finalize
<!-- beads-phase-id: responsible-vibe-10.5 -->

### Phase Entrance Criteria:
- [ ] All tests pass
- [ ] Bug is verified as fixed

### Tasks
- [ ] Squash WIP commits: `git reset --soft <first commit of this branch>. Then, Create a conventional commit. In the message, first summarize the intentions and key decisions from the development plan. Then, add a brief summary of the key changes and their side effects and dependencies

*Tasks managed via `bd` CLI*

## Key Decisions
1. **Root cause identified**: `BeadsPlugin.isEnabled()` checks `process.env.TASK_BACKEND === 'beads'` directly, but when auto-detection is used (no env var), the plugin's `isEnabled()` returns false even though `server-config.ts` already determined beads should be active via `TaskBackendManager.detectTaskBackend()`.

2. **Fix approach**: Remove the redundant `isEnabled()` check in `server-config.ts` since we already check `isBeadsBackend` before creating the plugin. The `isEnabled()` method in the plugin should either:
   - Option A: Use `TaskBackendManager.detectTaskBackend()` instead of checking env var directly
   - Option B: Accept the detection result in the constructor and use it
   - Option C: Since `server-config.ts` already gates plugin creation on `isBeadsBackend`, remove the `isEnabled()` check there entirely

3. **Chosen approach**: Option C - The check at line 166-168 in `server-config.ts` is redundant. We already determined `isBeadsBackend` is true before creating the plugin. The plugin's `isEnabled()` method should be updated to use `TaskBackendManager.detectTaskBackend()` for consistency.

## Notes
- Pre-existing test failures in `plan-management.test.ts` and timeout issues in E2E tests are not caused by our fix
- These failures occur because the tests expect markdown checkboxes (`- [ ]`) but when `bd` is available on the system, the beads format is used instead
- All 40 beads-specific integration tests pass with our fix
- Unit tests were updated to properly mock `TaskBackendManager` since it's in a different package (`@codemcp/workflows-core`)

---
*This plan is maintained by the LLM and uses beads CLI for task management. Tool responses provide guidance on which bd commands to use for task management.*
