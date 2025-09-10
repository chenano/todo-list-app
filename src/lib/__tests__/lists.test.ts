import { ListService } from '../lists';
import { ListFormData, ListUpdateData } from '../validations';

const mockQuery = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
};

const mockSupabase = {
  from: jest.fn().mockReturnValue(mockQuery),
  auth: {
    getUser: jest.fn(),
  },
};

describe('ListService', () => {
  let listService: ListService;

  beforeEach(() => {
    jest.clearAllMocks();
    listService = new ListService(mockSupabase as any);
  });

  describe('getLists', () => {
    it('should fetch lists successfully', async () => {
      const mockLists = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Test List',
          description: 'Test Description',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockQuery.order.mockResolvedValue({
        data: mockLists,
        error: null,
      });

      const result = await listService.getLists();

      expect(result.data).toEqual(mockLists);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('lists');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should handle database errors', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      mockQuery.order.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await listService.getLists();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Database error',
        code: 'DB_ERROR',
      });
    });

    it('should handle unexpected errors', async () => {
      mockQuery.order.mockRejectedValue(new Error('Network error'));

      const result = await listService.getLists();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'Failed to fetch lists',
        details: 'Error: Network error',
      });
    });
  });

  describe('getListsWithTaskCount', () => {
    it('should fetch lists with task count successfully', async () => {
      const mockListsWithTasks = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Test List',
          description: 'Test Description',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          tasks: [{ count: 5 }],
        },
      ];

      mockQuery.order.mockResolvedValue({
        data: mockListsWithTasks,
        error: null,
      });

      const result = await listService.getListsWithTaskCount();

      expect(result.data).toEqual([
        {
          id: '1',
          user_id: 'user1',
          name: 'Test List',
          description: 'Test Description',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          tasks: [{ count: 5 }],
          task_count: 1, // Array length
        },
      ]);
      expect(result.error).toBeNull();
    });
  });

  describe('getListById', () => {
    it('should fetch a single list successfully', async () => {
      const mockList = {
        id: '1',
        user_id: 'user1',
        name: 'Test List',
        description: 'Test Description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockQuery.single.mockResolvedValue({
        data: mockList,
        error: null,
      });

      const result = await listService.getListById('1');

      expect(result.data).toEqual(mockList);
      expect(result.error).toBeNull();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockQuery.single).toHaveBeenCalled();
    });
  });

  describe('createList', () => {
    it('should create a list successfully', async () => {
      const mockUser = { id: 'user1' };
      const listData: ListFormData = {
        name: 'New List',
        description: 'New Description',
      };

      const mockCreatedList = {
        id: '1',
        user_id: 'user1',
        name: 'New List',
        description: 'New Description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      mockQuery.single.mockResolvedValue({
        data: mockCreatedList,
        error: null,
      });

      const result = await listService.createList(listData);

      expect(result.data).toEqual(mockCreatedList);
      expect(result.error).toBeNull();
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: 'user1',
        name: 'New List',
        description: 'New Description',
      });
    });

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const listData: ListFormData = {
        name: 'New List',
        description: 'New Description',
      };

      const result = await listService.createList(listData);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        message: 'User not authenticated',
      });
    });
  });

  describe('updateList', () => {
    it('should update a list successfully', async () => {
      const updateData: ListUpdateData = {
        name: 'Updated List',
        description: 'Updated Description',
      };

      const mockUpdatedList = {
        id: '1',
        user_id: 'user1',
        name: 'Updated List',
        description: 'Updated Description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
      };

      mockQuery.single.mockResolvedValue({
        data: mockUpdatedList,
        error: null,
      });

      const result = await listService.updateList('1', updateData);

      expect(result.data).toEqual(mockUpdatedList);
      expect(result.error).toBeNull();
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated List',
          description: 'Updated Description',
          updated_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('deleteList', () => {
    it('should delete a list successfully', async () => {
      mockQuery.delete.mockResolvedValue({
        error: null,
      });

      const result = await listService.deleteList('1');

      expect(result.error).toBeNull();
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should handle delete errors', async () => {
      const mockError = { message: 'Delete failed', code: 'DELETE_ERROR' };
      mockQuery.delete.mockResolvedValue({
        error: mockError,
      });

      const result = await listService.deleteList('1');

      expect(result.error).toEqual({
        message: 'Delete failed',
        code: 'DELETE_ERROR',
      });
    });
  });

  describe('getTaskCount', () => {
    it('should get task count successfully', async () => {
      mockQuery.select.mockResolvedValue({
        count: 5,
        error: null,
      });

      const result = await listService.getTaskCount('list1');

      expect(result.data).toBe(5);
      expect(result.error).toBeNull();
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockQuery.eq).toHaveBeenCalledWith('list_id', 'list1');
    });

    it('should handle null count', async () => {
      mockQuery.select.mockResolvedValue({
        count: null,
        error: null,
      });

      const result = await listService.getTaskCount('list1');

      expect(result.data).toBe(0);
      expect(result.error).toBeNull();
    });
  });
});

describe('ListService methods', () => {
  it('should have all required methods', () => {
    expect(typeof listService.getLists).toBe('function');
    expect(typeof listService.getListsWithTaskCount).toBe('function');
    expect(typeof listService.getListById).toBe('function');
    expect(typeof listService.createList).toBe('function');
    expect(typeof listService.updateList).toBe('function');
    expect(typeof listService.deleteList).toBe('function');
    expect(typeof listService.getTaskCount).toBe('function');
  });
});