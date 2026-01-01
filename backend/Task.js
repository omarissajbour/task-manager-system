/**
 * Task model.
 *
 * Represents a single task in the Smart Task Organizer. Each task has
 * an auto‑generated identifier, a title, optional description, a deadline
 * stored as an ISO 8601 string, a priority ("High", "Medium" or "Low")
 * and a status. By default the status is set to "ToDo" and may later
 * be changed to "Completed" when the user marks the task as done.
 */
export default class Task {
  /**
   * Construct a new Task instance.
   *
   * @param {Object} options Options to initialise the task.
   * @param {number} options.id Unique identifier for the task.
   * @param {string} options.title Title describing the task.
   * @param {string} [options.description] Optional longer description.
   * @param {string} [options.deadline] ISO 8601 formatted deadline.
   * @param {string} [options.priority] Priority level (High, Medium, Low).
   * @param {string} [options.status] Status string (ToDo or Completed).
   */
  constructor({ id, title, description = '', deadline = null, priority = 'Low', status = 'ToDo' }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.deadline = deadline;
    this.priority = priority;
    this.status = status;
  }

  /**
   * Convert the task instance to a plain JSON object.
   *
   * @returns {Object} A serialisable representation of the task.
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      deadline: this.deadline,
      priority: this.priority,
      status: this.status
    };
  }
}