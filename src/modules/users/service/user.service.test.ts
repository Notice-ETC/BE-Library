import { UserService } from './user.service';
import { UserModel } from '../model/user.model';
import { NotFoundError, ValidationError } from '../../../util/errors';

jest.mock('../model/user.model');

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
  });

  describe('getUsers', () => {
    it('should return all users without filters', async () => {
      const mockUsers = [
        {
          _id: "user1",
          username: "user1",
          email: "user1@example.com",
          fullName: "User One",
          role: "normal_user",
          employmentStatus: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "user2",
          username: "user2",
          email: "user2@example.com",
          fullName: "User Two",
          role: "librarian",
          employmentStatus: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = [
        {
          userId: 'user1',
          username: 'user1',
          email: 'user1@example.com',
          fullName: 'User One',
          role: 'normal_user',
          employmentStatus: undefined,
          createdAt: mockUsers[0].createdAt,
          updatedAt: mockUsers[0].updatedAt,
        },
        {
          userId: 'user2',
          username: 'user2',
          email: 'user2@example.com',
          fullName: 'User Two',
          role: 'librarian',
          employmentStatus: undefined,
          createdAt: mockUsers[1].createdAt,
          updatedAt: mockUsers[1].updatedAt,
        },
      ];

      (UserModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUsers),
        }),
      });

      const result = await userService.getUsers({});

      expect(UserModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedResult);
    });

    it('should return users filtered by role', async () => {
      const mockUsers = [
        {
          _id: 'user1',
          username: 'admin1',
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'admin',
          employmentStatus: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = [
        {
          userId: 'user1',
          username: 'admin1',
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'admin',
          employmentStatus: undefined,
          createdAt: mockUsers[0].createdAt,
          updatedAt: mockUsers[0].updatedAt,
        },
      ];

      (UserModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUsers),
        }),
      });

      const result = await userService.getUsers({ role: 'admin' });

      expect(UserModel.find).toHaveBeenCalledWith({ role: 'admin' });
      expect(result).toEqual(expectedResult);
    });

    it('should return users filtered by employmentStatus', async () => {
      const mockUsers = [
        {
          _id: 'user1',
          username: 'librarian1',
          email: 'librarian@example.com',
          fullName: 'Librarian User',
          role: 'librarian',
          employmentStatus: 'employed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResult = [
        {
          userId: 'user1',
          username: 'librarian1',
          email: 'librarian@example.com',
          fullName: 'Librarian User',
          role: 'librarian',
          employmentStatus: 'employed',
          createdAt: mockUsers[0].createdAt,
          updatedAt: mockUsers[0].updatedAt,
        },
      ];

      (UserModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUsers),
        }),
      });

      const result = await userService.getUsers({ employmentStatus: 'employed' });

      expect(UserModel.find).toHaveBeenCalledWith({ employmentStatus: 'employed' });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'librarian',
        save: jest.fn().mockResolvedValue(true),
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.updateUserRole('user123', 'librarian');

      expect(UserModel.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.role).toBe('librarian');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.role).toBe('librarian');
    });

    it('should throw NotFoundError if user not found', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(userService.updateUserRole('nonexistent', 'admin')).rejects.toThrow(
        NotFoundError
      );
      await expect(userService.updateUserRole('nonexistent', 'admin')).rejects.toThrow(
        'User not found'
      );
    });

    it('should set employmentStatus to employed for librarian role', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'normal_user',
        employmentStatus: undefined,
        save: jest.fn().mockResolvedValue(true),
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await userService.updateUserRole('user123', 'librarian');

      expect(mockUser.employmentStatus).toBe('employed');
    });

    it('should set employmentStatus to employed for admin role', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'normal_user',
        employmentStatus: undefined,
        save: jest.fn().mockResolvedValue(true),
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await userService.updateUserRole('user123', 'admin');

      expect(mockUser.employmentStatus).toBe('employed');
    });
  });

  describe('updateEmploymentStatus', () => {
    it('should update employment status for librarian', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'librarian1',
        email: 'librarian@example.com',
        role: 'librarian',
        employmentStatus: 'employed',
        save: jest.fn().mockResolvedValue(true),
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.updateEmploymentStatus('user123', 'vacation');

      expect(mockUser.employmentStatus).toBe('vacation');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.employmentStatus).toBe('vacation');
    });

    it('should update employment status for admin', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'admin1',
        email: 'admin@example.com',
        role: 'admin',
        employmentStatus: 'employed',
        save: jest.fn().mockResolvedValue(true),
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.updateEmploymentStatus('user123', 'unemployed');

      expect(mockUser.employmentStatus).toBe('unemployed');
      expect(result.employmentStatus).toBe('unemployed');
    });

    it('should throw NotFoundError if user not found', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.updateEmploymentStatus('nonexistent', 'employed')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for normal_user role', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'user1',
        email: 'user@example.com',
        role: 'normal_user',
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        userService.updateEmploymentStatus('user123', 'employed')
      ).rejects.toThrow(ValidationError);
      await expect(
        userService.updateEmploymentStatus('user123', 'employed')
      ).rejects.toThrow('Employment status only applies to librarian and admin roles');
    });
  });
});

