import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      
      // Check if we have a token in localStorage
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        // If we have stored user data, use it
        setUserData(JSON.parse(storedUser));
        setLoading(false);
      } else {
        // Otherwise try to get user data from session (for OAuth users)
        try {
          const response = await axios.get('http://localhost:8000/auth/current_user', {
            withCredentials: true,
          });
          
          if (response.data) {
            setUserData(response.data);
          } else {
            // If no user data, redirect to login
            navigate('/login');
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to load user data. Please login again.');
         
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
    
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      await axios.get('http://localhost:8000/auth/logout', {
        withCredentials: true,
      });
      
      // Redirect to login page
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
            </div>
            <div className="flex items-center">
              {userData && (
                <span className="text-sm font-medium text-gray-700 mr-4">
                  Welcome, {userData.displayName || userData.name || 'User'}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}

        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
            <h2 className="text-lg font-medium text-gray-900 mb-4">User Information</h2>
            
            {userData ? (
              <div className="space-y-2">
                <p><span className="font-semibold">Name:</span> {userData.displayName || userData.name || 'N/A'}</p>
                <p><span className="font-semibold">Email:</span> {userData.email || 'N/A'}</p>
                <p><span className="font-semibold">ID:</span> {userData.id || userData._id || 'N/A'}</p>
              </div>
            ) : (
              <p className="text-gray-500">No user data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;