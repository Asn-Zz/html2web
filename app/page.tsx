"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Upload,
  Settings,
  Plus,
  Grid3X3,
  List,
  Download,
  Share2,
  Trash2,
  Eye,
  Folder,
  File,
  FileText,
  ImageIcon,
  Code,
  ChevronRight,
  Home,
  Loader2,
  Copy,
  RefreshCw,
  Save,
  FolderPlus,
  CloudUpload,
  TestTube,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { COSService } from "@/lib/cos-service"
import * as QRCodeLib from "qrcode"
import type { QRCodeRenderersOptions } from "qrcode"

interface FileItem {
  key: string
  name: string
  type: "file" | "folder"
  size: number
  created: Date
  path: string
  content?: string
  url?: string
  lastModified?: Date
}

interface COSSettings {
  secretId: string
  secretKey: string
  bucket: string
  region: string
}

export default function FileManagementSystem() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("date")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [uploadMode, setUploadMode] = useState<"file" | "code" | "folder">("file")
  const [newFileName, setNewFileName] = useState("")
  const [newFileContent, setNewFileContent] = useState("")
  const [newFolderName, setNewFolderName] = useState("")
  const [shareUrl, setShareUrl] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [editedContent, setEditedContent] = useState("")
  const [cosService, setCosService] = useState<COSService | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Modal states
  const [showUpload, setShowUpload] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showFileDetail, setShowFileDetail] = useState(false)
  const [showShare, setShowShare] = useState(false)

  // Settings
  const [settings, setSettings] = useState<COSSettings>({
    secretId: "",
    secretKey: "",
    bucket: "",
    region: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load settings from localStorage and initialize COS
  useEffect(() => {
    const savedSettings = localStorage.getItem("cosSettings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)

        // Initialize COS service if settings are complete
        if (parsed.secretId && parsed.secretKey && parsed.bucket && parsed.region) {
          initializeCOS(parsed)
        }
      } catch (error) {
        console.error("Failed to parse saved settings:", error)
        toast({
          title: "设置加载失败",
          description: "请重新配置COS设置",
          variant: "destructive",
        })
      }
    }
  }, [])

  // Initialize COS service
  const initializeCOS = async (cosSettings: COSSettings) => {
    try {
      const service = new COSService(cosSettings)
      setCosService(service)
      setIsInitialized(true)
      await loadFiles(service, "")
    } catch (error) {
      console.error("Failed to initialize COS:", error)
      toast({
        title: "COS初始化失败",
        description: "请检查配置信息是否正确",
        variant: "destructive",
      })
      setShowSettings(true)
    }
  }

  // Load files from COS
  const loadFiles = async (service: COSService = cosService!, path: string = currentPath) => {
    if (!service) {
      toast({
        title: "未配置COS",
        description: "请先配置COS设置",
        variant: "destructive",
      })
      setShowSettings(true)
      return
    }

    setIsLoading(true)
    try {      
      const result = await service.listFiles(path)

      const folders = result.folders.map((folder) => ({
        key: folder.prefix,
        name: folder.name,
        type: "folder" as const,
        size: 0,
        created: new Date(),
        path: path,
      }))

      const fileItems = result.files.map((file) => ({
        key: file.key,
        name: file.name,
        type: "file" as const,
        size: file.size,
        created: new Date(file.lastModified),
        lastModified: new Date(file.lastModified),
        path: path,
        url: file.url,
      }))
      
      setFiles([...folders, ...fileItems])
    } catch (error) {
      console.error("Failed to load files:", error)
      toast({
        title: "文件加载失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh current directory
  const refreshFiles = () => {
    if (cosService) {
      loadFiles(cosService, currentPath)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileType = (fileName: string) => {
    if (!fileName) return "other"
    const extension = fileName.split(".").pop()?.toLowerCase()
    if (["html", "htm"].includes(extension || "")) return "html"
    if (["png", "jpg", "jpeg", "gif", "webp", "svg", "ico"].includes(extension || "")) return "image"
    if (["txt", "js", "css", "json", "md", "xml", "log", "ini", "py", "java", "cpp", "c"].includes(extension || ""))
      return "text"
    return "other"
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === "folder") return <Folder className="w-5 h-5 text-yellow-500" />

    const extension = file.name.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "html":
      case "htm":
      case "js":
      case "css":
      case "json":
      case "py":
      case "java":
      case "cpp":
      case "c":
        return <Code className="w-5 h-5 text-blue-500" />
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "svg":
        return <ImageIcon className="w-5 h-5 text-green-500" />
      case "txt":
      case "md":
        return <FileText className="w-5 h-5 text-gray-500" />
      default:
        return <File className="w-5 h-5 text-gray-500" />
    }
  }

  const sortedFiles = [...files].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1
    }
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "date":
        return new Date(b.created).getTime() - new Date(a.created).getTime()
      case "size":
        return b.size - a.size
      default:
        return 0
    }
  })

  const breadcrumbs = [
    { name: "根目录", path: "" },
    ...currentPath
      .split("/")
      .filter((p) => p)
      .map((part, index, arr) => ({
        name: part,
        path: arr.slice(0, index + 1).join("/"),
      })),
  ]

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
    if (!uploadedFiles || !cosService) return

    setIsLoading(true)

    try {
      const uploadPromises = Array.from(uploadedFiles).map(async (file) => {
        const key = currentPath ? `${currentPath}/${file.name}` : file.name
        await cosService.uploadFile(key, file)
      })

      await Promise.all(uploadPromises)

      toast({
        title: "上传成功",
        description: `已上传 ${uploadedFiles.length} 个文件`,
      })

      setShowUpload(false)
      refreshFiles()
    } catch (error) {
      console.error("Upload failed:", error)
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCreateFile = async () => {
    if (!newFileName.trim() || !cosService) {
      toast({
        title: "错误",
        description: "请输入文件名",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const key = currentPath ? `${currentPath}/${newFileName}` : newFileName
      const blob = new Blob([newFileContent], { type: "text/plain" })
      await cosService.uploadFile(key, blob)

      toast({
        title: "创建成功",
        description: `文件 ${newFileName} 已创建`,
      })

      setNewFileName("")
      setNewFileContent("")
      setShowUpload(false)
      refreshFiles()
    } catch (error) {
      console.error("Create file failed:", error)
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !cosService) {
      toast({
        title: "错误",
        description: "请输入文件夹名称",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const key = currentPath ? `${currentPath}/${newFolderName}/` : `${newFolderName}/`
      await cosService.createFolder(key)

      toast({
        title: "创建成功",
        description: `文件夹 ${newFolderName} 已创建`,
      })

      setNewFolderName("")
      setShowUpload(false)
      refreshFiles()
    } catch (error) {
      console.error("Create folder failed:", error)
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleItemClick = async (item: FileItem) => {
    if (item.type === "folder") {
      const newPath = item.key.endsWith("/") ? item.key.slice(0, -1) : item.key
      setCurrentPath(newPath)
      if (cosService) {
        await loadFiles(cosService, newPath)
      }
    } else {
      await openFile(item)
    }
  }

  const openFile = async (file: FileItem) => {
    if (!cosService) return

    setSelectedFile(file)
    setShowFileDetail(true)

    // Load file content for text files
    const fileType = getFileType(file.name)
    if (fileType === "html" || fileType === "text") {
      setIsLoading(true)
      try {
        const content = await cosService.getFileContent(file.key)
        const updatedFile = { ...file, content }
        setSelectedFile(updatedFile)
        setEditedContent(content)
      } catch (error) {
        console.error("Failed to load file content:", error)
        toast({
          title: "文件内容加载失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleDelete = async (item: FileItem) => {
    if (!cosService) return

    const confirmMessage =
      item.type === "folder"
        ? `确定要删除文件夹 "${item.name}" 吗？\n此操作将删除其内部所有文件和子文件夹，且无法恢复！`
        : `确定要删除文件 "${item.name}" 吗？`

    if (!confirm(confirmMessage)) return

    setIsLoading(true)

    try {
      if (item.type === "folder") {
        await cosService.deleteFolder(item.key)
      } else {
        await cosService.deleteFile(item.key)
      }

      toast({
        title: "删除成功",
        description: `${item.name} 已删除`,
      })

      refreshFiles()
    } catch (error) {
      console.error("Delete failed:", error)
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = (item: FileItem) => {
    if (!item.url) {
      toast({
        title: "分享失败",
        description: "文件URL不可用",
        variant: "destructive",
      })
      return
    }
    
    setShareUrl(item.url)
    setShowShare(true)
  }

  const handleDownload = async (item: FileItem) => {
    if (!cosService) return

    setIsLoading(true)

    try {
      await cosService.downloadFile(item.key, item.name)
      toast({
        title: "下载成功",
        description: `文件 ${item.name} 已下载`,
      })
    } catch (error) {
      console.error("Download failed:", error)
      toast({
        title: "下载失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveFile = async () => {
    if (!selectedFile || !cosService) return

    setIsLoading(true)

    try {
      const blob = new Blob([editedContent], { type: "text/plain" })
      await cosService.uploadFile(selectedFile.key, blob)

      const updatedFile = {
        ...selectedFile,
        content: editedContent,
        size: blob.size,
      }
      setSelectedFile(updatedFile)

      toast({
        title: "保存成功",
        description: `文件 ${selectedFile.name} 已保存`,
      })

      // Refresh preview if it's an HTML file
      if (getFileType(selectedFile.name) === "html") {
        refreshPreview()
      }

      refreshFiles()
    } catch (error) {
      console.error("Save failed:", error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshPreview = useCallback(() => {
    if (previewRef.current && selectedFile && getFileType(selectedFile.name) === "html") {
      const blob = new Blob([editedContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      previewRef.current.src = url

      // Clean up the previous URL
      return () => URL.revokeObjectURL(url)
    }
  }, [editedContent, selectedFile])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "复制成功",
      description: "分享链接已复制到剪贴板",
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (!cosService) return

    const droppedFiles = e.dataTransfer.files
    setIsLoading(true)

    try {
      const uploadPromises = Array.from(droppedFiles).map(async (file) => {
        const key = currentPath ? `${currentPath}/${file.name}` : file.name
        await cosService.uploadFile(key, file)
      })

      await Promise.all(uploadPromises)

      toast({
        title: "上传成功",
        description: `已上传 ${droppedFiles.length} 个文件`,
      })

      refreshFiles()
    } catch (error) {
      console.error("Drop upload failed:", error)
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = () => {
    localStorage.setItem("cosSettings", JSON.stringify(settings))
    toast({
      title: "设置已保存",
      description: "COS配置已保存到本地",
    })
    setShowSettings(false)

    // Reinitialize COS with new settings
    if (settings.secretId && settings.secretKey && settings.bucket && settings.region) {
      initializeCOS(settings)
    }
  }

  const testConnection = async () => {
    if (!settings.bucket || !settings.region || !settings.secretId || !settings.secretKey) {
      toast({
        title: "配置不完整",
        description: "请填写完整的COS配置信息",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const testService = new COSService(settings)
      await testService.testConnection()

      toast({
        title: "连接成功",
        description: "COS连接测试通过",
      })
    } catch (error) {
      console.error("Connection test failed:", error)
      toast({
        title: "连接失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToPath = async (path: string) => {    
    setCurrentPath(path)
    if (cosService) {
      await loadFiles(cosService, path)
    }
  }

  // Generate QR code when share modal opens
  useEffect(() => { setTimeout(() => {
    if (showShare && qrCodeRef.current && shareUrl) {
      // Clear previous QR code
      qrCodeRef.current.innerHTML = ""      

      // 使用QRCodeLib生成QR码
      QRCodeLib.toCanvas(shareUrl, { width: 128, height: 128 } as QRCodeRenderersOptions)
        .then((canvas: HTMLCanvasElement) => {
          // 添加生成的canvas到DOM
          if (qrCodeRef.current) {
            qrCodeRef.current.appendChild(canvas)
          }
        })
        .catch((err: Error) => {
          console.error("QR码生成失败:", err)
          
          // 创建错误提示
          const errorDiv = document.createElement("div")
          errorDiv.className = "w-32 h-32 bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500 text-center"
          errorDiv.textContent = "QR码生成失败"
          
          if (qrCodeRef.current) {
            qrCodeRef.current.appendChild(errorDiv)
          }
        })
    }
  })}, [showShare, shareUrl])

  // Refresh preview when content changes
  useEffect(() => {
    if (selectedFile && getFileType(selectedFile.name) === "html") {
      const timeoutId = setTimeout(refreshPreview, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [editedContent, selectedFile, refreshPreview])

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-700">处理中...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <CloudUpload className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">文件分享管理系统</h1>
              {!isInitialized && (
                <Badge variant="destructive" className="ml-3">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  未配置
                </Badge>
              )}
            </div>
            <div className="flex space-x-4">
              <Dialog open={showUpload} onOpenChange={setShowUpload}>
                <DialogTrigger asChild>
                  <Button disabled={!isInitialized}>
                    <Plus className="w-4 h-4 mr-2" />
                    上传/创建
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>上传或创建文件</DialogTitle>
                  </DialogHeader>
                  <Tabs value={uploadMode} onValueChange={(value) => setUploadMode(value as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="file" className="flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>上传文件</span>
                      </TabsTrigger>
                      <TabsTrigger value="code" className="flex items-center space-x-2">
                        <Code className="w-4 h-4" />
                        <span>创建代码</span>
                      </TabsTrigger>
                      <TabsTrigger value="folder" className="flex items-center space-x-2">
                        <FolderPlus className="w-4 h-4" />
                        <span>创建文件夹</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="space-y-4">
                      <div className="text-sm text-gray-500">
                        将上传到: <Badge variant="secondary">{currentPath || "根目录"}</Badge>
                      </div>
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <CloudUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">拖拽文件到此处，或点击选择文件</p>
                        <Button onClick={() => fileInputRef.current?.click()}>选择文件</Button>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                      </div>
                    </TabsContent>

                    <TabsContent value="code" className="space-y-4">
                      <div className="text-sm text-gray-500">
                        将在 <Badge variant="secondary">{currentPath || "根目录"}</Badge> 中创建文件
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="fileName">文件名</Label>
                          <Input
                            id="fileName"
                            placeholder="文件名 (例: index.html)"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fileContent">文件内容</Label>
                          <Textarea
                            id="fileContent"
                            className="h-96 font-mono text-sm"
                            placeholder="输入代码内容..."
                            value={newFileContent}
                            onChange={(e) => setNewFileContent(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleCreateFile} className="w-full">
                          <Save className="w-4 h-4 mr-2" />
                          创建文件
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="folder" className="space-y-4">
                      <div className="text-sm text-gray-500">
                        将在 <Badge variant="secondary">{currentPath || "根目录"}</Badge> 中创建文件夹
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="folderName">文件夹名称</Label>
                          <Input
                            id="folderName"
                            placeholder="文件夹名称"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleCreateFolder} className="w-full">
                          <FolderPlus className="w-4 h-4 mr-2" />
                          创建文件夹
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    设置
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>腾讯云COS设置</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="secretId">SecretId</Label>
                      <Input
                        id="secretId"
                        value={settings.secretId}
                        onChange={(e) => setSettings((prev) => ({ ...prev, secretId: e.target.value }))}
                        placeholder="请输入SecretId"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secretKey">SecretKey</Label>
                      <Input
                        id="secretKey"
                        type="password"
                        value={settings.secretKey}
                        onChange={(e) => setSettings((prev) => ({ ...prev, secretKey: e.target.value }))}
                        placeholder="请输入SecretKey"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bucket">存储桶名称</Label>
                      <Input
                        id="bucket"
                        value={settings.bucket}
                        onChange={(e) => setSettings((prev) => ({ ...prev, bucket: e.target.value }))}
                        placeholder="格式: example-1250000000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="region">地域</Label>
                      <Input
                        id="region"
                        value={settings.region}
                        onChange={(e) => setSettings((prev) => ({ ...prev, region: e.target.value }))}
                        placeholder="格式: ap-guangzhou"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={saveSettings} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        保存设置
                      </Button>
                      <Button onClick={testConnection} variant="outline" className="flex-1 bg-transparent">
                        <TestTube className="w-4 h-4 mr-2" />
                        测试连接
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isInitialized ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">请先配置COS设置</h3>
            <p className="text-gray-500 mb-4">需要配置腾讯云COS信息才能使用文件管理功能</p>
            <Button onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              配置设置
            </Button>
          </div>
        ) : (
          <>
            {/* Breadcrumbs */}
            <div className="mb-4 flex items-center space-x-2 text-sm text-gray-600">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center">
                  <button
                    onClick={() => navigateToPath(crumb.path)}
                    className="hover:text-blue-600 cursor-pointer flex items-center"
                  >
                    {index === 0 ? <Home className="w-4 h-4" /> : crumb.name}
                  </button>
                  {index < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
                </div>
              ))}
            </div>

            {/* File List Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">我的文件 ({sortedFiles.length})</h2>
              <div className="flex space-x-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">按名称排序</SelectItem>
                    <SelectItem value="date">按时间排序</SelectItem>
                    <SelectItem value="size">按大小排序</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border border-gray-300 rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* File Grid/List */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedFiles.map((file) => (
                  <Card
                    key={file.key}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                    onClick={() => handleItemClick(file)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-semibold text-gray-900 truncate" title={file.name}>
                              {file.name}
                            </h3>
                            {file.type === "file" && (
                              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">{file.created.toLocaleDateString()}</div>
                        <div className="flex space-x-1">
                          {file.type === "file" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleItemClick(file)
                                }}
                                title="查看/编辑"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownload(file)
                                }}
                                title="下载"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleShare(file)
                                }}
                                title="分享"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(file)
                            }}
                            title="删除"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {sortedFiles.map((file) => (
                  <Card
                    key={file.key}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleItemClick(file)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 overflow-hidden">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-semibold text-gray-900 truncate" title={file.name}>
                              {file.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {file.type === "file" && `${formatFileSize(file.size)} • `}
                              {file.created.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                          {file.type === "file" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleItemClick(file)
                                }}
                                title="查看/编辑"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownload(file)
                                }}
                                title="下载"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleShare(file)
                                }}
                                title="分享"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(file)
                            }}
                            title="删除"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {sortedFiles.length === 0 && (
              <div className="text-center py-12">
                <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无文件</h3>
                <p className="text-gray-500 mb-4">点击上方按钮开始上传或创建文件</p>
                <Button onClick={() => setShowUpload(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  上传文件
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* File Detail Modal */}
      <Dialog open={showFileDetail} onOpenChange={setShowFileDetail}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="truncate" title={selectedFile?.name}>
              {selectedFile?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="flex flex-col h-[80vh]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500">
                  {selectedFile?.lastModified?.toLocaleString()}({formatFileSize(selectedFile?.size)})
                </span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={handleSaveFile}>
                    <Save className="w-4 h-4 mr-1" />
                    保存
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(selectedFile)}>
                    <Download className="w-4 h-4 mr-1" />
                    下载
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleShare(selectedFile)}>
                    <Share2 className="w-4 h-4 mr-1" />
                    分享
                  </Button>
                </div>
              </div>

              {/* Text/HTML Files */}
              {(getFileType(selectedFile.name) === "html" || getFileType(selectedFile.name) === "text") && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">编辑器</h4>
                    </div>
                    <Textarea
                      className="flex-1 font-mono text-sm resize-none"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">预览</h4>
                      {getFileType(selectedFile.name) === "html" && (
                        <Button size="sm" variant="outline" onClick={refreshPreview}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          刷新
                        </Button>
                      )}
                    </div>
                    {getFileType(selectedFile.name) === "html" ? (
                      <iframe ref={previewRef} className="flex-1 border border-gray-300 rounded-lg" title="预览" />
                    ) : (
                      <div className="flex-1 bg-gray-100 border border-gray-300 rounded-lg p-4">
                        <p className="text-gray-500">纯文本文件无预览。</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Image Files */}
              {getFileType(selectedFile.name) === "image" && (
                <div className="flex-1 flex flex-col">
                  <h4 className="font-medium mb-2">图片预览</h4>
                  <div className="flex-1 flex justify-center items-center bg-gray-100 rounded-lg p-4">
                    <img
                      src={selectedFile.url || "/placeholder.svg"}
                      alt={selectedFile.name}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                    />
                  </div>
                </div>
              )}

              {/* Other Files */}
              {getFileType(selectedFile.name) === "other" && (
                <div className="flex-1 flex flex-col">
                  <h4 className="font-medium mb-2">文件信息</h4>
                  <div className="flex-1 bg-gray-100 rounded-lg p-8 text-center">
                    <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-700 mb-2">此文件类型不支持在线预览。</p>
                    <p className="text-sm text-gray-500">文件名: {selectedFile.name}</p>
                    <p className="text-sm text-gray-500">大小: {formatFileSize(selectedFile.size)}</p>
                    <p className="text-sm text-gray-500">创建时间: {selectedFile.created.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分享文件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="shareUrl">分享链接</Label>
              <div className="flex mt-1">
                <Input id="shareUrl" value={shareUrl} readOnly className="flex-1 rounded-r-none bg-gray-50" />
                <Button onClick={copyToClipboard} className="rounded-l-none">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>二维码</Label>
              <div
                ref={qrCodeRef}
                className="border border-gray-300 rounded-lg p-4 flex justify-center items-center h-40 mt-1"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
