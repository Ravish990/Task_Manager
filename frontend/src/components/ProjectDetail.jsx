import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TaskBoard from './TaskBoard';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Get auth header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/projects/${projectId}`, {
        headers: getAuthHeader(),
        withCredentials: true,
      });
      
      const projectData = response.data.project;
      setProject(projectData);
      setProjectTitle(projectData.title);
      setProjectDescription(projectData.description || '');
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project. ' + (err.response?.data?.error || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      
      const response = await axios.put(
        `http://localhost:8000/projects/${projectId}`,
        {
          title: projectTitle,
          description: projectDescription
        },
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );
      
      setProject(response.data.project);
      setUpdateSuccess(true);
      
      setTimeout(() => {
        setUpdateSuccess(false);
        setShowEditForm(false);
      }, 1500);
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.response?.data?.error || 'Failed to update project. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-red-700">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-800">Project Details</h1>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">{project.title}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowEditForm(true)}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit
                </button>
              </div>
            </div>
            
            {showEditForm ? (
              <div className="bg-gray-50 p-4 rounded-md">
                <form onSubmit={handleUpdateProject}>
                  <div className="mb-3">
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
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      rows="3"
                    ></textarea>
                  </div>
                  
                  {updateSuccess && (
                    <div className="mb-3 p-2 bg-green-100 text-green-700 rounded-md text-center">
                      Project updated successfully!
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Update
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">{project.description || 'No description provided'}</p>
                <div className="text-sm text-gray-500">
                  <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                  <p>Last Updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>
              </>
            )}
          </div>

          {/* Task Board */}
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
            <TaskBoard project={project} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;