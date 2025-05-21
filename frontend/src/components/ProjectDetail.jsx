import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TaskBoard from './TaskBoard';
import AutomationPanel from './AutomationPanel';
const BaseURL = import.meta.env.VITE_API_BASE_URL;

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
  const BaseURL = import.meta.env.VITE_API_BASE_URL;

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
      const response = await axios.get(`${BaseURL}/projects/${projectId}`, {
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
        `${BaseURL}/projects/${projectId}`,
        { title: projectTitle, description: projectDescription },
        { headers: getAuthHeader(), withCredentials: true }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-white hover:text-yellow-300 transition duration-200"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold tracking-tight">Project Details</h1>
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
          {/* Project Info */}
          <div className="border-4 border-dashed border-blue-200 rounded-2xl p-6 bg-white mb-6 shadow-md hover:shadow-xl transition duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-blue-900">{project.title}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowEditForm(true)}
                  className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300"
                >
                  ✏️ Edit
                </button>
              </div>
            </div>

            {showEditForm ? (
              <div className="bg-blue-50 p-5 rounded-xl">
                <form onSubmit={handleUpdateProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Description</label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows="3"
                    ></textarea>
                  </div>

                  {updateSuccess && (
                    <div className="text-green-700 bg-green-100 px-3 py-2 rounded-md text-sm">
                      ✅ Project updated successfully!
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="px-4 py-1.5 text-sm border border-gray-400 text-gray-700 rounded-md hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">{project.description || 'No description provided'}</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>📅 Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                  <p>🕒 Updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>
              </>
            )}
          </div>

          {/* Task Board */}
          <div className="border-4 border-dashed border-indigo-200 rounded-xl p-6 bg-white mb-6 shadow-sm hover:shadow-md transition">
            <TaskBoard project={project} />
          </div>

          {/* Automation Panel */}
          <div className="rounded-2xl shadow-lg border border-blue-200 bg-gradient-to-br from-white via-blue-50 to-blue-100 p-6 mb-10 hover:shadow-xl transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
                ⚙️ Automation Rules
              </h2>
              <span className="text-sm text-blue-700 bg-white border border-blue-300 px-3 py-1 rounded-md shadow-sm">
                Project Smart Triggers
              </span>
            </div>
            <AutomationPanel
              projectId={project._id}
              currentUser={project.owner}
              token={localStorage.getItem('token')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
