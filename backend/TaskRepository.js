import fs from 'fs';
import path from 'path';
import Task from './Task.js';

/**
 * Repository for managing tasks.
 *
 * The repository is responsible for loading and saving tasks to a
 * persistent storage file (`tasks.json`) and exposing CRUD operations
 * used by the controllers. It encapsulates all logic for generating
 * unique identifiers and ensures that newly created tasks have a
 * default status of "ToDo" as required by FR5.
 */




export default class TaskRepository {
  constructor(dataDir = path.join(process.cwd(), 'data')) {
    this.dataDir = dataDir;
    this.tasksFile = path.join(this.dataDir, 'tasks.json');
    this.tasks = [];
    this.nextId = 1;
    // Ensure that the data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    this.load();
  }

  /**
   * Load tasks from the JSON file. If the file does not exist it will
   * initialise an empty array. The nextId is computed based on the
   * maximum existing id in the file to avoid id collisions.
   */
  load() {
    try {
      if (fs.existsSync(this.tasksFile)) {
        const raw = fs.readFileSync(this.tasksFile, 'utf-8');
        const data = JSON.parse(raw);
        this.tasks = data.map((obj) => new Task(obj));
        // Determine the next id
        const maxId = this.tasks.reduce((acc, t) => Math.max(acc, t.id), 0);
        this.nextId = maxId + 1;
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      this.tasks = [];
      this.nextId = 1;
    }
  }

  /**
   * Save the current tasks to the JSON file. This method is called
   * automatically on exit via the provided save method, but may be
   * called manually when exporting tasks.
   */
  save() {
    try {
      fs.writeFileSync(this.tasksFile, JSON.stringify(this.tasks.map((t) => t.toJSON()), null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving tasks:', err);
    }
  }

  /**
   * Retrieve all tasks, optionally sorted and/or filtered.
   *
   * @param {Object} options Query options
   * @param {string} [options.sortBy] 'deadline' or 'priority' to sort tasks
   * @param {string} [options.filter] 'completed', 'not-completed' or 'high-priority'
   * @returns {Task[]} Array of tasks sorted/filtered accordingly
   */
  getTasks({ sortBy, filter } = {}) {
    let result = [...this.tasks];
    if (filter) {
      if (filter === 'completed') {
        result = result.filter((t) => t.status === 'Completed');
      } else if (filter === 'not-completed') {
        result = result.filter((t) => t.status !== 'Completed');
      } else if (filter === 'high-priority') {
        result = result.filter((t) => t.priority === 'High');
      }
    }
    if (sortBy) {
      if (sortBy === 'deadline') {
        result.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
      } else if (sortBy === 'priority') {
        const order = { High: 0, Medium: 1, Low: 2 };
        result.sort((a, b) => order[a.priority] - order[b.priority]);
      }
    }
    return result;
  }

  /**
   * Add a new task to the repository.
   *
   * @param {Object} data Partial task data from the user
   * @returns {Task} The created task instance
   */
  addTask(data) {
    const task = new Task({ id: this.nextId++, ...data, status: 'ToDo' });
    this.tasks.push(task);
    return task;
  }

  /**
   * Update an existing task by its id.
   *
   * @param {number} id Task identifier
   * @param {Object} updates Object containing the fields to update
   * @returns {Task|null} The updated task or null if not found
   */
  updateTask(id, updates) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const existing = this.tasks[index];
    const updated = new Task({ ...existing, ...updates, id: existing.id });
    this.tasks[index] = updated;
    return updated;
  }

  /**
   * Delete a task by its id.
   *
   * @param {number} id Task identifier
   * @returns {boolean} True if removed, false if not found
   */
  deleteTask(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.tasks.splice(index, 1);
    return true;
  }

  /**
   * Mark a task as completed.
   *
   * @param {number} id Task identifier
   * @returns {Task|null} The updated task or null if not found
   */
  markCompleted(id) {
    return this.updateTask(id, { status: 'Completed' });
  }
}