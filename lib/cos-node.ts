import COS from 'cos-nodejs-sdk-v5';
import { Readable } from 'stream';

// Interfaces remain the same for data structure consistency
interface COSConfig {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
}

interface COSFile {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  url: string;
}

interface COSFolder {
  prefix: string;
  name:string;
}

interface ListFilesResult {
  files: COSFile[];
  folders: COSFolder[];
}

// New interface for file download payload
interface FilePayload {
  body: Buffer;
  contentType: string;
}

export class COSService {
  private config: COSConfig;
  private cos: COS;

  constructor(config: COSConfig) {
    this.config = config;
    this.initializeCOS();
  }

  private initializeCOS() {
    // Use the Node.js SDK constructor
    this.cos = new COS({
      SecretId: this.config.secretId,
      SecretKey: this.config.secretKey,
    });
  }

  // No changes needed for testConnection
  async testConnection(): Promise<void> {
    if (!this.config.bucket || !this.config.region) {
      throw new Error("配置信息不完整: 缺少存储桶或地域信息");
    }
    try {
      await this.cos.getBucket({
        Bucket: this.config.bucket,
        Region: this.config.region,
        MaxKeys: 1,
      });
    } catch (error: any) {
      throw new Error(`连接测试失败: ${error.message || error}`);
    }
  }

  // No changes needed for listFiles
  async listFiles(prefix: string = ""): Promise<ListFilesResult> {
    try {
      const listPrefix = prefix ? (prefix.endsWith('/') ? prefix : prefix + '/') : '';

      const data = await this.cos.getBucket({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Prefix: listPrefix,
        Delimiter: '/',
      });

      const folders: COSFolder[] = (data.CommonPrefixes || []).map((item: any) => ({
        prefix: item.Prefix,
        name: item.Prefix.replace(listPrefix, '').replace('/', ''),
      }));

      const files: COSFile[] = (data.Contents || [])
        .filter((item: any) => item.Key !== listPrefix)
        .map((item: any) => ({
          key: item.Key,
          name: item.Key.substring(listPrefix.length),
          size: Number(item.Size),
          lastModified: item.LastModified,
          url: `https://${this.config.bucket}.cos.${this.config.region}.myqcloud.com/${item.Key}`,
        }));

      return { files, folders };
    } catch (error: any) {
      throw new Error(`获取文件列表失败: ${error.message || error}`);
    }
  }

  /**
   * Uploads a file to COS.
   * @param key The full path (key) for the object in the bucket.
   * @param body The file content as a Buffer or ReadableStream.
   */
  async uploadFile(key: string, body: Buffer | Readable): Promise<void> {
    try {
      await this.cos.putObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: key,
        Body: body,
      });
    } catch (error: any) {
      throw new Error(`文件上传失败: ${error.message || error}`);
    }
  }

  /**
   * Gets a file's content and metadata from COS.
   * @param key The key of the file to retrieve.
   * @returns A promise that resolves to the file's body and content type.
   */
  async getFilePayload(key: string): Promise<FilePayload> {
    try {
      const data = await this.cos.getObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: key,
      });
      return {
        body: data.Body as Buffer,
        contentType: data.headers['content-type'] || 'application/octet-stream',
      };
    } catch (error: any) {
      throw new Error(`获取文件内容失败: ${error.message || error}`);
    }
  }

  // No changes needed for deleteFile, deleteFolder, createFolder
  async deleteFile(key: string): Promise<void> {
    try {
      await this.cos.deleteObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: key,
      });
    } catch (error: any) {
      throw new Error(`删除文件失败: ${error.message || error}`);
    }
  }

  async deleteFolder(prefix: string): Promise<void> {
    try {
      const listResult = await this.cos.getBucket({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Prefix: prefix,
      });

      if (listResult.Contents && listResult.Contents.length > 0) {
        await this.cos.deleteMultipleObject({
          Bucket: this.config.bucket,
          Region: this.config.region,
          Objects: listResult.Contents.map((item: any) => ({ Key: item.Key })),
        });
      }
    } catch (error: any) {
      throw new Error(`删除文件夹失败: ${error.message || error}`);
    }
  }

  async createFolder(key: string): Promise<void> {
    try {
      const folderKey = key.endsWith('/') ? key : key + '/';
      await this.cos.putObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: folderKey,
        Body: '',
      });
    } catch (error: any) {
      throw new Error(`创建文件夹失败: ${error.message || error}`);
    }
  }
}
