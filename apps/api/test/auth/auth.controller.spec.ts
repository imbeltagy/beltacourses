import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@repo/db';
import { AccessTokenGuard } from '@repo/service/core';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    loginModerator: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      loginModerator: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

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

  it('login returns the tokens from the service', async () => {
    const dto = { email: 'a@example.com', password: 'password' };
    const tokens = {
      access_token: 'access',
      refresh_token: 'refresh',
      token_type: 'Bearer' as const,
      expires_in: 1800,
    };
    authService.login.mockResolvedValue(tokens);

    await expect(controller.login(dto)).resolves.toEqual(tokens);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('moderators/login delegates to loginModerator', async () => {
    const dto = { email: 'admin@example.com', password: 'password' };
    const tokens = {
      access_token: 'access',
      refresh_token: 'refresh',
      token_type: 'Bearer' as const,
      expires_in: 300,
    };
    authService.loginModerator.mockResolvedValue(tokens);

    await expect(controller.loginModerator(dto)).resolves.toEqual(tokens);
    expect(authService.loginModerator).toHaveBeenCalledWith(dto);
  });

  it('refresh delegates to the service with the raw refresh token', async () => {
    const response = {
      access_token: 'new-access',
      token_type: 'Bearer' as const,
      expires_in: 1800,
    };
    authService.refresh.mockResolvedValue(response);

    await expect(
      controller.refresh({ refresh_token: 'a-refresh-token' }),
    ).resolves.toEqual(response);
    expect(authService.refresh).toHaveBeenCalledWith('a-refresh-token');
  });

  it('logout delegates to the service and responds 204', async () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { logout } = controller;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const decoratedStatus: number = Reflect.getMetadata('__httpCode__', logout);
    expect(decoratedStatus).toBe(204);

    authService.logout.mockResolvedValue(undefined);
    const user = {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: Role.admin,
      sid: 'sid-1',
    };

    await expect(controller.logout(user)).resolves.toBeUndefined();
    expect(authService.logout).toHaveBeenCalledWith(user);
  });
});
