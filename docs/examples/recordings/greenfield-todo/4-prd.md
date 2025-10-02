# Product Requirements Document: CLI Todo App

## Overview

A minimal, fast CLI todo application for personal task management, designed for developers who work primarily on the command line.

## User Profile

- **Primary User**: Developer who works primarily on command line
- **Use Case**: Personal task tracking and management
- **Environment**: Terminal/command line interface
- **Priority**: Speed and simplicity over features

## Core Requirements

### Functional Requirements

1. **Task Creation**: Add new tasks with descriptions
2. **Task Listing**: View active (incomplete) tasks
3. **Task Completion**: Mark tasks as completed
4. **Task Editing**: Modify existing task descriptions
5. **Task Deletion**: Remove tasks permanently

### Technical Requirements

- **Platform**: Command Line Interface (CLI)
- **Storage**: YAML file at `~/.todos.yaml`
- **Task IDs**: Incremental counter (1, 2, 3...), never reused
- **Metadata**: Store creation date (not displayed by default)
- **Completed Tasks**: Mark as done, exclude from default list view

## Command Interface

### Core Commands

```bash
todo add "Task description"     # Add new task, return ID
todo list                       # Show active tasks
todo complete <id>              # Mark task as completed, return confirmation
todo edit <id> "New description" # Update task description
todo delete <id>                # Remove task permanently
todo                           # Alias for 'todo list'
todo list --all                # Show all tasks including completed
todo help                      # Show usage information
```

### Command Responses

- All operations return the affected task ID
- Success messages: "Task 5 added", "Task 3 completed", "Task 7 deleted"
- Error messages: Clear, actionable feedback

## Data Structure (YAML)

```yaml
next_id: 4
tasks:
  1:
    description: 'Buy groceries'
    created: '2025-10-02T12:30:00Z'
    completed: false
  2:
    description: 'Write documentation'
    created: '2025-10-02T12:31:00Z'
    completed: true
    completed_at: '2025-10-02T13:00:00Z'
  3:
    description: 'Review code'
    created: '2025-10-02T12:32:00Z'
    completed: false
```

## Edge Case Handling

### Input Validation

- Empty task description → Error: "Task description cannot be empty"
- Invalid task ID → Error: "Invalid task ID: xyz"
- Missing arguments → Show usage help

### File Operations

- Missing todo file → Create automatically on first use
- Corrupted YAML → Backup existing, create new, warn user
- Permission issues → Clear error message with fix suggestion

### Task Operations

- Complete already completed task → "Task already completed" (not error)
- Delete non-existent task → Error: "Task ID not found"
- Duplicate descriptions → Allow (different IDs and timestamps)

## Success Criteria

- **Speed**: Commands execute in <100ms for typical file sizes
- **Simplicity**: Core workflow requires no documentation to understand
- **Reliability**: Graceful handling of all edge cases
- **Usability**: Natural command syntax that feels intuitive

## Out of Scope (v1)

- Due dates and reminders
- Task categories or tags
- Collaboration features
- Synchronization across devices
- Priority levels
- Task dependencies
- Recurring tasks
- Rich text formatting

## Future Considerations

- Remote file hosting capability
- Basic task filtering
- Export functionality
