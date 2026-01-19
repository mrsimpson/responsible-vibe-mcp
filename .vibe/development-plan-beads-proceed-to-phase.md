# Development Plan: responsible-vibe (beads-proceed-to-phase branch)

*Generated on 2026-01-18 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*
*Task Management: Beads Issue Tracker*

## Goal
**ACTUAL IMPLEMENTATION**: Create a comprehensive interface contract test framework for the responsible-vibe-mcp strategy pattern implementation.

**ORIGINAL GOAL**: Improve the proceed_to_phase functionality in beads mode to verify that all current phase tasks are completed before transitioning to a new phase. In beads mode, we can verify task completion during tool execution and raise an error if tasks are not complete, providing better validation and preventing premature phase transitions.

**NOTE**: This development session was redirected to implement a comprehensive interface contract test framework based on user requirements. The original beads proceed-to-phase functionality remains to be implemented in a future session.

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

**COMPREHENSIVE BEADS INSTRUCTION VALIDATION TESTS IMPLEMENTED** - Added complete test coverage for beads vs markdown instruction text validation to close critical gap in test coverage:

**Critical Gap Identified:**
- While markdown backend had excellent test coverage with anti-contamination protection, BeadsInstructionGenerator had virtually no tests validating actual instruction text content
- No comparative tests between backends to ensure proper differentiation
- Missing validation of beads-specific CLI commands and task management instructions

**Test Suites Implemented:**
1. **BeadsInstructionGenerator Content Tests** (`packages/mcp-server/test/unit/beads-instruction-generator.test.ts`):
   - ✅ **22 comprehensive tests** validating beads-specific content presence
   - ✅ **Beads CLI Commands**: Tests verify presence of all bd CLI commands (`bd list`, `bd create`, `bd close`, etc.)
   - ✅ **Task Management Structure**: Validates "🔧 BD CLI Task Management:" header and guidance
   - ✅ **Anti-Contamination**: Ensures no markdown-specific content appears in beads instructions
   - ✅ **Phase-Specific Content**: Tests different phases maintain beads structure consistently
   - ✅ **Variable Substitution**: Validates variable handling while maintaining beads format

2. **Backend Comparison Tests** (`packages/core/test/unit/instruction-generator-comparison.test.ts`):
   - ✅ **12 tests** directly comparing markdown vs beads instruction output
   - ✅ **Task Management Differences**: Validates markdown uses plan file checkboxes vs beads uses CLI
   - ✅ **Shared Content**: Ensures both backends preserve base instruction content
   - ✅ **Consistency Validation**: Tests variable substitution works identically across backends
   - ✅ **Format Differences**: Validates backend-specific instruction structure and guidance

3. **Phase Task ID Integration Tests** (`packages/mcp-server/test/unit/beads-phase-task-id-integration.test.ts`):
   - ✅ **15 tests** validating phase task ID extraction and usage
   - ✅ **ID Extraction**: Tests proper extraction from `<!-- beads-phase-id: project-epic-1.2 -->` format
   - ✅ **BD CLI Integration**: Validates extracted IDs are properly used in all bd commands
   - ✅ **Multi-Phase Support**: Tests correct handling of multiple phases in plan files
   - ✅ **Graceful Fallback**: Tests robust error handling for missing or malformed task IDs
   - ✅ **Edge Cases**: Comprehensive validation of error scenarios and malformed input

**Test Quality and Coverage:**
- ✅ **All 49 new tests pass** across all three test suites
- ✅ **Real Bug Discovery**: Tests identified edge cases in phase task ID regex parsing
- ✅ **Integration with Existing Framework**: Tests follow established patterns and use same mocking strategies
- ✅ **Comprehensive Validation**: Tests cover all requirements including anti-contamination, content structure, and phase integration

**Critical Protection Achieved:**
- **BeadsInstructionGenerator Quality**: Now has same level of test protection as markdown backend
- **Backend Differentiation**: Validates that each backend produces appropriate task management instructions
- **Instruction Text Reliability**: Ensures beads instructions contain correct CLI commands and guidance
- **Future Safety**: Test framework prevents regression and ensures instruction quality

**Benefits:**
- 🛡️ **Quality Assurance**: Critical gap in test coverage eliminated
- 📝 **Instruction Validation**: Ensures users receive correct, usable beads instructions
- 🔄 **Backend Consistency**: Validates proper separation and differentiation between backends
- 🧪 **Test Coverage**: Comprehensive validation of instruction text content and structure
- 🚀 **Regression Prevention**: Future changes to instruction generation will be validated automatically

