const Invitation = require('../db/models/invitation');
const Project = require('../db/models/project');
const User = require('../db/models/user');

// Get all pending invitations for the current user
exports.getUserInvitations = async (req, res) => {
    try {
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        // Find all pending invitations for this user
        const invitations = await Invitation.find({
            recipient: userId,
            status: 'pending'
        })
        .populate({
            path: 'project',
            select: 'title description'
        })
        .populate({
            path: 'sender',
            select: 'displayName email'
        });
        
        res.status(200).json({
            success: true,
            count: invitations.length,
            invitations
        });
    } catch (error) {
        console.error('Get invitations error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Accept an invitation
exports.acceptInvitation = async (req, res) => {
    try {
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        // Find the invitation
        const invitation = await Invitation.findById(req.params.id);
        
        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }
        
        // Check if this invitation is for the current user
        if (invitation.recipient.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Not authorized to accept this invitation' });
        }
        
        // Check if invitation is still pending
        if (invitation.status !== 'pending') {
            return res.status(400).json({ error: `Invitation has already been ${invitation.status}` });
        }
        
        // Find the project
        const project = await Project.findById(invitation.project);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Add user to project members if not already a member
        if (!project.members.includes(userId)) {
            project.members.push(userId);
            await project.save();
        }
        
        // Update invitation status
        invitation.status = 'accepted';
        await invitation.save();
        
        res.status(200).json({
            success: true,
            message: 'Invitation accepted successfully',
            invitation,
            project
        });
    } catch (error) {
        console.error('Accept invitation error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Reject an invitation
exports.rejectInvitation = async (req, res) => {
    try {
        // Get user ID from either JWT or Passport session
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }
        
        // Find the invitation
        const invitation = await Invitation.findById(req.params.id);
        
        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }
        
        // Check if this invitation is for the current user
        if (invitation.recipient.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Not authorized to reject this invitation' });
        }
        
        // Check if invitation is still pending
        if (invitation.status !== 'pending') {
            return res.status(400).json({ error: `Invitation has already been ${invitation.status}` });
        }
        
        // Update invitation status
        invitation.status = 'rejected';
        await invitation.save();
        
        res.status(200).json({
            success: true,
            message: 'Invitation rejected successfully',
            invitation
        });
    } catch (error) {
        console.error('Reject invitation error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};