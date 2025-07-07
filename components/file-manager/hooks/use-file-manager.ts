import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { COSService } from "@/lib/cos-service"
import type { COSSettings, FileItem } from "../types"
import { getFileType } from "../utils"

export function useFileManager() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("date")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
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

  const { toast } = useToast()

  const initializeCOS = useCallback(
    async (cosSettings: COSSettings) => {
      try {
        const service = new COSService(cosSettings)
        setCosService(service)
        setIsInitialized(true)
        await loadFiles(service, "")
      } catch (error) {
        console.error("Failed to initialize COS:", error)
        toast({ title: "COS初始化失败", description: "请检查配置信息是否正确", variant: "destructive" })
        setShowSettings(true)
      }
    },
    [toast]
  )

  // Load settings from localStorage and initialize COS
  useEffect(() => {
    const savedSettings = localStorage.getItem("cosSettings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
        if (parsed.secretId && parsed.secretKey && parsed.bucket && parsed.region) {
          initializeCOS(parsed)
        }
      } catch (error) {
        console.error("Failed to parse saved settings:", error)
        toast({ title: "设置加载失败", description: "请重新配置COS设置", variant: "destructive" })
      }
    }
  }, [initializeCOS, toast])

  const loadFiles = async (service: COSService, path: string) => {
    if (!service) {
      toast({ title: "未配置COS", description: "请先配置COS设置", variant: "destructive" })
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
      toast({ title: "文件加载失败", description: error instanceof Error ? error.message : "未知错误", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshFiles = useCallback(() => {
    if (cosService) {
      loadFiles(cosService, currentPath)
    }
  }, [cosService, currentPath])

  const sortedFiles = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1
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

  const handleItemClick = async (item: FileItem) => {
    if (item.type === "folder") {
      const newPath = item.key.endsWith("/") ? item.key.slice(0, -1) : item.key
      setCurrentPath(newPath)
      if (cosService) await loadFiles(cosService, newPath)
    } else {
      await openFile(item)
    }
  }

  const openFile = async (file: FileItem) => {
    if (!cosService) return
    setSelectedFile(file)
    setShowFileDetail(true)
    const fileType = getFileType(file.name)
    if (fileType === "html" || fileType === "text") {
      setIsLoading(true)
      try {
        const content = await cosService.getFileContent(file.key)
        setSelectedFile({ ...file, content })
        setEditedContent(content)
      } catch (error) {
        console.error("Failed to load file content:", error)
        toast({ title: "文件内容加载失败", description: error instanceof Error ? error.message : "未知错误", variant: "destructive" })
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
      if (item.type === "folder") await cosService.deleteFolder(item.key)
      else await cosService.deleteFile(item.key)
      toast({ title: "删除成功", description: `${item.name} 已删除` })
      refreshFiles()
    } catch (error) {
      console.error("Delete failed:", error)
      toast({ title: "删除失败", description: error instanceof Error ? error.message : "未知错误", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = (item: FileItem) => {
    if (!item.url) {
      toast({ title: "分享失败", description: "文件URL不可用", variant: "destructive" })
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
      toast({ title: "下载成功", description: `文件 ${item.name} 已下载` })
    } catch (error) {
      console.error("Download failed:", error)
      toast({ title: "下载失败", description: error instanceof Error ? error.message : "未知错误", variant: "destructive" })
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
      setSelectedFile({ ...selectedFile, content: editedContent, size: blob.size })
      toast({ title: "保存成功", description: `文件 ${selectedFile.name} 已保存` })
      refreshFiles()
    } catch (error) {
      console.error("Save failed:", error)
      toast({ title: "保存失败", description: error instanceof Error ? error.message : "未知错误", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = () => {
    localStorage.setItem("cosSettings", JSON.stringify(settings))
    toast({ title: "设置已保存", description: "COS配置已保存到本地" })
    setShowSettings(false)
    if (settings.secretId && settings.secretKey && settings.bucket && settings.region) {
      initializeCOS(settings)
    }
  }

  const testConnection = async () => {
    if (!settings.bucket || !settings.region || !settings.secretId || !settings.secretKey) {
      toast({ title: "配置不完整", description: "请填写完整的COS配置信息", variant: "destructive" })
      return
    }
    setIsLoading(true)
    try {
      const testService = new COSService(settings)
      await testService.testConnection()
      toast({ title: "连接成功", description: "COS连接测试通过" })
    } catch (error) {
      console.error("Connection test failed:", error)
      toast({ title: "连接失败", description: error instanceof Error ? error.message : "未知错误", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToPath = async (path: string) => {
    setCurrentPath(path)
    if (cosService) await loadFiles(cosService, path)
  }

  return {
    files,
    currentPath,
    viewMode,
    sortBy,
    isLoading,
    selectedFile,
    shareUrl,
    isDragging,
    editedContent,
    cosService,
    isInitialized,
    showUpload,
    showSettings,
    showFileDetail,
    showShare,
    settings,
    sortedFiles,
    breadcrumbs,
    setFiles,
    setCurrentPath,
    setViewMode,
    setSortBy,
    setIsLoading,
    setSelectedFile,
    setShareUrl,
    setIsDragging,
    setEditedContent,
    setShowUpload,
    setShowSettings,
    setShowFileDetail,
    setShowShare,
    setSettings,
    refreshFiles,
    handleItemClick,
    handleDelete,
    handleShare,
    handleDownload,
    handleSaveFile,
    saveSettings,
    testConnection,
    navigateToPath,
  }
}
