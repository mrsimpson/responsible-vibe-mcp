# Development Plan: responsible-vibe (beads branch)

*Generated on 2026-01-16 by Vibe Feature MCP*
*Workflow: [epcc](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/epcc)*

## Goal
Implement a dedicated task tracker to improve task management in development workflows, addressing issues with maintaining large task lists in markdown-based plans.

## Explore
### Tasks
- [x] Analyze current markdown-based task management in development plans
- [x] Identify specific issues with large task lists in markdown format
- [x] Research existing task tracker implementations and patterns
- [x] Explore the responsible-vibe-mcp codebase structure and architecture
- [x] Document current workflow and task management patterns
- [x] Investigate if there are existing task management MCPs or tools available  
- [x] Define specific requirements for the dedicated task tracker
- [x] Explore the "beads" task tracker fork at ~/projects/beads
- [x] Analyze beads architecture and features
- [x] Evaluate beads suitability for integration with responsible-vibe-mcp
- [x] Document integration approach if beads is suitable

### Completed
- [x] Created development plan file

## Plan

### Phase Entrance Criteria:
- [x] Current task management issues have been thoroughly identified and documented
- [x] Existing task management approaches have been analyzed 
- [x] Requirements for the dedicated task tracker have been defined
- [x] Technical constraints and integration points have been explored

### Tasks
- [x] Design beads integration architecture  
- [x] Define integration configuration and setup process
- [x] Plan two-tier task management model (plan files + beads)
- [x] Design beads-to-plan-file synchronization strategy
- [x] Plan backwards compatibility approach
- [x] Define user experience and workflow changes
- [x] Identify technical challenges and edge cases
- [x] Create implementation roadmap and task breakdown

### Completed
*None yet*

## Code

### Phase Entrance Criteria:
- [ ] Implementation strategy has been thoroughly planned and documented
- [ ] Technical approach and architecture decisions have been defined
- [ ] Integration approach with existing systems has been determined
- [ ] Tasks have been broken down into specific, actionable implementation steps

### Tasks

#### Phase 1: Backend Detection & Abstraction
- [x] Add TASK_BACKEND environment variable detection
- [x] Implement `bd` command availability checking utility  
- [x] Create task backend abstraction layer/interface
- [x] Add backend detection to server initialization
- [x] Update start_development() to use task backend detection
- [x] Modify plan file templates for beads mode (no task lists)

#### Phase 2: Beads Integration
- [x] Implement beads project epic creation on start_development()
- [x] Add beads phase task creation for each workflow phase
- [x] Store phase task IDs in plan file comments (<!-- beads-phase-id: -->)
- [x] Update whats_next() to detect and use task backend
- [x] Add beads tool instructions to whats_next() for beads mode
- [x] Provide current phase task context in whats_next() responses

#### Phase 3: Polish & Documentation  
- [x] Add error handling when beads unavailable in beads mode
- [x] Implement graceful error messages with setup instructions
- [x] Create beads setup and usage documentation
- [x] Add comprehensive testing for both backends
- [x] Validate phase task hierarchy creation works correctly
- [x] Ensure full backwards compatibility with existing projects
- [x] Create instruction generator tests for task backend integration

#### Phase 4: Bug Fixes & Code Quality
- [x] Fix non-null assertion in beads-integration.ts:66 (`match[1]!`) - replaced with `match[1] || ''`
- [x] Fix non-null assertion in beads-integration.ts:119 (`match[1]!`) - replaced with `match[1] || ''`
- [x] Fix any type usage in task-backend.test.ts:116 - used specific error type extension `(error as Error & { code: string })`
- [x] Fix any type usage in instruction-generator-task-backend.test.ts:20 - used `Partial<ProjectDocsManager>` with proper import
- [x] Fix any type usage in instruction-generator-task-backend.test.ts:44 - used proper type casting with `{} as unknown as PlanManager`
- [x] Run linter to verify all errors are fixed - all 5 linting errors resolved
- [x] Run tests to ensure nothing broke - all 127 tests pass

