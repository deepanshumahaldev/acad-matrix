import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { StorageService } from './storage.service';

export class LocalStorageService implements StorageService {
  private readonly uploadDir: string;

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || path.resolve(process.cwd(), 'uploads');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(key: string, content: Buffer | string): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
    writeFileSync(filePath, buf);
    return `/uploads/${key}`;
  }

  async getDownloadUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}
