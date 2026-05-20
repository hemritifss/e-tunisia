import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  url: string;
  key: string;
  bucket: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  /** Public-facing base for browsers — defaults to same-origin `/uploads`. */
  private readonly publicBase: string;

  constructor(private configService: ConfigService) {
    this.endpoint = this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    this.bucket = this.configService.get<string>('S3_BUCKET') || 'etunisia';
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    const accessKey = this.configService.get<string>('S3_ACCESS_KEY') || 'minioadmin';
    const secretKey = this.configService.get<string>('S3_SECRET_KEY') || 'minioadmin';
    const forcePathStyle = this.configService.get<string>('S3_FORCE_PATH_STYLE') === 'true';
    // If the env sets a public URL (e.g. https://cdn.example.com or http://localhost:9000/etunisia),
    // use it. Otherwise return same-origin `/uploads/<key>` URLs and let Nest proxy to MinIO.
    this.publicBase = (this.configService.get<string>('S3_PUBLIC_URL') || '/uploads').replace(/\/+$/, '');

    this.s3Client = new S3Client({
      region,
      endpoint: this.endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  }

  /** Ensure the bucket exists and is publicly readable on boot (best-effort). */
  async onModuleInit() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created bucket "${this.bucket}"`);
      } catch (e: any) {
        this.logger.warn(`Could not create bucket "${this.bucket}": ${e?.message}`);
      }
    }
    // Make everything readable so URLs returned to the browser work without signing.
    try {
      const policy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        }],
      };
      await this.s3Client.send(new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify(policy),
      }));
      this.logger.log(`Bucket "${this.bucket}" is publicly readable`);
    } catch (e: any) {
      this.logger.warn(`Could not set bucket policy: ${e?.message}`);
    }
  }

  /** Build the browser-facing URL for a given object key. */
  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }

  /** Internal S3 endpoint URL (used by the in-app proxy to fetch the bytes). */
  internalUrl(key: string): string {
    return `${this.endpoint.replace(/\/+$/, '')}/${this.bucket}/${key}`;
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    folder: string = 'uploads',
    mimeType?: string,
  ): Promise<UploadedFile> {
    const extension = extname(originalName).toLowerCase();
    const key = `${folder}/${uuidv4()}${extension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType || this.getMimeType(extension),
        }),
      );

      // Browser-facing URL — same-origin by default.
      const url = this.publicUrl(key);
      this.logger.log(`File uploaded: ${key}`);

      return { url, key, bucket: this.bucket };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Accept a base64 data URL (e.g. from a FileReader in the browser), decode it,
   * upload to MinIO, and return the same `{url, key, bucket}` shape.
   * Caps incoming size so a malicious client can't stuff giant payloads.
   */
  async uploadDataUrl(dataUrl: string, folder = 'uploads'): Promise<UploadedFile> {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      throw new Error('Not a data URL');
    }
    const match = dataUrl.match(/^data:([^;,]+)(?:;([^,]+))?,(.+)$/);
    if (!match) throw new Error('Malformed data URL');
    const mime = match[1] || 'application/octet-stream';
    const isBase64 = (match[2] || '').includes('base64');
    const rawData = match[3];
    const buffer = isBase64
      ? Buffer.from(rawData, 'base64')
      : Buffer.from(decodeURIComponent(rawData), 'utf8');
    if (buffer.length > 12 * 1024 * 1024) {
      throw new Error('File too large (max 12MB)');
    }
    // Pick an extension from the mime type
    const ext = ({
      'image/jpeg': '.jpg',
      'image/png':  '.png',
      'image/gif':  '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'video/mp4':  '.mp4',
      'video/webm': '.webm',
    } as Record<string, string>)[mime] || '.bin';
    return this.uploadFile(buffer, `file${ext}`, folder, mime);
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${error.message}`);
      throw error;
    }
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }
}
