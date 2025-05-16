const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notificationController');
const userAuth = require('../middleware/userAuth');

// Apply authentication middleware to all routes
router.use(userAuth);

// Get all notifications for the current user
router.get('/', notificationController.getUserNotifications);

// Mark a notification as read
router.put('/:notificationId/read', notificationController.markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllNotificationsAsRead);

module.exports = router;