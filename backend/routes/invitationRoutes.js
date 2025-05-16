const express = require('express');
const invitationController = require('../controller/invitationController');
const userAuth = require('../middleware/userAuth');

const router = express.Router();

// All invitation routes are protected by auth middleware
router.use(userAuth);

// Invitation routes
router.get('/pending', invitationController.getUserInvitations);
router.put('/:id/accept', invitationController.acceptInvitation);
router.put('/:id/reject', invitationController.rejectInvitation);

module.exports = router;