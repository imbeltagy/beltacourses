import { EmailService, fillVariables } from '../../src/email/email.service';

describe('fillVariables', () => {
  it('replaces placeholders, with or without inner spaces', () => {
    expect(
      fillVariables('Hi {{name}} {{ n }}', { name: 'A', n: 2 }, false),
    ).toBe('Hi A 2');
  });

  it('escapes values for HTML only when asked', () => {
    const vars = { name: '<b>"x" & \'y\'</b>' };
    expect(fillVariables('{{name}}', vars, true)).toBe(
      '&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;',
    );
    expect(fillVariables('{{name}}', vars, false)).toBe(vars.name);
  });

  it('throws on a variable that was not provided', () => {
    expect(() => fillVariables('{{missing}}', {}, true)).toThrow(/missing/);
  });
});

describe('EmailService', () => {
  let templates: { load: jest.Mock };
  let smtp: { send: jest.Mock };
  let service: EmailService;

  beforeEach(() => {
    templates = {
      load: jest.fn().mockResolvedValue({
        subject: 'Welcome {{name}}',
        html: '<a href="{{loginUrl}}">{{name}}</a>',
      }),
    };
    smtp = { send: jest.fn().mockResolvedValue(undefined) };
    service = new EmailService(templates as never, smtp as never);
  });

  it('loads the template for the locale and sends it filled in', async () => {
    await service.send('account-created', {
      to: 'a@b.com',
      locale: 'ar',
      variables: {
        name: 'Jane <script>',
        email: 'a@b.com',
        loginUrl: 'https://x.test/ar/login?a=1&b=2',
      },
    });

    expect(templates.load).toHaveBeenCalledWith('account-created', 'ar');
    expect(smtp.send).toHaveBeenCalledWith({
      to: 'a@b.com',
      subject: 'Welcome Jane <script>',
      html: '<a href="https://x.test/ar/login?a=1&amp;b=2">Jane &lt;script&gt;</a>',
    });
  });

  it('does not send when the template cannot be loaded', async () => {
    templates.load.mockRejectedValue(new Error('no file'));
    await expect(
      service.send('account-created', {
        to: 'a@b.com',
        locale: 'en',
        variables: { name: 'J', email: 'a@b.com', loginUrl: 'u' },
      }),
    ).rejects.toThrow('no file');
    expect(smtp.send).not.toHaveBeenCalled();
  });

  it('propagates a mail server failure', async () => {
    smtp.send.mockRejectedValue(new Error('refused'));
    await expect(
      service.send('account-created', {
        to: 'a@b.com',
        locale: 'en',
        variables: { name: 'J', email: 'a@b.com', loginUrl: 'u' },
      }),
    ).rejects.toThrow('refused');
  });
});
