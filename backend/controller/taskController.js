const Task = require('../db/models/task');
const Project = require('../db/models/project');

// Create a new task
exports.createTask = async (req, res) => {
    try {
        const { title, description, dueDate, assignee, status, projectId } = req.body;
        
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        // Check if project exists and user is a member
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user is authorized to create tasks in this project
        const isOwner = project.owner.toString() === userId.toString();
        const isMember = project.members.some(member => member.toString() === userId.toString());
        
        if (!isOwner && !isMember) {
            return res.status(403).json({ error: 'Not authorized to create tasks in this project' });
        }
        
        // Validate status if provided
        if (status && !project.taskStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status. Valid statuses are: ' + project.taskStatuses.join(', ')
            });
        }
        
        // Create new task
        const newTask = new Task({
            title,
            description,
            dueDate,
            assignee,
            status: status || 'To Do',
            project: projectId,
            createdBy: userId
        });
        
        const savedTask = await newTask.save();
        
        // Populate creator and assignee info
        const populatedTask = await Task.findById(savedTask._id)
            .populate('createdBy', 'displayName email')
            .populate('assignee', 'displayName email');
        
        res.status(201).json({
            success: true,
            task: populatedTask
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Get all tasks for a project
exports.getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        // Check if project exists and user is a member
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user is authorized to view tasks in this project
        const isOwner = project.owner.toString() === userId.toString();
        const isMember = project.members.some(member => member.toString() === userId.toString());
        
        if (!isOwner && !isMember) {
            return res.status(403).json({ error: 'Not authorized to view tasks in this project' });
        }
        
        // Get all tasks for the project
        const tasks = await Task.find({ project: projectId })
            .populate('createdBy', 'displayName email')
            .populate('assignee', 'displayName email')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks
        });
    } catch (error) {
        console.error('Get project tasks error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        // Find the task
        const task = await Task.findById(taskId)
            .populate('createdBy', 'displayName email')
            .populate('assignee', 'displayName email');
        
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        // Check if project exists and user is a member
        const project = await Project.findById(task.project);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user is authorized to view this task
        const isOwner = project.owner.toString() === userId.toString();
        const isMember = project.members.some(member => member.toString() === userId.toString());
        
        if (!isOwner && !isMember) {
            return res.status(403).json({ error: 'Not authorized to view this task' });
        }
        
        res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Update a task
exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, dueDate, assignee, status } = req.body;
        
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        // Find the task
        let task = await Task.findById(taskId);
        
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        // Check if project exists and user is a member
        const project = await Project.findById(task.project);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user is authorized to update this task
        const isOwner = project.owner.toString() === userId.toString();
        const isMember = project.members.some(member => member.toString() === userId.toString());
        
        if (!isOwner && !isMember) {
            return res.status(403).json({ error: 'Not authorized to update this task' });
        }
        
        // Validate status if provided
        if (status && !project.taskStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status. Valid statuses are: ' + project.taskStatuses.join(', ')
            });
        }
        
        // Update task
        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate) updateData.dueDate = dueDate;
        if (assignee) updateData.assignee = assignee;
        if (status) updateData.status = status;
        
        task = await Task.findByIdAndUpdate(
            taskId,
            { ...updateData, updatedAt: Date.now() },
            { new: true }
        ).populate('createdBy', 'displayName email')
         .populate('assignee', 'displayName email');
        
        res.status(200).json({
            success: true,
            task
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Delete a task
exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        // Find the task
        const task = await Task.findById(taskId);
        
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        // Check if project exists and user is a member
        const project = await Project.findById(task.project);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user is authorized to delete this task
        const isOwner = project.owner.toString() === userId.toString();
        const isCreator = task.createdBy.toString() === userId.toString();
        
        if (!isOwner && !isCreator) {
            return res.status(403).json({ error: 'Not authorized to delete this task' });
        }
        
        await Task.findByIdAndDelete(taskId);
        
        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Update project task statuses
exports.updateProjectTaskStatuses = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { statuses } = req.body;
        
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        // Check if project exists
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user is the project owner
        if (project.owner.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Only the project owner can update task statuses' });
        }
        
        // Validate statuses
        if (!Array.isArray(statuses) || statuses.length === 0) {
            return res.status(400).json({ error: 'Statuses must be a non-empty array' });
        }
        
        // Update project with new statuses
        project.taskStatuses = statuses;
        await project.save();
        
        res.status(200).json({
            success: true,
            project
        });
    } catch (error) {
        console.error('Update project task statuses error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};