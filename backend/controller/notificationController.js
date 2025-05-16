const NotificationService = require('../service/notificationService');

// Get all notifications for the current user
exports.getUserNotifications = async (req, res) => {
    try {
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        const notifications = await NotificationService.getUserNotifications(userId);
        
        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        console.error('Get user notifications error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Mark a notification as read
exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        const notification = await NotificationService.markNotificationAsRead(notificationId, userId);
        
        res.status(200).json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        await NotificationService.markAllNotificationsAsRead(userId);
        
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};