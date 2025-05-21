import { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const BASE_URL = import.meta.env.VITE_BASE_URL;


const TaskBoard = ({ project }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [projectMembers, setProjectMembers] = useState([]);
  const [tasksByStatus, setTasksByStatus] = useState({});

  // Get auth header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (project) {
      fetchTasks();
      fetchProjectMembers();
    }
  }, [project]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/tasks/project/${project._id}`, {
        headers: getAuthHeader(),
        withCredentials: true,
      });
      
      setTasks(response.data.tasks || []);
      organizeTasksByStatus(response.data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. ' + (err.response?.data?.error || ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/projects/${project._id}`, {
        headers: getAuthHeader(),
        withCredentials: true,
      });
      
      if (response.data.project && response.data.project.members) {
        setProjectMembers(response.data.project.members);
      }
    } catch (err) {
      console.error('Error fetching project members:', err);
    }
  };

  const organizeTasksByStatus = (tasksList) => {
    const organized = {};
    
    // Initialize all statuses with empty arrays
    project.taskStatuses.forEach(status => {
      organized[status] = [];
    });
    
    // Populate with tasks
    tasksList.forEach(task => {
      if (organized[task.status]) {
        organized[task.status].push(task);
      } else {
        // If status doesn't exist (might happen if statuses were changed), put in first column
        organized[project.taskStatuses[0]].push({
          ...task,
          status: project.taskStatuses[0]
        });
      }
    });
    
    setTasksByStatus(organized);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!taskTitle.trim()) {
      setError('Task title is required');
      return;
    }
    
    try {
      setError('');
      
      const response = await axios.post(
        `${BASE_URL}/tasks/create`,
        {
          title: taskTitle,
          description: taskDescription,
          dueDate: taskDueDate || undefined,
          assignee: taskAssignee || undefined,
          projectId: project._id
        },
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );
      
      // Add the new task to the tasks array
      setTasks([...tasks, response.data.task]);
      
      // Update the organized tasks
      const updatedTasksByStatus = { ...tasksByStatus };
      const status = response.data.task.status;
      updatedTasksByStatus[status] = [...(updatedTasksByStatus[status] || []), response.data.task];
      setTasksByStatus(updatedTasksByStatus);
      
      // Reset form fields
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setTaskAssignee('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.error || 'Failed to create task. Please try again.');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/tasks/${taskId}`,
        { status: newStatus },
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );
      
      // Update the task in the tasks array
      const updatedTasks = tasks.map(task => 
        task._id === taskId ? response.data.task : task
      );
      
      setTasks(updatedTasks);
      organizeTasksByStatus(updatedTasks);
    } catch (err) {
      console.error('Error updating task status:', err);
      setError(err.response?.data?.error || 'Failed to update task status.');
      // Refresh tasks to ensure UI is in sync with backend
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`${BASE_URL}/tasks/${taskId}`, {
          headers: getAuthHeader(),
          withCredentials: true,
        });
        
        // Remove the task from the tasks array
        const updatedTasks = tasks.filter(task => task._id !== taskId);
        setTasks(updatedTasks);
        organizeTasksByStatus(updatedTasks);
      } catch (err) {
        console.error('Error deleting task:', err);
        setError(err.response?.data?.error || 'Failed to delete task.');
      }
    }
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Find the task that was dragged
    const taskId = draggableId;
    const newStatus = destination.droppableId;
    
    // Update task status in the backend
    handleUpdateTaskStatus(taskId, newStatus);
  };

  if (loading) {
    return <div className="text-center py-4">Loading tasks...</div>;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 btn-hover-effect animate-fade-in"
        >
          Add Task
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg animate-shake" role="alert">
          {error}
        </div>
      )}

      {/* Create Task Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md animate-fade-in">
          <h4 className="text-md font-medium text-gray-900 mb-3">Create New Task</h4>
          <form onSubmit={handleCreateTask}>
            <div className="mb-3">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 form-field-focus"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 form-field-focus"
                rows="2"
              ></textarea>
            </div>
            <div className="mb-3">
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 form-field-focus"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <select
                id="assignee"
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 form-field-focus"
              >
                <option value="">Select Assignee</option>
                {projectMembers.map(member => (
                  <option key={member._id} value={member._id}>
                    {member.displayName || member.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 btn-hover-effect"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 btn-hover-effect"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {project.taskStatuses.map(status => (
            <div key={status} className="bg-gray-50 rounded-md p-3">
              <h4 className="font-medium text-gray-700 mb-3 flex justify-between items-center">
                {status}
                <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {tasksByStatus[status]?.length || 0}
                </span>
              </h4>
              <Droppable droppableId={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[200px]"
                  >
                    {tasksByStatus[status]?.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-3 mb-2 rounded-md shadow-sm border border-gray-200 task-card-enter hover-lift"
                          >
                            <div className="flex justify-between items-start">
                              <h5 className="font-medium text-gray-900">{task.title}</h5>
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                                className="text-red-500 hover:text-red-700 text-sm hover-scale"
                              >
                                ×
                              </button>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                            {task.dueDate && (
                              <div className="text-xs text-gray-500 mt-2">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                            {task.assignee && (
                              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-2 inline-block animate-fade-in">
                                {task.assignee.displayName || task.assignee.email}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TaskBoard;