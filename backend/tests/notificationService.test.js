const mongoose = require('mongoose');
const NotificationService = require('../service/notificationService');
const Task = require('../db/models/task');
const User = require('../db/models/user');
const Notification = require('../db/models/notification');

// Mock the models
jest.mock('../db/models/task');
jest.mock('../db/models/user');
jest.mock('../db/models/notification');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to track notifications
    console.log = jest.fn();
    
    // Mock Notification model methods
    Notification.prototype.save = jest.fn().mockResolvedValue({});
    Notification.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      })
    });
    Notification.findOne = jest.fn().mockReturnValue({
      save: jest.fn().mockResolvedValue({})
    });
    Notification.updateMany = jest.fn().mockResolvedValue({});
  });

  describe('sendTaskAssignmentNotification', () => {
    it('should send a notification when a user is assigned to a task', async () => {
      // Setup mock data
      const taskId = new mongoose.Types.ObjectId();
      const assigneeId = new mongoose.Types.ObjectId();
      const assignerId = new mongoose.Types.ObjectId();
      const projectId = new mongoose.Types.ObjectId();
      
      // Mock the task and user data
      const mockTask = {
        _id: taskId,
        title: 'Test Task',
        project: {
          _id: projectId,
          title: 'Test Project'
        }
      };
      
      const mockAssigner = {
        _id: assignerId,
        displayName: 'John Doe',
        email: 'john@example.com'
      };
      
      // Setup mock implementations
      Task.findById.mockImplementation(() => ({
        populate: jest.fn().mockImplementation(() => ({
          populate: jest.fn().mockResolvedValue(mockTask)
        }))
      }));
      
      User.findById.mockResolvedValue(mockAssigner);
      
      // Call the service method
      await NotificationService.sendTaskAssignmentNotification(taskId, assigneeId, assignerId);
      
      // Verify the mocks were called correctly
      expect(Task.findById).toHaveBeenCalledWith(taskId);
      expect(User.findById).toHaveBeenCalledWith(assignerId, 'displayName email');
      
      // Verify the notification was created
      expect(Notification.prototype.save).toHaveBeenCalled();
      
      // Verify the notification was logged
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(`Notification sent to user ${assigneeId}`)
      );
    });
    
    it('should not send a notification when assignee is the same as assigner', async () => {
      const taskId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      
      await NotificationService.sendTaskAssignmentNotification(taskId, userId, userId);
      
      // Verify no database calls were made
      expect(Task.findById).not.toHaveBeenCalled();
      expect(User.findById).not.toHaveBeenCalled();
      expect(Notification.prototype.save).not.toHaveBeenCalled();
      
      // Verify no notification was logged
      expect(console.log).not.toHaveBeenCalled();
    });
  });
  
  describe('sendTaskStatusUpdateNotification', () => {
    it('should send a notification when a task status is updated', async () => {
      // Setup mock data
      const taskId = new mongoose.Types.ObjectId();
      const assigneeId = new mongoose.Types.ObjectId();
      const updaterId = new mongoose.Types.ObjectId();
      const projectId = new mongoose.Types.ObjectId();
      
      const mockTask = {
        _id: taskId,
        title: 'Test Task',
        status: 'In Progress',
        assignee: assigneeId,
        project: projectId
      };
      
      const mockUpdater = {
        _id: updaterId,
        displayName: 'Jane Smith',
        email: 'jane@example.com'
      };
      
      // Setup mock implementations
      User.findById.mockResolvedValue(mockUpdater);
      
      // Call the service method
      await NotificationService.sendTaskStatusUpdateNotification(mockTask, updaterId, 'To Do');
      
      // Verify the mocks were called correctly
      expect(User.findById).toHaveBeenCalledWith(updaterId, 'displayName email');
      
      // Verify the notification was created
      expect(Notification.prototype.save).toHaveBeenCalled();
      
      // Verify the notification was logged
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(`Notification sent to user ${assigneeId}`)
      );
    });
    
    it('should not send a notification when there is no assignee', async () => {
      const mockTask = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Task',
        status: 'In Progress',
        assignee: null
      };
      
      await NotificationService.sendTaskStatusUpdateNotification(
        mockTask, 
        new mongoose.Types.ObjectId(), 
        'To Do'
      );
      
      // Verify no database calls were made
      expect(User.findById).not.toHaveBeenCalled();
      expect(Notification.prototype.save).not.toHaveBeenCalled();
      
      // Verify no notification was logged
      expect(console.log).not.toHaveBeenCalled();
    });
    
    it('should not send a notification when the updater is the assignee', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      const mockTask = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Task',
        status: 'In Progress',
        assignee: userId
      };
      
      await NotificationService.sendTaskStatusUpdateNotification(mockTask, userId, 'To Do');
      
      // Verify no database calls were made
      expect(User.findById).not.toHaveBeenCalled();
      expect(Notification.prototype.save).not.toHaveBeenCalled();
      
      // Verify no notification was logged
      expect(console.log).not.toHaveBeenCalled();
    });
  });
  
  describe('getUserNotifications', () => {
    it('should get user notifications', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockNotifications = [
        { _id: new mongoose.Types.ObjectId(), message: 'Test notification 1' },
        { _id: new mongoose.Types.ObjectId(), message: 'Test notification 2' }
      ];
      
      // Setup mock implementation
      Notification.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockNotifications)
              })
            })
          })
        })
      });
      
      // Call the service method
      const result = await NotificationService.getUserNotifications(userId);
      
      // Verify the mock was called correctly
      expect(Notification.find).toHaveBeenCalledWith({ recipient: userId });
      
      // Verify the result
      expect(result).toEqual(mockNotifications);
    });
  });
  
  describe('markNotificationAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const mockNotification = {
        _id: notificationId,
        recipient: userId,
        read: false,
        save: jest.fn().mockResolvedValue({ _id: notificationId, read: true })
      };
      
      // Setup mock implementation
      Notification.findOne.mockResolvedValue(mockNotification);
      
      // Call the service method
      const result = await NotificationService.markNotificationAsRead(notificationId, userId);
      
      // Verify the mock was called correctly
      expect(Notification.findOne).toHaveBeenCalledWith({ 
        _id: notificationId,
        recipient: userId
      });
      
      // Verify the notification was updated
      expect(mockNotification.read).toBe(true);
      expect(mockNotification.save).toHaveBeenCalled();
    });
    
    it('should throw an error if notification is not found', async () => {
      const notificationId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      
      // Setup mock implementation
      Notification.findOne.mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(NotificationService.markNotificationAsRead(notificationId, userId))
        .rejects.toThrow('Notification not found or not authorized');
    });
  });
  
  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      // Call the service method
      await NotificationService.markAllNotificationsAsRead(userId);
      
      // Verify the mock was called correctly
      expect(Notification.updateMany).toHaveBeenCalledWith(
        { recipient: userId, read: false },
        { read: true }
      );
    });
  });
});