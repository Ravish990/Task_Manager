import { useState, useEffect } from 'react';
import axios from 'axios';

const Notification = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Get auth header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/invitations/pending', {
        headers: getAuthHeader(),
        withCredentials: true,
      });
      
      setInvitations(response.data.invitations || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError('Failed to load invitations');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    
    // Set up polling to check for new invitations every 30 seconds
    const intervalId = setInterval(fetchInvitations, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleAccept = async (invitationId) => {
    try {
      await axios.put(`http://localhost:8000/invitations/${invitationId}/accept`, {}, {
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

  const handleReject = async (invitationId) => {
    try {
      await axios.put(`http://localhost:8000/invitations/${invitationId}/reject`, {}, {
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

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        
        {/* Notification Badge */}
        {invitations.length > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
        )}
      </div>

      {/* Dropdown Panel */}
      {showNotifications && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
            </div>
            
            {loading ? (
              <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
            ) : error ? (
              <div className="px-4 py-2 text-sm text-red-500">{error}</div>
            ) : invitations.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">No new notifications</div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                {invitations.map((invitation) => (
                  <div key={invitation._id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{invitation.sender.displayName || invitation.sender.email}</span>
                      {' invited you to join the project '}
                      <span className="font-medium">{invitation.project.title}</span>
                    </p>
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => handleReject(invitation._id)}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAccept(invitation._id)}
                        className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                      >
                        Accept
                      </button>
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