**COMPREHENSIVE INTERFACE CONTRACT TEST FRAMEWORK IMPLEMENTATION** - Created a complete testing framework for strategy pattern interfaces:

**Implementation Completed:**
1. **Base Framework Architecture** (`packages/core/test/unit/contracts/base-interface-contract.ts`):
   - `BaseInterfaceContract<T>` abstract class for all interface testing
   - `ImplementationRegistration<T>` interface for registering implementations
   - `MethodTestConfig` and `ErrorTestConfig` for test configuration
   - `ValidationHelpers` utilities for common test validations
   - Automated test generation for interface compliance

2. **Implementation Registry System** (`packages/core/test/unit/contracts/implementation-registry.ts`):
   - Central registry for all interface implementations
   - Support for IPlanManager, IInstructionGenerator, and ITaskBackendClient
   - Auto-registration decorator pattern
   - Discovery and validation utilities

3. **Interface-Specific Contract Tests**:
   - **IPlanManager Contract** (`plan-manager-contract.test.ts`): Tests plan file operations, state machine integration, task backend configuration
   - **IInstructionGenerator Contract** (`instruction-generator-contract.test.ts`): Tests instruction generation, variable substitution, context handling
   - **ITaskBackendClient Contract** (`task-backend-client-contract.test.ts`): Tests task operations, validation, error scenarios

4. **Existing Implementation Integration** (`existing-implementations.test.ts`):
   - Registered PlanManager and InstructionGenerator implementations
   - Automated test setup/cleanup with temporary directories
   - Integration with contract test suites

5. **Comprehensive Documentation** (`README.md`):
   - Complete usage guidelines and API documentation
   - Examples for adding new implementations and interfaces
   - Best practices for contract testing
   - CI/CD integration guidance

**Testing Results:**
✅ **Framework Architecture**: Base classes and utilities implemented and tested
✅ **Implementation Registry**: Central registration system working correctly 
✅ **Contract Test Suites**: All three interface contracts implemented with comprehensive test coverage
✅ **Existing Implementation Tests**: PlanManager and InstructionGenerator successfully registered and tested
✅ **Build Integration**: All tests pass, TypeScript compilation successful, linting clean
✅ **Documentation**: Complete documentation with examples and usage guidelines

**Benefits Achieved:**
- **Interface Compliance**: Automatic validation that all implementations satisfy interface contracts
- **Future-Proof**: Easy to add new implementations and interfaces to the testing framework
- **Quality Assurance**: Comprehensive error handling, return type validation, and behavior testing

**TEST FRAMEWORK FIXES AND IMPROVEMENTS** - Resolved critical test infrastructure issues:

**Issues Fixed:**
1. **Backend Detection Test Architecture Mismatch**: The instruction-generator-backends.test.ts was testing backend detection in the core InstructionGenerator class, but backend selection was moved to the ServerComponentsFactory. Fixed by rewriting tests to focus on core InstructionGenerator functionality (markdown-only behavior).

2. **Contract Test Registration Timing Issue**: Contract tests were failing because implementations weren't registered before createContractTests() was called. Fixed by registering implementations directly with contract instances at module level before test creation.

3. **Mock Implementation Creation**: Created MockTaskBackendClient for testing ITaskBackendClient interface contracts since no concrete implementation exists in the core package.

**Results:**
✅ **instruction-generator-backends.test.ts**: All 6 tests now pass, focusing on core markdown functionality
✅ **Contract Test Registration**: All three interfaces (IPlanManager, IInstructionGenerator, ITaskBackendClient) now have proper implementation registration
✅ **Test Robustness**: String validations use flexible toContain() assertions rather than brittle exact matches
✅ **Architecture Alignment**: Tests now correctly reflect the factory pattern architecture where backend selection happens at the factory level, not in individual components
- **Developer Experience**: Clear documentation and examples for extending the framework
- **CI/CD Ready**: Deterministic tests suitable for automated testing pipelines

**Architectural Redesign for Beads Integration** - After analyzing the current scattered integration pattern where beads logic is mixed throughout components (PlanManager, InstructionGenerator, tool handlers), we've decided to implement a Strategy Pattern with Component Substitution approach:

