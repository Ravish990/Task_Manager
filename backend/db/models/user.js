const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: false, 
    },
    displayName: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: false,
    },
    lastName: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false,
    },
    // Badges earned by the user through automations
    badges: [{
        name: {
            type: String,
            required: true
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }]
});

const User = mongoose.model('User', UserSchema);

module.exports = User;