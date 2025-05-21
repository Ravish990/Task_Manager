import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_BASE_URL;


const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  // Get auth header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch task notifications
      const notificationsResponse = await axios.get(`${BASE_URL}/notifications`, {
        headers: getAuthHeader(),
        withCredentials: true,
      });
      
      // Fetch project invitations
      const invitationsResponse = await axios.get(`${BASE_URL}/invitations/pending`, {
        headers: getAuthHeader(),
        withCredentials: true,
      });
      
      setNotifications(notificationsResponse.data.notifications || []);
      setInvitations(invitationsResponse.data.invitations || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling to check for new notifications every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await axios.put(`${BASE_URL}/invitations/${invitationId}/accept`, {}, {
        headers: getAuthHeader(),
        withCredentials: true,
      });
      
      // Remove the accepted invitation from the list
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation');
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    try {
      await axios.put(`${BASE_URL}/invitations/${invitationId}/reject`, {}, {
        headers: getAuthHeader(),
        withCredentials: true,
      });
      
      // Remove the rejected invitation from the list
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      setError('Failed to reject invitation');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(`${BASE_URL}/notifications/${notificationId}/read`, {}, {
        headers: getAuthHeader(),
        withCredentials: true,
      });
      
      // Update the notification in the list to mark it as read
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`${BASE_URL}/notifications/read-all`, {}, {
        headers: getAuthHeader(),
        withCredentials: true,
      });
      
      // Mark all notifications as read in the state
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    handleMarkAsRead(notification._id);
    
    // Navigate to the appropriate page based on notification type
    if (notification.type === 'task_assignment' || notification.type === 'task_status_update') {
      // Navigate to the project containing the task
      navigate(`/projects/${notification.projectId._id}`);
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length + invitations.length;

  return (
    <div className="relative">
      {/* Notification Bell Icon with hover animation */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white hover-scale"
          aria-label="Notifications"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        
        {/* Notification Badge with pulse animation */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white notification-badge"></span>
        )}
      </div>

      {/* Dropdown Panel with slide-in animation */}
      {showNotifications && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-slide-in-top">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            {loading ? (
              <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            ) : error ? (
              <div className="px-4 py-2 text-sm text-red-500 animate-fade-in">{error}</div>
            ) : notifications.length === 0 && invitations.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 animate-fade-in">No new notifications</div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {/* Task Notifications */}
                {notifications.map((notification, index) => (
                  <div 
                    key={notification._id} 
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 animate-fade-in animation-delay-${index * 100} cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-2">
                        {notification.type === 'task_assignment' ? (
                          <span className="inline-block p-1 rounded-full bg-green-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-block p-1 rounded-full bg-blue-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Project Invitations */}
                {invitations.map((invitation, index) => (
                  <div 
                    key={invitation._id} 
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 animate-fade-in animation-delay-${index * 100} bg-yellow-50`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-2">
                        <span className="inline-block p-1 rounded-full bg-yellow-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{invitation.sender.displayName || invitation.sender.email}</span>
                          {' invited you to join the project '}
                          <span className="font-medium">{invitation.project.title}</span>
                        </p>
                        <div className="mt-2 flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectInvitation(invitation._id);
                            }}
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 btn-hover-effect"
                          >
                            Decline
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptInvitation(invitation._id);
                            }}
                            className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 btn-hover-effect"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;