import UsersService from '../../../src/services/users.service.js';
import UsersRepository from '../../../src/repositories/users.repository.js';

jest.mock('../../../src/repositories/users.repository.js');

describe('UsersService', () => {
  let usersService;
  let usersRepositoryMock;

  beforeEach(() => {
    usersRepositoryMock = new UsersRepository();
    usersService = new UsersService(usersRepositoryMock);
  });

  it('editMyUsername should call updateUsername on the repository', async () => {
    const userId = 1; 
    const username = 'newUsername'; 

    usersRepositoryMock.updateUsername = jest.fn();

    await usersService.editMyUsername(userId, username);

    expect(usersRepositoryMock.updateUsername).toHaveBeenCalledWith(userId, username);
  });
});
