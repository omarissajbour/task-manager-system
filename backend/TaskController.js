import TaskRepository from './TaskRepository.js';
import fs from 'fs';

/**
 * TaskController wires HTTP routes to the underlying TaskRepository. It is
 * designed to be instantiated once with a TaskRepository instance and
 * exposes handler functions that can be passed directly to Express route
 * definitions. Keeping routing logic separate from business logic
 * improves testability and adheres to the controller concept of the
 * MVC pattern.
 */
export default class TaskController {
  /**
   * Create a new TaskController.
   *
   * @param {TaskRepository} repository Instance responsible for persistence
   */
  constructor(repository) {
    this.repository = repository;
    // Bind methods to this instance to ensure correct context when used as route handlers
    this.listTasks = this.listTasks.bind(this);
    this.createTask = this.createTask.bind(this);
    this.updateTask = this.updateTask.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
    this.markCompleted = this.markCompleted.bind(this);
    this.exportTasks = this.exportTasks.bind(this);
  }


  

  /**
   * Handle GET /tasks requests with optional sorting and filtering.
   */
  listTasks(req, res) {
    const { sortBy, filter } = req.query;
    const tasks = this.repository.getTasks({ sortBy, filter });
    res.json(tasks.map((t) => t.toJSON()));
  }

  /**
   * Handle POST /tasks requests to create a new task. Validates
   * mandatory fields and returns the created task.
   */
  createTask(req, res) {
    const { title, description, deadline, priority } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const allowedPriorities = ['High', 'Medium', 'Low'];
    const normalizedPriority = allowedPriorities.includes(priority) ? priority : 'Low';
    const newTask = this.repository.addTask({
      title,
      description: description || '',
      deadline: deadline || null,
      priority: normalizedPriority
    });
    res.status(201).json(newTask.toJSON());
  }

  /**
   * Handle PUT /tasks/:id requests to update an existing task.
   */
  updateTask(req, res) {
    const id = parseInt(req.params.id, 10);
    const { title, description, deadline, priority, status } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (deadline !== undefined) updates.deadline = deadline;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    const updated = this.repository.updateTask(id, updates);
    if (!updated) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(updated.toJSON());
  }

  /**
   * Handle DELETE /tasks/:id requests to remove a task.
   */
  deleteTask(req, res) {
    const id = parseInt(req.params.id, 10);
    const ok = this.repository.deleteTask(id);
    if (!ok) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(204).send();
  }

  /**
   * Handle POST /tasks/:id/complete requests to mark a task as completed.
   */
  markCompleted(req, res) {
    const id = parseInt(req.params.id, 10);
    const updated = this.repository.markCompleted(id);
    if (!updated) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(updated.toJSON());
  }

  /**
   * Export all tasks to a text file and return its contents in the response.
   */
  exportTasks(req, res) {
    const tasks = this.repository.getTasks();
    const lines = tasks.map((t) => {
      return `ID: ${t.id}\nTitle: ${t.title}\nDescription: ${t.description}\nDeadline: ${t.deadline}\nPriority: ${t.priority}\nStatus: ${t.status}\n`;
    });
    const text = lines.join('\n');
    // Write to export file
    const exportPath = this.repository.tasksFile.replace('tasks.json', 'tasks_export.txt');
    fs.writeFileSync(exportPath, text, 'utf-8');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks_export.txt"');
    res.send(text);
  }
}