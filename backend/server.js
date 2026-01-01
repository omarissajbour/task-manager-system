import http from 'http';
import url from 'url';
import { StringDecoder } from 'string_decoder';
import TaskRepository from './TaskRepository.js';
import TaskController from './TaskController.js';
import fs from 'fs';

/**
 * Minimal HTTP server for the Smart Task Organizer.
 *
 * This implementation avoids external dependencies such as Express
 * (which cannot be installed in the restricted environment) and
 * instead uses Node.js's built‑in `http` and `url` modules to route
 * requests to controller methods. It handles JSON request bodies,
 * implements CORS headers, and calls the appropriate controller
 * functions based on the request path and method.
 */

const repo = new TaskRepository();
const controller = new TaskController(repo);







const port = process.env.PORT || 3000;

/**
 * Parse JSON body from a request.
 *
 * @param {http.IncomingMessage} req The incoming HTTP request
 * @returns {Promise<any>} Promise that resolves with the parsed body
 */
function parseRequestBody(req) {
  return new Promise((resolve) => {
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
      buffer += decoder.write(data);
    });
    req.on('end', () => {
      buffer += decoder.end();
      if (buffer) {
        try {
          resolve(JSON.parse(buffer));
        } catch (e) {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Send a JSON response with the given status code.
 *
 * @param {http.ServerResponse} res The HTTP response object
 * @param {number} status HTTP status code
 * @param {Object} data Data to serialise as JSON
 */
function sendJson(res, status, data) {
  const json = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(json);
}

/**
 * Send a plain text response (used for export).
 */
function sendText(res, status, text) {
  res.writeHead(status, {
    'Content-Type': 'text/plain',
    'Content-Disposition': 'attachment; filename="tasks_export.txt"',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(text);
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Preflight CORS handling
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    return res.end();
  }
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname || '';
  const idMatch = pathname.match(/^\/tasks\/(\d+)(?:\/complete)?$/);
  try {
    // Route: GET /tasks with optional query parameters
    if (req.method === 'GET' && pathname === '/tasks') {
      const tasks = controller.repository.getTasks({ sortBy: parsedUrl.query.sortBy, filter: parsedUrl.query.filter });
      return sendJson(res, 200, tasks.map((t) => t.toJSON()));
    }
    // Route: POST /tasks
    if (req.method === 'POST' && pathname === '/tasks') {
      const body = await parseRequestBody(req);
      if (!body || !body.title) {
        return sendJson(res, 400, { message: 'Title is required' });
      }
      const allowedPriorities = ['High', 'Medium', 'Low'];
      const priority = allowedPriorities.includes(body.priority) ? body.priority : 'Low';
      const task = controller.repository.addTask({
        title: body.title,
        description: body.description || '',
        deadline: body.deadline || null,
        priority
      });
      return sendJson(res, 201, task.toJSON());
    }
    // Route: PUT /tasks/:id
    if (req.method === 'PUT' && idMatch) {
      const id = parseInt(idMatch[1], 10);
      const body = await parseRequestBody(req);
      const updates = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.deadline !== undefined) updates.deadline = body.deadline;
      if (body.priority !== undefined) updates.priority = body.priority;
      if (body.status !== undefined) updates.status = body.status;
      const updated = controller.repository.updateTask(id, updates);
      if (!updated) {
        return sendJson(res, 404, { message: 'Task not found' });
      }
      return sendJson(res, 200, updated.toJSON());
    }
    // Route: DELETE /tasks/:id
    if (req.method === 'DELETE' && idMatch) {
      const id = parseInt(idMatch[1], 10);
      const ok = controller.repository.deleteTask(id);
      if (!ok) {
        return sendJson(res, 404, { message: 'Task not found' });
      }
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      });
      return res.end();
    }
    // Route: POST /tasks/:id/complete
    if (req.method === 'POST' && pathname.match(/^\/tasks\/(\d+)\/complete$/)) {
      const id = parseInt(pathname.split('/')[2], 10);
      const updated = controller.repository.markCompleted(id);
      if (!updated) {
        return sendJson(res, 404, { message: 'Task not found' });
      }
      return sendJson(res, 200, updated.toJSON());
    }
    // Route: GET /tasks/export
    if (req.method === 'GET' && pathname === '/tasks/export') {
      const tasks = controller.repository.getTasks();
      const lines = tasks.map((t) => {
        return `ID: ${t.id}\nTitle: ${t.title}\nDescription: ${t.description}\nDeadline: ${t.deadline}\nPriority: ${t.priority}\nStatus: ${t.status}\n`;
      });
      const text = lines.join('\n');
      // Write to export file
      const exportPath = controller.repository.tasksFile.replace('tasks.json', 'tasks_export.txt');
      try {
        fs.writeFileSync(exportPath, text, 'utf-8');
      } catch (err) {
        console.error('Failed to write export file:', err);
      }
      return sendText(res, 200, text);
    }
    // Serve front-end static files
    // If requesting root or index.html, return the main HTML page
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      try {
        const filePath = new URL('../frontend/index.html', import.meta.url);
        const content = fs.readFileSync(filePath, 'utf-8');
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        });
        return res.end(content);
      } catch (e) {
        console.error('Failed to read index.html:', e);
      }
    }
    // Serve app.js file
    if (req.method === 'GET' && (pathname === '/app.js' || pathname.endsWith('/app.js'))) {
      try {
        const filePath = new URL('../frontend/app.js', import.meta.url);
        const content = fs.readFileSync(filePath, 'utf-8');
        res.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        });
        return res.end(content);
      } catch (e) {
        console.error('Failed to read app.js:', e);
      }
    }
    // Unknown route
    sendJson(res, 404, { message: 'Not found' });
  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { message: 'Server error' });
  }
});

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Persist tasks on exit
const gracefulExit = () => {
  console.log('Saving tasks before shutdown...');
  repo.save();
  process.exit(0);
};
process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);