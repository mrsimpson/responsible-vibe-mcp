# Development Plan: responsible-vibe (beads-phase-deps branch)

*Generated on 2026-01-18 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*
*Task Management: Beads Issue Tracker*

## Goal
Improve the beads integration by:
1. Making phase tasks depend on each other for proper sequential execution
2. Encouraging agents to use --description parameter for richer, more detailed tasks

## Explore
<!-- beads-phase-id: responsible-vibe-1 -->
### Tasks
**🔧 TASK MANAGEMENT VIA CLI TOOL bd**

Tasks are managed via bd CLI tool. Use bd commands to create and manage tasks with proper hierarchy:

- `bd list --parent responsible-vibe-1 --status open`
- `bd create "Task title" --parent responsible-vibe-1 --description "Detailed task description explaining context, approach, and expected outcome" --priority 2`
- `bd update <task-id> --status in_progress`
- `bd close <task-id>`

**IMPORTANT**: Always include --description with detailed context when creating tasks. This provides richer task information for better project tracking.

**Never use [ ] or [x] checkboxes - use bd commands only!**

### Completed
- [x] Created development plan file

## Plan
<!-- beads-phase-id: responsible-vibe-2 -->

### Phase Entrance Criteria:
- [ ] Current beads integration implementation has been analyzed
- [ ] Specific issues with task dependencies and descriptions have been identified
- [ ] Requirements for the improvements have been gathered
- [ ] Technical constraints and existing architecture have been understood

### Tasks
**🔧 TASK MANAGEMENT VIA CLI TOOL bd**

Tasks are managed via bd CLI tool. Use bd commands to create and manage tasks with proper hierarchy:

- `bd list --parent responsible-vibe-2 --status open`
- `bd create "Task title" --parent responsible-vibe-2 --description "Detailed task description explaining context, approach, and expected outcome" --priority 2`
- `bd update <task-id> --status in_progress`
- `bd close <task-id>`

**IMPORTANT**: Always include --description with detailed context when creating tasks. This provides richer task information for better project tracking.

**Never use [ ] or [x] checkboxes - use bd commands only!**

### Completed
*None yet*

## Code
<!-- beads-phase-id: responsible-vibe-3 -->

### Phase Entrance Criteria:
- [ ] Implementation strategy has been thoroughly defined
- [ ] Technical approach for phase task dependencies has been designed
- [ ] Solution for encouraging --description parameter usage has been planned
- [ ] Tasks have been broken down into specific, actionable implementation steps

### Tasks
**🔧 TASK MANAGEMENT VIA CLI TOOL bd**

Tasks are managed via bd CLI tool. Use bd commands to create and manage tasks with proper hierarchy:

- `bd list --parent responsible-vibe-3 --status open`
- `bd create "Task title" --parent responsible-vibe-3 --description "Detailed task description explaining context, approach, and expected outcome" --priority 2`
- `bd update <task-id> --status in_progress`
- `bd close <task-id>`

**IMPORTANT**: Always include --description with detailed context when creating tasks. This provides richer task information for better project tracking.

**Never use [ ] or [x] checkboxes - use bd commands only!**

### Completed
*None yet*

## Commit
<!-- beads-phase-id: responsible-vibe-4 -->

### Phase Entrance Criteria:
- [ ] Core functionality has been implemented and working
- [ ] Phase task dependencies are properly enforced
- [ ] Enhanced task description guidance is functional
- [ ] Code has been tested and validated
- [ ] Integration with existing systems is confirmed

### Tasks
**🔧 TASK MANAGEMENT VIA CLI TOOL bd**

Tasks are managed via bd CLI tool. Use bd commands to create and manage tasks with proper hierarchy:

- `bd list --parent responsible-vibe-4 --status open`
- `bd create "Task title" --parent responsible-vibe-4 --description "Detailed task description explaining context, approach, and expected outcome" --priority 2`
- `bd update <task-id> --status in_progress`
- `bd close <task-id>`

**IMPORTANT**: Always include --description with detailed context when creating tasks. This provides richer task information for better project tracking.

**Never use [ ] or [x] checkboxes - use bd commands only!**

### Completed
*None yet*

## Key Decisions

### Root Cause Identified: Plan File TBD Replacement Issue ✅
**DISCOVERY**: The beads integration correctly creates individual phase tasks:
- `responsible-vibe-1.1` (Explore)
- `responsible-vibe-1.2` (Plan)  
- `responsible-vibe-1.3` (Code)
- `responsible-vibe-1.4` (Commit)

