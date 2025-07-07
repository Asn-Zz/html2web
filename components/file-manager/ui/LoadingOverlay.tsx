import { Loader2 } from "lucide-react"

export function LoadingOverlay({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-gray-700">处理中...</span>
      </div>
    </div>
  )
}
