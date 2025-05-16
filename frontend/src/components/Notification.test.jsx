import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import axios from 'axios';
import Notification from './Notification';

// Mock axios
vi.mock('axios');

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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders notification bell icon', () => {
    axios.get.mockResolvedValueOnce({ data: { invitations: [] } });
    
    render(<Notification />);
    
    // Check if the bell icon is rendered
    const bellIcon = screen.getByRole('button');
    expect(bellIcon).toBeInTheDocument();
  });

  test('shows loading state while fetching invitations', () => {
    // Don't resolve the promise yet to keep it in loading state
    axios.get.mockImplementationOnce(() => new Promise(() => {}));
    
    render(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button');
    fireEvent.click(bellIcon);
    
    // Check if loading text is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows no notifications message when there are no invitations', async () => {
    axios.get.mockResolvedValueOnce({ data: { invitations: [] } });
    
    render(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button');
    fireEvent.click(bellIcon);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText('No new notifications')).toBeInTheDocument();
    });
  });

  test('displays invitations when they exist', async () => {
    const mockInvitations = [
      {
        _id: '1',
        sender: { displayName: 'John Doe', email: 'john@example.com' },
        project: { title: 'Test Project' },
        status: 'pending'
      }
    ];
    
    axios.get.mockResolvedValueOnce({ data: { invitations: mockInvitations } });
    
    render(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button');
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
    
    axios.get.mockResolvedValueOnce({ data: { invitations: mockInvitations } });
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    
    render(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button');
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
    
    axios.get.mockResolvedValueOnce({ data: { invitations: mockInvitations } });
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    
    render(<Notification />);
    
    // Click the bell icon to show notifications
    const bellIcon = screen.getByRole('button');
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
});