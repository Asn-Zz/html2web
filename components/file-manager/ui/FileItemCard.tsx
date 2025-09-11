import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Eye, Edit, Share2, Trash2 } from "lucide-react"
import type { FileItem } from "../types"
import { formatFileSize, getFileIcon } from "../utils"

interface FileItemCardProps {
  file: FileItem
  onItemClick: (item: FileItem) => void
  onEdit: (item: FileItem) => void
  onShare: (item: FileItem) => void
  onDownload: (item: FileItem) => void
  onDelete: (item: FileItem) => void
}

export function FileItemCard({ file, onItemClick, onEdit, onShare, onDownload, onDelete }: FileItemCardProps) {
  const isFolder = file.type === "folder"
  const folderSize = file.children?.map((item) => item.size).reduce((a, b) => a + b, 0) || 0
  
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
      onClick={() => onItemClick(file)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {getFileIcon(file)}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-semibold text-gray-900 truncate" title={file.name}>
                {file.name} {isFolder && `(${file.children?.length})`}
              </h3>
              {file.type === "file" && <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>}
              {file.type === "folder" && <p className="text-sm text-gray-500">{formatFileSize(folderSize)}</p>}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">{file.created.toLocaleDateString()}</div>
          <div className="flex justify-between items-center">
            {file.type === "file" && (
              <>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(file); }} title="查看/编辑">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDownload(file); }} title="下载">
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onShare(file); }} title="分享">
                  <Share2 className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(file); }} title="删除" className="text-red-600 hover:text-red-800">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
