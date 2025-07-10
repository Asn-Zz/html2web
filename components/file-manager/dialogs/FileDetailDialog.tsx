import { useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Download, File, RefreshCw, Save, Share2 } from "lucide-react"
import type { FileItem } from "../types"
import { formatFileSize, getFileType } from "../utils"

// --- Syntax Highlighting Additions ---
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-markup';     // For HTML, XML, etc.
import 'prismjs/themes/prism-tomorrow.css';    // A nice dark theme for the editor
// --- End of Additions ---

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
      // It's good practice to revoke the URL when the component unmounts or the URL changes,
      // but in this short-lived context, it's less critical.
      // For robustness, you might manage and revoke old URLs.
    }
  }, [editedContent, selectedFile])

  useEffect(() => {
    if (isOpen && selectedFile && getFileType(selectedFile.name) === "html") {
      // Initial load
      refreshPreview()
      // Debounced refresh on edit
      const timeoutId = setTimeout(refreshPreview, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [isOpen, editedContent, selectedFile, refreshPreview])

  if (!selectedFile) return null

  const fileType = getFileType(selectedFile.name)

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
          {(fileType === "html" || fileType === "text") && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
              <div className="flex flex-col min-h-0">
                <h4 className="font-medium mb-2">编辑器</h4>
                {fileType === "html" ? (
                  <div className="relative h-0 flex-1 border rounded-md bg-gray-900 text-white">
                    <Editor
                      value={editedContent}
                      onValueChange={onContentChange}
                      highlight={code => highlight(code, languages.markup, 'markup')}
                      padding={10}
                      className="w-full h-full overflow-auto"
                      style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 14,
                        outline: 'none',
                        overflow: 'scroll'
                      }}
                    />
                  </div>
                ) : (
                  <Textarea className="flex-1 font-mono text-sm resize-none" value={editedContent} onChange={(e) => onContentChange(e.target.value)} />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">预览</h4>
                  {fileType === "html" && <Button size="sm" variant="outline" onClick={refreshPreview}><RefreshCw className="w-4 h-4 mr-1" />刷新</Button>}
                </div>
                {fileType === "html" ? (
                  <iframe ref={previewRef} className="flex-1 border border-gray-300 rounded-lg" title="预览" />
                ) : (
                  <div className="flex-1 bg-gray-100 border border-gray-300 rounded-lg p-4 flex items-center justify-center">
                    <p className="text-gray-500">纯文本文件无预览。</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {fileType === "image" && (
            <div className="flex-1 flex flex-col"><h4 className="font-medium mb-2">图片预览</h4><div className="flex-1 flex justify-center items-center bg-gray-100 rounded-lg p-4"><img src={selectedFile.url || "/placeholder.svg"} alt={selectedFile.name} className="max-w-full max-h-full object-contain rounded-lg shadow-md" /></div></div>
          )}
          {fileType === "other" && (
            <div className="flex-1 flex flex-col"><h4 className="font-medium mb-2">文件信息</h4><div className="flex-1 bg-gray-100 rounded-lg p-8 text-center flex flex-col justify-center items-center"><File className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="text-lg text-gray-700 mb-2">此文件类型不支持在线预览。</p><p className="text-sm text-gray-500">文件名: {selectedFile.name}</p><p className="text-sm text-gray-500">大小: {formatFileSize(selectedFile.size)}</p><p className="text-sm text-gray-500">创建时间: {selectedFile.created.toLocaleString()}</p></div></div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
