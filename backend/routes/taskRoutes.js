const express = require('express');
const taskController = require('../controller/taskController');
const userAuth = require('../middleware/userAuth');

const router = express.Router();

// All task routes are protected by auth middleware
router.use(userAuth);

// Task CRUD routes
router.post('/create', taskController.createTask);
router.get('/project/:projectId', taskController.getProjectTasks);
router.get('/:taskId', taskController.getTaskById);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

// Project task statuses management
router.put('/project/:projectId/statuses', taskController.updateProjectTaskStatuses);

module.exports = router;