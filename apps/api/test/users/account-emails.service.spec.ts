import { Logger } from '@nestjs/common';
import { Role } from '@repo/db';

process.env.CLIENT_FRONTEND_URL = 'https://app.example.com/';
process.env.ADMIN_FRONTEND_URL = 'https://admin.example.com';

import { AccountEmailsService } from '../../src/users/account-emails.service';

describe('AccountEmailsService', () => {
  let emailService: { send: jest.Mock };
  let service: AccountEmailsService;

  beforeEach(() => {
    emailService = { send: jest.fn().mockResolvedValue(undefined) };
    service = new AccountEmailsService(emailService as never);
  });

  it('links a client to the public app in their locale', async () => {
    await service.sendAccountCreated(
      { name: 'Jane', email: 'j@x.com', role: Role.student },
      'ar',
    );

    expect(emailService.send).toHaveBeenCalledWith('account-created', {
      to: 'j@x.com',
      locale: 'ar',
      variables: {
        name: 'Jane',
        email: 'j@x.com',
        loginUrl: 'https://app.example.com/ar/login',
      },
    });
  });

  it('links an admin to the admin app', async () => {
    await service.sendAccountCreated(
      { name: 'Ann', email: 'a@x.com', role: Role.admin },
      'en',
    );

    expect(emailService.send).toHaveBeenCalledWith(
      'account-created',
      expect.objectContaining({
        variables: expect.objectContaining({
          loginUrl: 'https://admin.example.com/en/login',
        }),
      }),
    );
  });

  it('swallows a send failure so the request still succeeds', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    emailService.send.mockRejectedValue(new Error('mail down'));

    await expect(
      service.sendAccountCreated(
        { name: 'Jane', email: 'j@x.com', role: Role.student },
        'en',
      ),
    ).resolves.toBeUndefined();
  });
});
