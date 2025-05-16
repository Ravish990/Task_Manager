const Automation = require('../db/models/automation');
const Task = require('../db/models/task');
const User = require('../db/models/user');
const NotificationService = require('./notificationService');

/**
 * Service to handle workflow automations
 */
class AutomationService {
  /**
   * Process automations when a task is updated
   * @param {Object} task - The updated task
   * @param {Object} previousTask - The task before update
   * @param {String} userId - ID of the user who made the update
   */
  static async processTaskUpdate(task, previousTask, userId) {
    try {
      // Check for status change automations
      if (previousTask.status !== task.status) {
        await this.processStatusChangeAutomations(task, previousTask.status, userId);
      }

      // Check for assignment automations
      if (
        (!previousTask.assignee && task.assignee) || 
        (previousTask.assignee && task.assignee && 
         previousTask.assignee.toString() !== task.assignee.toString())
      ) {
        await this.processTaskAssignmentAutomations(task, userId);
      }
    } catch (error) {
      console.error('Error processing task update automations:', error);
    }
  }

  /**
   * Process automations triggered by status changes
   * @param {Object} task - The updated task
   * @param {String} previousStatus - The previous status
   * @param {String} userId - ID of the user who made the update
   */
  static async processStatusChangeAutomations(task, previousStatus, userId) {
    try {
      // Find automations for this project with status change trigger
      const automations = await Automation.find({
        project: task.project,
        active: true,
        'trigger.type': 'task_status_change',
        $or: [
          // Match specific from/to status
          {
            'trigger.conditions.fromStatus': previousStatus,
            'trigger.conditions.toStatus': task.status
          },
          // Match any to status (fromStatus is null/undefined)
          {
            'trigger.conditions.fromStatus': { $exists: false },
            'trigger.conditions.toStatus': task.status
          },
          // Match any from status (toStatus is null/undefined)
          {
            'trigger.conditions.fromStatus': previousStatus,
            'trigger.conditions.toStatus': { $exists: false }
          }
        ]
      });

      // Execute each matching automation
      for (const automation of automations) {
        await this.executeAutomationAction(automation, task, userId);
      }
    } catch (error) {
      console.error('Error processing status change automations:', error);
    }
  }

  /**
   * Process automations triggered by task assignments
   * @param {Object} task - The updated task
   * @param {String} userId - ID of the user who made the update
   */
  static async processTaskAssignmentAutomations(task, userId) {
    try {
      if (!task.assignee) return;

      // Find automations for this project with task assignment trigger
      const automations = await Automation.find({
        project: task.project,
        active: true,
        'trigger.type': 'task_assignment',
        $or: [
          // Match specific user assignment
          { 'trigger.conditions.userId': task.assignee },
          // Match any user assignment (userId is null/undefined)
          { 'trigger.conditions.userId': { $exists: false } }
        ]
      });

      // Execute each matching automation
      for (const automation of automations) {
        await this.executeAutomationAction(automation, task, userId);
      }
    } catch (error) {
      console.error('Error processing task assignment automations:', error);
    }
  }

  /**
   * Process automations triggered by due date passing
   * This should be called by a scheduled job
   */
  static async processDueDateAutomations() {
    try {
      const now = new Date();
      
      // Find tasks with passed due dates
      const overdueTasks = await Task.find({
        dueDate: { $lt: now },
        status: { $ne: 'Done' } // Exclude completed tasks
      }).populate('project');

      for (const task of overdueTasks) {
        // Find automations for this project with due date trigger
        const automations = await Automation.find({
          project: task.project._id,
          active: true,
          'trigger.type': 'task_due_date_passed'
        });

        // Execute each matching automation
        for (const automation of automations) {
          await this.executeAutomationAction(automation, task, null);
        }
      }
    } catch (error) {
      console.error('Error processing due date automations:', error);
    }
  }

