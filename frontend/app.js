const { useState, useEffect } = React;

function App() {
  const [tasks, setTasks] = useState([]);
  // The form holds editable fields for creating or editing a task.  We include
  // the status field so completed tasks can be reverted when editing.
  const [form, setForm] = useState({ id: null, title: '', description: '', deadline: '', priority: 'Low', status: 'ToDo' });
  const [editing, setEditing] = useState(false);
  // page controls which view to render: 'list' for task overview, 'form' for create/edit
  const [page, setPage] = useState('list');
  const [sortBy, setSortBy] = useState('');
  const [filter, setFilter] = useState('');

  // Fetch tasks from API with current sort/filter
  const fetchTasks = async () => {
    try {
      const params = [];
      if (sortBy) params.push(`sortBy=${encodeURIComponent(sortBy)}`);
      if (filter) params.push(`filter=${encodeURIComponent(filter)}`);
      const url = '/tasks' + (params.length ? '?' + params.join('&') : '');
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [sortBy, filter]);

  // Handle input changes for the form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form to create or update a task
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      alert('Title is required');
      return;
    }
    const payload = {
      title: form.title,
      description: form.description,
      deadline: form.deadline || null,
      priority: form.priority,
      status: form.status || 'ToDo'
    };
    try {
      if (editing) {
        await fetch(`/tasks/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      // Reset form and return to the list view
      setForm({ id: null, title: '', description: '', deadline: '', priority: 'Low', status: 'ToDo' });
      setEditing(false);
      // Reset filter so edited tasks remain visible if they change status or priority
      setFilter('');
      setPage('list');
      fetchTasks();
    } catch (err) {
      console.error('Failed to save task', err);
    }
  };

  // Populate form for editing
  const editTask = (task) => {
    openEditForm(task);
  };

  // Delete a task
  const deleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetch(`/tasks/${id}`, { method: 'DELETE' });
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  // Mark a task as completed
  const completeTask = async (id) => {
    try {
      await fetch(`/tasks/${id}/complete`, { method: 'POST' });
      fetchTasks();
    } catch (err) {
      console.error('Failed to complete task', err);
    }
  };

  // Open the form for creating a new task
  const openNewForm = () => {
    setForm({ id: null, title: '', description: '', deadline: '', priority: 'Low', status: 'ToDo' });
    setEditing(false);
    setPage('form');
  };

  // Open the form for editing an existing task
  const openEditForm = (task) => {
    setForm({ ...task, deadline: task.deadline ? task.deadline.substring(0, 16) : '', status: task.status });
    setEditing(true);
    setPage('form');
  };

  // Export tasks as a text file
  const exportTasks = async () => {
    try {
      const res = await fetch('/tasks/export');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tasks_export.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export tasks', err);
    }
  };

  return (
    <div className="container">
      <h1>Smart Task Organizer</h1>
      {/* Navigation bar to switch between pages */}
      <nav style={{ marginBottom: '20px' }}>
        <button onClick={() => { setPage('list'); setFilter(''); setSortBy(''); }}>كل المهام</button>
        <button onClick={() => { openNewForm(); }}>إضافة مهمة</button>
        <button onClick={() => { setFilter('completed'); setPage('list'); }}>المهام المكتملة</button>
        <button onClick={() => { setFilter('not-completed'); setPage('list'); }}>المهام غير المكتملة</button>
      </nav>
      {/* List view */}
      {page === 'list' && (
        <>
          <div className="filters">
            <div>
              <label htmlFor="sortBy">Sort By:</label>
              <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="">None</option>
                <option value="deadline">Deadline</option>
                <option value="priority">Priority</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter">Filter:</label>
              <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">None</option>
                <option value="completed">Completed</option>
                <option value="not-completed">Not Completed</option>
                <option value="high-priority">High Priority</option>
              </select>
            </div>
            <div>
              <button type="button" className="secondary" onClick={exportTasks}>Export</button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Deadline</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.id}</td>
                  <td>{task.title}</td>
                  <td>{task.description}</td>
                  <td>{task.deadline ? new Date(task.deadline).toLocaleString() : ''}</td>
                  <td>{task.priority}</td>
                  <td>{task.status}</td>
                  <td>
                    <button type="button" className="secondary" onClick={() => editTask(task)}>Edit</button>
                    <button type="button" className="danger" onClick={() => deleteTask(task.id)}>Delete</button>
                    {task.status !== 'Completed' && (
                      <button type="button" className="primary" onClick={() => completeTask(task.id)}>Complete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {/* Form view for create or edit */}
      {page === 'form' && (
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Title:</label>
          <input type="text" id="title" name="title" value={form.title} onChange={handleChange} required />
          <label htmlFor="description">Description:</label>
          <input type="text" id="description" name="description" value={form.description} onChange={handleChange} />
          <label htmlFor="deadline">Deadline:</label>
          <input type="datetime-local" id="deadline" name="deadline" value={form.deadline} onChange={handleChange} />
          <label htmlFor="priority">Priority:</label>
          <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          {/* When editing, allow the user to change the status */}
          <label htmlFor="status">Status:</label>
          <select id="status" name="status" value={form.status} onChange={handleChange}>
            <option value="ToDo">ToDo</option>
            <option value="Completed">Completed</option>
          </select>
          <button type="submit" className="primary">{editing ? 'Update Task' : 'Add Task'}</button>
          <button type="button" className="secondary" onClick={() => {
            setEditing(false);
            setPage('list');
            setForm({ id: null, title: '', description: '', deadline: '', priority: 'Low', status: 'ToDo' });
          }}>Cancel</button>
        </form>
      )}
    </div>
  );
}

// Render the application
ReactDOM.render(<App />, document.getElementById('root'));