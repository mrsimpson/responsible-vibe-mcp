# Todo CLI

A minimal, fast command-line todo application for personal task management.

## Features

- **Simple CRUD Operations**: Add, list, complete, edit, and delete tasks
- **Human-Readable Storage**: YAML file format at `~/.todos.yaml`
- **Stable Task IDs**: Incremental counter that never reuses IDs
- **Smart Listing**: Completed tasks are hidden by default, show with `--all`
- **Cross-Platform**: Single binary for Linux, macOS, and Windows
- **Fast & Lightweight**: No dependencies, instant startup

## Installation

### Download Binary

Download the appropriate binary for your platform from the releases:

- `todo-linux` for Linux
- `todo-macos` for macOS
- `todo.exe` for Windows

### Build from Source

```bash
git clone <repository>
cd todo
go build -o todo
```

### Install to PATH

```bash
# Linux/macOS
sudo cp todo /usr/local/bin/

# Or add to your PATH
export PATH=$PATH:/path/to/todo
```

## Usage

### Basic Commands

```bash
# List active tasks
todo
todo list

# Add a new task
todo add "Buy groceries"
todo add "Write documentation"

# Complete a task
todo complete 1

# List all tasks (including completed)
todo list --all

# Edit a task
todo edit 2 "Buy organic groceries"

# Delete a task
todo delete 3

# Show help
todo help
```

### Examples

```bash
$ todo add "Review pull request"
Task 1 added

$ todo add "Deploy to production"
Task 2 added

$ todo
1: Review pull request
2: Deploy to production

$ todo complete 1
Task 1 completed

$ todo
2: Deploy to production

$ todo list --all
1: Review pull request [DONE]
2: Deploy to production
```

## Data Storage

Tasks are stored in `~/.todos.yaml` in human-readable YAML format:

```yaml
next_id: 3
tasks:
  1:
    id: 1
    description: 'Review pull request'
    created: '2025-10-02T12:30:00Z'
    completed: true
    completed_at: '2025-10-02T13:00:00Z'
  2:
    id: 2
    description: 'Deploy to production'
    created: '2025-10-02T12:31:00Z'
    completed: false
```

## Error Handling

The application provides clear error messages for common issues:

- Empty task descriptions
- Invalid task IDs
- Non-existent tasks
- File permission problems

## Cross-Platform Builds

```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o todo-linux

# macOS
GOOS=darwin GOARCH=amd64 go build -o todo-macos

# Windows
GOOS=windows GOARCH=amd64 go build -o todo.exe
```

## Architecture

The application follows a clean, modular architecture:

- `main.go` - Command routing and entry point
- `task.go` - Task data structures and business logic
- `storage.go` - YAML file operations with atomic writes
- `commands.go` - Command implementations and user interface

## Requirements

- Go 1.16+ (for building from source)
- No runtime dependencies

## License

[Add your license here]