### Completed
- [x] Original complex integration architecture designed
- [x] User feedback received and analyzed
- [x] **REVISED**: Simplified either/or approach planned
- [x] Environment variable backend selection designed  
- [x] Beads phase hierarchy model designed
- [x] Direct tool instruction approach planned (no MCP proxying)
- [x] Simplified implementation roadmap created
- [x] Updated coding tasks broken down into actionable steps
- [x] **ALL PHASES COMPLETED**: Full beads integration implemented
- [x] **ENHANCEMENT**: Updated instruction generator to provide task-backend-aware guidance
- [x] **TESTING**: Created comprehensive tests for task backend integration
- [x] **ENHANCEMENT**: Enhanced beads instructions with workflow-focused commands based on dependency research

## Commit

### Phase Entrance Criteria:
- [ ] Core functionality has been implemented and working
- [ ] Code has been tested and validated
- [ ] Integration with existing systems is functional
- [ ] Implementation meets the defined requirements

### Tasks
- [ ] *To be added when this phase becomes active*

### Completed
*None yet*

## Key Decisions

### Implementation Completed Successfully ✅
**ALL FEATURES IMPLEMENTED**: Beads integration is now fully functional with complete backwards compatibility, comprehensive testing, and clean code quality.

**Final Implementation Highlights**:
- ✅ **Backend Detection**: `TASK_BACKEND` environment variable with automatic beads availability checking
- ✅ **Plan File Integration**: Modified plan files show beads task management with phase task ID tracking
- ✅ **Project Epic Creation**: Automatic beads project epic creation during `start_development()`
- ✅ **Phase Task Hierarchy**: Structured task hierarchy with epic → phase tasks → sub-tasks
- ✅ **WhatsNext Instructions**: Context-aware beads tool instructions in `whats_next()` responses
- ✅ **Error Handling**: Comprehensive error handling with helpful setup instructions
- ✅ **Backwards Compatibility**: All existing tests pass, zero breaking changes
- ✅ **Documentation**: Complete beads integration guide at `docs/BEADS_INTEGRATION.md`
- ✅ **Testing**: Comprehensive test coverage for both markdown and beads backends
- ✅ **Instruction Generator**: Smart task management guidance that adapts to active backend
- ✅ **Code Quality**: Fixed all linting errors (5 issues resolved) maintaining strict TypeScript standards
### Task Management Issues Identified
- **Large lists become unwieldy**: Some development plans have 50+ tasks, making markdown lists hard to manage
- **No task status tracking**: Only [x] and [ ] states, no in-progress, blocked, or priority indicators
- **Difficult to search and filter**: No easy way to find specific tasks or filter by status/priority
- **No task dependencies**: Tasks cannot express dependencies on other tasks
- **No time tracking**: No way to track how long tasks take or estimate effort
- **Limited metadata**: Tasks can't have assignees, due dates, categories, or tags

### Current Architecture Findings
- **Monorepo structure**: `packages/core`, `packages/mcp-server`, `packages/cli`, etc.
- **Plan files stored in `.vibe/`**: Each development session gets its own plan file
- **MCP server architecture**: Tool handlers, registries, and component-based design
- **Multiple workflow support**: Waterfall, EPCC, bugfix, etc.

### Current Task Management Architecture (User Clarified)
✅ **Phase-based section structure**: Plan files have sections named after workflow phases (Explore, Plan, Code, Commit)
✅ **Hierarchical task organization**: Each phase contains:
  - `### Phase Entrance Criteria:` (initial phase has none)
  - `### Tasks` 
  - `### Completed`
✅ **Agent autonomy**: Completely up to the agent to detect, read, and edit the corresponding sections
✅ **whats_next() guidance**: Agent constantly reminded which section to inspect via tool responses
✅ **Manual markdown editing**: Agents manually edit plan files to update task status and content

