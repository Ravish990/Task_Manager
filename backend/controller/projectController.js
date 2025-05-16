const Project = require('../db/models/project');
const User = require('../db/models/user');

// Create a new project
exports.createProject = async (req, res) => {
    try {
        const { title, description } = req.body;
        
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        console.log('Creating project for user:', userId);
        console.log('Project data:', { title, description });
        
        // Create new project with the current user as owner
        const newProject = new Project({
            title,
            description,
            owner: userId,
            members: [userId] // Owner is also a member
        });
        
        const savedProject = await newProject.save();
        
        console.log('Project created successfully:', savedProject);
        
        res.status(201).json({
            success: true,
            project: savedProject
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Get all projects for the current user (owned or member)
exports.getUserProjects = async (req, res) => {
    try {
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        console.log('Fetching projects for user:', userId);
        
        const projects = await Project.find({
            $or: [
                { owner: userId },
                { members: userId }
            ]
        }).populate('owner', 'displayName email');
        
        console.log(`Found ${projects.length} projects for user ${userId}`);
        
        res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Get a single project by ID
exports.getProjectById = async (req, res) => {
    try {
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        const project = await Project.findById(req.params.id)
            .populate('owner', 'displayName email')
            .populate('members', 'displayName email');
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user is authorized to view this project
        const isOwner = project.owner._id.toString() === userId.toString();
        const isMember = project.members.some(member => member._id.toString() === userId.toString());
        
        if (!isOwner && !isMember) {
            return res.status(403).json({ error: 'Not authorized to access this project' });
        }
        
        res.status(200).json({
            success: true,
            project
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Update a project
exports.updateProject = async (req, res) => {
    try {
        const { title, description } = req.body;
        
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        // Find the project
        let project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user is the owner
        if (project.owner.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Only the project owner can update project details' });
        }
        
        // Update project
        project = await Project.findByIdAndUpdate(
            req.params.id,
            { title, description, updatedAt: Date.now() },
            { new: true }
        );
        
        res.status(200).json({
            success: true,
            project
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Delete a project
exports.deleteProject = async (req, res) => {
    try {
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user is the owner
        if (project.owner.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Only the project owner can delete this project' });
        }
        
        await Project.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Invite a user to a project
exports.inviteUser = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        // Find the project
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user is the owner or a member
        const isOwner = project.owner.toString() === userId.toString();
        const isMember = project.members.includes(userId);
        
        if (!isOwner && !isMember) {
            return res.status(403).json({ error: 'Not authorized to invite users to this project' });
        }
        
        // Find the user to invite
        const userToInvite = await User.findOne({ email });
        
        if (!userToInvite) {
            return res.status(404).json({ error: 'User with this email not found' });
        }
        
        // Check if user is already a member
        if (project.members.includes(userToInvite._id)) {
            return res.status(400).json({ error: 'User is already a member of this project' });
        }
        
        // Add user to members
        project.members.push(userToInvite._id);
        await project.save();
        
        res.status(200).json({
            success: true,
            message: `${userToInvite.displayName || userToInvite.email} has been added to the project`,
            project
        });
    } catch (error) {
        console.error('Invite user error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Remove a user from a project
exports.removeUser = async (req, res) => {
    try {
        const { userId: memberIdToRemove } = req.params;
        
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        // Find the project
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user is the owner
        if (project.owner.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Only the project owner can remove members' });
        }
        
        // Check if user is trying to remove themselves as owner
        if (memberIdToRemove === userId.toString() && project.owner.toString() === userId.toString()) {
            return res.status(400).json({ error: 'Project owner cannot be removed. Transfer ownership or delete the project instead.' });
        }
        
        // Remove user from members
        project.members = project.members.filter(
            member => member.toString() !== memberIdToRemove
        );
        
        await project.save();
        
        res.status(200).json({
            success: true,
            message: 'User removed from project successfully',
            project
        });
    } catch (error) {
        console.error('Remove user error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};