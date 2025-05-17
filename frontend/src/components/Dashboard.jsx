import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Notification from './Notification';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [createProjectSuccess, setCreateProjectSuccess] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const navigate = useNavigate();

  // Get auth header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      
      // Check if we have a token in localStorage
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        // If we have stored user data, use it
        setUserData(JSON.parse(storedUser));
        fetchProjects();
      } else {
        // Otherwise try to get user data from session (for OAuth users)
        try {
          const response = await axios.get('http://localhost:8000/auth/current_user', {
            withCredentials: true,
          });
          
          if (response.data) {
            setUserData(response.data);
            fetchProjects();
          } else {
            // If no user data, redirect to login
            navigate('/login');
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to load user data. Please login again.');
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('Using headers for project fetch:', headers);
      
      const response = await axios.get('http://localhost:8000/projects/getAll', {
        headers: headers,
        withCredentials: true,
      });
      
      console.log('Projects fetch response:', response.data);
      
      setProjects(response.data.projects || []);
      console.log('Projects set in state:', response.data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. ' + (err.response?.data?.error || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!projectTitle.trim()) {
      setError('Project title is required');
      return;
    }
    
    try {
      setError(''); // Clear any previous errors
      setCreateProjectLoading(true);
      
      console.log('Creating project with data:', { title: projectTitle, description: projectDescription });
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('Using headers:', headers);
      
      const response = await axios.post(
        'http://localhost:8000/projects/create',
        { title: projectTitle, description: projectDescription },
        { 
          headers: headers, 
          withCredentials: true 
        }
      );
      
      console.log('Project creation response:', response.data);
      
      // Add the new project to the projects array
      setProjects([...projects, response.data.project]);
      
      // Reset form fields
      setProjectTitle('');
      setProjectDescription('');
      
      // Show success message briefly before hiding the form
      setCreateProjectSuccess(true);
      setTimeout(() => {
        setCreateProjectSuccess(false);
        setShowCreateForm(false);
      }, 1500);
      
      console.log('Project created successfully:', response.data.project);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.error || 'Failed to create project. Please try again.');
    } finally {
      setCreateProjectLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:8000/projects/${selectedProject._id}/invite`,
        { email: inviteEmail },
        { headers: getAuthHeader(), withCredentials: true }
      );
      
      setError('');
      // Show success message
      alert(`Invitation sent to ${inviteEmail} successfully!`);
      
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (err) {
      console.error('Error inviting user:', err);
      setError(err.response?.data?.error || 'Failed to invite user.');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axios.delete(`http://localhost:8000/projects/${projectId}`, {
          headers: getAuthHeader(),
          withCredentials: true,
        });
        
        setProjects(projects.filter(project => project._id !== projectId));
      } catch (err) {
        console.error('Error deleting project:', err);
        setError(err.response?.data?.error || 'Failed to delete project.');
      }
    }
  };

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
              <div className="mr-4">
                <Notification />
              </div>
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
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">User Information</h2>
            
            {userData ? (
              <div className="space-y-2">
                <p><span className="font-semibold">Name:</span> {userData.displayName || userData.name || 'N/A'}</p>
                <p><span className="font-semibold">Email:</span> {userData.email || 'N/A'}</p>
       
              </div>
            ) : (
              <p className="text-gray-500">No user data available</p>
            )}
          </div>

          {/* Projects Section */}
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">My Projects</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Create Project
              </button>
            </div>

            {/* Create Project Form */}
            {showCreateForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-md font-medium text-gray-900 mb-3">Create New Project</h3>
                <form onSubmit={handleCreateProject}>
                  <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      disabled={createProjectLoading}
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      rows="3"
                      disabled={createProjectLoading}
                    ></textarea>
                  </div>
                  
                  {createProjectSuccess && (
                    <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-md text-center">
                      Project created successfully!
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      disabled={createProjectLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        createProjectLoading ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                      disabled={createProjectLoading}
                    >
                      {createProjectLoading ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Invite User Form */}
            {showInviteForm && selectedProject && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Invite User to "{selectedProject.title}"
                </h3>
                <form onSubmit={handleInviteUser}>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInviteForm(false);
                        setSelectedProject(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Invite
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Projects List */}
            {projects.length > 0 ? (
              <div className="overflow-hidden bg-white shadow sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {projects.map((project) => (
                    <li key={project._id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-indigo-600 truncate">{project.title}</h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedProject(project);
                                setShowInviteForm(true);
                              }}
                              className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                            >
                              Invite
                            </button>
                            {project.owner === (userData.id || userData._id) && (
                              <button
                                onClick={() => handleDeleteProject(project._id)}
                                className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {project.description || 'No description provided'}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                          <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                          <button
                            onClick={() => navigate(`/projects/${project._id}`)}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                          >
                            View Tasks
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No projects yet. Create your first project!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;