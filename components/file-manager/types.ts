export interface FileItem {
  key: string
  name: string
  type: "file" | "folder"
  size: number
  created: Date
  path: string
  content?: string
  url?: string
  lastModified?: Date
  children?: FileItem[]
}

export interface COSSettings {
  token?: string
  secretId: string
  secretKey: string
  bucket: string
  region: string
}
