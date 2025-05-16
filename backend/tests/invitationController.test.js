const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const invitationController = require('../controller/invitationController');
const Invitation = require('../db/models/invitation');
const Project = require('../db/models/project');
const User = require('../db/models/user');

let mongoServer;

// Mock request and response objects
const mockRequest = (userData = {}, params = {}, body = {}) => ({
  user: userData,
  params,
  body
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  await User.deleteMany({});
  await Project.deleteMany({});
  await Invitation.deleteMany({});
});

describe('Invitation Controller', () => {
  describe('getUserInvitations', () => {
    it('should return pending invitations for the user', async () => {
      // Create test users
      const user1 = await User.create({
        displayName: 'Test User 1',
        email: 'user1@test.com',
        password: 'password123'
      });
      
      const user2 = await User.create({
        displayName: 'Test User 2',
        email: 'user2@test.com',
        password: 'password123'
      });
      
      // Create a test project
      const project = await Project.create({
        title: 'Test Project',
        description: 'Test Description',
        owner: user1._id,
        members: [user1._id]
      });
      
      // Create a test invitation
      await Invitation.create({
        project: project._id,
        sender: user1._id,
        recipient: user2._id,
        status: 'pending'
      });
      
      const req = mockRequest({ id: user2._id });
      const res = mockResponse();
      
      await invitationController.getUserInvitations(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
          invitations: expect.arrayContaining([
            expect.objectContaining({
              status: 'pending'
            })
          ])
        })
      );
    });
  });
  
  describe('acceptInvitation', () => {
    it('should accept an invitation and add user to project members', async () => {
      // Create test users
      const user1 = await User.create({
        displayName: 'Test User 1',
        email: 'user1@test.com',
        password: 'password123'
      });
      
      const user2 = await User.create({
        displayName: 'Test User 2',
        email: 'user2@test.com',
        password: 'password123'
      });
      
      // Create a test project
      const project = await Project.create({
        title: 'Test Project',
        description: 'Test Description',
        owner: user1._id,
        members: [user1._id]
      });
      
      // Create a test invitation
      const invitation = await Invitation.create({
        project: project._id,
        sender: user1._id,
        recipient: user2._id,
        status: 'pending'
      });
      
      const req = mockRequest({ id: user2._id }, { id: invitation._id });
      const res = mockResponse();
      
      await invitationController.acceptInvitation(req, res);
      
      // Check if invitation status was updated
      const updatedInvitation = await Invitation.findById(invitation._id);
      expect(updatedInvitation.status).toBe('accepted');
      
      // Check if user was added to project members
      const updatedProject = await Project.findById(project._id);
      expect(updatedProject.members).toContainEqual(user2._id);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Invitation accepted successfully'
        })
      );
    });
  });
  
  describe('rejectInvitation', () => {
    it('should reject an invitation', async () => {
      // Create test users
      const user1 = await User.create({
        displayName: 'Test User 1',
        email: 'user1@test.com',
        password: 'password123'
      });
      
      const user2 = await User.create({
        displayName: 'Test User 2',
        email: 'user2@test.com',
        password: 'password123'
      });
      
      // Create a test project
      const project = await Project.create({
        title: 'Test Project',
        description: 'Test Description',
        owner: user1._id,
        members: [user1._id]
      });
      
      // Create a test invitation
      const invitation = await Invitation.create({
        project: project._id,
        sender: user1._id,
        recipient: user2._id,
        status: 'pending'
      });
      
      const req = mockRequest({ id: user2._id }, { id: invitation._id });
      const res = mockResponse();
      
      await invitationController.rejectInvitation(req, res);
      
      // Check if invitation status was updated
      const updatedInvitation = await Invitation.findById(invitation._id);
      expect(updatedInvitation.status).toBe('rejected');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Invitation rejected successfully'
        })
      );
    });
  });
});