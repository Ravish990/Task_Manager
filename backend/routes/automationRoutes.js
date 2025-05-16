const express = require('express');
const automationController = require('../controller/automationController');
const userAuth = require('../middleware/userAuth');

const router = express.Router();


router.use(userAuth);

router.post('/create', automationController.createAutomation);


router.get('/project/:projectId', automationController.getProjectAutomations);

router.get('/:automationId', automationController.getAutomationById);


router.put('/:automationId', automationController.updateAutomation);


router.delete('/:automationId', automationController.deleteAutomation);

module.exports = router;
