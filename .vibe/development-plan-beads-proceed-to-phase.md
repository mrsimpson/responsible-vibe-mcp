# Development Plan: responsible-vibe (beads-proceed-to-phase branch)

*Generated on 2026-01-18 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*
*Task Management: Beads Issue Tracker*

## Goal
Improve the proceed_to_phase functionality in beads mode to verify that all current phase tasks are completed before transitioning to a new phase. In beads mode, we can verify task completion during tool execution and raise an error if tasks are not complete, providing better validation and preventing premature phase transitions.

## Explore
<!-- beads-phase-id: responsible-vibe-2 -->
### Tasks
**🔧 TASK MANAGEMENT VIA CLI TOOL bd**

Tasks are managed via bd CLI tool. Use bd commands to create and manage tasks with proper hierarchy:

- `bd list --parent <phase-task-id>`
- `bd create "Task title" --parent <phase-task-id> -p 2`
- `bd ready <task-id>`

**Never use [ ] or [x] checkboxes - use bd commands only!**

### Completed
- [x] Created development plan file

## Plan
<!-- beads-phase-id: responsible-vibe-2 -->

### Phase Entrance Criteria:
- [ ] The problem space has been thoroughly understood
- [ ] Existing codebase patterns have been identified and documented
- [ ] Requirements have been clearly defined and documented
- [ ] Key constraints and dependencies have been identified
- [ ] Research findings have been documented

### Tasks
**🔧 TASK MANAGEMENT VIA CLI TOOL bd**

Tasks are managed via bd CLI tool. Use bd commands to create and manage tasks with proper hierarchy:

- `bd list --parent <phase-task-id>`
- `bd create "Task title" --parent <phase-task-id> -p 2`
- `bd ready <task-id>`

**Never use [ ] or [x] checkboxes - use bd commands only!**

### Completed
*None yet*

## Code
<!-- beads-phase-id: responsible-vibe-2 -->

### Phase Entrance Criteria:
- [ ] Implementation plan has been created and documented
- [ ] Technical approach has been defined
- [ ] Architecture decisions have been made and documented
- [ ] Tasks have been broken down into actionable items
- [ ] Dependencies and integration points are clear
- [ ] Test strategy has been defined

### Tasks
**🔧 TASK MANAGEMENT VIA CLI TOOL bd**

Tasks are managed via bd CLI tool. Use bd commands to create and manage tasks with proper hierarchy:

- `bd list --parent <phase-task-id>`
- `bd create "Task title" --parent <phase-task-id> -p 2`
- `bd ready <task-id>`

**Never use [ ] or [x] checkboxes - use bd commands only!**

### Completed
*None yet*

## Commit
<!-- beads-phase-id: responsible-vibe-2 -->

### Phase Entrance Criteria:
- [ ] Core implementation is complete
- [ ] All planned features have been implemented
- [ ] Code has been tested and is working as expected
- [ ] Integration tests pass
- [ ] Code follows project standards and conventions
- [ ] Error handling is in place

### Tasks
**🔧 TASK MANAGEMENT VIA CLI TOOL bd**

Tasks are managed via bd CLI tool. Use bd commands to create and manage tasks with proper hierarchy:

- `bd list --parent <phase-task-id>`
- `bd create "Task title" --parent <phase-task-id> -p 2`
- `bd ready <task-id>`

**Never use [ ] or [x] checkboxes - use bd commands only!**

### Completed
*None yet*

## Key Decisions
*Important decisions will be documented here as they are made*

**Beads Mode Task Completion Verification** - We can verify task completion in proceed_to_phase by:
1. Detecting beads mode using `TaskBackendManager.detectTaskBackend()` 
2. Extracting phase task ID from plan file comments `<!-- beads-phase-id: task-xyz123 -->`
3. Using `bd list --parent <phase-task-id> --status open` to check for incomplete tasks
4. Throwing an error if any open tasks exist before allowing phase transition
5. This provides immediate feedback without requiring separate entrance criteria validation

**Detailed Validation Logic Design:**
1. **Validation Trigger**: Add validation step early in `executeWithConversation()` before transition logic
2. **Beads Mode Detection**: Use `TaskBackendManager.detectTaskBackend()` to check if backend is 'beads' and available
3. **Phase Task ID Lookup**: Use stored phase-to-task-ID mapping instead of parsing plan file
4. **Task Completion Check**: Execute `bd list --parent <phase-task-id> --status open --json` to get incomplete tasks
5. **Error Handling**: If incomplete tasks found, throw descriptive error with task details and suggestions
6. **Performance**: Cache beads detection result to avoid repeated CLI calls

**Integration with Existing proceed_to_phase Flow:**
1. **Insertion Point**: Add beads validation after argument validation but before review/role validation
2. **Method Structure**: Create private `validateBeadsTaskCompletion()` method in ProceedToPhaseHandler
3. **Flow Integration**: 
   - Early exit pattern: return early if not beads mode
   - Non-breaking: existing validations continue to work
   - Positioned before expensive operations (transition engine, etc.)
4. **Dependencies**: 
   - Import BeadsIntegration class for task queries
   - Use existing PlanManager for file reading
   - Leverage TaskBackendManager for mode detection
5. **Error Consistency**: Use same error pattern as existing validations (throw Error with descriptive message)

