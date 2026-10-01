import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream';

const streamPipeline = promisify(pipeline);

export interface IStorageService {
  saveStream(stream: NodeJS.ReadableStream, filename: string): Promise<string>;
  getFilePath(storageKey: string): string;
  deleteFile(storageKey: string): Promise<boolean>;
  getPublicUrl(storageKey: string): string;
}

export class LocalDiskStorageService implements IStorageService {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), '../../uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveStream(stream: NodeJS.ReadableStream, filename: string): Promise<string> {
    const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destination = path.join(this.baseDir, safeName);
    const writeStream = fs.createWriteStream(destination);

    await streamPipeline(stream, writeStream);
    return safeName;
  }

  getFilePath(storageKey: string): string {
    return path.join(this.baseDir, storageKey);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      const fullPath = this.getFilePath(storageKey);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  getPublicUrl(storageKey: string): string {
    return `/api/downloads/${encodeURIComponent(storageKey)}`;
  }
}

export const storage = new LocalDiskStorageService();
