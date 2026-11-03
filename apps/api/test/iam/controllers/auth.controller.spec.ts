import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@repo/db';
import { AuthController } from '../../../src/iam/controllers/auth.controller';
import { IamFacade } from '../../../src/iam/iam.facade';
import { UserResponseDto } from '../../../src/iam/dto/response/user.dto';
import { userRow } from '../../helpers/rows';

describe('AuthController', () => {
  let controller: AuthController;
  let iam: {
    register: jest.Mock;
    login: jest.Mock;
    loginModerator: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    iam = {
      register: jest.fn(),
      login: jest.fn(),
      loginModerator: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: IamFacade, useValue: iam }],
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
    iam.register.mockResolvedValue(userRow());

    const result = await controller.register(dto);

    expect(result).toBeInstanceOf(UserResponseDto);
    expect(result).not.toHaveProperty('hashed_password');
    expect(iam.register).toHaveBeenCalledWith(dto, undefined);
  });

  it('register forwards the uploaded avatar file to the service', async () => {
    const dto = {
      email: 'a@example.com',
      password: 'password',
      name: 'A',
      role: Role.student,
    };
    const avatar = { originalname: 'avatar.png' } as Express.Multer.File;
    iam.register.mockResolvedValue(userRow());

    await controller.register(dto, avatar);

    expect(iam.register).toHaveBeenCalledWith(dto, avatar);
  });

  it('login delegates to the service and responds 200, not 201', () => {
    const { login } = controller;

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
      refresh_expires_in: 604800,
    };
    iam.login.mockResolvedValue(tokens);

    await expect(controller.login(dto)).resolves.toEqual(tokens);
    expect(iam.login).toHaveBeenCalledWith(dto);
  });

  it('moderators/login delegates to loginModerator', async () => {
    const dto = { email: 'admin@example.com', password: 'password' };
    const tokens = {
      access_token: 'access',
      refresh_token: 'refresh',
      token_type: 'Bearer' as const,
      expires_in: 300,
      refresh_expires_in: 36000,
    };
    iam.loginModerator.mockResolvedValue(tokens);

    await expect(controller.loginModerator(dto)).resolves.toEqual(tokens);
    expect(iam.loginModerator).toHaveBeenCalledWith(dto);
  });

  it('refresh delegates to the service with the raw refresh token', async () => {
    const response = {
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      token_type: 'Bearer' as const,
      expires_in: 1800,
      refresh_expires_in: 604800,
    };
    iam.refresh.mockResolvedValue(response);

    await expect(
      controller.refresh({ refresh_token: 'a-refresh-token' }),
    ).resolves.toEqual(response);
    expect(iam.refresh).toHaveBeenCalledWith('a-refresh-token');
  });

  it('logout delegates to the service and responds 204', async () => {
    const { logout } = controller;

    const decoratedStatus: number = Reflect.getMetadata('__httpCode__', logout);
    expect(decoratedStatus).toBe(204);

    iam.logout.mockResolvedValue(undefined);
    const user = {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: Role.admin,
      sid: 'sid-1',
      groupId: null,
      permissions: [],
    };

    await expect(controller.logout(user)).resolves.toBeUndefined();
    expect(iam.logout).toHaveBeenCalledWith(user);
  });
});