  /**
   * Execute the action specified by an automation
   * @param {Object} automation - The automation to execute
   * @param {Object} task - The task that triggered the automation
   * @param {String} triggeringUserId - ID of the user who triggered the automation (can be null)
   */
  static async executeAutomationAction(automation, task, triggeringUserId) {
    try {
      const { type, parameters } = automation.action;

      switch (type) {
        case 'assign_badge':
          if (task.assignee && parameters.badgeName) {
            await this.assignBadgeToUser(
              task.assignee,
              parameters.badgeName,
              task.project
            );
          }
          break;

        case 'change_task_status':
          if (parameters.status) {
            // Update task status without triggering more automations
            await Task.findByIdAndUpdate(
              task._id,
              { status: parameters.status, updatedAt: Date.now() }
            );
          }
          break;

        case 'send_notification':
          if (task.assignee && parameters.notificationMessage) {
            // Create notification with reference to the automation that triggered it
            const notification = {
              recipient: task.assignee,
              sender: triggeringUserId || task.createdBy,
              type: 'automation_triggered',
              taskId: task._id,
              projectId: task.project,
              automationId: automation._id, // Include the automation ID
              message: this.formatNotificationMessage(parameters.notificationMessage, task),
              read: false
            };
            
            await NotificationService.createNotification(notification);
          }
          break;
      }

      console.log(`Executed automation "${automation.name}" for task ${task._id}`);
    } catch (error) {
      console.error(`Error executing automation action:`, error);
    }
  }
  
  /**
   * Format a notification message by replacing placeholders with task values
   * @param {String} messageTemplate - The message template with placeholders
   * @param {Object} task - The task object with values to insert
   * @returns {String} - The formatted message
   */
  static formatNotificationMessage(messageTemplate, task) {
    let message = messageTemplate
      .replace('{task.title}', task.title)
      .replace('{task.status}', task.status);

    if (task.dueDate) {
      const formattedDate = new Date(task.dueDate).toLocaleDateString();
      message = message.replace('{task.dueDate}', formattedDate);
    }
    
    return message;
  }

  /**
   * Assign a badge to a user
   * @param {String} userId - The user to assign the badge to
   * @param {String} badgeName - The name of the badge
   * @param {String} projectId - The project ID
   */
  static async assignBadgeToUser(userId, badgeName, projectId) {
    try {
      // Check if user already has this badge for this project
      const user = await User.findById(userId);
      
      if (!user) {
        console.error(`User ${userId} not found`);
        return;
      }

      // Initialize badges array if it doesn't exist
      if (!user.badges) {
        user.badges = [];
      }

      // Check if user already has this badge for this project
      const existingBadge = user.badges.find(
        badge => badge.name === badgeName && badge.projectId.toString() === projectId.toString()
      );

      if (!existingBadge) {
        // Add the badge
        user.badges.push({
          name: badgeName,
          projectId: projectId,
          earnedAt: new Date()
        });

        await user.save();
        console.log(`Badge "${badgeName}" assigned to user ${userId}`);
      }
    } catch (error) {
      console.error('Error assigning badge to user:', error);
    }
  }

  /**
   * Send a notification triggered by an automation
   * @param {Object} task - The task that triggered the automation
   * @param {String} recipientId - The user to notify
   * @param {String} senderId - The user who triggered the automation
   * @param {String} messageTemplate - The notification message template
   * @param {String} automationId - The ID of the automation that triggered this notification
   */
  static async sendAutomationNotification(task, recipientId, senderId, messageTemplate, automationId = null) {
    try {
      // Format the message using the helper method
      const message = this.formatNotificationMessage(messageTemplate, task);

      // Create a notification
      const notification = {
        recipient: recipientId,
        sender: senderId,
        type: 'automation_triggered',
        taskId: task._id,
        projectId: task.project,
        message: message,
        read: false
      };
      
      // Add automation ID if provided
      if (automationId) {
        notification.automationId = automationId;
      }

      await NotificationService.createNotification(notification);
    } catch (error) {
      console.error('Error sending automation notification:', error);
    }
  }
}

module.exports = AutomationService;