1. **Problem**: Current pattern has "if (beads mode)" conditionals scattered throughout codebase, creating tight coupling and violating separation of concerns
2. **Solution**: Strategy Pattern + Abstract Factory for clean component substitution  
3. **Key Components**:
   - IBackendStrategy interface with MarkdownBackendStrategy and BeadsBackendStrategy implementations
   - Component factories for backend-specific implementations (IPlanManager, IInstructionGenerator, ITaskManager, IStateManager)
   - Server initialization uses strategy to create appropriate component set
   - Tool handlers receive backend-agnostic interfaces via dependency injection
4. **Benefits**: Complete separation of concerns, no scattered conditionals, easy testing, maintainable
5. **Migration**: 5-phase approach starting with interface extraction, ending with cleanup of conditional logic
6. **Trade-offs**: Initial complexity increase for long-term maintainability and extensibility gains

**ARCHITECTURAL PIVOT - Strategy Pattern Approach** - Major design decision made:

**Original Approach (Abandoned):** 
- Add conditional beads logic to existing components
- Scatter "if (beads mode)" checks throughout codebase  
- Create BeadsStateManager as additional layer

**NEW APPROACH - Strategy Pattern with Component Substitution:**
1. Define interfaces (IPlanManager, IInstructionGenerator, etc.)
2. Create dedicated beads strategy implementations (BeadsPlanManager, BeadsInstructionGenerator)
3. Use ServerComponentsFactory to instantiate appropriate implementations based on task backend
4. Completely replace default components with beads-specific ones when in beads mode
5. Eliminate all conditional logic and scattered beads integration

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

**Design Issues Analysis (Post-WIP Commit):**

**Potential Architectural Concerns:**
1. **File-based State Management**: Using individual JSON files per conversation may not scale well
2. **Beads CLI Dependency**: Direct execSync calls in validation logic create tight coupling to beads CLI
3. **Error Handling Consistency**: Current graceful degradation might be too permissive
4. **Performance**: File I/O on every proceed_to_phase call could be optimized
5. **State Synchronization**: No mechanism to handle concurrent access or state conflicts

**Integration Pattern Issues:**
1. **Validation Placement**: Early validation in proceed_to_phase might not be the ideal integration point
2. **Lifecycle Management**: No clear strategy for cleaning up beads state files
3. **Configuration**: Hard-coded file paths and beads command strings

**User Experience Concerns:**
1. **Error Messages**: While descriptive, they might be too technical for end users
2. **Fallback Behavior**: Silent fallback might confuse users expecting validation
3. **Task Status Interpretation**: Only checking 'open' status might miss other incomplete states

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

**🏗️ NEW ARCHITECTURAL APPROACH - STRATEGY PATTERN WITH COMPONENT SUBSTITUTION**

**Key Architectural Decision:**
Instead of continuing to add conditional beads logic throughout existing components, we will implement a **Strategy Pattern with Component Substitution** approach. This means having dedicated beads-specific components that completely replace the default ones when beads mode is active.

**Core Design Principles:**
1. **Interface-based Substitution**: Define interfaces (IPlanManager, IInstructionGenerator, etc.) that both default and beads implementations fulfill
2. **Factory-based Initialization**: ServerComponentsFactory chooses which concrete implementations to instantiate based on task backend
3. **Dependency Injection**: Components receive their dependencies through constructor injection, maintaining loose coupling
4. **Complete Separation**: No more "if (beads mode)" conditionals scattered throughout the codebase

**Benefits:**
- 🔄 **Clean Architecture**: Eliminates scattered conditionals and mixed responsibilities
- 🔧 **Maintainable**: Each backend has its own dedicated implementations
- 🧪 **Testable**: Easy to test backend-specific behavior in isolation
- 🔮 **Extensible**: Easy to add new task backends (GitHub Issues, Linear, etc.)
- 📦 **Modular**: Beads logic is contained in dedicated modules

**Implementation Strategy:**
1. Extract interfaces from existing components (IPlanManager, IInstructionGenerator, etc.)
2. Create backend-specific strategy implementations (BeadsPlanManager, BeadsInstructionGenerator)
3. Implement ServerComponentsFactory for component creation and substitution
4. Update server initialization to use factory pattern with dependency injection
5. Migrate and clean up existing scattered conditional logic
6. Create interface contract testing framework for implementation compliance
7. Restructure existing tests for strategy pattern without changing test content

**Test Structure Implications:**
- **Interface Contract Tests**: New category to ensure all implementations satisfy interface contracts
- **Implementation-Specific Tests**: Split existing mixed behavior tests into backend-specific tests
- **Factory Pattern Tests**: Test component substitution and registration logic
- **Enhanced Test Helpers**: Backend variant utilities and interface compliance testing
- **Minimal E2E Changes**: Focus on behavior consistency rather than implementation details

