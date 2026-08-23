import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@repo/db';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { register: jest.Mock; login: jest.Mock };

  beforeEach(async () => {
    authService = { register: jest.fn(), login: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
  });

  it('register delegates to the service', async () => {
    const dto = {
      email: 'a@example.com',
      password: 'password',
      name: 'A',
      role: Role.student,
    };
    authService.register.mockResolvedValue({ id: 'user-1' });

    await expect(controller.register(dto)).resolves.toEqual({ id: 'user-1' });
    expect(authService.register).toHaveBeenCalledWith(dto, undefined);
  });

  it('register forwards the uploaded avatar file to the service', async () => {
    const dto = {
      email: 'a@example.com',
      password: 'password',
      name: 'A',
      role: Role.student,
    };
    const avatar = { originalname: 'avatar.png' } as Express.Multer.File;
    authService.register.mockResolvedValue({ id: 'user-1' });

    await controller.register(dto, avatar);

    expect(authService.register).toHaveBeenCalledWith(dto, avatar);
  });

  it('login delegates to the service and responds 200, not 201', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { login } = controller;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const decoratedStatus: number = Reflect.getMetadata('__httpCode__', login);

    expect(decoratedStatus).toBe(200);
  });

  it('login returns the access token from the service', async () => {
    const dto = { email: 'a@example.com', password: 'password' };
    authService.login.mockResolvedValue({ access_token: 'signed-token' });

    await expect(controller.login(dto)).resolves.toEqual({
      access_token: 'signed-token',
    });
    expect(authService.login).toHaveBeenCalledWith(dto);
  });
});
