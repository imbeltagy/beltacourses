import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  S3_ACCESS_KEY_ID,
  S3_BUCKET,
  S3_REGION,
  S3_SECRET_ACCESS_KEY,
} from './s3.constants';

@Injectable()
export class S3Adapter {
  private readonly region: string;
  private readonly bucket: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly client: S3Client;

  constructor() {
    const missing = [
      ['S3_REGION', S3_REGION],
      ['S3_BUCKET', S3_BUCKET],
      ['S3_ACCESS_KEY_ID', S3_ACCESS_KEY_ID],
      ['S3_SECRET_ACCESS_KEY', S3_SECRET_ACCESS_KEY],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        `S3Adapter: missing required environment variables: ${missing.join(', ')}`,
      );
    }

    this.region = S3_REGION!;
    this.bucket = S3_BUCKET!;
    this.accessKeyId = S3_ACCESS_KEY_ID!;
    this.secretAccessKey = S3_SECRET_ACCESS_KEY!;

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  }

  /** Bucket this adapter writes to — the service stores it on the metadata row. */
  getBucket(): string {
    return this.bucket;
  }

  /** Region-scoped public URL for an object key. */
  getUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  /** Idempotent: S3 does not error when the key is already gone. */
  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
