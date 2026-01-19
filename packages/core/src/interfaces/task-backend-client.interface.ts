/**
 * Task Backend Client Interface
 *
 * Defines the contract for task backend operations (CLI commands, etc.).
 * Enables clean abstraction of different task backends (beads, GitHub Issues, etc.).
 */

/**
 * Represents a task from the backend
 */
export interface BackendTask {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: number;
  parent?: string;
  children?: BackendTask[];
}

/**
 * Result of task validation operations
 */
export interface TaskValidationResult {
  valid: boolean;
  openTasks: BackendTask[];
  message?: string;
}

/**
 * Interface for task backend client operations
 * All task backend clients must implement this interface
 */
export interface ITaskBackendClient {
  /**
   * Check if the task backend is available and properly configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get all open tasks for a given parent task
   */
  getOpenTasks(parentTaskId: string): Promise<BackendTask[]>;

  /**
   * Validate that all tasks under a parent are completed
   * Returns validation result with details about any remaining open tasks
   */
  validateTasksCompleted(parentTaskId: string): Promise<TaskValidationResult>;

  /**
   * Create a new task under a parent
   */
  createTask(
    title: string,
    parentTaskId: string,
    priority?: number
  ): Promise<string>;

  /**
   * Update task status
   */
  updateTaskStatus(
    taskId: string,
    status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  ): Promise<void>;
}
