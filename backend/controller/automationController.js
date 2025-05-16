const Automation = require('../db/models/automation');
const Project = require('../db/models/project');
const Task = require('../db/models/task');
const cron = require('node-cron');

/**
 * --- Automation Runner Helpers ---
 */

// Check and run automations for an event
async function checkAndTriggerAutomations(eventType, task, changes = {}) {
    const automations = await Automation.find({
        project: task.project,
        'trigger.type': eventType,
        active: true
    });

    for (const automation of automations) {
        const { trigger, action } = automation;

        // Match conditions
        if (eventType === 'task_status_change') {
            const from = trigger.conditions?.fromStatus;
            const to = trigger.conditions?.toStatus;
            if ((from && from !== changes.fromStatus) ||
                (to && to !== changes.toStatus)) continue;
        }

        if (eventType === 'task_assignment') {
            const assignedTo = trigger.conditions?.userId;
            if (assignedTo && assignedTo !== task.assignee.toString()) continue;
        }

        if (eventType === 'task_due_date_passed') {
            if (task.dueDate > new Date()) continue;
        }

        await performAutomationAction(action, task);
    }
}

// Action executor
async function performAutomationAction(action, task) {
    switch (action.type) {
        case 'assign_badge':
            console.log(`Assigning badge ${action.parameters.badgeId} to ${task.assignee}`);
            break;

        case 'change_task_status':
            task.status = action.parameters.status;
            await task.save();
            break;

        case 'send_notification':
            console.log(`Notification to ${action.parameters.userId}: ${action.parameters.message}`);
            break;

        default:
            console.warn('Unknown action type:', action.type);
    }
}

/**
 * --- Controller Actions ---
 */