### Key Strategic Decision: Beads Integration Choice
**DECISION**: Integrate existing beads-mcp server rather than building custom task tracker
**RATIONALE**: 
- Beads already solves ALL identified problems perfectly
- Production-tested with AI agents
- Rich feature set: dependencies, priorities, git integration, context optimization
- Zero development overhead - focus on integration, not implementation
- Active maintenance and community ecosystem

### Simplified Integration Approach (User Feedback)
**USER FEEDBACK**: Hybrid approach too complicated - simplify significantly:
✅ **Beads detection**: Validate `bd` command availability
✅ **Clear separation**: Either markdown OR beads (no hybrid)
✅ **Environment control**: `TASK_BACKEND=markdown|beads` 
✅ **Phase hierarchy**: Create beads task per phase, link to phase task
✅ **Direct tool usage**: No MCP proxying - include beads tools in whats_next() instructions

### Current Workflow Patterns
- **Markdown-based task management**: Tasks tracked with `[ ]` and `[x]` checkboxes
- **Phase-based development**: Tasks organized by workflow phases (Explore, Plan, Code, Commit)
- **Manual task updates**: Agents must manually edit markdown files to update task status
- **No central task database**: Each plan file is independent, no cross-project task management
- **Limited task metadata**: Only completion status, no priorities, dependencies, or time tracking

### Beads Task Tracker Analysis - PERFECT MATCH!

**Beads is exactly what we need!** This distributed, git-backed graph issue tracker is specifically designed for AI agents and addresses ALL our identified problems:

#### Core Features (All Requirements Met!)
✅ **Rich task states**: open, in_progress, blocked, deferred, closed (+ custom statuses)
✅ **Priority system**: 0-4 priority levels (P0=critical → P4=low)
✅ **Dependencies**: blocks, related, parent-child relationships with full graph support
✅ **Rich metadata**: assignee, owner, estimates, due dates, external refs, labels
✅ **Hierarchical tasks**: Support for epics (bd-a3f8.1.1 sub-task structure)
✅ **Search & filter**: Built-in query capabilities 
✅ **Git integration**: Native git storage with versioning, branching, merging
✅ **Time tracking**: Estimated minutes, timestamps, due dates

#### Technical Architecture
✅ **SQLite + JSONL**: Fast local cache with human-readable git storage
✅ **Existing MCP server**: Full MCP implementation already exists at `integrations/beads-mcp/`
✅ **Context optimized**: Smart context window management (2-5k tokens vs 10-50k)
✅ **Agent-first design**: Built specifically for AI agent workflows
✅ **Zero-conflict merging**: Hash-based IDs prevent merge conflicts

#### Integration Points  
✅ **CLI + MCP**: Both command-line and MCP server interfaces available
✅ **Natural language**: Agents can interact via natural language commands
✅ **Bulk operations**: Efficient multi-task management
✅ **Cross-project**: Single beads instance can manage multiple repositories/projects

## Final Enhancement: Smart Instruction Generation

Following user feedback about ensuring consistency between markdown and beads task instructions, I enhanced the **Instruction Generator** (`packages/core/src/instruction-generator.ts`) to provide task-backend-aware guidance:

### Before (Markdown Only)
```
**Plan File Guidance:**
- Work on the tasks listed in the Explore section  
- Mark completed tasks with [x] as you finish them
- Add new tasks as they are identified during your work with the user
```

### After (Smart Detection)
**When TASK_BACKEND=markdown:**
```
**Plan File Guidance:**
- Work on the tasks listed in the Explore section
- Mark completed tasks with [x] as you finish them  
- Add new tasks as they are identified during your work with the user
```

**When TASK_BACKEND=beads:**
```
**Plan File Guidance:**
- Work on the tasks listed in the Explore section
- Use beads tools for task management in this phase
- Create tasks: `bd create 'Task title' --parent <phase-task-id> -p 2`
- Complete tasks: `bd ready <task-id>`  
- Update task status: `bd update <task-id> --status in_progress`
- List phase tasks: `bd list --parent <phase-task-id>`
- Add new tasks as they are identified during your work with the user
```

