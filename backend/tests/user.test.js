const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userController = require('../controller/userController');
const userRoutes = require('../routes/userRoutes');
const User = require('../db/models/user');

// Mock dependencies
jest.mock('../db/models/user');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('User Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', userRoutes);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('POST /users/login', () => {
    test('should login user with valid credentials', async () => {
      // Mock user and bcrypt compare
      const mockUser = {
        _id: '123',
        displayName: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword'
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('test-token');

      const response = await request(app)
        .post('/users/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', 'test-token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', '123');
      expect(response.body.user).toHaveProperty('displayName', 'Test User');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    test('should reject login with invalid credentials', async () => {
      // Mock user and bcrypt compare
      const mockUser = {
        _id: '123',
        displayName: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword'
      };
      
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false); // Password doesn't match

      const response = await request(app)
        .post('/users/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    test('should reject login with non-existent user', async () => {
      User.findOne.mockResolvedValue(null); // User not found

      const response = await request(app)
        .post('/users/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });
  });

  describe('POST /users/register', () => {
    test('should register a new user', async () => {
      // Mock user creation
      const mockNewUser = {
        _id: '456',
        displayName: 'New User',
        email: 'new@example.com',
        password: 'hashedPassword',
        save: jest.fn().mockResolvedValue(true)
      };
      
      User.findOne.mockResolvedValue(null); // No existing user
      User.mockImplementation(() => mockNewUser);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('new-user-token');

      const response = await request(app)
        .post('/users/register')
        .send({
          displayName: 'New User',
          email: 'new@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token', 'new-user-token');
      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    test('should reject registration with existing email', async () => {
      // Mock existing user
      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/users/register')
        .send({
          displayName: 'Existing User',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email already exists');
    });
  });
});