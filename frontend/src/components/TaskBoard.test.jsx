import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import axios from 'axios';
import TaskBoard from './TaskBoard';

// Mock axios
vi.mock('axios');

// Mock react-beautiful-dnd
vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) => children({
    innerRef: () => {},
    droppableProps: {},
    placeholder: null,
  }),
  Draggable: ({ children }) => children({
    innerRef: () => {},
    draggableProps: {},
    dragHandleProps: {},
  }),
}));

describe('TaskBoard Component', () => {
  const mockProject = {
    _id: 'project123',
    title: 'Test Project',
    description: 'Test Description',
    taskStatuses: ['To Do', 'In Progress', 'Done'],
    owner: 'user123',
    members: ['user123', 'user456']
  };

  const mockTasks = [
    {
      _id: 'task1',
      title: 'Task 1',
      description: 'Task 1 description',
      status: 'To Do',
      project: 'project123',
      createdBy: { _id: 'user123', displayName: 'Test User' },
      createdAt: new Date().toISOString()
    },
    {
      _id: 'task2',
      title: 'Task 2',
      description: 'Task 2 description',
      status: 'In Progress',
      project: 'project123',
      createdBy: { _id: 'user123', displayName: 'Test User' },
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'fake-token'),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    });

    // Mock successful API responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/tasks/project/')) {
        return Promise.resolve({ data: { tasks: mockTasks } });
      }
      if (url.includes('/projects/')) {
        return Promise.resolve({ data: { project: mockProject } });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  test('renders task board with tasks grouped by status', async () => {
    render(<TaskBoard project={mockProject} />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });
    
    // Check if task statuses are displayed
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    
    // Check if tasks are displayed
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
  });

  test('shows create task form when Add Task button is clicked', async () => {
    render(<TaskBoard project={mockProject} />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Add Task')).toBeInTheDocument();
    });
    
    // Click Add Task button
    fireEvent.click(screen.getByText('Add Task'));
    
    // Check if form is displayed
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.getByLabelText('Title *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  test('creates a new task when form is submitted', async () => {
    // Mock successful task creation
    axios.post.mockResolvedValueOnce({
      data: {
        task: {
          _id: 'task3',
          title: 'New Task',
          description: 'New task description',
          status: 'To Do',
          project: 'project123',
          createdBy: { _id: 'user123', displayName: 'Test User' },
          createdAt: new Date().toISOString()
        }
      }
    });

    render(<TaskBoard project={mockProject} />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Add Task')).toBeInTheDocument();
    });
    
    // Click Add Task button
    fireEvent.click(screen.getByText('Add Task'));
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'New Task' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New task description' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Create'));
    
    // Check if API was called with correct data
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/tasks/create',
        {
          title: 'New Task',
          description: 'New task description',
          dueDate: undefined,
          assignee: undefined,
          projectId: 'project123'
        },
        expect.any(Object)
      );
    });
  });
});