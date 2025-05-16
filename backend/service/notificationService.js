const Task = require('../db/models/task');
const User = require('../db/models/user');
const Notification = require('../db/models/notification');

/**
 * Service to handle notifications for task assignments and updates
 */
class NotificationService {
  /**
   * Create a notification with the given data
   * @param {Object} notificationData - The notification data
   * @returns {Object} - The created notification
   */
  static async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      
      console.log(`Notification sent to user ${notificationData.recipient}: ${notificationData.message}`);
      
      // In a production app, you would also:
      // 1. Emit a socket.io event for real-time notifications
      // 2. Send an email notification
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to a user when they are assigned to a task
   * @param {string} taskId - The ID of the task
   * @param {string} assigneeId - The ID of the user being assigned
   * @param {string} assignerId - The ID of the user making the assignment
   */
  static async sendTaskAssignmentNotification(taskId, assigneeId, assignerId) {
    try {
      // Skip if assignee is the same as assigner
      if (assigneeId.toString() === assignerId.toString()) {
        return;
      }

      const task = await Task.findById(taskId)
        .populate('project', 'title')
        .populate('createdBy', 'displayName email');
      
      const assigner = await User.findById(assignerId, 'displayName email');

      if (!task || !assigner) {
        console.error('Task or assigner not found');
        return;
      }

      const message = `You have been assigned to task "${task.title}" in project "${task.project.title}" by ${assigner.displayName || assigner.email}`;
      
      // Create a notification using the createNotification method
      await this.createNotification({
        recipient: assigneeId,
        sender: assignerId,
        type: 'task_assignment',
        taskId: taskId,
        projectId: task.project._id,
        message: message,
        read: false
      });
    } catch (error) {
      console.error('Error sending task assignment notification:', error);
    }
  }

  /**
   * Send notification when a task status is updated
   * @param {Object} task - The updated task
   * @param {string} updaterId - The ID of the user who updated the task
   * @param {string} previousStatus - The previous status of the task
   */
  static async sendTaskStatusUpdateNotification(task, updaterId, previousStatus) {
    try {
      // Only notify if there's an assignee and they're not the one who updated the task
      if (!task.assignee || task.assignee.toString() === updaterId.toString()) {
        return;
      }

      const updater = await User.findById(updaterId, 'displayName email');
      
      if (!updater) {
        console.error('Updater not found');
        return;
      }

      const message = `Your task "${task.title}" has been moved from "${previousStatus}" to "${task.status}" by ${updater.displayName || updater.email}`;
      
      // Create a notification using the createNotification method
      await this.createNotification({
        recipient: task.assignee,
        sender: updaterId,
        type: 'task_status_update',
        taskId: task._id,
        projectId: task.project,
        message: message,
        read: false
      });
    } catch (error) {
      console.error('Error sending task status update notification:', error);
    }
  }
  
  /**
   * Get all unread notifications for a user
   * @param {string} userId - The ID of the user
   * @returns {Array} - Array of notification objects
   */
  static async getUserNotifications(userId) {
    try {
      const notifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .populate('sender', 'displayName email')
        .populate('taskId', 'title')
        .populate('projectId', 'title')
        .limit(20);
      
      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }
  
  /**
   * Mark a notification as read
   * @param {string} notificationId - The ID of the notification
   * @param {string} userId - The ID of the user
   */
  static async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({ 
        _id: notificationId,
        recipient: userId
      });
      
      if (!notification) {
        throw new Error('Notification not found or not authorized');
      }
      
      notification.read = true;
      await notification.save();
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
  
  /**
   * Mark all notifications as read for a user
   * @param {string} userId - The ID of the user
   */
  static async markAllNotificationsAsRead(userId) {
    try {
      await Notification.updateMany(
        { recipient: userId, read: false },
        { read: true }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;