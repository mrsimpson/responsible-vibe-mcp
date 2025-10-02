package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// GetTodoFilePath returns the path to the todo file
func GetTodoFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("cannot get home directory: %w", err)
	}
	return filepath.Join(homeDir, ".todos.yaml"), nil
}

// LoadTodos loads the todo data from the YAML file
func LoadTodos() (*TodoData, error) {
	filePath, err := GetTodoFilePath()
	if err != nil {
		return nil, err
	}

	// If file doesn't exist, return empty TodoData
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return NewTodoData(), nil
	}

	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("cannot read todo file: %w", err)
	}

	var todoData TodoData
	if err := yaml.Unmarshal(data, &todoData); err != nil {
		return nil, fmt.Errorf("cannot parse todo file: %w", err)
	}

	// Initialize tasks map if nil
	if todoData.Tasks == nil {
		todoData.Tasks = make(map[int]*Task)
	}

	return &todoData, nil
}

// SaveTodos saves the todo data to the YAML file atomically
func SaveTodos(todoData *TodoData) error {
	filePath, err := GetTodoFilePath()
	if err != nil {
		return err
	}

	data, err := yaml.Marshal(todoData)
	if err != nil {
		return fmt.Errorf("cannot marshal todo data: %w", err)
	}

	// Write to temporary file first
	tempPath := filePath + ".tmp"
	if err := ioutil.WriteFile(tempPath, data, 0600); err != nil {
		return fmt.Errorf("cannot write temp file: %w", err)
	}

	// Atomically rename temp file to final file
	if err := os.Rename(tempPath, filePath); err != nil {
		os.Remove(tempPath) // Clean up temp file on error
		return fmt.Errorf("cannot save todo file: %w", err)
	}

	return nil
}
