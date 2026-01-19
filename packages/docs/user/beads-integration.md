# Beads Integration for Responsible-Vibe-MCP

> ⚠️ **Experimental Feature**: Beads integration is experimental. Requires `bd` CLI to be installed.

Integration between responsible-vibe-mcp and [beads distributed issue tracker](https://github.com/steveyegge/beads) for enhanced AI agent task management.

## Overview

**Prerequisites**: `bd` CLI must be installed and available in PATH.

**Backends**:

- **Markdown** (default): Checkbox tasks in plan files
- **Beads** (experimental): Rich task management with dependencies, priorities, and git integration

## Configuration

```bash
# Enable beads backend
export TASK_BACKEND=beads

# Fallback to markdown (default)
export TASK_BACKEND=markdown
# or unset TASK_BACKEND
```

or add this to the MCP env config in your agent.

**Auto-detection**: System validates `bd` command availability and falls back to markdown if unavailable.

## Quick Setup

1. Install beads CLI (`bd` command must be in PATH)
2. `export TASK_BACKEND=beads`
3. Use `start_development()` as normal

## Usage

### Development Workflow

When `TASK_BACKEND=beads`:

1. **Project epic**: Created automatically for all development tasks
2. **Phase tasks**: One task per workflow phase with sequential dependencies
3. **Plan file**: Modified to include beads task IDs in comments

**Task Hierarchy** (automatic):

```
Project Epic: "responsible-vibe Development: My Project" (bd-a1b2)
├── Explore Phase (bd-a1b2.1) → Plan Phase (bd-a1b2.2) →
├── Code Phase (bd-a1b2.3) → Commit Phase (bd-a1b2.4)
```

**Sequential dependencies**: Each phase blocks the next, ensuring proper workflow order.

### Essential Commands

```bash
# Task creation with context
bd create "Task title" --parent bd-a1b2.1 --description "what, why, how" --priority 2

# Task management
bd list --parent bd-a1b2.1 --status open  # List phase tasks
bd show <task-id>                          # Show details
bd update <task-id> --status in_progress   # Update status
bd close <task-id>                         # Mark complete

# Project overview
bd show bd-a1b2                            # Show epic
bd list --parent bd-a1b2 --recursive       # All project tasks
```

## Troubleshooting

**`bd` command not found**: Install beads CLI and ensure it's in PATH  
**Beads setup failed**: Ensure git repo, run `bd init` if needed  
**Phase task IDs missing**: Re-run `start_development()` to regenerate beads integration

**Switch backends**: Change `TASK_BACKEND` environment variable and restart development session.

## Technical Notes

- **Backwards compatible**: Existing markdown projects unaffected
- **Per-project choice**: Each project chooses its backend independently
- **Graceful fallback**: Falls back to markdown if beads unavailable
- **Plan file modifications**: Phase task IDs stored in comments for reference

**Limitations**: No real-time sync between beads and plan files; manual task creation required.

## Resources

- [Beads Repository](https://github.com/steveyegge/beads)
- [Beads MCP Integration](https://github.com/beads-data/beads/tree/main/integrations/beads-mcp)
