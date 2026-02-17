# Development Plan: responsible-vibe (fix-missing-start_development branch)

*Generated on 2026-02-17 by Vibe Feature MCP*
*Workflow: [bugfix](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/bugfix)*

## Goal
Fix bug where whats_next error message doesn't properly instruct agents to start development

## Reproduce
<!-- beads-phase-id: responsible-vibe-11.1 -->
### Tasks

*Tasks managed via `bd` CLI*

## Analyze
<!-- beads-phase-id: responsible-vibe-11.2 -->

### Phase Entrance Criteria:
- [ ] The bug has been successfully reproduced
- [ ] Steps to reproduce are documented
- [ ] Current error behavior is clearly identified

### Tasks

*Tasks managed via `bd` CLI*

## Fix
<!-- beads-phase-id: responsible-vibe-11.3 -->

### Phase Entrance Criteria:
- [ ] Root cause of the bug has been identified
- [ ] Impact and scope of the issue is understood
- [ ] Solution approach has been determined

### Tasks

*Tasks managed via `bd` CLI*

## Verify
<!-- beads-phase-id: responsible-vibe-11.4 -->

### Phase Entrance Criteria:
- [ ] Fix has been implemented
- [ ] Code changes are complete
- [ ] Implementation addresses the root cause

### Tasks

*Tasks managed via `bd` CLI*

## Finalize
<!-- beads-phase-id: responsible-vibe-11.5 -->

### Phase Entrance Criteria:
- [ ] Fix has been verified to work correctly
- [ ] No regressions have been introduced
- [ ] Testing confirms the bug is resolved

### Tasks

*Tasks managed via `bd` CLI*

## Key Decisions

### Root Cause Analysis

**Problem:** Error messages from `whats_next` don't explicitly instruct AI agents to call `start_development()` function.

**Analysis of Current Messages:**

1. **Message 1 (no workflows):** "Please adjust the VIBE_WORKFLOW_DOMAINS environment variable or copy a workflow to .vibe/workflows/ directory."
   - **Issue:** Focuses on environment setup, doesn't mention function calls
   - **Agent Impact:** Agents may try to modify environment instead of calling tools

2. **Message 2 (workflows available):** "Please use the start_development tool first to initialize development with a workflow."
   - **Issue:** Says "use the tool" but doesn't explicitly say "call start_development()"
   - **Agent Impact:** Some agents may not recognize this as a function call instruction

**Root Cause:** Messages are written for human users, not AI agents that need explicit function call instructions.

### Solution Design

**Implemented Fix:**
- Changed "Please use the start_development tool" → "Please call start_development()"
- Changed "Please adjust the VIBE_WORKFLOW_DOMAINS" → "Please call start_development() to begin. First, set up workflows..."
- Updated suggestion metadata to match

**KISS Principle Applied:**
- Minimal change to existing function
- Only modified the error message strings
- Preserved all existing functionality and metadata
- No structural changes to code

**Verification Results:**
- ✅ All existing tests pass
- ✅ Error messages now contain "call start_development()" 
- ✅ Messages still contain required context about conversation not started
- ✅ No regressions introduced
- ✅ Fix addresses the exact root cause identified

## Notes

### Bug Reproduction - Current Error Message Behavior

**Current Error Messages from `whats_next` when no development is started:**

1. **When no workflows available:**
   ```
   No development conversation has been started for this project and no workflows are available. Please adjust the VIBE_WORKFLOW_DOMAINS environment variable or copy a workflow to .vibe/workflows/ directory.
   ```

2. **When workflows are available:**
   ```
   No development conversation has been started for this project. Please use the start_development tool first to initialize development with a workflow.
   ```

**Problem Identified:**
The error messages don't explicitly instruct agents to call `start_development()`. While the second message mentions "use the start_development tool", it's not clear enough for all AI agents to understand they should make a function call.

**Expected Behavior:**
Error messages should clearly instruct agents to call the `start_development()` function with proper guidance on parameters.

---
*This plan is maintained by the LLM and uses beads CLI for task management. Tool responses provide guidance on which bd commands to use for task management.*
