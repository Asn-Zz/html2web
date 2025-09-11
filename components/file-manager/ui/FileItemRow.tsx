
import { Button } from "@/components/ui/button"
import { Download, Edit, Share2, Trash2 } from "lucide-react"
import type { FileItem } from "../types"
import { formatFileSize, getFileIcon } from "../utils"

interface FileItemRowProps {
  file: FileItem
  onItemClick: (item: FileItem) => void
  onEdit: (item: FileItem) => void
  onShare: (item: FileItem) => void
  onDownload: (item: FileItem) => void
  onDelete: (item: FileItem) => void
}

export function FileItemRow({ file, onItemClick, onEdit, onShare, onDownload, onDelete }: FileItemRowProps) {
  const isFolder = file.type === "folder" && !!file.children?.length

  return (
    <div className="cursor-pointer hover:shadow-md transition-shadow p-4" onClick={() => onItemClick(file)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 overflow-hidden">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {getFileIcon(file)}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-semibold text-gray-900 truncate" title={file.name}>
                {file.name} {isFolder && `(${file.children?.length})`}
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
    </div>
  )
}
