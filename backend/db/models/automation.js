const mongoose = require('mongoose');

/**
 * Schema for workflow automations
 * Automations are triggered by specific events and perform actions
 */
const AutomationSchema = new mongoose.Schema({
    // The project this automation belongs to
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    // Name of the automation for display purposes
    name: {
        type: String,
        required: true,
        trim: true
    },
    // Whether the automation is active
    active: {
        type: Boolean,
        default: true
    },
    // The trigger that activates this automation
    trigger: {
        // Type of trigger
        type: {
            type: String,
            enum: ['task_status_change', 'task_assignment', 'task_due_date_passed'],
            required: true
        },
        // Additional conditions for the trigger
        conditions: {
            // For task_status_change: the status that triggers the automation
            fromStatus: {
                type: String
            },
            toStatus: {
                type: String
            },
            // For task_assignment: the user that triggers the automation when assigned
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
            // Due date passed doesn't need additional conditions
        }
    },
    // The action to perform when triggered
    action: {
        // Type of action
        type: {
            type: String,
            enum: ['assign_badge', 'change_task_status', 'send_notification'],
            required: true
        },
        // Additional parameters for the action
        parameters: {
            // For assign_badge: the badge to assign
            badgeName: {
                type: String
            },
            // For change_task_status: the status to change to
            status: {
                type: String
            },
            // For send_notification: the notification message template
            notificationMessage: {
                type: String
            }
        }
    },
    // Who created this automation
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
AutomationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Automation = mongoose.model('Automation', AutomationSchema);

module.exports = Automation;