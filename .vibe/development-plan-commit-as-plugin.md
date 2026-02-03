# Development Plan: responsible-vibe (commit-as-plugin branch)

*Generated on 2026-02-03 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Refactor commit behavior from per-development configuration to a plugin system with environment variable configuration, similar to the beads implementation. This will improve agent compliance and simplify configuration management.
## Key Decisions
- Current commit behavior is configured per-development via `commit_behaviour` parameter in `start_development` tool
- Beads plugin demonstrates the plugin pattern: environment variable activation (`TASK_BACKEND=beads`), plugin registry, lifecycle hooks
- Plugin system uses lifecycle hooks: `afterStartDevelopment`, `beforePhaseTransition`, etc.
- Environment variable approach will simplify configuration and improve agent compliance
- **Environment Variable Design**: Use `COMMIT_BEHAVIOR=step|phase|end|none` (similar to `TASK_BACKEND=beads`)
- **Plugin Activation**: Only activate when `COMMIT_BEHAVIOR` is set, graceful degradation when not set
- **Plugin Architecture**: CommitPlugin will implement IPlugin interface with hooks for commit operations
- **Git Operations**: Extend GitManager with actual commit functionality (currently missing)
- **NO BACKWARD COMPATIBILITY**: Remove commit_behaviour parameter completely, no deprecation period
- **Configurable Commit Messages**: Add `COMMIT_MESSAGE_TEMPLATE` environment variable for custom message formats
- **End Commit Solution**: Add final commit task to last phase of plan file, plugin monitors task completion
- **Commit Execution Split**: GitManager performs WIP commits (step/phase), Agent performs final commit (end) via plan instructions

## Notes
**Current Implementation Analysis:**
- `commit_behaviour` parameter in `start_development.ts` (line 35): `'step' | 'phase' | 'end' | 'none'`
- Translated to `GitCommitConfig` object with boolean flags (lines 70-80)
- Stored in conversation state via `updateConversationState()` (line 150)
- Tool description dynamically generated based on git repository status (server-config.ts line 340)

**Beads Plugin Pattern:**
- Environment activation: `process.env.TASK_BACKEND === 'beads'`
- Plugin registration in `server-config.ts` (lines 130-140)
- Lifecycle hooks: `afterStartDevelopment`, `beforePhaseTransition`, `afterPlanFileCreated`
- Graceful degradation: continues operation if plugin fails

**Issues Identified:**
- Agents not respecting commit behavior configuration
- Per-development configuration is cumbersome
- No centralized commit logic - scattered across codebase
- **CRITICAL**: Actual git commit operations are not implemented yet - only configuration is stored
- Tests show expected interface but no actual git execution found in codebase

**End Commit Challenge - When is Development "Complete"?**

**Current System Analysis:**
- No explicit "development complete" signal in current architecture
- Workflows have phases but no clear "final" phase marker
- Agents can abandon development at any point
- No session lifecycle management beyond conversation state

**Possible Indicators of Completion:**
1. **Final Phase Reached**: Last phase in workflow state machine
2. **Agent Inactivity**: No activity for extended period (unreliable)
3. **Explicit Signal**: Agent calls completion tool/command
4. **Plan File Analysis**: All tasks marked complete
5. **Conversation End**: Session termination (may be abrupt)

**Challenges:**
- Agents may not follow workflows completely
- Development can be abandoned mid-stream
- Multiple conversation sessions for same development
- No clear "success" vs "abandonment" distinction

**End Commit Solution - Plan File Integration:**

**Elegant Approach: Final Phase Task**
- Add task to final phase: `[ ] Create final commit (COMMIT_BEHAVIOR=end)`
- **Agent performs the actual git commands** as instructed in the task
- Plugin only provides the instructions and template in the plan file
- No GitManager involvement for final commits
- Leverages existing plan file workflow

**Implementation:**
1. **Plugin detects final phase** in workflow state machine
2. **Automatically adds commit task** to final phase during plan file creation
3. **Task includes git command instructions** with populated template
4. **Agent executes git commands** when marking task complete
5. **No plugin monitoring needed** - agent handles everything

**Task Template Examples:**
```markdown
## Commit (Final Phase)
### Tasks
- [ ] Review all changes and ensure development is complete
- [ ] Squash WIP commits: `git reset --soft {startHash} && git commit -m "feat: todo-app complete"`
- [ ] Push changes to remote repository
```

