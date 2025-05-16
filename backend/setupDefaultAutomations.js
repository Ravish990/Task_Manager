/**
 * Script to set up default automations for projects
 * This can be run manually or integrated into project creation
 */
const mongoose = require('mongoose');
const Automation = require('./db/models/automation');
const Project = require('./db/models/project');
const connectDb = require('./db/connection');

/**
 * Set up default automations for a project
 * @param {string} projectId - The ID of the project
 * @param {string} ownerId - The ID of the project owner
 */
async function setupDefaultAutomations(projectId, ownerId) {
  try {
    console.log(`Setting up default automations for project ${projectId}`);
    
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      console.error(`Project ${projectId} not found`);
      return;
    }
    
    // 1. When a task is moved to 'Done' → Assign badge
    const doneBadgeAutomation = new Automation({
      project: projectId,
      name: 'Assign badge on task completion',
      active: true,
      trigger: {
        type: 'task_status_change',
        conditions: {
          toStatus: 'Done'
        }
      },
      action: {
        type: 'assign_badge',
        parameters: {
          badgeName: 'Task Completer'
        }
      },
      createdBy: ownerId
    });
    
    // 2. When a task is assigned to user X → Move to 'In Progress'
    const assignmentStatusAutomation = new Automation({
      project: projectId,
      name: 'Move task to In Progress when assigned',
      active: true,
      trigger: {
        type: 'task_assignment'
        // No specific user condition, applies to any assignment
      },
      action: {
        type: 'change_task_status',
        parameters: {
          status: 'In Progress'
        }
      },
      createdBy: ownerId
    });
    
    // 3. When a due date passes → Send notification
    const dueDateNotificationAutomation = new Automation({
      project: projectId,
      name: 'Send notification when task is overdue',
      active: true,
      trigger: {
        type: 'task_due_date_passed'
      },
      action: {
        type: 'send_notification',
        parameters: {
          notificationMessage: 'Task "{task.title}" is overdue! Please update its status or adjust the due date.'
        }
      },
      createdBy: ownerId
    });
    
    // Save all automations
    await Promise.all([
      doneBadgeAutomation.save(),
      assignmentStatusAutomation.save(),
      dueDateNotificationAutomation.save()
    ]);
    
    console.log(`Successfully set up default automations for project ${projectId}`);
    return {
      doneBadgeAutomation,
      assignmentStatusAutomation,
      dueDateNotificationAutomation
    };
  } catch (error) {
    console.error('Error setting up default automations:', error);
    throw error;
  }
}

/**
 * Run this script directly to set up automations for existing projects
 * Usage: node setupDefaultAutomations.js
 */
if (require.main === module) {
  // Connect to database
  connectDb()
    .then(async () => {
      try {
        // Get all projects
        const projects = await Project.find({});
        console.log(`Found ${projects.length} projects`);
        
        // Set up automations for each project
        for (const project of projects) {
          await setupDefaultAutomations(project._id, project.owner);
        }
        
        console.log('Default automations setup complete');
        process.exit(0);
      } catch (error) {
        console.error('Error in setup script:', error);
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Database connection error:', err);
      process.exit(1);
    });
}

module.exports = setupDefaultAutomations;