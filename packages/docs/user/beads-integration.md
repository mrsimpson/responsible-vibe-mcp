# Beads Integration for Responsible-Vibe-MCP

This document describes the integration between responsible-vibe-mcp and the [beads distributed issue tracker](https://github.com/beads-data/beads).

## Overview

Responsible-vibe-mcp supports two task management backends:

- **Markdown Backend** (default): Traditional plan files with checkbox tasks (`[ ]` and `[x]`)
- **Beads Backend** (optional): Integration with beads distributed issue tracker for enhanced task management

## Why Beads?

Beads provides significant advantages over markdown checkboxes for complex development workflows:

### Rich Task Management

- **Multiple states**: open, in_progress, blocked, deferred, closed (+ custom statuses)
- **Priority levels**: P0 (critical) through P4 (low priority)
- **Dependencies**: Task blocking, relationships, and hierarchical structures
- **Rich metadata**: Assignees, due dates, estimates, external references, labels

### AI Agent Optimized

- **Context efficiency**: 2-5k tokens vs 10-50k for large markdown task lists
- **Git integration**: Native git storage with branching and merging support
- **Agent-first design**: Built specifically for AI agent workflows
- **Natural language interface**: Agents can interact via natural language commands

### Development Integration

- **Project organization**: Single beads instance manages multiple repositories
- **Zero-conflict merging**: Hash-based IDs prevent merge conflicts
- **Bulk operations**: Efficient multi-task management

## Configuration

### Environment Variable Control

Set the task backend using the `TASK_BACKEND` environment variable:

```bash
# Use markdown backend (default)
export TASK_BACKEND=markdown
# or leave unset for default behavior

# Use beads backend
export TASK_BACKEND=beads
```

### Backend Detection

The system automatically:

1. Checks the `TASK_BACKEND` environment variable
2. If set to `beads`, validates that the `bd` command is available
3. Falls back to markdown mode if beads is unavailable
4. Provides helpful error messages with setup instructions if needed

## Beads Installation

### Prerequisites

- Git repository for your project
- Go development environment (for building beads)

### Installation Steps

1. **Clone beads repository**:

   ```bash
   git clone https://github.com/beads-data/beads.git ~/beads
   cd ~/beads
   ```

2. **Build and install**:

   ```bash
   make install
   ```

3. **Verify installation**:

   ```bash
   bd --version
   ```

4. **Configure responsible-vibe-mcp**:
   ```bash
   export TASK_BACKEND=beads
   ```

## Usage

### Starting Development with Beads

When `TASK_BACKEND=beads` is set, calling `start_development()` will:

1. **Create project epic**: Main container for all development tasks
2. **Create phase tasks**: One task per workflow phase (e.g., Explore, Plan, Code, Commit)
3. **Generate plan file**: Modified plan file with beads integration
4. **Store task IDs**: Phase task IDs stored in plan file comments

Example plan file structure with beads:

```markdown
# Development Plan: My Project (feature-branch)

_Task Management: Beads Issue Tracker_

## Explore

<!-- beads-phase-id: bd-a1b2.1 -->

### Tasks

Tasks are managed via beads. Use beads tools to create and manage tasks for this phase.

### Completed

- [x] Created development plan file

## Plan

<!-- beads-phase-id: bd-a1b2.2 -->

### Tasks

Tasks are managed via beads. Use beads tools to create and manage tasks for this phase.
```

### Task Hierarchy

Beads creates a hierarchical task structure with sequential phase dependencies:

```
Project Epic: "responsible-vibe Development: My Project" (bd-a1b2)
├── Explore Phase: "Explore Phase" (bd-a1b2.1)
│   ├── Task: "Analyze current issues" (bd-a1b2.1.1)
│   └── Task: "Research alternatives" (bd-a1b2.1.2)
├── Plan Phase: "Plan Phase" (bd-a1b2.2) [depends on: Explore]
│   ├── Task: "Design architecture" (bd-a1b2.2.1)
│   └── Task: "Create roadmap" (bd-a1b2.2.2)
├── Code Phase: "Code Phase" (bd-a1b2.3) [depends on: Plan]
│   ├── Task: "Implement feature" (bd-a1b2.3.1)
│   └── Task: "Write tests" (bd-a1b2.3.2)
└── Commit Phase: "Commit Phase" (bd-a1b2.4) [depends on: Code]
    ├── Task: "Review and cleanup" (bd-a1b2.4.1)
    └── Task: "Final validation" (bd-a1b2.4.2)
```

### Sequential Phase Dependencies

**New Feature**: Responsible-vibe-mcp automatically creates sequential dependencies between workflow phases to ensure proper execution order.

**How it works**:

- Each phase automatically blocks the next phase in sequence
- Explore phase must be completed before Plan phase can begin
- Plan phase must be completed before Code phase can begin
- Code phase must be completed before Commit phase can begin

**Dependency Commands**:

```bash
# Dependencies are automatically created during start_development()
bd dep bd-a1b2.1 --blocks bd-a1b2.2  # Explore blocks Plan
bd dep bd-a1b2.2 --blocks bd-a1b2.3  # Plan blocks Code
bd dep bd-a1b2.3 --blocks bd-a1b2.4  # Code blocks Commit
```

**Benefits**:

- Ensures proper workflow sequence
- Prevents agents from jumping ahead to later phases
- Maintains development discipline and quality
- Leverages beads' native dependency management

### Using whats_next() with Beads

When beads backend is active, `whats_next()` responses include beads-specific instructions:

```
**Beads Task Management Active**

Current phase task: `bd-a1b2.1` (Explore Phase)

Use beads tools for task management in this phase:
- Create sub-tasks: `bd create 'Task title' --parent bd-a1b2.1 --description 'Detailed context explaining what, why, and how' --priority 2`
- List phase tasks: `bd list --parent bd-a1b2.1 --status open`
- Mark task complete: `bd close <task-id>`
- Show task details: `bd show <task-id>`
- Update task: `bd update <task-id> --status in_progress`

**Enhanced Task Creation**: Always include --description with detailed context:
- **What**: Clearly state what needs to be done
- **Why**: Explain the purpose and context
- **How**: Outline the approach or key steps

**Example**: `bd create 'Fix authentication bug' --parent bd-a1b2.3 --description 'Resolve login failure when users have special characters in passwords. Issue occurs in validateCredentials() method. Need to update regex pattern and add proper input sanitization.' --priority 1`
```

### Common Beads Commands

#### Task Creation

```bash
# Create a new task under current phase
bd create "Implement user authentication" --parent bd-a1b2.3 -p 1

# Create task with description and due date
bd create "Write API tests" --parent bd-a1b2.3 -p 2 --description "Unit tests for REST API endpoints" --due "2024-01-30"
```

#### Task Management

```bash
# List all tasks for current phase
bd list --parent bd-a1b2.3

# Show task details
bd show bd-a1b2.3.1

# Update task status
bd update bd-a1b2.3.1 --status in_progress

# Mark task as complete
bd close bd-a1b2.3.1

# Add dependencies
bd update bd-a1b2.3.2 --blocks bd-a1b2.3.1
```

#### Project Overview

```bash
# Show project epic and all phase tasks
bd show bd-a1b2

# List all tasks in project
bd list --parent bd-a1b2 --recursive
```

## Backwards Compatibility

The beads integration is fully backwards compatible:

### Existing Projects

- **No forced migration**: Existing markdown-based projects continue working unchanged
- **Per-project choice**: Each project can choose its task backend independently
- **Zero breaking changes**: All existing responsible-vibe-mcp features remain available

### Migration Strategy

- **Optional adoption**: Teams choose when/if to adopt beads
- **Coexistence**: Markdown and beads projects can coexist
- **Gradual transition**: Teams can experiment with beads on new projects

### Default Behavior

- **Markdown default**: New projects use markdown backend unless explicitly configured
- **Graceful fallback**: If beads is configured but unavailable, clear error messages provide guidance
- **No installation required**: Beads integration is purely opt-in

## Troubleshooting

### Beads Command Not Found

**Error**: `Beads command (bd) not found`

**Solution**: Install beads following the installation instructions above.

### Beads Integration Setup Failed

**Error**: `Failed to create beads project epic`

**Solutions**:

1. Ensure you're in a git repository
2. Verify beads is properly installed (`bd --version`)
3. Check beads is initialized in the project (`bd init` if needed)
4. Verify sufficient permissions in the project directory

### Phase Task IDs Not Found

**Error**: `Could not find beads phase task ID for current phase`

**Solutions**:

1. Check the plan file contains proper `<!-- beads-phase-id: bd-xxx -->` comments
2. Verify the beads tasks exist (`bd show bd-xxx`)
3. Re-run `start_development()` to regenerate the beads integration

### Switching Between Backends

To switch from beads to markdown:

```bash
unset TASK_BACKEND
# or
export TASK_BACKEND=markdown
```

To switch from markdown to beads:

```bash
export TASK_BACKEND=beads
```

**Note**: Existing plan files are not automatically converted. Start a new development session to use the new backend.

## Technical Details

### Architecture

The beads integration consists of several components:

1. **TaskBackendManager**: Detects and validates task backend configuration
2. **BeadsIntegration**: Handles beads project creation and task management
3. **PlanManager**: Generates appropriate plan files based on backend
4. **StartDevelopmentHandler**: Orchestrates beads setup during project initialization
5. **WhatsNextHandler**: Provides beads-specific instructions when active

### Plan File Modifications

When using beads backend, plan files are modified:

- **Task sections**: Replace checkbox lists with beads integration instructions
- **Phase task IDs**: Stored in comments for whats_next() reference
- **Backend indication**: Plan file header indicates active backend

### Error Handling

The integration includes comprehensive error handling:

- **Backend validation**: Ensures beads is available when requested
- **Setup instructions**: Provides clear guidance when beads is missing
- **Graceful degradation**: Falls back to markdown mode when appropriate
- **Detailed logging**: Comprehensive logging for debugging

## Limitations

### Current Limitations

1. **No real-time sync**: Plan files don't automatically update when beads tasks change
2. **Manual task creation**: Tasks must be created manually using beads commands
3. **Limited metadata display**: Plan files don't show full beads task metadata
4. **One-way integration**: Changes in beads don't automatically update plan files

### Future Enhancements

Potential improvements for future versions:

1. **Bidirectional sync**: Automatic plan file updates from beads changes
2. **Task template integration**: Pre-populate common tasks based on workflow phase
3. **Visual task management**: Rich task display in plan files
4. **Advanced workflow integration**: Custom beads workflows for different development phases

## Contributing

To contribute to the beads integration:

1. **Core logic**: Located in `packages/core/src/task-backend.ts` and `packages/core/src/beads-integration.ts`
2. **MCP handlers**: Located in `packages/mcp-server/src/tool-handlers/`
3. **Tests**: Add tests to relevant test suites in both core and mcp-server packages
4. **Documentation**: Update this document and related documentation

## Resources

- [Beads GitHub Repository](https://github.com/beads-data/beads)
- [Beads MCP Integration](https://github.com/beads-data/beads/tree/main/integrations/beads-mcp)
- [Responsible-Vibe-MCP Documentation](https://mrsimpson.github.io/responsible-vibe-mcp/)
- [Workflow Documentation](https://mrsimpson.github.io/responsible-vibe-mcp/workflows/)
