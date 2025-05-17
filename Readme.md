TaskBoard Pro - README
## TaskBoard Pro
**TaskBoard Pro** is an advanced project collaboration platform designed to streamline team productivity through
seamless task management and customizable workflow automation. Built with a modern tech stack and Firebase
authentication, it empowers teams to manage projects, track tasks, and automate routine actions effectively.
## Features
### Core Functionalities
- **User Authentication**
 - Google OAuth login (via Firebase)
 - Stores basic user profile (name, email)
- **Project Management**
 - Create and manage projects (title, description)
 - Invite users to projects via email
 - Role-based access: Only project members can view/modify project data
- **Task Management**
 - Create tasks (title, description, due date, assignee)
 - Move tasks across default statuses: `To Do`, `In Progress`, `Done`
 - Kanban-style UI for task grouping by status
- **Workflow Automation**
TaskBoard Pro - README
 - Project owners can define automation rules:
 - Move task to `Done` assign badge
 - Task assigned to user move to `In Progress`
 - Past due date send notification
 - Automations are stored in MongoDB and processed server-side
- **Backend API Endpoints**
 - `/auth` Authentication
 - `/projects` Project management
 - `/tasks` Task management
 - `/automations` Workflow rules
 - `/notifications` Notification triggers
## Tech Stack
- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** Firebase (Google OAuth)
- **Hosting:** Vercel/Render (or your hosting solution)
## Project Structure
/client React frontend
/server Express backend
 /controllers
TaskBoard Pro - README
 /models
 /routes
 /utils
.env Environment variables
README.md Project documentation
## API Documentation
### Auth API
#### `POST /auth/login`
- **Description:** Login using Firebase token
- **Body:** `{ "idToken": "string" }`
- **Returns:** `{ "user": { "name": "string", "email": "string", "uid": "string" } }`
### Project API
#### `GET /projects`
- Returns all projects for the logged-in user
#### `POST /projects`
- **Body:** `{ "title": "string", "description": "string" }`
#### `POST /projects/:id/invite`
- **Body:** `{ "email": "user@example.com" }`
TaskBoard Pro - README
### Task API
#### `GET /projects/:id/tasks`
- Returns all tasks grouped by status
#### `POST /projects/:id/tasks`
- **Body:** `{ "title": "string", "description": "string", "dueDate": "YYYY-MM-DD", "assignee": "userId" }`
#### `PATCH /tasks/:taskId/move`
- **Body:** `{ "status": "To Do" | "In Progress" | "Done" }`
### Automation API
#### `GET /projects/:id/automations`
- Returns automation rules for the project
#### `POST /projects/:id/automations`
- **Body:** `{ "trigger": "onStatusChange", "condition": { "from": "In Progress", "to": "Done" }, "action": { "type":
"assignBadge", "badge": "Task Finisher" } }`
### Notifications API
#### `GET /notifications`
- Returns overdue task notifications for the user
## Automation Logic
TaskBoard Pro - README
All automations are defined and stored using JSON-like rules. Triggers can be:
- `onStatusChange`
- `onAssign`
- `onDueDatePassed`
### Sample Automation JSONs
#### Move to Done Assign Badge
```json
{ "trigger": "onStatusChange", "condition": { "to": "Done" }, "action": { "type": "assignBadge", "badge": "Task Champion" }
}
```
#### Assigned to a User Move to In Progress
```json
{ "trigger": "onAssign", "condition": { "assignee": "user@example.com" }, "action": { "type": "moveTask", "status": "In
Progress" } }
```
#### Due Date Passed Send Notification
```json
{ "trigger": "onDueDatePassed", "action": { "type": "sendNotification", "message": "Task is overdue!" } }
```
## Database Schema
TaskBoard Pro - README
### Users
```json
{ "_id": "ObjectId", "name": "string", "email": "string", "uid": "firebase-uid", "projects": ["projectId"] }
```
### Projects
```json
{ "_id": "ObjectId", "title": "string", "description": "string", "members": ["userId"], "owner": "userId" }
```
### Tasks
```json
{ "_id": "ObjectId", "title": "string", "description": "string", "dueDate": "Date", "assignee": "userId", "projectId": "projectId",
"status": "To Do" | "In Progress" | "Done", "createdAt": "Date" }
```
### Automations
```json
{ "_id": "ObjectId", "projectId": "projectId", "trigger": "onStatusChange" | "onAssign" | "onDueDatePassed", "condition":
"Object", "action": "Object" }
```
### Notifications (optional)
```json
{ "_id": "ObjectId", "userId": "userId", "message": "string", "read": false, "createdAt": "Date" }
TaskBoard Pro - README
```
## Demo Video
 Watch the Demo: https://your-demo-link.com
## Optional Postman Collection
 Download Collection: https://your-postman-link.com
## Run Locally
```bash
# Backend
cd backend
npm install
npm run dev
# Frontend
cd frontend
npm install
npm start
```
## Submission Checklist
TaskBoard Pro - README
- [x] Google OAuth Login
- [x] Projects and Memberships
- [x] Tasks and Kanban View
- [x] Workflow Automations
- [x] REST APIs
- [x] README with schema diagrams
- [x] Loom/YouTube demo video
## Contact
 ravish99055@gmail.com
**Made with to simplify teamwork.**