**ACTUAL PROBLEM**: The plan file incorrectly shows all phases pointing to the epic ID (`responsible-vibe-1`) instead of their specific phase task IDs. This means the `updatePlanFileWithPhaseTaskIds()` method in start-development.ts failed to properly replace the TBD placeholders.

**IMPACT**: 
1. **Phase Dependencies**: Since all phases reference the same epic task, there are no sequential dependencies between phases
2. **Task Context**: Agents get incorrect task context in whats_next() responses since all phases appear to be under the same parent task

### Second Issue Confirmed: Missing --description Parameter ✅
**DISCOVERY**: The `generateBeadsInstructions()` method in beads-integration.ts shows this pattern:
```
bd create 'Task description' --parent ${currentPhaseTaskId} -p 2
```

**ACTUAL PROBLEM**: Instructions do NOT include the `--description` parameter, leading agents to create thin tasks without detailed context.

**SOLUTION NEEDED**: Update instructions to encourage:
```
bd create 'Task title' --parent ${currentPhaseTaskId} --description 'Detailed context and approach' -p 2
```

### Root Cause Found: Regex Pattern Bug ✅
**DISCOVERY**: The task ID extraction regex in BeadsIntegration is `[\w\d-]+` which does NOT include periods (dots).

**ACTUAL BUG**: Beads task IDs like `responsible-vibe-1.1` are being truncated to `responsible-vibe-1` because the regex stops at the first period.

**PROOF**: 
- Expected ID: `responsible-vibe-1.1` (Explore phase)
- Regex captures: `responsible-vibe-1` (epic ID only)
- Result: All phases get assigned the epic ID instead of their own IDs

**FIX NEEDED**: Change regex from `[\w\d-]+` to `[\w\d.-]+` to include periods in task IDs.

### Phase Dependency Solution Identified ✅
**RESEARCH COMPLETE**: Beads supports dependencies via `bd dep` command:
- Shorthand: `bd dep <blocker-id> --blocks <blocked-id>`
- Explicit: `bd dep add <blocked-id> <blocker-id>`

**PHASE SEQUENCE SOLUTION**: After fixing the regex bug, add dependencies:
1. `bd dep responsible-vibe-1.1 --blocks responsible-vibe-1.2` (Explore blocks Plan)
2. `bd dep responsible-vibe-1.2 --blocks responsible-vibe-1.3` (Plan blocks Code) 
3. `bd dep responsible-vibe-1.3 --blocks responsible-vibe-1.4` (Code blocks Commit)

**IMPLEMENTATION APPROACH**: Extend BeadsIntegration with a `createPhaseDependencies()` method.

## Implementation Strategy Complete ✅

### 1. Regex Fix Strategy 🔧
**ROOT ISSUE**: Three regex patterns in BeadsIntegration use `[\w\d-]+` which excludes periods:
- Line 133-134: `createProjectEpic()` method  
- Line 224-225: `createPhaseTasks()` method
- Line 456: `createEntranceCriteriaTasks()` method

**KEY INSIGHT**: Lines 135 and 226 already have correct pattern `(bd-[\w\d.]+)` but are third in match precedence!

**FIX APPROACH**: 
1. Change `[\w\d-]+` to `[\w\d.-]+` in all three locations
2. Test with various beads ID formats: `bd-abc123`, `project-name-123`, `responsible-vibe-1.2.3`
3. Ensure backwards compatibility with legacy formats
4. Add unit tests for ID extraction with different patterns

### 2. Phase Dependencies Implementation 🔗
**INTEGRATION POINT**: Add phase dependency creation in start-development.ts after line 668 (post-phase creation, pre-plan update)

**IMPLEMENTATION PLAN**:
```typescript
// Add to BeadsIntegration class
async createPhaseDependencies(phaseTasks: BeadsPhaseTask[]): Promise<void>

// Add to start-development.ts after createPhaseTasks()
await beadsIntegration.createPhaseDependencies(phaseTasks);
```

**DEPENDENCY SEQUENCE**:
1. `bd dep phaseTasks[0].taskId --blocks phaseTasks[1].taskId` (Explore → Plan)
2. `bd dep phaseTasks[1].taskId --blocks phaseTasks[2].taskId` (Plan → Code)  
3. `bd dep phaseTasks[2].taskId --blocks phaseTasks[3].taskId` (Code → Commit)

**ERROR HANDLING**: 
- Continue setup even if dependency creation fails
- Log dependency failures as warnings, not errors
- Provide fallback instructions for manual dependency setup

