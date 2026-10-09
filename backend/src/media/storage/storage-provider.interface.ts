export interface UploadResult {
  url: string;
  key: string;
}

export interface StorageProvider {
  upload(buffer: Buffer, key: string, contentType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';