exports.createAutomation = async (req, res) => {
    try {
        const { projectId, name, trigger, action } = req.body;
        const userId = req.user.id || req.user._id;

        if (!userId) return res.status(401).json({ error: 'User ID not found in request' });

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.owner.toString() !== userId.toString())
            return res.status(403).json({ error: 'Only project owners can create automations' });

        if (!trigger || !['task_status_change', 'task_assignment', 'task_due_date_passed'].includes(trigger.type))
            return res.status(400).json({ error: 'Invalid trigger type' });

        if (!action || !['assign_badge', 'change_task_status', 'send_notification'].includes(action.type))
            return res.status(400).json({ error: 'Invalid action type' });

        if (trigger.type === 'task_status_change') {
            if (trigger.conditions?.fromStatus &&
                !project.taskStatuses.includes(trigger.conditions.fromStatus)) {
                return res.status(400).json({
                    error: `Invalid fromStatus. Valid: ${project.taskStatuses.join(', ')}`
                });
            }

            if (trigger.conditions?.toStatus &&
                !project.taskStatuses.includes(trigger.conditions.toStatus)) {
                return res.status(400).json({
                    error: `Invalid toStatus. Valid: ${project.taskStatuses.join(', ')}`
                });
            }
        }

        if (action.type === 'change_task_status') {
            if (!action.parameters?.status ||
                !project.taskStatuses.includes(action.parameters.status)) {
                return res.status(400).json({
                    error: `Invalid status. Valid: ${project.taskStatuses.join(', ')}`
                });
            }
        }

        const newAutomation = new Automation({
            project: projectId,
            name,
            trigger,
            action,
            createdBy: userId,
            active: true
        });

        const savedAutomation = await newAutomation.save();
        res.status(201).json({ success: true, automation: savedAutomation });
    } catch (error) {
        console.error('Create automation error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

exports.getProjectAutomations = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id || req.user._id;

        if (!userId) return res.status(401).json({ error: 'User ID not found in request' });

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const isOwner = project.owner.toString() === userId.toString();
        const isMember = project.members.some(m => m.toString() === userId.toString());

        if (!isOwner && !isMember)
            return res.status(403).json({ error: 'Not authorized' });

        const automations = await Automation.find({ project: projectId })
            .populate('createdBy', 'displayName email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: automations.length, automations });
    } catch (error) {
        console.error('Get project automations error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

exports.getAutomationById = async (req, res) => {
    try {
        const { automationId } = req.params;
        const userId = req.user.id || req.user._id;

        if (!userId) return res.status(401).json({ error: 'User ID not found in request' });

        const automation = await Automation.findById(automationId)
            .populate('createdBy', 'displayName email');
        if (!automation) return res.status(404).json({ error: 'Automation not found' });

        const project = await Project.findById(automation.project);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const isOwner = project.owner.toString() === userId.toString();
        const isMember = project.members.some(m => m.toString() === userId.toString());

        if (!isOwner && !isMember)
            return res.status(403).json({ error: 'Not authorized to view this automation' });

        res.status(200).json({ success: true, automation });
    } catch (error) {
        console.error('Get automation error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

exports.updateAutomation = async (req, res) => {
    try {
        const { automationId } = req.params;
        const { name, trigger, action, active } = req.body;
        const userId = req.user.id || req.user._id;

        if (!userId) return res.status(401).json({ error: 'User ID not found in request' });

        let automation = await Automation.findById(automationId);
        if (!automation) return res.status(404).json({ error: 'Automation not found' });

        const project = await Project.findById(automation.project);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.owner.toString() !== userId.toString())
            return res.status(403).json({ error: 'Only project owners can update automations' });

        if (trigger && !['task_status_change', 'task_assignment', 'task_due_date_passed'].includes(trigger.type)) {
            return res.status(400).json({ error: 'Invalid trigger type' });
        }

        if (action && !['assign_badge', 'change_task_status', 'send_notification'].includes(action.type)) {
            return res.status(400).json({ error: 'Invalid action type' });
        }

        if (trigger?.type === 'task_status_change') {
            if (trigger.conditions?.fromStatus &&
                !project.taskStatuses.includes(trigger.conditions.fromStatus)) {
                return res.status(400).json({
                    error: `Invalid fromStatus. Valid: ${project.taskStatuses.join(', ')}`
                });
            }
            if (trigger.conditions?.toStatus &&
                !project.taskStatuses.includes(trigger.conditions.toStatus)) {
                return res.status(400).json({
                    error: `Invalid toStatus. Valid: ${project.taskStatuses.join(', ')}`
                });
            }
        }

        if (action?.type === 'change_task_status') {
            if (!action.parameters?.status || !project.taskStatuses.includes(action.parameters.status)) {
                return res.status(400).json({
                    error: `Invalid status. Valid: ${project.taskStatuses.join(', ')}`
                });
            }
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (trigger) updateData.trigger = trigger;
        if (action) updateData.action = action;
        if (active !== undefined) updateData.active = active;

        automation = await Automation.findByIdAndUpdate(
            automationId,
            { ...updateData, updatedAt: Date.now() },
            { new: true }
        ).populate('createdBy', 'displayName email');

        res.status(200).json({ success: true, automation });
    } catch (error) {
        console.error('Update automation error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

exports.deleteAutomation = async (req, res) => {
    try {
        const { automationId } = req.params;
        const userId = req.user.id || req.user._id;

        if (!userId) return res.status(401).json({ error: 'User ID not found in request' });

        const automation = await Automation.findById(automationId);
        if (!automation) return res.status(404).json({ error: 'Automation not found' });

        const project = await Project.findById(automation.project);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.owner.toString() !== userId.toString())
            return res.status(403).json({ error: 'Only project owners can delete automations' });

        await Automation.findByIdAndDelete(automationId);

        res.status(200).json({ success: true, message: 'Automation deleted successfully' });
    } catch (error) {
        console.error('Delete automation error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

/**
 * 🕒 CRON: Due date automation runner (every hour)
 */
cron.schedule('0 * * * *', async () => {
    console.log('[Automation Cron] Running due date check...');
    const overdueTasks = await Task.find({
        dueDate: { $lt: new Date() },
        status: { $ne: 'Done' }
    });

    for (const task of overdueTasks) {
        await checkAndTriggerAutomations('task_due_date_passed', task);
    }
});
