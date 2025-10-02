package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// addTask adds a new task with the given description
func addTask(args []string) {
	if len(args) == 0 {
		fmt.Println("Error: Task description cannot be empty")
		fmt.Println("Usage: todo add \"task description\"")
		os.Exit(1)
	}

	description := strings.Join(args, " ")
	if strings.TrimSpace(description) == "" {
		fmt.Println("Error: Task description cannot be empty")
		os.Exit(1)
	}

	todoData, err := LoadTodos()
	if err != nil {
		fmt.Printf("Error loading todos: %v\n", err)
		os.Exit(2)
	}

	task := NewTask(todoData.NextID, description)
	todoData.Tasks[todoData.NextID] = task
	taskID := todoData.NextID
	todoData.NextID++

	if err := SaveTodos(todoData); err != nil {
		fmt.Printf("Error saving todos: %v\n", err)
		os.Exit(2)
	}

	fmt.Printf("Task %d added\n", taskID)
}

// listTasks displays tasks (active only or all)
func listTasks(showAll bool) {
	todoData, err := LoadTodos()
	if err != nil {
		fmt.Printf("Error loading todos: %v\n", err)
		os.Exit(2)
	}

	if len(todoData.Tasks) == 0 {
		fmt.Println("No tasks found")
		return
	}

	hasActiveTasks := false
	for id := 1; id < todoData.NextID; id++ {
		task, exists := todoData.Tasks[id]
		if !exists {
			continue
		}

		if !showAll && task.Completed {
			continue
		}

		hasActiveTasks = true
		status := ""
		if task.Completed {
			status = " [DONE]"
		}
		fmt.Printf("%d: %s%s\n", task.ID, task.Description, status)
	}

	if !hasActiveTasks && !showAll {
		fmt.Println("No active tasks")
	}
}

// completeTask marks a task as completed
func completeTask(args []string) {
	if len(args) == 0 {
		fmt.Println("Error: Task ID required")
		fmt.Println("Usage: todo complete <id>")
		os.Exit(1)
	}

	id, err := strconv.Atoi(args[0])
	if err != nil {
		fmt.Printf("Error: Invalid task ID: %s\n", args[0])
		os.Exit(1)
	}

	todoData, err := LoadTodos()
	if err != nil {
		fmt.Printf("Error loading todos: %v\n", err)
		os.Exit(2)
	}

	task, exists := todoData.Tasks[id]
	if !exists {
		fmt.Printf("Error: Task ID %d not found\n", id)
		os.Exit(1)
	}

	if task.Completed {
		fmt.Printf("Task %d already completed\n", id)
		return
	}

	task.MarkCompleted()

	if err := SaveTodos(todoData); err != nil {
		fmt.Printf("Error saving todos: %v\n", err)
		os.Exit(2)
	}

	fmt.Printf("Task %d completed\n", id)
}

// editTask updates a task's description
func editTask(args []string) {
	if len(args) < 2 {
		fmt.Println("Error: Task ID and new description required")
		fmt.Println("Usage: todo edit <id> \"new description\"")
		os.Exit(1)
	}

	id, err := strconv.Atoi(args[0])
	if err != nil {
		fmt.Printf("Error: Invalid task ID: %s\n", args[0])
		os.Exit(1)
	}

	description := strings.Join(args[1:], " ")
	if strings.TrimSpace(description) == "" {
		fmt.Println("Error: Task description cannot be empty")
		os.Exit(1)
	}

	todoData, err := LoadTodos()
	if err != nil {
		fmt.Printf("Error loading todos: %v\n", err)
		os.Exit(2)
	}

	task, exists := todoData.Tasks[id]
	if !exists {
		fmt.Printf("Error: Task ID %d not found\n", id)
		os.Exit(1)
	}

	task.Description = description

	if err := SaveTodos(todoData); err != nil {
		fmt.Printf("Error saving todos: %v\n", err)
		os.Exit(2)
	}

	fmt.Printf("Task %d updated\n", id)
}

// deleteTask removes a task permanently
func deleteTask(args []string) {
	if len(args) == 0 {
		fmt.Println("Error: Task ID required")
		fmt.Println("Usage: todo delete <id>")
		os.Exit(1)
	}

	id, err := strconv.Atoi(args[0])
	if err != nil {
		fmt.Printf("Error: Invalid task ID: %s\n", args[0])
		os.Exit(1)
	}

	todoData, err := LoadTodos()
	if err != nil {
		fmt.Printf("Error loading todos: %v\n", err)
		os.Exit(2)
	}

	_, exists := todoData.Tasks[id]
	if !exists {
		fmt.Printf("Error: Task ID %d not found\n", id)
		os.Exit(1)
	}

	delete(todoData.Tasks, id)

	if err := SaveTodos(todoData); err != nil {
		fmt.Printf("Error saving todos: %v\n", err)
		os.Exit(2)
	}

	fmt.Printf("Task %d deleted\n", id)
}

// showHelp displays usage information
func showHelp() {
	fmt.Println("Todo CLI - Simple task management")
	fmt.Println()
	fmt.Println("Usage:")
	fmt.Println("  todo                    List active tasks")
	fmt.Println("  todo add \"description\"   Add a new task")
	fmt.Println("  todo list               List active tasks")
	fmt.Println("  todo list --all         List all tasks (including completed)")
	fmt.Println("  todo complete <id>      Mark task as completed")
	fmt.Println("  todo edit <id> \"desc\"    Update task description")
	fmt.Println("  todo delete <id>        Delete task permanently")
	fmt.Println("  todo help               Show this help")
	fmt.Println()
	fmt.Println("Examples:")
	fmt.Println("  todo add \"Buy groceries\"")
	fmt.Println("  todo complete 1")
	fmt.Println("  todo edit 2 \"Buy organic groceries\"")
}
