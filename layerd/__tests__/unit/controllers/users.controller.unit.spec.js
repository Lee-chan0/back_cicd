import { jest } from '@jest/globals';
import { UsersController } from '../../../src/controllers/users.controller.js';

const usersController = new UsersController();

const req = { user: { userId: 1 } }; 
const res = {
  status: jest.fn(() => res),
  json: jest.fn(),
};
const next = jest.fn();

describe('User Controller', () => {
  it('should find user info', async () => {
    await usersController.findMyInfo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: expect.any(Object) }); 
  });

  it('should handle errors', async () => {
    const fakeError = new Error('Test error');
    usersController.usersService.findMyInfo = jest.fn(() => {
        throw fakeError;
    });

    await usersController.findMyInfo(req, res, next);

    expect(next).toHaveBeenCalledWith(fakeError);
  });
});
