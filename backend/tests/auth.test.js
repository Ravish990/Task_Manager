const request = require('supertest');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const authRoutes = require('../routes/authRoutes');

// Mock dependencies
jest.mock('passport', () => ({
  authenticate: jest.fn(() => (req, res, next) => next()),
  initialize: jest.fn(() => (req, res, next) => next()),
  session: jest.fn(() => (req, res, next) => next()),
}));

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use('/auth', authRoutes);
  });

  test('GET /auth/google should call passport.authenticate', async () => {
    await request(app).get('/auth/google');
    expect(passport.authenticate).toHaveBeenCalledWith('google', { scope: ['profile', 'email'] });
  });

  test('GET /auth/google/callback should call passport.authenticate', async () => {
    await request(app).get('/auth/google/callback');
    expect(passport.authenticate).toHaveBeenCalledWith('google', { failureRedirect: '/' });
  });

  test('GET /auth/current_user should return user data', async () => {
    const app = express();
    app.use((req, res, next) => {
      req.user = { id: '123', displayName: 'Test User' };
      next();
    });
    app.use('/auth', authRoutes);

    const response = await request(app).get('/auth/current_user');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: '123', displayName: 'Test User' });
  });
  
  test('GET /auth/logout should logout the user', async () => {
    const app = express();
    // Mock req.logout function
    app.use((req, res, next) => {
      req.logout = jest.fn((callback) => callback());
      next();
    });
    app.use('/auth', authRoutes);

    const response = await request(app).get('/auth/logout');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Logout successful');
  });
});