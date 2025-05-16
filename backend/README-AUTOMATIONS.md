# Task Automation System

This document describes the task automation system implemented in the application. The system allows for workflow automations that are triggered by specific events and perform actions.

## Automation Types

The system supports the following automations:

### 1. When a task is moved to 'Done' → Assign badge

- **Trigger**: Task status changes to "Done"
- **Action**: Assign a badge (e.g., "Task Completer") to the user who was assigned to the task

### 2. When a task is assigned to a user → Move to 'In Progress'

- **Trigger**: Task is assigned to a specific user
- **Action**: Automatically change the task status to "In Progress"

### 3. When a due date passes → Send notification

- **Trigger**: Current date > task due date
- **Action**: Notify responsible users (e.g., via in-app alert)

## Database Structure

Automations are stored in the database to ensure:

- **Persistency**: The rules don't disappear when the server restarts
- **Querying**: You can look up automations relevant to a project or task
- **User Configuration**: Project owners can view/edit their automations via the UI

### Automation Schema

```javascript
{
  // The project this automation belongs to
  project: ObjectId,
  
  // Name of the automation for display purposes
  name: String,
  
  // Whether the automation is active
  active: Boolean,
  
  // The trigger that activates this automation
  trigger: {
    // Type of trigger
    type: String, // 'task_status_change', 'task_assignment', 'task_due_date_passed'
    
    // Additional conditions for the trigger
    conditions: {
      // For task_status_change: the status that triggers the automation
      fromStatus: String,
      toStatus: String,
      
      // For task_assignment: the user that triggers the automation when assigned
      userId: ObjectId
      // Due date passed doesn't need additional conditions
    }
  },
  
  // The action to perform when triggered
  action: {
    // Type of action
    type: String, // 'assign_badge', 'change_task_status', 'send_notification'
    
    // Additional parameters for the action
    parameters: {
      // For assign_badge: the badge to assign
      badgeName: String,
      
      // For change_task_status: the status to change to
      status: String,
      
      // For send_notification: the notification message template
      notificationMessage: String
    }
  },
  
  // Who created this automation
  createdBy: ObjectId,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## Default Automations

When a new project is created, the following default automations are automatically set up:

1. **Assign badge on task completion**
   - Trigger: Task status changes to "Done"
   - Action: Assign "Task Completer" badge to the task assignee

2. **Move task to In Progress when assigned**
   - Trigger: Task is assigned to any user
   - Action: Change task status to "In Progress"

3. **Send notification when task is overdue**
   - Trigger: Task due date has passed
   - Action: Send notification to the task assignee

## Implementation Details

### Automation Processing

Automations are processed in the following scenarios:

1. **Task Updates**: When a task is updated (status change or assignment), the `processTaskUpdate` method in `AutomationService` is called to check for and execute relevant automations.

2. **Due Date Checks**: A scheduled job runs every hour to check for tasks with passed due dates and execute relevant automations.

### Security

- Only project owners can create, update, or delete automations
- Project members can view automations but cannot modify them

## API Endpoints

### Automation Management

- `POST /automations/create` - Create a new automation
- `GET /automations/project/:projectId` - Get all automations for a project
- `GET /automations/:automationId` - Get a single automation by ID
- `PUT /automations/:automationId` - Update an automation
- `DELETE /automations/:automationId` - Delete an automation

## Setup Script

A setup script (`setupDefaultAutomations.js`) is available to create default automations for existing projects. This script is automatically called when a new project is created, but can also be run manually:

```
node setupDefaultAutomations.js
```

## Testing

The automation system is thoroughly tested with unit tests covering:

- Creation of default automations
- Processing of task status change automations
- Processing of task assignment automations
- Processing of due date automations