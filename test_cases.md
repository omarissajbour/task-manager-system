# Test Cases for Smart Task Organizer

Each functional requirement (FR) of the Smart Task Organizer has at least one corresponding test case.
Each test case specifies a unique identifier, the associated requirement, the test objective,
the necessary preconditions, the steps to perform, and the expected outcome.
These cases focus on black-box testing of the REST API and the web interface implemented
using HTML and JavaScript.

---

## TC-FR1-01

**Requirement ID:** FR1 – Create a new task

**Test Objective:**  
Verify that a user can create a new task with a title, description, deadline, and priority, and that the task is stored with a default status of `ToDo`.

**Preconditions:**
- The Smart Task Organizer backend is running.
- The system is accessible through the web interface or API.

**Test Steps:**
1. Send a `POST /tasks` request with a JSON body containing:
   - a non-empty `title`
   - a `description`
   - a valid ISO 8601 `deadline`
   - a `priority` set to `High`
2. Observe the HTTP response status code and response body.
3. Send a `GET /tasks` request.

**Expected Result:**
- The response status is `201 Created`.
- The returned task contains the provided title, description, deadline, and priority.
- The task status is set to `ToDo` by default.
- The task appears in the list returned by `GET /tasks`.

---

## TC-FR2-01

**Requirement ID:** FR2 – Edit an existing task

**Test Objective:**  
Ensure that editing an existing task updates only the specified fields and preserves other attributes.

**Preconditions:**
- At least one task exists in the system.
- The task ID is known.

**Test Steps:**
1. Send a `PUT /tasks/{id}` request with updated values for `title` and `description`.
2. Observe the HTTP response status code and body.
3. Retrieve the task using `GET /tasks`.

**Expected Result:**
- The response status is `200 OK`.
- The task’s title and description are updated.
- The deadline, priority, and status remain unchanged.

---

## TC-FR3-01

**Requirement ID:** FR3 – Delete a task

**Test Objective:**  
Verify that a task can be deleted successfully.

**Preconditions:**
- At least one task exists in the system.
- The task ID is known.

**Test Steps:**
1. Send a `DELETE /tasks/{id}` request.
2. Observe the HTTP response status.
3. Send a `GET /tasks` request.

**Expected Result:**
- The delete request returns status `204 No Content`.
- The deleted task no longer appears in the task list.

---

## TC-FR4-01

**Requirement ID:** FR4 – Display all tasks

**Test Objective:**  
Ensure that the system returns a list of all stored tasks.

**Preconditions:**
- One or more tasks exist in the system.

**Test Steps:**
1. Send a `GET /tasks` request.
2. Observe the HTTP response.

**Expected Result:**
- The response status is `200 OK`.
- The response body contains a JSON array of all tasks.

---

## TC-FR5-01

**Requirement ID:** FR5 – Default task status

**Test Objective:**  
Verify that newly created tasks have a default status of `ToDo`.

**Preconditions:**
- The backend server is running.

**Test Steps:**
1. Create a task using `POST /tasks` without providing a `status` field.
2. Observe the returned task object.

**Expected Result:**
- The task includes a `status` field with value `ToDo`.

---

## TC-FR6-01

**Requirement ID:** FR6 – Mark a task as completed

**Test Objective:**  
Ensure that a task can be marked as completed.

**Preconditions:**
- A task exists with status `ToDo`.
- The task ID is known.

**Test Steps:**
1. Send a request to `/tasks/{id}/complete`.
2. Observe the response.
3. Retrieve the task using `GET /tasks`.

**Expected Result:**
- The response status is `200 OK`.
- The task status is updated to `Completed`.

---

## TC-FR7-01

**Requirement ID:** FR7 – Sort tasks

**Test Objective:**  
Verify that tasks can be sorted by deadline or priority.

**Preconditions:**
- Multiple tasks exist with different deadlines and priorities.

**Test Steps:**
1. Send `GET /tasks?sortBy=deadline`.
2. Observe the order of tasks.
3. Send `GET /tasks?sortBy=priority`.

**Expected Result:**
- Tasks are ordered by ascending deadline.
- Tasks are ordered by priority (High → Medium → Low).

---

## TC-FR8-01

**Requirement ID:** FR8 – Filter tasks

**Test Objective:**  
Verify that tasks can be filtered based on status and priority.

**Preconditions:**
- Tasks with different statuses and priorities exist.

**Test Steps:**
1. Send `GET /tasks?filter=completed`.
2. Send `GET /tasks?filter=not-completed`.
3. Send `GET /tasks?filter=high-priority`.

**Expected Result:**
- Each request returns only tasks matching the filter condition.

---

## TC-FR9-01

**Requirement ID:** FR9 – Save tasks on system close

**Test Objective:**  
Ensure that tasks are saved automatically when the system shuts down.

**Preconditions:**
- At least one task exists in the system.

**Test Steps:**
1. Stop the backend server gracefully.
2. Inspect the `tasks.json` file.

**Expected Result:**
- The `tasks.json` file exists and contains all tasks in JSON format.

---

## TC-FR10-01

**Requirement ID:** FR10 – Load tasks on system start

**Test Objective:**  
Verify that tasks are loaded automatically when the system starts.

**Preconditions:**
- The `tasks.json` file exists and contains saved tasks.

**Test Steps:**
1. Start the backend server.
2. Send a `GET /tasks` request.

**Expected Result:**
- The returned tasks match the data stored in `tasks.json`.

---

## TC-FR11-01

**Requirement ID:** FR11 – Export tasks to a text file

**Test Objective:**  
Verify that tasks can be exported to a readable text file.

**Preconditions:**
- Several tasks exist in the system.

**Test Steps:**
1. Send a `GET /tasks/export` request.
2. Download and open the exported file.

**Expected Result:**
- The response status is `200 OK`.
- A file named `tasks_export.txt` is generated.
- The file contains readable task information including ID, title, description, deadline, priority, and status.
