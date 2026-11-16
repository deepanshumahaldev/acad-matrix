export interface StorageService {
  upload(key: string, content: Buffer | string, mimeType: string): Promise<string>;
  getDownloadUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
