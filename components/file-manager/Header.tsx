import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CloudUpload, Plus, Settings } from "lucide-react"

interface HeaderProps {
  isInitialized: boolean
  onUploadClick: () => void
  onSettingsClick: () => void
}

export function Header({ isInitialized, onUploadClick, onSettingsClick }: HeaderProps) {
  return (
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
            <Button onClick={onUploadClick} disabled={!isInitialized}>
              <Plus className="w-4 h-4 mr-2" />
              上传/创建
            </Button>
            <Button variant="outline" onClick={onSettingsClick}>
              <Settings className="w-4 h-4 mr-2" />
              设置
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
