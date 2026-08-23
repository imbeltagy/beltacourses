/* eslint-disable @typescript-eslint/no-require-imports --
 * loadAdapter() re-requires the adapter after jest.resetModules() so the module
 * re-reads process.env. A static import is hoisted and would defeat that. */
import type { S3Adapter as S3AdapterClass } from '../../src/storage/s3.adapter';

// Must be prefixed `mock` — jest.mock factories may not close over anything else.
const mockSend = jest.fn();
const mockS3Client = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation((config: unknown) => {
    mockS3Client(config);
    return { send: mockSend };
  }),
  PutObjectCommand: jest
    .fn()
    .mockImplementation((input: unknown) => ({ type: 'PutObject', input })),
  DeleteObjectCommand: jest
    .fn()
    .mockImplementation((input: unknown) => ({ type: 'DeleteObject', input })),
}));

const FULL_ENV = {
  S3_REGION: 'eu-central-1',
  S3_BUCKET: 'my-bucket',
  S3_ACCESS_KEY_ID: 'key-id',
  S3_SECRET_ACCESS_KEY: 'secret-key',
};

/**
 * The constants are read at import time, so each case needs a fresh module
 * registry with the env it wants to exercise.
 */
function loadAdapter(env: Partial<typeof FULL_ENV>): typeof S3AdapterClass {
  for (const name of Object.keys(FULL_ENV)) delete process.env[name];
  Object.assign(process.env, env);

  jest.resetModules();

  const mod =
    require('../../src/storage/s3.adapter') as typeof import('../../src/storage/s3.adapter');
  return mod.S3Adapter;
}

describe('S3Adapter', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('environment validation', () => {
    it('throws naming every missing variable when none are set', () => {
      const S3Adapter = loadAdapter({});

      expect(() => new S3Adapter()).toThrow(
        'S3Adapter: missing required environment variables: S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY',
      );
    });

    it('names only the missing variables, not the ones that are set', () => {
      const S3Adapter = loadAdapter({
        S3_REGION: FULL_ENV.S3_REGION,
        S3_BUCKET: FULL_ENV.S3_BUCKET,
      });

      expect(() => new S3Adapter()).toThrow(
        'S3Adapter: missing required environment variables: S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY',
      );
    });

    it('treats an empty string as missing', () => {
      const S3Adapter = loadAdapter({ ...FULL_ENV, S3_BUCKET: '' });

      expect(() => new S3Adapter()).toThrow(
        'S3Adapter: missing required environment variables: S3_BUCKET',
      );
    });

    it('constructs when all four are set', () => {
      const S3Adapter = loadAdapter(FULL_ENV);

      expect(() => new S3Adapter()).not.toThrow();
    });

    it('passes the region and credentials to the S3 client', () => {
      const S3Adapter = loadAdapter(FULL_ENV);
      new S3Adapter();

      expect(mockS3Client).toHaveBeenCalledWith({
        region: 'eu-central-1',
        credentials: {
          accessKeyId: 'key-id',
          secretAccessKey: 'secret-key',
        },
      });
    });
  });

  describe('once constructed', () => {
    let adapter: S3AdapterClass;

    beforeEach(() => {
      const S3Adapter = loadAdapter(FULL_ENV);
      adapter = new S3Adapter();
      mockSend.mockReset();
      mockSend.mockResolvedValue(undefined);
    });

    it('getBucket returns the configured bucket', () => {
      expect(adapter.getBucket()).toBe('my-bucket');
    });

    it('getUrl includes the region segment', () => {
      expect(adapter.getUrl('2026/08/abc.png')).toBe(
        'https://my-bucket.s3.eu-central-1.amazonaws.com/2026/08/abc.png',
      );
    });

    it('upload sends a PutObjectCommand with bucket, key, body and content type', async () => {
      const body = Buffer.from('file-contents');

      await adapter.upload('2026/08/abc.png', body, 'image/png');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith({
        type: 'PutObject',
        input: {
          Bucket: 'my-bucket',
          Key: '2026/08/abc.png',
          Body: body,
          ContentType: 'image/png',
        },
      });
    });

    it('delete sends a DeleteObjectCommand', async () => {
      await adapter.delete('2026/08/abc.png');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith({
        type: 'DeleteObject',
        input: { Bucket: 'my-bucket', Key: '2026/08/abc.png' },
      });
    });

    it('propagates an S3 failure to the caller', async () => {
      mockSend.mockRejectedValue(new Error('AccessDenied'));

      await expect(adapter.delete('2026/08/abc.png')).rejects.toThrow(
        'AccessDenied',
      );
    });
  });
});
