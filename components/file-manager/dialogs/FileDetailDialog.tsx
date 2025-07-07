import { useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Download, File, RefreshCw, Save, Share2 } from "lucide-react"
import type { FileItem } from "../types"
import { formatFileSize, getFileType } from "../utils"

interface FileDetailDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  selectedFile: FileItem | null
  editedContent: string
  onContentChange: (content: string) => void
  onSave: () => void
  onDownload: (item: FileItem) => void
  onShare: (item: FileItem) => void
}

export function FileDetailDialog({ isOpen, onOpenChange, selectedFile, editedContent, onContentChange, onSave, onDownload, onShare }: FileDetailDialogProps) {
  const previewRef = useRef<HTMLIFrameElement>(null)

  const refreshPreview = useCallback(() => {
    if (previewRef.current && selectedFile && getFileType(selectedFile.name) === "html") {
      const blob = new Blob([editedContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      previewRef.current.src = url
      return () => URL.revokeObjectURL(url)
    }
  }, [editedContent, selectedFile])

  useEffect(() => {
    if (isOpen && selectedFile && getFileType(selectedFile.name) === "html") {
      const timeoutId = setTimeout(refreshPreview, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [isOpen, editedContent, selectedFile, refreshPreview])

  if (!selectedFile) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="truncate" title={selectedFile.name}>{selectedFile.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-[80vh]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500">{selectedFile.lastModified?.toLocaleString()}({formatFileSize(selectedFile.size)})</span>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={onSave}><Save className="w-4 h-4 mr-1" />保存</Button>
              <Button size="sm" variant="outline" onClick={() => onDownload(selectedFile)}><Download className="w-4 h-4 mr-1" />下载</Button>
              <Button size="sm" variant="outline" onClick={() => onShare(selectedFile)}><Share2 className="w-4 h-4 mr-1" />分享</Button>
            </div>
          </div>
          { (getFileType(selectedFile.name) === "html" || getFileType(selectedFile.name) === "text") && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
              <div className="flex flex-col"><h4 className="font-medium mb-2">编辑器</h4><Textarea className="flex-1 font-mono text-sm resize-none" value={editedContent} onChange={(e) => onContentChange(e.target.value)} /></div>
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2"><h4 className="font-medium">预览</h4>{getFileType(selectedFile.name) === "html" && <Button size="sm" variant="outline" onClick={refreshPreview}><RefreshCw className="w-4 h-4 mr-1" />刷新</Button>}</div>
                {getFileType(selectedFile.name) === "html" ? <iframe ref={previewRef} className="flex-1 border border-gray-300 rounded-lg" title="预览" /> : <div className="flex-1 bg-gray-100 border border-gray-300 rounded-lg p-4"><p className="text-gray-500">纯文本文件无预览。</p></div>}
              </div>
            </div>
          )}
          { getFileType(selectedFile.name) === "image" && (
            <div className="flex-1 flex flex-col"><h4 className="font-medium mb-2">图片预览</h4><div className="flex-1 flex justify-center items-center bg-gray-100 rounded-lg p-4"><img src={selectedFile.url || "/placeholder.svg"} alt={selectedFile.name} className="max-w-full max-h-full object-contain rounded-lg shadow-md" /></div></div>
          )}
          { getFileType(selectedFile.name) === "other" && (
            <div className="flex-1 flex flex-col"><h4 className="font-medium mb-2">文件信息</h4><div className="flex-1 bg-gray-100 rounded-lg p-8 text-center"><File className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="text-lg text-gray-700 mb-2">此文件类型不支持在线预览。</p><p className="text-sm text-gray-500">文件名: {selectedFile.name}</p><p className="text-sm text-gray-500">大小: {formatFileSize(selectedFile.size)}</p><p className="text-sm text-gray-500">创建时间: {selectedFile.created.toLocaleString()}</p></div></div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
