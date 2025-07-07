import { Button } from "@/components/ui/button"
import { AlertCircle, Settings } from "lucide-react"

export function UninitializedState({ onSettingsClick }: { onSettingsClick: () => void }) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">请先配置COS设置</h3>
      <p className="text-gray-500 mb-4">需要配置腾讯云COS信息才能使用文件管理功能</p>
      <Button onClick={onSettingsClick}>
        <Settings className="w-4 h-4 mr-2" />
        配置设置
      </Button>
    </div>
  )
}
