import type React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronRight, Folder, Grid3X3, Home, List, Plus } from "lucide-react"
import type { FileItem } from "./types"
import { FileItemCard } from "./ui/FileItemCard"
import { FileTree } from "./ui/FileTree"
import { FileAnalyze } from "./FileAnalyze"

interface FileBrowserProps {
  sortedFiles: FileItem[]
  breadcrumbs: { name: string; path: string }[]
  viewMode: "grid" | "list"
  sortBy: string
  isDragging: boolean
  onNavigate: (path: string) => void
  onSortChange: (value: string) => void
  onViewModeChange: (mode: "grid" | "list") => void
  onItemClick: (item: FileItem) => void
  onEdit: (item: FileItem) => void
  onShare: (item: FileItem) => void
  onDownload: (item: FileItem) => void
  onDelete: (item: FileItem) => void
  onUploadClick: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export function FileBrowser({
  sortedFiles,
  breadcrumbs,
  viewMode,
  sortBy,
  onNavigate,
  onSortChange,
  onViewModeChange,
  onItemClick,
  onEdit,
  onShare,
  onDownload,
  onDelete,
  onUploadClick,
}: FileBrowserProps) {
  return (
    <>
      {/* Breadcrumbs & Analyze */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
              <button
                onClick={() => onNavigate(crumb.path)}
                className="hover:text-blue-600 cursor-pointer flex items-center"
              >
                {index === 0 ? <Home className="w-4 h-4" /> : crumb.name}
              </button>
              {index < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
            </div>
          ))}
        </div>

        <FileAnalyze />
      </div>


      {/* File List Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">我的文件 ({sortedFiles.length})</h2>
        <div className="flex space-x-4">
          <Select value={sortBy} onValueChange={onSortChange}>
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
              onClick={() => onViewModeChange("grid")}
              className="rounded-r-none h-full"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="rounded-l-none h-full"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* File Grid/List */}
      {sortedFiles.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedFiles.map((file) => (
              <FileItemCard
                key={file.key}
                file={file}
                onItemClick={onItemClick}
                onEdit={onEdit}
                onShare={onShare}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <FileTree
              files={sortedFiles}
              onItemClick={onItemClick}
              onEdit={onEdit}
              onShare={onShare}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无文件</h3>
          <p className="text-gray-500 mb-4">点击上方按钮开始上传或创建文件</p>
          <Button onClick={onUploadClick}>
            <Plus className="w-4 h-4 mr-2" />
            上传文件
          </Button>
        </div>
      )}
    </>
  )
}
