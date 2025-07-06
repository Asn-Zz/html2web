import COS from 'cos-js-sdk-v5'

interface COSConfig {
  secretId: string
  secretKey: string
  bucket: string
  region: string
}

interface COSFile {
  key: string
  name: string
  size: number
  lastModified: string
  url: string
}

interface COSFolder {
  prefix: string
  name: string
}

interface ListFilesResult {
  files: COSFile[]
  folders: COSFolder[]
}

export class COSService {
  private config: COSConfig
  private cos: any

  constructor(config: COSConfig) {
    this.config = config
    this.initializeCOS()
  }

  private initializeCOS() {
    // 初始化真实的COS SDK实例
    this.cos = new COS({
      SecretId: this.config.secretId,
      SecretKey: this.config.secretKey,
    })
  }

  async testConnection(): Promise<void> {
    if (!this.config.bucket || !this.config.region) {
      throw new Error("配置信息不完整: 缺少存储桶或地域信息");
    }
    try {
      // 尝试获取存储桶信息来测试连接
      await this.cos.getBucket({
        Bucket: this.config.bucket,
        Region: this.config.region,
        MaxKeys: 1,
      })
    } catch (error: any) {
      throw new Error(`连接测试失败: ${error.error?.Message || error.message}`)
    }
  }

  async listFiles(prefix: string = ""): Promise<ListFilesResult> {
    try {
      prefix = prefix ? prefix + '/' : prefix

      const data = await this.cos.getBucket({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Prefix: prefix,
        Delimiter: '/',
      });

      const folders: COSFolder[] = (data.CommonPrefixes || []).map((item: any) => ({
        prefix: item.Prefix,
        name: item.Prefix.replace(prefix, '').replace('/', ''),
      }));

      const files: COSFile[] = (data.Contents || [])
        .filter((item: any) => item.Key !== prefix) // 过滤掉文件夹自身
        .map((item: any) => ({
          key: item.Key,
          name: item.Key.substring(prefix.length),
          size: Number(item.Size),
          lastModified: item.LastModified,
          url: `https://${this.config.bucket}.cos.${this.config.region}.myqcloud.com/${item.Key}`,
        }));      

      return { files, folders };
    } catch (error: any) {
      throw new Error(`获取文件列表失败: ${error.error?.Message || error.message}`);
    }
  }

  async uploadFile(key: string, file: File | Blob): Promise<void> {
    try {
      await this.cos.putObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: key,
        Body: file,
      })
    } catch (error: any) {
      throw new Error(`文件上传失败: ${error.error?.Message || error.message}`)
    }
  }

  async getFileContent(key: string): Promise<string> {
    try {
      const data = await this.cos.getObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: key,
      })
      return data.Body
    } catch (error: any) {
      throw new Error(`获取文件内容失败: ${error.error?.Message || error.message}`)
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.cos.deleteObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: key,
      })
    } catch (error: any) {
      throw new Error(`删除文件失败: ${error.error?.Message || error.message}`)
    }
  }

  async deleteFolder(prefix: string): Promise<void> {
    try {
      // 首先获取文件夹下的所有对象
      const listResult = await this.cos.getBucket({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Prefix: prefix,
      })

      if (listResult.Contents && listResult.Contents.length > 0) {
        const keysToDelete = listResult.Contents.map((item: any) => ({ Key: item.Key }))
        await this.cos.deleteMultipleObject({
          Bucket: this.config.bucket,
          Region: this.config.region,
          Objects: keysToDelete,
        })
      }
    } catch (error: any) {
      throw new Error(`删除文件夹失败: ${error.error?.Message || error.message}`)
    }
  }

  async createFolder(key: string): Promise<void> {
    try {
      // 创建一个以'/'结尾的空对象作为文件夹占位符
      await this.cos.putObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: key,
        Body: "",
      })
    } catch (error: any) {
      throw new Error(`创建文件夹失败: ${error.error?.Message || error.message}`)
    }
  }

  async downloadFile(key: string, fileName: string): Promise<void> {
    try {
      const data = await this.cos.getObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: key,
        DataType: "blob",
      })

      // 创建下载链接并触发下载
      const url = URL.createObjectURL(data.Body)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      throw new Error(`下载文件失败: ${error.error?.Message || error.message}`)
    }
  }
}