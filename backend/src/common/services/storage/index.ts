import { LocalStorageService } from './local.storage';
import type { StorageService } from './storage.service';

export * from './storage.service';
export * from './local.storage';

let storageInstance: StorageService | null = null;

export function createStorageService(): StorageService {
  if (!storageInstance) {
    storageInstance = new LocalStorageService();
  }
  return storageInstance;
}
