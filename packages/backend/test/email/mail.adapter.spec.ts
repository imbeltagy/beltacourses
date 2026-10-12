const sendMail = jest.fn().mockResolvedValue(undefined);
const createTransport = jest.fn(() => ({ sendMail }));
jest.mock('nodemailer', () => ({ createTransport }));

process.env.NODEMAILER_USER = 'user@gmail.com';
process.env.NODEMAILER_PASS = 'app-password';
process.env.NODEMAILER_SENDER_EMAIL = 'no-reply@beltacourses.com';

import { MailAdapter } from '../../src/email/mail.adapter';

describe('MailAdapter', () => {
  it('connects to Gmail with the configured account', () => {
    new MailAdapter();

    expect(createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: { user: 'user@gmail.com', pass: 'app-password' },
    });
  });

  it('sends the html from the sender with auto-reply suppression headers', async () => {
    await new MailAdapter().send({
      to: 'a@b.com',
      subject: 'Hi',
      html: '<p>hi</p>',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'no-reply@beltacourses.com',
      to: 'a@b.com',
      subject: 'Hi',
      html: '<p>hi</p>',
      headers: expect.objectContaining({
        'Message-ID': expect.stringMatching(/^<\d+-\w+@beltacourses\.com>$/),
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
      }),
    });
  });
});
