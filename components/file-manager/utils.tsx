import type React from "react"
import { Code, File, FileText, Folder, ImageIcon } from "lucide-react"
import type { FileItem } from "./types"

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export const getFileType = (fileName: string): "html" | "image" | "text" | "other" => {
  if (!fileName) return "other"
  const extension = fileName.split(".").pop()?.toLowerCase()
  if (["html", "htm"].includes(extension || "")) return "html"
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "ico"].includes(extension || "")) return "image"
  if (["txt", "js", "css", "json", "md", "xml", "log", "ini", "py", "java", "cpp", "c"].includes(extension || ""))
    return "text"
  return "other"
}

export const getFileIcon = (file: FileItem): React.ReactNode => {
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
