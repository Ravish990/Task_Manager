const express = require('express');
const userController = require('../controller/userController');
const userAuth = require('../middleware/userAuth');

const router = express.Router();

// Authentication routes
router.post('/login', userController.login);
router.post('/register', userController.createUser);

// User CRUD routes - protected by auth middleware
router.get('/:id', userAuth, userController.getUserById);
router.put('/:id', userAuth, userController.updateUser);
router.delete('/:id', userAuth, userController.deleteUser);
 
module.exports = router;