**Benefits:**
- **Unified approach**: All modes get final commit task in plan
- **Simple WIP commits**: No complex templating for auto-commits
- **Agent control**: Agent always handles the final polished commit
- **Clean history**: step/phase modes squash WIP commits into single final commit

**Plugin Design Specification:**

**CommitPlugin Structure:**
```typescript
class CommitPlugin implements IPlugin {
  getName(): string { return 'CommitPlugin'; }
  getSequence(): number { return 50; } // Before BeadsPlugin (100)
  isEnabled(): boolean { return !!process.env.COMMIT_BEHAVIOR; }
  getHooks(): PluginHooks {
    return {
      afterStartDevelopment: // Store initial commit hash
      beforePhaseTransition: // Commit on phase if enabled
      // New hook needed: afterStepCompleted for step commits
    };
  }
}
```

**Environment Variable Values:**
- `COMMIT_BEHAVIOR=step`: WIP commits after each step + final squash commit via plan
- `COMMIT_BEHAVIOR=phase`: WIP commits before phase transitions + final squash commit via plan  
- `COMMIT_BEHAVIOR=end`: Only final commit via plan file task (no WIP commits)
- `COMMIT_BEHAVIOR=none`: No automatic commits
- Unset: Plugin disabled, no commit behavior

**Commit Types:**
- **WIP Commits**: Simple generic messages, created automatically by GitManager
- **Final Commit**: Always via plan file task for all modes (step/phase/end)
- **Squashing**: step/phase modes instruct agent to squash all WIP commits in final task

**Simple WIP Commit Messages:**
- Step: `"WIP: {lastUserMessage}"` or `"WIP: {phase} progress"`
- Phase: `"WIP: transition to {targetPhase}"`
- No templates needed - just generic WIP messages

**Final Commit Task (All Modes):**
- `step`/`phase`: `"Squash all WIP commits: git reset --soft {startHash} && git commit -m '{finalTemplate}'"`
- `end`: `"Create final commit: git add . && git commit -m '{finalTemplate}'"`
- Only final commit uses configurable templates

**Git Operations Needed:**
- `GitManager.createCommit(message, projectPath)`: Execute simple WIP commits
- `GitManager.hasUncommittedChanges(projectPath)`: Check if there are changes to commit
- **Note**: Final commits always performed by agent via plan file instructions (with squashing for step/phase modes)

**GitManager Extensions Required:**
```typescript
// Add to GitManager class
static createCommit(message: string, projectPath: string): boolean {
  // Execute: git add . && git commit -m "message"
  // Return success/failure
}

static createSquashCommit(startHash: string, message: string, projectPath: string): boolean {
  // Execute: git reset --soft startHash && git commit -m "message"
  // For 'end' mode to squash all development commits
}

static hasUncommittedChanges(projectPath: string): boolean {
  // Execute: git status --porcelain
  // Check if there are changes to commit
}
```

**Commit Message Template System:**
```typescript
class CommitMessageGenerator {
  static generate(template: string, context: CommitContext): string {
    // Replace placeholders: {phase}, {workflow}, {timestamp}, etc.
    // Handle missing context gracefully
  }
}

interface CommitContext {
  phase?: string;
  currentPhase?: string;
  targetPhase?: string;
  workflow?: string;
  goal?: string;
  timestamp: string;
  branch: string;
}
```

**Direct Migration Strategy (No Backward Compatibility):**

1. **Remove commit_behaviour parameter completely** from StartDevelopmentArgs interface
2. **Remove all related logic** from start-development.ts 
3. **Remove from tool schema** in server-config.ts
4. **Create CommitPlugin** with environment variable activation only
5. **Update all tests** to use environment variables instead of parameters
6. **Update documentation** to show only environment variable approach

**Files to Modify:**
- `packages/mcp-server/src/tool-handlers/start-development.ts`: Remove parameter and logic
- `packages/mcp-server/src/server-config.ts`: Remove from tool schema  
- `packages/mcp-server/src/plugin-system/plugin-interfaces.ts`: Remove from StartDevelopmentArgs
- `packages/core/src/types.ts`: Keep GitCommitConfig for plugin use
- All related tests: Update to use environment variables only

**End Commit Trigger Strategies:**

**Option 1: New Lifecycle Hook `afterDevelopmentComplete`**
- Add new hook to plugin interface: `afterDevelopmentComplete`
- Triggered when agent reaches final phase of workflow
- Requires workflow state machine to identify final phases
- Plugin detects final phase completion and triggers end commit

