package main

import (
	"fmt"
	"os"
)

func main() {
	// If no arguments, default to listing active tasks
	if len(os.Args) < 2 {
		listTasks(false)
		return
	}

	command := os.Args[1]
	args := os.Args[2:]

	switch command {
	case "add":
		addTask(args)
	case "list":
		showAll := len(args) > 0 && args[0] == "--all"
		listTasks(showAll)
	case "complete":
		completeTask(args)
	case "edit":
		editTask(args)
	case "delete":
		deleteTask(args)
	case "help":
		showHelp()
	default:
		fmt.Printf("Error: Unknown command: %s\n", command)
		showHelp()
		os.Exit(1)
	}
}
