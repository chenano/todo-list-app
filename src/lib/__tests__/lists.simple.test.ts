import { ListService } from '../lists';
import { ListFormData, ListUpdateData } from '../validations';

// Create a simple mock for testing
const createMockSupabase = () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  };

  return {
    from: jest.fn().mockReturnValue(mockQuery),
    auth: {
      getUser: jest.fn(),
    },
    mockQuery,
  };
};

describe('ListService', () => {
  let listService: ListService;
  let mockSupabase: any;
  let mockQuery: any;

  beforeEach(() => {
    const mock = createMockSupabase();
    mockSupabase = mock;
    mockQuery = mock.mockQuery;
    listService = new ListService(mockSupabase);
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
    });

    it('should handle errors', async () => {
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
    });
  });

  describe('deleteList', () => {
    it('should delete a list successfully', async () => {
      mockQuery.eq.mockResolvedValue({
        error: null,
      });

      const result = await listService.deleteList('1');

      expect(result.error).toBeNull();
    });
  });
});