This ensures that AI agents receive appropriate task management instructions regardless of which backend is active, maintaining workflow consistency while leveraging the enhanced capabilities of each system.

### Post-Implementation Research & Enhancement

Following user feedback about task dependency management, I conducted research on optimal beads workflow integration and enhanced the system with **workflow-focused instructions**:

#### Research Findings
- ✅ **Current implementation is optimal**: Either/or backend approach works well
- ✅ **Agent workflow efficiency**: `whats_next()` should provide curated, ready-to-use commands 
- ✅ **Dependency management**: Beads handles dependencies automatically - agents shouldn't analyze them
- ✅ **Phase hierarchy**: Project epic → phase tasks → work items structure is correct

#### Enhanced Instructions (v2)
**Before**:
```
- Create sub-tasks: `bd create 'Task title' --parent <phase-task-id> -p 2`
- List phase tasks: `bd list --parent <phase-task-id>`  
- Mark task complete: `bd ready <task-id>`
```

**After** (workflow-optimized):
```
**Recommended Workflow**:
1. **List ready tasks**: `bd list --parent <phase-task-id> --status open`
2. **Create new task**: `bd create 'Task title' --parent <phase-task-id> -p 2`
3. **Start working**: `bd update <task-id> --status in_progress` 
4. **Complete task**: `bd ready <task-id>`

**Important**: Work on ready tasks first. Let beads handle dependencies.
```

This enhancement provides agents with a clear, efficient workflow that leverages beads' dependency management without requiring manual dependency analysis.

## Notes

### Integration Strategy with Beads

**Recommended approach**: Integrate beads as an enhanced task management layer while preserving the existing plan file structure.

#### Two-Tier Integration Model
1. **Plan File Level** (Human-readable):
   - Keep existing phase-based sections for human readability
   - Include task summaries and progress indicators  
   - Maintain entrance criteria and completion tracking

2. **Beads Level** (AI Agent-optimized):
   - Create beads issues for detailed task management
   - Link beads issues to plan file sections via labels/metadata
   - Use beads for dependencies, priorities, time tracking
   - Enable cross-project task management

#### Implementation Approach
1. **Use existing beads-mcp server**: No need to build from scratch!
2. **Extend responsible-vibe-mcp**: Add optional beads integration layer
3. **Preserve backward compatibility**: Agents can continue using markdown-only mode
4. **Progressive enhancement**: Teams can adopt beads gradually

#### Workflow Integration
- **Phase tasks**: Create beads issues labeled with phase (e.g., "phase:explore")
- **Entrance criteria**: Track as special beads issues with dependencies
- **Plan sync**: Update plan files with beads task summaries for human review
- **Git commits**: Link beads issues to commits via conventional commit messages

#### Benefits Over Custom Solution
- **Proven solution**: Beads is already being used by AI agents in production
- **Active development**: Maintained by experienced team with agent focus
- **Rich ecosystem**: Existing integrations, documentation, community tools
- **Zero development overhead**: No need to build/maintain custom task tracker

## Simplified Integration Architecture

### Core Integration Strategy

**Simple Either/Or Approach**: Choose between markdown tasks OR beads tasks - no complexity of hybrid syncing.

#### Component Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Responsible-Vibe-MCP                     │
│ ┌─────────────────┐  ┌─────────────────┐                   │
│ │   Existing      │  │   Task Backend  │                   │
│ │   Tools &       │  │   Abstraction   │                   │
│ │   Workflows     │  │   Layer         │                   │
│ └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
          ┌─────────────────┐  ┌─────────────────┐
          │   Markdown      │  │   Beads         │
          │   Backend       │  │   Backend       │
          │   (Default)     │  │   (Optional)    │
          └─────────────────┘  └─────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │   Beads CLI     │
                              │   + MCP Tools   │
                              └─────────────────┘