**Beads CLI Abstraction Design:**

**Current Issue**: Direct execSync calls create tight coupling to beads CLI commands and make testing difficult.

**Solution - ITaskBackendClient Interface**:
```typescript
interface ITaskBackendClient {
  listTasks(parentId: string, filters: TaskFilters): Promise<TaskInfo[]>
  createTask(title: string, options: CreateTaskOptions): Promise<string>
  updateTask(taskId: string, updates: TaskUpdates): Promise<void>
  getTaskStatus(taskId: string): Promise<TaskStatus>
}
```

**Benefits**:
- **Mockable**: Easy to create test implementations
- **Cacheable**: Can implement caching layer transparently  
- **Error Standardization**: Consistent error handling across all CLI operations
- **Command Batching**: Can optimize multiple calls into batched operations
- **Future Backends**: Same interface can support GitHub Issues, Linear, etc.

**Key Benefits of New Architecture:**
- ✅ **Eliminates Scattered Conditionals**: No more "if (beads mode)" throughout codebase
- ✅ **Improves Testability**: Each backend implementation tested in isolation
- ✅ **Enables Future Extensibility**: Easy to add GitHub Issues, Linear, etc. backends
- ✅ **Maintains Backward Compatibility**: Existing interfaces preserved during migration
- ✅ **Preserves Test Coverage**: Comprehensive test restructuring without losing coverage
- ✅ **CLI Abstraction**: Clean interface for task backend operations with caching and error handling

**TEST RESTRUCTURING FOR STRATEGY PATTERN ARCHITECTURE COMPLETED** - Successfully restructured existing tests to work with the new strategy pattern architecture while maintaining full test coverage and functionality:

**Implementation Completed:**
1. **ServerComponentsFactory Tests** (`packages/mcp-server/test/unit/server-components-factory.test.ts`):
   - Comprehensive test coverage for factory pattern implementation
   - Tests for component creation based on task backend configuration
   - Validation of dependency injection and component substitution
   - Tests for backend detection and fallback behavior
   - Future extensibility tests marked as todo items

2. **Core Unit Test Fixes** - Updated problematic imports and type issues:
   - Fixed `InstructionContext` imports to use interface files
   - Resolved type casting issues in mock objects
   - Maintained implementation-specific testing approach
   - Preserved existing test logic while fixing architectural compatibility

3. **Component Substitution E2E Tests** (`packages/mcp-server/test/e2e/component-substitution.test.ts`):
   - End-to-end validation of strategy pattern implementation
   - Tests for markdown backend component behavior
   - Factory integration and dependency injection verification
   - Backend detection and component creation validation
   - Fallback behavior documentation (with todo items for full implementation)

**Testing Architecture Analysis:**
- ✅ **Unit Tests**: Correctly maintain implementation-specific testing (no changes needed)
- ✅ **Integration Tests**: Already using factory pattern through server initialization
- ✅ **E2E Tests**: Verified to work correctly with component substitution
- ✅ **Factory Tests**: New comprehensive test suite for ServerComponentsFactory
- ✅ **Contract Tests**: Existing interface contract tests remain unchanged and effective

**Test Structure Validation:**
- ✅ **Preserved Test Logic**: No functionality lost during restructuring
- ✅ **Maintained Coverage**: All existing test coverage maintained
- ✅ **Build Compatibility**: All tests pass in existing CI/build system
- ✅ **Strategy Pattern Support**: Tests now properly validate component substitution
- ✅ **Future Ready**: Test structure prepared for beads implementations

**Key Test Categories Identified and Addressed:**
1. **Implementation-Specific Tests**: Continue direct instantiation (correct approach)
2. **Server-Level Tests**: Use factory pattern via server initialization (already working)
3. **Factory Pattern Tests**: New dedicated test suite for component substitution
4. **Integration Tests**: Validate end-to-end behavior with strategy pattern

**Benefits Achieved:**
- ✅ **No Breaking Changes**: Existing tests continue to work without modification where appropriate
- ✅ **Enhanced Coverage**: New tests specifically for strategy pattern implementation
- ✅ **Architectural Validation**: Tests confirm strategy pattern works correctly
- ✅ **Developer Experience**: Clear test structure for future implementations
- ✅ **CI/CD Ready**: All tests pass and integrate with existing build pipeline

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
