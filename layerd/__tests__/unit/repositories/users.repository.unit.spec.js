import { jest } from '@jest/globals';
import { UsersRepository } from '../../../src/repositories/users.repository.js';

describe('User Repository', () => {
  it('should find user by email', async () => {
    const userRepository = new UsersRepository();

    const email = 'example@email.com'; 

    jest.spyOn(userRepository, 'findUserByEmail').mockReturnValue({
    });

    const user = await userRepository.findUserByEmail(email);

    expect(user).toEqual(expect.objectContaining({
    }));
  });
});