### 3. Enhanced Beads Instructions 📝
**CURRENT ISSUE**: `generateBeadsInstructions()` shows:
```
bd create 'Task description' --parent ${currentPhaseTaskId} -p 2
```

**ENHANCED FORMAT**:
```
bd create 'Task title' --parent ${currentPhaseTaskId} --description 'Detailed context explaining what, why, and how' --priority 2
```

**INSTRUCTION IMPROVEMENTS**:
- Split title and description clearly 
- Provide examples of good descriptions
- Include description writing guidelines
- Add contextual examples for different phase types

**BACKWARDS COMPATIBILITY**: Keep simple format as fallback option with note about description benefits

## Implementation Completed Successfully ✅

### 1. Regex Pattern Fixes Applied ✅
**CHANGES MADE**:
- ✅ Fixed Line 133-134: `createProjectEpic()` method regex patterns
- ✅ Fixed Line 224-225: `createPhaseTasks()` method regex patterns  
- ✅ Fixed Line 456: `createEntranceCriteriaTasks()` method regex patterns
- ✅ Changed all instances from `[\w\d-]+` to `[\w\d.-]+` to include periods

**VERIFICATION**: 
- ✅ All existing tests pass
- ✅ New tests added covering hierarchical task IDs with periods
- ✅ Tested legacy format compatibility
- ✅ Build completes successfully

### 2. Phase Dependencies Implementation ✅  
**NEW METHOD ADDED**: `createPhaseDependencies(phaseTasks: BeadsPhaseTask[])`
- ✅ Creates sequential dependencies: Explore → Plan → Code → Commit
- ✅ Uses `bd dep currentPhase --blocks nextPhase` syntax
- ✅ Robust error handling with warnings (doesn't fail setup)
- ✅ Integrated into start-development.ts workflow
- ✅ Comprehensive logging for debugging

**WORKFLOW INTEGRATION**:
- ✅ Called after `createPhaseTasks()` and before plan file update
- ✅ Maintains backwards compatibility 
- ✅ Graceful degradation on dependency creation failures

### 3. Enhanced Beads Instructions ✅
**IMPROVEMENTS MADE**:
- ✅ Updated `generateBeadsInstructions()` to promote `--description` usage
- ✅ Added task description best practices section
- ✅ Included example with detailed description format
- ✅ Maintained backwards compatibility with simple format
- ✅ Clear guidance on What/Why/How description structure

**NEW INSTRUCTION FORMAT**:
```
bd create 'Task title' --parent ${currentPhaseTaskId} --description 'Detailed context explaining what, why, and how' --priority 2
```

### 4. Comprehensive Testing ✅
**NEW TESTS ADDED**:
- ✅ Task ID extraction with periods in all three methods
- ✅ Hierarchical ID format testing (`project-1.2.3.4`)
- ✅ Legacy format compatibility (`bd-abc123`)
- ✅ Mixed format scenarios
- ✅ All 11 beads integration tests passing

**RESULT**: Both original issues completely resolved with proper testing and backwards compatibility maintained.

## Final Commit Phase - Production Ready ✅

### Code Cleanup Complete ✅
- ✅ **Updated beads instructions**: Changed from `bd ready` to `bd close` as instructed
- ✅ **No debug output**: Systematic review found no temporary debug code in production files
- ✅ **No TODO/FIXME**: Clean codebase ready for production
- ✅ **Proper error handling**: All new code includes comprehensive error handling

### Documentation Updated ✅  
- ✅ **Enhanced beads integration documentation**: Added sequential phase dependencies section
- ✅ **Updated task creation examples**: Now shows `--description` parameter usage
- ✅ **Command reference updated**: All examples use `bd close` instead of `bd ready`
- ✅ **Benefits clearly documented**: Phase dependencies and enhanced task descriptions

### Final Validation Complete ✅
- ✅ **Build successful**: Full project builds without errors
- ✅ **All tests passing**: 11/11 beads integration tests pass
- ✅ **Regression testing**: No existing functionality broken
- ✅ **Production ready**: Code quality verified for deployment

**🎉 IMPLEMENTATION COMPLETE - READY FOR DELIVERY** 

Both original beads integration issues have been successfully resolved:
1. **Phase task dependencies**: ✅ Sequential dependencies implemented and working
2. **Enhanced task descriptions**: ✅ Rich --description guidance provided and documented

The implementation is production-ready with comprehensive testing, clean code, and updated documentation.

## Notes
*Additional context and observations*

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