```

#### Integration Layers

1. **Backend Detection Layer**: Check `bd` command and `TASK_BACKEND` env var
2. **Task Abstraction Layer**: Common interface for markdown vs beads tasks  
3. **Phase Management Layer**: Create beads phase tasks using hierarchy
4. **Instruction Layer**: Include beads tools in whats_next() when using beads backend

### Configuration Design

#### Environment Variable Control
```bash
# Choose task backend (defaults to markdown if not set)
export TASK_BACKEND=markdown  # Default - existing behavior
export TASK_BACKEND=beads     # Use beads for task management
```

#### Detection Logic
```
1. Check TASK_BACKEND environment variable
2. If TASK_BACKEND=beads:
   - Validate `bd` command is available
   - If not available: error + setup instructions
3. If TASK_BACKEND=markdown or unset:
   - Use existing markdown task management
4. No config files needed - simple env var control
```

### Task Management Model

#### When TASK_BACKEND=markdown (Default)
- **Existing behavior**: Plan files with `[ ]` and `[x]` tasks
- **No changes**: Current workflow continues exactly as before
- **Human readable**: Plan files remain primary task documentation

#### When TASK_BACKEND=beads  
- **Phase hierarchy**: Create beads task per workflow phase (epic → tasks)
- **No plan file tasks**: Plan file shows phase structure but no `[ ]` tasks
- **Beads-only tasks**: All task management through beads tools
- **Phase linking**: Each phase has its beads task ID for organization

#### Beads Hierarchy Structure
```
Project Epic: "responsible-vibe enhancement" (bd-a1b2)
├── Explore Phase: "Explore beads integration" (bd-a1b2.1)
│   ├── Task: "Analyze current issues" (bd-a1b2.1.1) 
│   └── Task: "Research beads features" (bd-a1b2.1.2)
├── Plan Phase: "Plan beads integration" (bd-a1b2.2)
│   ├── Task: "Design architecture" (bd-a1b2.2.1)
│   └── Task: "Create roadmap" (bd-a1b2.2.2)
└── Code Phase: "Implement beads integration" (bd-a1b2.3)
    ├── Task: "Add backend detection" (bd-a1b2.3.1)
    └── Task: "Update whats_next()" (bd-a1b2.3.2)
```

### Phase Task Management

#### Plan File Creation Process
```
When start_development() is called with TASK_BACKEND=beads:

1. Create plan file with phase sections (no task lists)
2. Create beads project epic for the development session  
3. Create beads phase task for each workflow phase
4. Store phase task IDs in plan file for reference

Plan file example:
## Explore
<!-- beads-phase-id: bd-a1b2.1 -->
### Phase Entrance Criteria:
- [x] Requirements gathered

### Tasks
Use beads tools to manage tasks for this phase.
Current phase task: bd-a1b2.1

## Plan  
<!-- beads-phase-id: bd-a1b2.2 -->
### Phase Entrance Criteria:
- [ ] Exploration complete
```

### User Experience Changes

#### For TASK_BACKEND=markdown (Default)
- **No changes**: Existing workflow continues unchanged
- **Plan file tasks**: Continue using `[ ]` and `[x]` checkboxes
- **Zero dependencies**: No beads installation required

#### For TASK_BACKEND=beads
- **Enhanced whats_next() responses**: Include beads tool instructions
- **Phase task context**: Always provided current phase task ID
- **Direct beads usage**: Agents told to use beads tools directly
- **No plan file editing**: Tasks managed entirely in beads

#### whats_next() Response Changes
```
When TASK_BACKEND=beads, whats_next() includes:

"Use beads tools for task management in this phase.
Current phase task: bd-a1b2.1 (Explore Phase)

Available beads tools:
- bd create 'Task title' --parent bd-a1b2.1 -p 1
- bd list --parent bd-a1b2.1  
- bd ready
- bd show bd-a1b2.1

