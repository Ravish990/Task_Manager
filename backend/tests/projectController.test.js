const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const Project = require('../db/models/project');
const User = require('../db/models/user');
const projectController = require('../controller/projectController');

// Mock Express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.user = { id: '60d0fe4f5311236168a109ca' };
  next();
};

// Setup routes for testing
app.post('/projects', mockAuth, projectController.createProject);
app.get('/projects', mockAuth, projectController.getUserProjects);
app.get('/projects/:id', mockAuth, projectController.getProjectById);
app.put('/projects/:id', mockAuth, projectController.updateProject);
app.delete('/projects/:id', mockAuth, projectController.deleteProject);
app.post('/projects/:id/invite', mockAuth, projectController.inviteUser);
app.delete('/projects/:id/members/:userId', mockAuth, projectController.removeUser);

// Mock data
const mockUser = {
  _id: '60d0fe4f5311236168a109ca',
  displayName: 'Test User',
  email: 'test@example.com'
};

const mockProject = {
  _id: '60d0fe4f5311236168a109cb',
  title: 'Test Project',
  description: 'Test Description',
  owner: '60d0fe4f5311236168a109ca',
  members: ['60d0fe4f5311236168a109ca'],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock the mongoose models
jest.mock('../db/models/project');
jest.mock('../db/models/user');

describe('Project Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      // Mock the save method
      Project.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockProject),
        ...mockProject
      }));

      const response = await request(app)
        .post('/projects')
        .send({
          title: 'Test Project',
          description: 'Test Description'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.project).toBeDefined();
    });

    it('should return 500 if there is a server error', async () => {
      // Mock the save method to throw an error
      Project.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Server error')),
        ...mockProject
      }));

      const response = await request(app)
        .post('/projects')
        .send({
          title: 'Test Project',
          description: 'Test Description'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('getUserProjects', () => {
    it('should get all projects for the current user', async () => {
      // Mock the find method
      Project.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([mockProject])
      });

      const response = await request(app).get('/projects');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.projects).toHaveLength(1);
    });

    it('should return 500 if there is a server error', async () => {
      // Mock the find method to throw an error
      Project.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Server error'))
      });

      const response = await request(app).get('/projects');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('getProjectById', () => {
    it('should get a project by ID', async () => {
      // Mock the findById method
      Project.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockProject,
            owner: { _id: mockUser._id, ...mockUser },
            members: [{ _id: mockUser._id, ...mockUser }]
          })
        })
      });

      const response = await request(app).get(`/projects/${mockProject._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.project).toBeDefined();
    });

    it('should return 404 if project not found', async () => {
      // Mock the findById method to return null
      Project.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      const response = await request(app).get(`/projects/${mockProject._id}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('inviteUser', () => {
    it('should invite a user to a project', async () => {
      // Mock the findById method
      Project.findById = jest.fn().mockResolvedValue({
        ...mockProject,
        owner: {
          toString: () => mockUser._id
        },
        members: [{
          toString: () => mockUser._id
        }],
        save: jest.fn().mockResolvedValue({
          ...mockProject,
          members: [mockUser._id, '60d0fe4f5311236168a109cc']
        })
      });

      // Mock the findOne method for User
      User.findOne = jest.fn().mockResolvedValue({
        _id: '60d0fe4f5311236168a109cc',
        displayName: 'Invited User',
        email: 'invited@example.com'
      });

      const response = await request(app)
        .post(`/projects/${mockProject._id}/invite`)
        .send({
          email: 'invited@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('has been added to the project');
    });

    it('should return 404 if user to invite not found', async () => {
      // Mock the findById method
      Project.findById = jest.fn().mockResolvedValue({
        ...mockProject,
        owner: {
          toString: () => mockUser._id
        },
        members: [{
          toString: () => mockUser._id
        }]
      });

      // Mock the findOne method for User to return null
      User.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post(`/projects/${mockProject._id}/invite`)
        .send({
          email: 'nonexistent@example.com'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User with this email not found');
    });
  });
});