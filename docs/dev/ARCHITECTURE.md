# Technical Architecture: CLI Todo App

## Overview

A minimal, fast CLI todo application built in Go, designed for single-binary distribution across multiple platforms.

## Technology Stack

### Core Technology

- **Language**: Go 1.21+
- **Distribution**: Single binary executable
- **Storage**: YAML file (`~/.todos.yaml`)
- **Dependencies**: Minimal external dependencies

### Key Libraries

- **CLI Parsing**: Go standard `flag` package
- **YAML Operations**: `gopkg.in/yaml.v3`
- **File Operations**: Go standard library (`os`, `filepath`, `io`)
- **Time Handling**: Go standard `time` package

## Project Structure

```
todo/
├── main.go          # Entry point and command routing
├── task.go          # Task struct and business logic
├── storage.go       # YAML file operations and data persistence
├── commands.go      # Command implementations (add, list, complete, etc.)
├── go.mod          # Go module definition
└── go.sum          # Dependency checksums
```

## Architecture Components

### 1. Main Entry Point (`main.go`)

- Command-line argument parsing using `flag` package
- Command routing to appropriate handlers
- Global error handling and exit codes
- Help text generation

### 2. Task Model (`task.go`)

```go
type Task struct {
    ID          int       `yaml:"id"`
    Description string    `yaml:"description"`
    Created     time.Time `yaml:"created"`
    Completed   bool      `yaml:"completed"`
    CompletedAt *time.Time `yaml:"completed_at,omitempty"`
}

type TodoData struct {
    NextID int           `yaml:"next_id"`
    Tasks  map[int]*Task `yaml:"tasks"`
}
```

### 3. Storage Layer (`storage.go`)

- YAML file read/write operations
- Atomic file updates (write to temp file, then rename)
- File creation and permission handling
- Data validation and error recovery

### 4. Command Handlers (`commands.go`)

- Individual command implementations
- Input validation and sanitization
- Formatted output generation
- Error message standardization

## Data Storage Design

### File Location

- Primary: `~/.todos.yaml`
- Cross-platform home directory resolution using `os.UserHomeDir()`
- Automatic file creation on first use

### YAML Structure

```yaml
next_id: 4
tasks:
  1:
    id: 1
    description: 'Buy groceries'
    created: '2025-10-02T12:30:00Z'
    completed: false
  2:
    id: 2
    description: 'Write documentation'
    created: '2025-10-02T12:31:00Z'
    completed: true
    completed_at: '2025-10-02T13:00:00Z'
  3:
    id: 3
    description: 'Review code'
    created: '2025-10-02T12:32:00Z'
    completed: false
```

### ID Management

- Incremental counter starting from 1
- IDs never reused (even after task deletion)
- `next_id` field tracks the next available ID

## Command Interface Design

### Command Structure

```bash
todo <command> [arguments]
```

### Supported Commands

- `todo` or `todo list` - Show active tasks
- `todo add "description"` - Add new task
- `todo complete <id>` - Mark task as completed
- `todo edit <id> "new description"` - Update task
- `todo delete <id>` - Remove task permanently
- `todo list --all` - Show all tasks including completed
- `todo help` - Show usage information

### Argument Parsing Strategy

- Use Go's `flag` package with custom parsing logic
- Handle positional arguments for task descriptions
- Support both quoted and unquoted task descriptions
- Validate numeric IDs with clear error messages

## Error Handling Strategy

### File Operations

- Graceful handling of missing files (auto-create)
- Permission error detection with helpful messages
- YAML parsing error recovery with backup creation
- Atomic writes to prevent data corruption

### Input Validation

- Empty task description validation
- Numeric ID validation with range checking
- Command existence validation
- Argument count validation

### Error Messages

- Clear, actionable error messages
- Consistent formatting across all commands
- Exit codes: 0 (success), 1 (user error), 2 (system error)

## Cross-Platform Compatibility

### File System

- Use `filepath.Join()` for path construction
- `os.UserHomeDir()` for home directory detection
- Standard Go file operations (platform-agnostic)

### Binary Distribution

- Cross-compilation support: `GOOS=linux GOARCH=amd64 go build`
- Target platforms: Linux, macOS, Windows
- Single binary with no external dependencies

## Performance Considerations

### File I/O Optimization

- Read entire file into memory (acceptable for personal use)
- Batch operations to minimize file writes
- Use buffered I/O for larger operations

### Memory Usage

- Minimal memory footprint
- Efficient YAML marshaling/unmarshaling
- No persistent background processes

### Startup Time

- Fast binary startup (Go advantage)
- Minimal dependency loading
- Direct file access without caching layers

## Security Considerations

### File Permissions

- Create todo file with user-only permissions (0600)
- Respect existing file permissions
- No network operations or external API calls

### Input Sanitization

- Validate all user inputs
- Prevent YAML injection through task descriptions
- Safe handling of special characters

## Build and Distribution

### Build Process

```bash
go mod init todo
go mod tidy
go build -o todo
```

### Cross-Platform Builds

```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o todo-linux

# macOS
GOOS=darwin GOARCH=amd64 go build -o todo-macos

# Windows
GOOS=windows GOARCH=amd64 go build -o todo.exe
```

### Installation

- Single binary placement in PATH
- No additional configuration required
- Automatic data file creation on first use

## Future Extensibility

### Planned Enhancements

- Remote file hosting support (minimal changes to storage layer)
- Basic filtering capabilities
- Export functionality

### Architecture Flexibility

- Modular design allows easy feature additions
- Storage layer abstraction enables different backends
- Command pattern supports new operations

## Non-Functional Requirements

### Performance Targets

- Command execution: <100ms for typical file sizes
- File operations: <50ms for read/write cycles
- Binary size: <10MB

### Reliability

- Data integrity through atomic file operations
- Graceful degradation on file system errors
- Consistent behavior across platforms

### Maintainability

- Clear separation of concerns
- Minimal external dependencies
- Comprehensive error handling
- Self-documenting code structure
