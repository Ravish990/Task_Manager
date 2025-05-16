const express = require('express');
const projectController = require('../controller/projectController');
const userAuth = require('../middleware/userAuth');

const router = express.Router();

// All project routes are protected by auth middleware
router.use(userAuth);

// Project CRUD routes
router.post('/create', projectController.createProject);
router.get('/getAll', projectController.getUserProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Project member management
router.post('/:id/invite', projectController.inviteUser);
router.delete('/:id/members/:userId', projectController.removeUser);

module.exports = router;