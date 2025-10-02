package main

import "time"

// Task represents a single todo item
type Task struct {
	ID          int        `yaml:"id"`
	Description string     `yaml:"description"`
	Created     time.Time  `yaml:"created"`
	Completed   bool       `yaml:"completed"`
	CompletedAt *time.Time `yaml:"completed_at,omitempty"`
}

// TodoData represents the entire todo file structure
type TodoData struct {
	NextID int            `yaml:"next_id"`
	Tasks  map[int]*Task  `yaml:"tasks"`
}

// NewTask creates a new task with the given ID and description
func NewTask(id int, description string) *Task {
	return &Task{
		ID:          id,
		Description: description,
		Created:     time.Now(),
		Completed:   false,
	}
}

// MarkCompleted marks the task as completed with current timestamp
func (t *Task) MarkCompleted() {
	t.Completed = true
	now := time.Now()
	t.CompletedAt = &now
}

// NewTodoData creates an empty TodoData structure
func NewTodoData() *TodoData {
	return &TodoData{
		NextID: 1,
		Tasks:  make(map[int]*Task),
	}
}
