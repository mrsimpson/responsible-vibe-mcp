# Development Plan: responsible-vibe (better-phase-tasks branch)

*Generated on 2026-02-09 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Improve phase transitioning when using beads by:
1. Ensuring phase tasks are checked for completion before transitions
2. Fixing task creation to target the correct phase

## Explore
<!-- beads-phase-id: responsible-vibe-11.1 -->
### Tasks

*Tasks managed via `bd` CLI*

## Plan
<!-- beads-phase-id: responsible-vibe-11.2 -->
### Phase Entrance Criteria:
- [ ] The problem has been thoroughly explored and understood
- [ ] Current implementation has been analyzed
- [ ] Root causes of phase transition issues have been identified
- [ ] Requirements for the fix are clearly defined

### Tasks

*Tasks managed via `bd` CLI*

## Code
<!-- beads-phase-id: responsible-vibe-11.3 -->
### Phase Entrance Criteria:
- [ ] Implementation approach has been planned and documented
- [ ] Technical design decisions have been made
- [ ] Code changes have been outlined with clear scope
- [ ] Dependencies and affected components are identified

### Tasks

*Tasks managed via `bd` CLI*

## Commit
<!-- beads-phase-id: responsible-vibe-11.4 -->
### Phase Entrance Criteria:
- [ ] All planned code changes have been implemented
- [ ] Code has been tested and verified to work correctly
- [ ] Phase transition logic properly validates task completion
- [ ] Task creation targets the correct phase

### Tasks

*Tasks managed via `bd` CLI*

## Key Decisions

### Phase Transition Task Validation Issue
- **Problem**: Phase transitions don't check if tasks are completed before allowing transition
- **Root Cause**: BeadsPlugin.validateBeadsTaskCompletion() method exists but has graceful degradation that allows transitions even when validation fails
- **Location**: `packages/mcp-server/src/plugin-system/beads-plugin.ts` line ~200-300
- **Current Behavior**: Logs warnings but continues with transition instead of blocking

### Task Creation Targeting Wrong Phase Issue  
- **Problem**: Tasks sometimes get created for wrong phase
- **Root Cause**: BeadsInstructionGenerator.extractPhaseTaskId() relies on parsing plan file comments to find phase task IDs
- **Location**: `packages/mcp-server/src/components/beads/beads-instruction-generator.ts` line ~150-200
- **Current Behavior**: If phase task ID extraction fails, returns null and provides generic guidance without specific parent task ID

### Key Components Identified
1. **BeadsPlugin**: Handles phase transition validation via `beforePhaseTransition` hook
2. **ProceedToPhaseHandler**: Main phase transition logic in `packages/mcp-server/src/tool-handlers/proceed-to-phase.ts`
3. **BeadsInstructionGenerator**: Provides task management guidance and extracts phase task IDs
4. **TransitionEngine**: Core transition logic in `packages/core/src/transition-engine.ts`

### Implementation Strategy
**Primary Fix**: Modify BeadsPlugin.validateBeadsTaskCompletion() to properly block transitions when tasks are incomplete, removing the graceful degradation that allows invalid transitions.

**Secondary Fix**: Improve BeadsInstructionGenerator.extractPhaseTaskId() to be more robust in finding phase task IDs and provide better fallback behavior.

**Supporting Improvements**: 
- Enhanced error messages with specific task details and resolution guidance
- Comprehensive test coverage for validation scenarios

### Technical Approach
1. **Phase Transition Validation**: Remove try-catch blocks that swallow validation errors in BeadsPlugin
2. **Task ID Extraction**: Add multiple fallback strategies for finding phase task IDs in plan files
3. **Error Handling**: Provide actionable error messages with specific task IDs and bd CLI commands
4. **Testing**: Cover edge cases like missing beads state, malformed plan files, and incomplete tasks

## Notes
*Additional context and observations*

---
*This plan is maintained by the LLM and uses beads CLI for task management. Tool responses provide guidance on which bd commands to use for task management.*