**Option 2: Manual Trigger Tool**
- Add new tool: `complete_development` 
- Agent calls this when development is finished
- Tool triggers end commit (squash all commits since start)
- Simple and explicit, agent controls when development ends

**Option 3: Final Phase Detection**
- Plugin monitors phase transitions
- When transitioning TO a final phase (like "commit" in EPCC), trigger end commit
- Requires workflow metadata to identify final phases
- Automatic but depends on workflow structure

**Recommended Approach: Option 2 (Manual Trigger)**
- Most reliable - agent explicitly signals completion
- Works with any workflow structure
- Clear user intent
- Simpler implementation

**Implementation:**
```typescript
// New tool: complete_development
mcpServer.registerTool('complete_development', {
  description: 'Complete development and trigger final commit if COMMIT_BEHAVIOR=end',
  // Plugin hook: afterDevelopmentComplete
});
```
```
Parameter -> Environment Variable
commit_behaviour: 'step' -> COMMIT_BEHAVIOR=step
commit_behaviour: 'phase' -> COMMIT_BEHAVIOR=phase  
commit_behaviour: 'end' -> COMMIT_BEHAVIOR=end
commit_behaviour: 'none' -> COMMIT_BEHAVIOR=none (or unset)
```

**Plugin Registration and Activation Logic:**

**Registration in server-config.ts:**
```typescript
// Add after BeadsPlugin registration
if (process.env.COMMIT_BEHAVIOR) {
  const commitPlugin = new CommitPlugin({ projectPath });
  if (commitPlugin.isEnabled()) {
    pluginRegistry.registerPlugin(commitPlugin);
    logger.info('CommitPlugin registered successfully', {
      enabled: commitPlugin.isEnabled(),
      sequence: commitPlugin.getSequence(),
      behavior: process.env.COMMIT_BEHAVIOR,
    });
  }
}
```

**Plugin File Structure:**
```
packages/mcp-server/src/plugin-system/commit-plugin.ts
packages/mcp-server/src/components/commit/commit-manager.ts (git operations)
packages/mcp-server/test/unit/commit-plugin.test.ts
packages/mcp-server/test/e2e/commit-plugin-integration.test.ts
```

**Activation Logic:**
1. **Environment Check**: `process.env.COMMIT_BEHAVIOR` must be set to valid value
2. **Git Repository Check**: Only activate in git repositories
3. **Valid Values**: 'step', 'phase', 'end', 'none'
4. **Graceful Degradation**: Log warning and disable if invalid value provided

**Testing Strategy:**

**Unit Tests (commit-plugin.test.ts):**
- Plugin activation/deactivation based on environment variable
- Hook registration and sequence ordering
- Commit message generation for different scenarios and templates
- Template placeholder replacement (phase, workflow, timestamp, etc.)
- Custom template validation and fallback to defaults
- Error handling and graceful degradation
- Environment variable validation

**Integration Tests (commit-plugin-integration.test.ts):**
- End-to-end commit behavior with real git repository
- Plugin interaction with other plugins (BeadsPlugin)
- Phase transition commits with custom templates
- Step completion commits with custom templates
- Final development commits with squashing
- Template context population from actual development state

**Test Scenarios:**
1. **COMMIT_BEHAVIOR=step**: Verify commits after each whats_next call
2. **COMMIT_BEHAVIOR=phase**: Verify commits before phase transitions
3. **COMMIT_BEHAVIOR=end**: Verify single squashed commit at completion
4. **COMMIT_BEHAVIOR=none**: Verify no automatic commits
5. **Custom templates**: Verify COMMIT_MESSAGE_TEMPLATE placeholder replacement
6. **Invalid templates**: Verify graceful fallback to defaults
7. **Missing context**: Verify template handles missing placeholders
8. **Invalid values**: Verify graceful degradation
9. **Non-git repository**: Verify plugin disables gracefully
10. **No changes to commit**: Verify plugin skips commit operations

**Plugin Architecture and Usage Documentation:**

**Architecture Overview:**
```
CommitPlugin (IPlugin)
├── Environment Variable Activation (COMMIT_BEHAVIOR)
├── Git Repository Detection
├── Commit Message Template System
│   ├── Default templates (step/phase/end)
│   ├── Custom template support (COMMIT_MESSAGE_TEMPLATE)
│   └── Placeholder replacement engine
├── Lifecycle Hooks:
│   ├── afterStartDevelopment (store initial commit hash)
│   ├── beforePhaseTransition (phase commits)
│   └── afterStepCompleted (step commits) [NEW HOOK NEEDED]
└── CommitManager (git operations)
    ├── createCommit()
    ├── createSquashCommit()
    └── hasUncommittedChanges()
```