Create tasks as children of the current phase task."
```

## Backwards Compatibility Plan

### Compatibility Guarantee
- **Zero breaking changes**: Existing responsible-vibe-mcp installations continue working unchanged
- **Opt-in integration**: Beads features are purely additive and optional
- **Graceful fallback**: When beads unavailable, system works in markdown-only mode

### Migration Strategy
```
Phase 1: Optional Beads (v1.0)
├── Add beads integration as opt-in feature
├── Maintain full markdown compatibility
└── Provide migration tools for existing plans

Phase 2: Enhanced Integration (v1.1)  
├── Improved sync algorithms
├── Advanced beads features
└── Better UX for beads users

Phase 3: Mature Ecosystem (v2.0)
├── Consider making beads default for new projects
├── Advanced workflow integrations
└── Enterprise features
```

### Legacy Support
- **Existing plan files**: Continue to work exactly as before
- **No forced migration**: Users choose when/if to adopt beads
- **Tool parity**: All existing responsible-vibe features remain available
- **Documentation**: Clear upgrade paths and migration guides

## Technical Challenges & Solutions

### Challenge 1: Beads Availability Detection  
**Problem**: Need to detect if beads is available when TASK_BACKEND=beads
**Solution**: 
- Check `bd` command exists and is functional
- Provide clear error messages with setup instructions if not found
- Graceful fallback messaging

### Challenge 2: Phase Task ID Management
**Problem**: Storing and retrieving beads phase task IDs  
**Solution**:
- Embed phase task IDs in plan file comments: `<!-- beads-phase-id: bd-a1b2.1 -->`
- Parse these IDs when providing whats_next() instructions
- Handle missing/invalid IDs gracefully

### Challenge 3: Tool Discovery
**Problem**: Agents need to know about beads tools when using beads backend
**Solution**:
- Include beads tool usage in whats_next() instructions
- Provide context-appropriate beads commands
- No need for MCP tool registration - just instruction

### Challenge 4: Migration Path
**Problem**: Users switching between backends
**Solution**:
- Clear documentation on differences
- Warning messages when switching backends
- No automatic migration - users choose approach

### Challenge 5: Setup Simplicity
**Problem**: Users need to install beads
**Solution**:
- Document beads installation clearly
- Detect missing beads and provide install links
- Make beads purely optional - default markdown always works

## Simplified Implementation Roadmap

### Phase 1: Backend Detection & Abstraction (Week 1)
1. **Environment Detection**
   - Add TASK_BACKEND environment variable support
   - Implement `bd` command availability checking  
   - Create task backend abstraction layer

2. **Plan File Generation Updates**
   - Modify start_development() to detect task backend
   - Update plan file templates for beads mode
   - Add phase task ID placeholder system

### Phase 2: Beads Integration (Week 2)  
3. **Phase Task Management**
   - Implement beads project epic creation
   - Add beads phase task creation during plan setup
   - Store phase task IDs in plan file comments

4. **whats_next() Enhancement**
   - Extend whats_next() to detect task backend
   - Add beads tool instructions for beads mode
   - Provide current phase task context

### Phase 3: Polish & Documentation (Week 3)
5. **Error Handling & UX**
   - Add clear error messages when beads unavailable
   - Implement graceful fallback behaviors
   - Create setup documentation

6. **Testing & Validation**
   - Test with both markdown and beads backends
   - Validate phase task hierarchy creation
   - Ensure backwards compatibility

### Key Simplifications
- **No MCP proxying**: Just include beads tool instructions
- **No hybrid syncing**: Either markdown OR beads, never both
- **No complex configuration**: Just environment variable
- **No migration tools**: Users choose backend per project

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
- [x] **TESTING**: Fixed tests with dependency injection pattern for proper mocking
- [x] **BUG FIX**: Resolved test file corruption and restored clean test structure