**Error Handling and User Experience Design:**
1. **Error Message Structure**:
   - Clear problem statement: "Cannot proceed to [phase] - incomplete tasks in current phase"
   - Actionable details: List of incomplete task IDs and titles
   - Helpful guidance: "Complete tasks using 'bd close <task-id>' or mark as complete"
2. **Error Types**:
   - **Incomplete Tasks**: List specific open tasks that need completion
   - **Plan File Parse Error**: Clear message if phase task ID extraction fails
   - **Beads CLI Error**: Graceful handling if bd command fails (fallback to non-blocking)
3. **User Guidance**:
   - Include bd commands to check and complete tasks
   - Suggest using 'bd list --parent <phase-id> --status open' to see remaining work
   - Option to defer tasks if appropriate using 'bd defer <task-id>'
4. **Graceful Degradation**: If beads validation fails due to technical issues, log warning but allow transition
5. **Logging**: Comprehensive debug logs for troubleshooting integration issues

**Phase-to-Task-ID Mapping Storage Design:**

**Problem**: Currently phase task IDs are only stored in plan file comments, requiring parsing on every validation.

**Solution Options Evaluated**:
1. **Extend ConversationState** - Add `beadsPhaseMapping?: BeadsPhaseTask[]` field
2. **Separate metadata file** - Store mapping in `.vibe/beads-phase-mapping.json`
3. **Derive from beads** - Query epic's children to reconstruct mapping
4. **Beads labels/metadata** - Use beads built-in metadata features

**Recommended Approach**: Dedicated BeadsState Storage
- **Pros**: Loose coupling, separation of concerns, beads-specific lifecycle, extensible
- **Cons**: Additional storage mechanism, need coordination with conversation lifecycle
- **Storage Options**:
  - **Option A**: `.vibe/beads-state.json` - Simple file-based storage
  - **Option B**: Beads integration manager with persistent state
  - **Option C**: Extend BeadsIntegration class with state management
- **Preferred**: Option C - Extend BeadsIntegration class
- **Access Pattern**: BeadsIntegration.getPhaseTaskMapping(conversationId) method
- **Lifecycle**: Created during beads setup, persisted across tool calls, cleaned up when conversation ends

**Dedicated BeadsState Design Details:**

**Data Structure**:
```typescript
interface BeadsConversationState {
  conversationId: string;
  projectPath: string;
  epicId: string;
  phaseTasks: BeadsPhaseTask[];
  createdAt: string;
  updatedAt: string;
}
```

**Storage Implementation**:
- **File**: `.vibe/beads-state.json` (conversation-scoped)
- **Manager**: BeadsStateManager class for CRUD operations
- **Integration**: BeadsIntegration class extended with state management methods

**API Design**:
- `BeadsStateManager.createState(conversationId, epicId, phaseTasks)`
- `BeadsStateManager.getState(conversationId): BeadsConversationState | null`
- `BeadsStateManager.getPhaseTaskId(conversationId, phase): string | null`
- `BeadsStateManager.cleanup(conversationId)` for conversation end

**Integration Points**:
- **start-development**: Create beads state after successful setup
- **proceed_to_phase**: Query beads state for phase task validation
- **Fallback**: Graceful degradation to plan file parsing if state missing

**Updated Implementation Strategy Summary:**
1. **Phase 1**: Implement BeadsStateManager with dedicated storage (.vibe/beads-state.json)
2. **Phase 2**: Update start-development handler to create and populate beads state
3. **Phase 3**: Implement core validation logic in proceed_to_phase handler using BeadsStateManager
4. **Phase 4**: Add backwards compatibility fallback for conversations without beads state
5. **Phase 5**: Comprehensive test coverage for all scenarios
6. **Key Features**: Loose coupling, separation of concerns, early validation, descriptive error messages, graceful degradation
7. **Architecture Benefits**: No ConversationState pollution, beads-specific lifecycle management, extensible for future beads features

**Implementation Completed:**
✅ **BeadsStateManager**: Dedicated state management with file-based persistence (.vibe/beads-state-{conversationId}.json)
✅ **Start-Development Integration**: Automatic beads state creation during project setup with epic and phase task mapping
✅ **Proceed-To-Phase Validation**: Early validation that blocks transitions when incomplete tasks exist in current phase
✅ **Graceful Fallback**: Handles missing beads state, CLI errors, and non-beads mode gracefully
✅ **Comprehensive Testing**: Unit tests covering state management, error handling, and edge cases
✅ **Clean Architecture**: Maintained separation of concerns with no tight coupling to conversation state

## Notes
*Additional context and observations*

**Current proceed_to_phase Implementation:**
- Located in `/packages/mcp-server/src/tool-handlers/proceed-to-phase.ts`
- Already has validation for review states and agent roles
- Executes in `executeWithConversation()` method
- Currently no task completion verification for beads mode

**Beads Integration Details:**
- Task backend detected via `TASK_BACKEND=beads` environment variable
- BeadsIntegration class provides utilities for querying tasks
- Plan file contains beads phase task IDs in comments: `<!-- beads-phase-id: task-xyz123 -->`
- Beads CLI commands: `bd list --parent <id> --status open` for incomplete tasks
- Status indicators: open, in_progress, blocked, deferred vs closed

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