**Usage Documentation:**
1. **Setup**: Set `COMMIT_BEHAVIOR=step|phase|end|none` environment variable
2. **Custom Messages**: Optionally set `COMMIT_MESSAGE_TEMPLATE="your template"`
3. **Template Placeholders**: Use `{phase}`, `{workflow}`, `{timestamp}`, `{branch}`, etc.
4. **Agent Configuration**: Add to agent startup scripts (no per-development config needed)
5. **Behavior**:
   - `step`: Auto-commit after each development step
   - `phase`: Auto-commit before phase transitions  
   - `end`: Single commit at development completion
   - `none`: No automatic commits

**Template Examples:**
- Default step: `"dev: {phase} step - {timestamp}"`
- Custom step: `"🚀 [{phase}] progress on {branch}"`
- Default phase: `"feat: {currentPhase} -> {targetPhase}"`
- Custom phase: `"✨ Phase transition: {currentPhase} ➜ {targetPhase}"`
- Default end: `"feat: {workflow} complete - {goal}"`
- Custom end: `"🎉 Completed {workflow}: {goal}"`

**Benefits:**
- Consistent commit behavior across all developments
- Customizable commit message formats
- Simplified agent configuration
- Better agent compliance (no per-call parameter needed)
- Centralized commit logic in plugin
- Graceful degradation when disabled

## Explore
### Completed
- [x] Created development plan file
- [x] Analyze current commit behavior implementation
- [x] Study beads plugin implementation as reference
- [x] Identify where commit behavior is currently configured
- [x] Document current issues with agent compliance
- [x] Define environment variable configuration approach
- [x] Research plugin interface patterns in the codebase

## Plan

### Phase Entrance Criteria:
- [x] Current commit behavior implementation has been analyzed
- [x] Beads plugin implementation has been studied as reference
- [x] Environment variable configuration approach has been defined
- [x] Plugin interface design has been specified
- [x] Migration strategy from current configuration has been planned

### Completed
- [x] Design CommitPlugin interface and structure
- [x] Define git commit operations and GitManager extensions
- [x] Plan removal of commit_behaviour parameter from start_development
- [x] Design migration strategy for existing configurations
- [x] Create plugin registration and activation logic
- [x] Plan testing strategy for plugin functionality
- [x] Document plugin architecture and usage

## Code

### Phase Entrance Criteria:
- [x] Plugin interface has been designed and documented
- [x] Environment variable configuration schema has been defined
- [x] Implementation plan has been approved
- [x] Migration strategy has been finalized

### Completed
- [x] Write failing tests for GitManager.createCommit()
- [x] Implement GitManager.createCommit() to pass tests
- [x] Write failing tests for GitManager.hasUncommittedChanges()
- [x] Implement GitManager.hasUncommittedChanges() to pass tests
- [x] Write failing tests for CommitPlugin activation and hooks
- [x] Implement CommitPlugin with lifecycle hooks
- [x] Write failing tests for plan file task injection
- [x] Implement final commit task injection to plan files
- [x] Write failing tests for commit_behaviour parameter removal
- [x] Remove commit_behaviour parameter from start_development
- [x] Update server-config.ts to register CommitPlugin
- [x] Create integration test for end-to-end commit behavior
- [x] Clean up old ConversationManager gitCommitConfig integration
- [x] Remove unused imports and fix build issues
- [x] Remove obsolete start-development-no-commit-param.test.ts

## Commit

### Phase Entrance Criteria:
- [ ] Plugin implementation is complete and tested
- [ ] Environment variable configuration is working
- [ ] Migration from old configuration is functional
- [ ] All tests are passing

### Tasks
- [x] Remove debug output and temporary logging statements from development
- [x] Review and address any TODO/FIXME comments in the codebase
- [x] Clean up any experimental or commented-out code
- [x] Run final test suite to ensure all functionality works correctly
- [x] Update documentation to reflect final implementation state
- [x] Create final commit with comprehensive message summarizing the refactoring
- [x] Verify CommitPlugin works correctly in production scenarios

### Completed
*None yet*



---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
