# Detailed Design: CLI Todo App

## Implementation Strategy

### Development Phases

#### Phase 1: Foundation (Core Infrastructure)

**Goal**: Establish basic project structure and data handling

1. **Project Setup**
   - Initialize Go module: `go mod init todo`
   - Create basic file structure
   - Add YAML dependency: `gopkg.in/yaml.v3`

2. **Storage Layer (`storage.go`)**
   - `TodoData` struct with NextID and Tasks map
   - `LoadTodos()` function - read YAML file, handle missing file
   - `SaveTodos()` function - atomic write with temp file
   - `GetTodoFilePath()` function - cross-platform home directory

3. **Task Model (`task.go`)**
   - `Task` struct with ID, Description, Created, Completed, CompletedAt
   - `NewTask()` constructor function
   - `MarkCompleted()` method
   - Task validation functions

#### Phase 2: Core Commands (MVP)

**Goal**: Implement essential CRUD operations

4. **Add Command**
   - Parse task description from arguments
   - Validate non-empty description
   - Generate new ID, create task
   - Save to file, return success message with ID

5. **List Command**
   - Load todos from file
   - Filter active tasks (completed=false)
   - Format output: "ID: Description"
   - Handle empty list gracefully

6. **Complete Command**
   - Parse task ID from arguments
   - Validate ID exists and is numeric
   - Mark task as completed with timestamp
   - Save to file, return confirmation with ID

#### Phase 3: Extended Commands

**Goal**: Add remaining CRUD operations

7. **Edit Command**
   - Parse ID and new description
   - Validate task exists and description not empty
   - Update task description
   - Save to file, return confirmation

8. **Delete Command**
   - Parse task ID from arguments
   - Validate task exists
   - Remove from tasks map
   - Save to file, return confirmation

9. **List All Command**
   - Load todos from file
   - Show all tasks with completion status
   - Format: "ID: Description [DONE]" for completed

#### Phase 4: Polish & Testing

**Goal**: Robust error handling and user experience

10. **Error Handling**
    - File permission errors
    - YAML parsing errors
    - Invalid input validation
    - Consistent error messages

11. **Help System**
    - Usage information for each command
    - Command examples
    - Error message improvements

12. **Testing & Validation**
    - Manual testing of all commands
    - Edge case validation
    - Cross-platform testing

## Detailed Component Design

### Main Entry Point (`main.go`)

```go
func main() {
    if len(os.Args) < 2 {
        listTasks(false) // Default to list active tasks
        return
    }

    command := os.Args[1]
    switch command {
    case "add":
        addTask(os.Args[2:])
    case "list":
        showAll := len(os.Args) > 2 && os.Args[2] == "--all"
        listTasks(showAll)
    case "complete":
        completeTask(os.Args[2:])
    case "edit":
        editTask(os.Args[2:])
    case "delete":
        deleteTask(os.Args[2:])
    case "help":
        showHelp()
    default:
        fmt.Printf("Unknown command: %s\n", command)
        showHelp()
        os.Exit(1)
    }
}
```

### Storage Operations

```go
func LoadTodos() (*TodoData, error) {
    // Get file path, handle missing file
    // Read YAML, unmarshal to TodoData
    // Return initialized structure if file missing
}

func SaveTodos(data *TodoData) error {
    // Marshal to YAML
    // Write to temp file atomically
    // Rename temp file to final location
}
```

### Command Implementations

```go
func addTask(args []string) {
    // Validate description not empty
    // Load current todos
    // Create new task with next ID
    // Save todos
    // Print "Task X added"
}

func listTasks(showAll bool) {
    // Load todos
    // Filter by completion status
    // Format and print each task
}

func completeTask(args []string) {
    // Parse and validate ID
    // Load todos
    // Mark task completed
    // Save todos
    // Print "Task X completed"
}
```

## Error Handling Strategy

### Input Validation

- Empty task descriptions → "Task description cannot be empty"
- Invalid task IDs → "Invalid task ID: {input}"
- Missing arguments → Show command usage

### File Operations

- Missing todo file → Create automatically with empty structure
- Permission errors → "Cannot access todo file: {error}"
- YAML parsing errors → Backup corrupted file, create new one

### Task Operations

- Task not found → "Task ID {id} not found"
- Already completed → "Task {id} already completed"
- System errors → Generic error with exit code 2

## Data Flow

### Add Task Flow

1. Parse command line arguments
2. Validate description not empty
3. Load existing todos from file
4. Generate new task with incremented ID
5. Add task to todos map
6. Save updated todos to file
7. Print confirmation with task ID

### List Tasks Flow

1. Load todos from file
2. Filter tasks based on completion status
3. Sort tasks by ID
4. Format and display each task
5. Handle empty list case

### Complete Task Flow

1. Parse and validate task ID
2. Load todos from file
3. Verify task exists
4. Update task completion status and timestamp
5. Save updated todos to file
6. Print confirmation message

## Testing Strategy

### Manual Test Cases

1. **First Run**: Verify file creation
2. **Add Tasks**: Multiple tasks with various descriptions
3. **List Tasks**: Empty list, single task, multiple tasks
4. **Complete Tasks**: Valid IDs, invalid IDs, already completed
5. **Edit Tasks**: Valid updates, empty descriptions
6. **Delete Tasks**: Existing tasks, non-existent tasks
7. **Edge Cases**: Special characters, very long descriptions
8. **File Operations**: Permission issues, corrupted files

### Cross-Platform Testing

- Test on macOS, Linux, Windows
- Verify file path resolution
- Check binary execution

## Performance Considerations

### File I/O Optimization

- Read entire file into memory (acceptable for personal use)
- Use atomic writes to prevent corruption
- Minimal file system calls per operation

### Memory Usage

- Keep data structures simple
- Avoid unnecessary copying
- Use pointers for large structs

## Build and Distribution

### Build Commands

```bash
# Development build
go build -o todo

# Release builds
GOOS=linux GOARCH=amd64 go build -o todo-linux
GOOS=darwin GOARCH=amd64 go build -o todo-macos
GOOS=windows GOARCH=amd64 go build -o todo.exe
```

### Installation

1. Place binary in PATH directory
2. Run `todo help` to verify installation
3. First command will create `~/.todos.yaml`
