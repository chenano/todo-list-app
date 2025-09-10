import { renderHook, act, waitFor } from '@testing-library/react';
import { useLists, useList, useCreateList, useUpdateList, useDeleteList } from '../useLists';
import { listService } from '../../lib/lists';
import { ListFormData, ListUpdateData } from '../../lib/validations';

// Mock the list service
jest.mock('../../lib/lists');

const mockListService = listService as jest.Mocked<typeof listService>;

describe('useLists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch lists on mount', async () => {
    const mockLists = [
      {
        id: '1',
        user_id: 'user1',
        name: 'Test List',
        description: 'Test Description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        task_count: 5,
      },
    ];

    mockListService.getListsWithTaskCount.mockResolvedValue({
      data: mockLists,
      error: null,
    });

    const { result } = renderHook(() => useLists());

    expect(result.current.loading).toBe(true);
    expect(result.current.lists).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lists).toEqual(mockLists);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    const mockError = { message: 'Failed to fetch lists' };
    mockListService.getListsWithTaskCount.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useLists());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lists).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it('should create a list with optimistic update', async () => {
    const mockLists = [
      {
        id: '1',
        user_id: 'user1',
        name: 'Existing List',
        description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        task_count: 0,
      },
    ];

    const newListData: ListFormData = {
      name: 'New List',
      description: 'New Description',
    };

    const createdList = {
      id: '2',
      user_id: 'user1',
      name: 'New List',
      description: 'New Description',
      created_at: '2024-01-01T01:00:00Z',
      updated_at: '2024-01-01T01:00:00Z',
    };

    mockListService.getListsWithTaskCount.mockResolvedValue({
      data: mockLists,
      error: null,
    });

    mockListService.createList.mockResolvedValue({
      data: createdList,
      error: null,
    });

    const { result } = renderHook(() => useLists());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lists).toHaveLength(1);

    let createdListResult: any;
    await act(async () => {
      createdListResult = await result.current.createList(newListData);
    });

    // Should have the new list added
    expect(result.current.lists).toHaveLength(2);
    expect(result.current.lists[0].name).toBe('New List');
    
    // Wait for the real data to be set
    await waitFor(() => {
      expect(result.current.lists[0].id).toBe('2');
    });

    expect(createdListResult).toEqual(createdList);
  });

  it('should rollback optimistic update on create error', async () => {
    const mockLists = [
      {
        id: '1',
        user_id: 'user1',
        name: 'Existing List',
        description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        task_count: 0,
      },
    ];

    const newListData: ListFormData = {
      name: 'New List',
      description: 'New Description',
    };

    const mockError = { message: 'Failed to create list' };

    mockListService.getListsWithTaskCount.mockResolvedValue({
      data: mockLists,
      error: null,
    });

    mockListService.createList.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useLists());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lists).toHaveLength(1);

    let createdListResult: any;
    await act(async () => {
      createdListResult = await result.current.createList(newListData);
    });

    // Should rollback to original state
    expect(result.current.lists).toHaveLength(1);
    expect(result.current.lists[0].id).toBe('1');
    expect(result.current.error).toEqual(mockError);
    expect(createdListResult).toBeNull();
  });

  it('should update a list with optimistic update', async () => {
    const mockLists = [
      {
        id: '1',
        user_id: 'user1',
        name: 'Original List',
        description: 'Original Description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        task_count: 5,
      },
    ];

    const updateData: ListUpdateData = {
      name: 'Updated List',
      description: 'Updated Description',
    };

    const updatedList = {
      id: '1',
      user_id: 'user1',
      name: 'Updated List',
      description: 'Updated Description',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T01:00:00Z',
    };

    mockListService.getListsWithTaskCount.mockResolvedValue({
      data: mockLists,
      error: null,
    });

    mockListService.updateList.mockResolvedValue({
      data: updatedList,
      error: null,
    });

    const { result } = renderHook(() => useLists());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updateResult: any;
    await act(async () => {
      updateResult = await result.current.updateList('1', updateData);
    });

    expect(result.current.lists[0].name).toBe('Updated List');
    expect(result.current.lists[0].description).toBe('Updated Description');
    expect(updateResult).toEqual(updatedList);
  });

  it('should delete a list with optimistic update', async () => {
    const mockLists = [
      {
        id: '1',
        user_id: 'user1',
        name: 'List to Delete',
        description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        task_count: 0,
      },
      {
        id: '2',
        user_id: 'user1',
        name: 'Other List',
        description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        task_count: 0,
      },
    ];

    mockListService.getListsWithTaskCount.mockResolvedValue({
      data: mockLists,
      error: null,
    });

    mockListService.deleteList.mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useLists());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lists).toHaveLength(2);

    let deleteResult: any;
    await act(async () => {
      deleteResult = await result.current.deleteList('1');
    });

    expect(result.current.lists).toHaveLength(1);
    expect(result.current.lists[0].id).toBe('2');
    expect(deleteResult).toBe(true);
  });
});

describe('useList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch a single list', async () => {
    const mockList = {
      id: '1',
      user_id: 'user1',
      name: 'Test List',
      description: 'Test Description',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockListService.getListById.mockResolvedValue({
      data: mockList,
      error: null,
    });

    const { result } = renderHook(() => useList('1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.list).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.list).toEqual(mockList);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    const mockError = { message: 'List not found' };
    mockListService.getListById.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useList('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.list).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });
});

describe('useCreateList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a list successfully', async () => {
    const listData: ListFormData = {
      name: 'New List',
      description: 'New Description',
    };

    const createdList = {
      id: '1',
      user_id: 'user1',
      name: 'New List',
      description: 'New Description',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockListService.createList.mockResolvedValue({
      data: createdList,
      error: null,
    });

    const { result } = renderHook(() => useCreateList());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    let createResult: any;
    await act(async () => {
      createResult = await result.current.createList(listData);
    });

    expect(createResult).toEqual(createdList);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle create errors', async () => {
    const listData: ListFormData = {
      name: 'New List',
      description: 'New Description',
    };

    const mockError = { message: 'Failed to create list' };

    mockListService.createList.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useCreateList());

    let createResult: any;
    await act(async () => {
      createResult = await result.current.createList(listData);
    });

    expect(createResult).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });
});

describe('useUpdateList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update a list successfully', async () => {
    const updateData: ListUpdateData = {
      name: 'Updated List',
    };

    const updatedList = {
      id: '1',
      user_id: 'user1',
      name: 'Updated List',
      description: 'Original Description',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T01:00:00Z',
    };

    mockListService.updateList.mockResolvedValue({
      data: updatedList,
      error: null,
    });

    const { result } = renderHook(() => useUpdateList());

    let updateResult: any;
    await act(async () => {
      updateResult = await result.current.updateList('1', updateData);
    });

    expect(updateResult).toEqual(updatedList);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useDeleteList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a list successfully', async () => {
    mockListService.deleteList.mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useDeleteList());

    let deleteResult: any;
    await act(async () => {
      deleteResult = await result.current.deleteList('1');
    });

    expect(deleteResult).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle delete errors', async () => {
    const mockError = { message: 'Failed to delete list' };

    mockListService.deleteList.mockResolvedValue({
      error: mockError,
    });

    const { result } = renderHook(() => useDeleteList());

    let deleteResult: any;
    await act(async () => {
      deleteResult = await result.current.deleteList('1');
    });

    expect(deleteResult).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });
});