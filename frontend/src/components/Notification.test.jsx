import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import Notification from './Notification';

// Mock axios
vi.mock('axios');

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

const renderWithRouter = (ui) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('Notification Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue('fake-token'),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    // Mock setInterval and clearInterval
    vi.useFakeTimers();
    
    // Default mock responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: { notifications: [] } });
      } else if (url.includes('/invitations/pending')) {
        return Promise.resolve({ data: { invitations: [] } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders notification bell icon', () => {
    renderWithRouter(<Notification />);
    
    // Check if the bell icon is rendered
    const bellIcon = screen.getByRole('button', { name: 'Notifications' });
    expect(bellIcon).toBeInTheDocument();
  });

  test('shows loading state while fetching notifications', () => {
    // Don't resolve the promises to keep it in loading state
    axios.get.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.click(bellIcon);
    
    // Check if loading text is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows no notifications message when there are no notifications or invitations', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: { notifications: [] } });
      } else if (url.includes('/invitations/pending')) {
        return Promise.resolve({ data: { invitations: [] } });
      }
      return Promise.resolve({ data: {} });
    });
    
    renderWithRouter(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.click(bellIcon);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText('No new notifications')).toBeInTheDocument();
    });
  });

  test('displays task notifications when they exist', async () => {
    const mockNotifications = [
      {
        _id: '1',
        type: 'task_assignment',
        sender: { displayName: 'John Doe', email: 'john@example.com' },
        message: 'You have been assigned to task "Test Task" in project "Test Project"',
        read: false,
        createdAt: new Date().toISOString(),
        taskId: { _id: 'task1', title: 'Test Task' },
        projectId: { _id: 'project1', title: 'Test Project' }
      }
    ];
    
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: { notifications: mockNotifications } });
      } else if (url.includes('/invitations/pending')) {
        return Promise.resolve({ data: { invitations: [] } });
      }
      return Promise.resolve({ data: {} });
    });
    
    renderWithRouter(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.click(bellIcon);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText(/You have been assigned to task/)).toBeInTheDocument();
    });
  });

  test('displays project invitations when they exist', async () => {
    const mockInvitations = [
      {
        _id: '1',
        sender: { displayName: 'John Doe', email: 'john@example.com' },
        project: { title: 'Test Project' },
        status: 'pending'
      }
    ];
    
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: { notifications: [] } });
      } else if (url.includes('/invitations/pending')) {
        return Promise.resolve({ data: { invitations: mockInvitations } });
      }
      return Promise.resolve({ data: {} });
    });
    
    renderWithRouter(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.click(bellIcon);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Test Project/)).toBeInTheDocument();
    });
    
    // Check if accept and decline buttons are present
    expect(screen.getByText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Decline')).toBeInTheDocument();
  });

  test('handles accepting an invitation', async () => {
    const mockInvitations = [
      {
        _id: '1',
        sender: { displayName: 'John Doe', email: 'john@example.com' },
        project: { title: 'Test Project' },
        status: 'pending'
      }
    ];
    
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: { notifications: [] } });
      } else if (url.includes('/invitations/pending')) {
        return Promise.resolve({ data: { invitations: mockInvitations } });
      }
      return Promise.resolve({ data: {} });
    });
    
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    
    renderWithRouter(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.click(bellIcon);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });
    
    // Click the accept button
    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);
    
    // Check if the API was called with the correct parameters
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:8000/invitations/1/accept',
        {},
        expect.objectContaining({
          headers: { Authorization: 'Bearer fake-token' },
          withCredentials: true
        })
      );
    });
  });

  test('handles rejecting an invitation', async () => {
    const mockInvitations = [
      {
        _id: '1',
        sender: { displayName: 'John Doe', email: 'john@example.com' },
        project: { title: 'Test Project' },
        status: 'pending'
      }
    ];
    
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: { notifications: [] } });
      } else if (url.includes('/invitations/pending')) {
        return Promise.resolve({ data: { invitations: mockInvitations } });
      }
      return Promise.resolve({ data: {} });
    });
    
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    
    renderWithRouter(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.click(bellIcon);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });
    
    // Click the decline button
    const declineButton = screen.getByText('Decline');
    fireEvent.click(declineButton);
    
    // Check if the API was called with the correct parameters
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:8000/invitations/1/reject',
        {},
        expect.objectContaining({
          headers: { Authorization: 'Bearer fake-token' },
          withCredentials: true
        })
      );
    });
  });
  
  test('handles marking a notification as read', async () => {
    const mockNotifications = [
      {
        _id: '1',
        type: 'task_assignment',
        sender: { displayName: 'John Doe', email: 'john@example.com' },
        message: 'You have been assigned to task "Test Task" in project "Test Project"',
        read: false,
        createdAt: new Date().toISOString(),
        taskId: { _id: 'task1', title: 'Test Task' },
        projectId: { _id: 'project1', title: 'Test Project' }
      }
    ];
    
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: { notifications: mockNotifications } });
      } else if (url.includes('/invitations/pending')) {
        return Promise.resolve({ data: { invitations: [] } });
      }
      return Promise.resolve({ data: {} });
    });
    
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    
    renderWithRouter(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.click(bellIcon);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText(/You have been assigned to task/)).toBeInTheDocument();
    });
    
    // Click the notification to mark it as read
    const notification = screen.getByText(/You have been assigned to task/);
    fireEvent.click(notification);
    
    // Check if the API was called with the correct parameters
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:8000/notifications/1/read',
        {},
        expect.objectContaining({
          headers: { Authorization: 'Bearer fake-token' },
          withCredentials: true
        })
      );
    });
  });
  
  test('handles marking all notifications as read', async () => {
    const mockNotifications = [
      {
        _id: '1',
        type: 'task_assignment',
        sender: { displayName: 'John Doe', email: 'john@example.com' },
        message: 'You have been assigned to task "Test Task" in project "Test Project"',
        read: false,
        createdAt: new Date().toISOString(),
        taskId: { _id: 'task1', title: 'Test Task' },
        projectId: { _id: 'project1', title: 'Test Project' }
      }
    ];
    
    axios.get.mockImplementation((url) => {
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: { notifications: mockNotifications } });
      } else if (url.includes('/invitations/pending')) {
        return Promise.resolve({ data: { invitations: [] } });
      }
      return Promise.resolve({ data: {} });
    });
    
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    
    renderWithRouter(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.click(bellIcon);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText(/You have been assigned to task/)).toBeInTheDocument();
    });
    
    // Click the "Mark all as read" button
    const markAllButton = screen.getByText('Mark all as read');
    fireEvent.click(markAllButton);
    
    // Check if the API was called with the correct parameters
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:8000/notifications/read-all',
        {},
        expect.objectContaining({
          headers: { Authorization: 'Bearer fake-token' },
          withCredentials: true
        })
      );
    });
  });
});