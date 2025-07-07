import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, TestTube } from "lucide-react"
import type { COSSettings } from "../types"

interface SettingsDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  settings: COSSettings
  onSettingsChange: (settings: COSSettings) => void
  onSave: () => void
  onTestConnection: () => void
}

export function SettingsDialog({ isOpen, onOpenChange, settings, onSettingsChange, onSave, onTestConnection }: SettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>腾讯云COS设置</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="secretId">SecretId</Label>
            <Input id="secretId" value={settings.secretId} onChange={(e) => onSettingsChange({ ...settings, secretId: e.target.value })} placeholder="请输入SecretId" />
          </div>
          <div>
            <Label htmlFor="secretKey">SecretKey</Label>
            <Input id="secretKey" type="password" value={settings.secretKey} onChange={(e) => onSettingsChange({ ...settings, secretKey: e.target.value })} placeholder="请输入SecretKey" />
          </div>
          <div>
            <Label htmlFor="bucket">存储桶名称</Label>
            <Input id="bucket" value={settings.bucket} onChange={(e) => onSettingsChange({ ...settings, bucket: e.target.value })} placeholder="格式: example-1250000000" />
          </div>
          <div>
            <Label htmlFor="region">地域</Label>
            <Input id="region" value={settings.region} onChange={(e) => onSettingsChange({ ...settings, region: e.target.value })} placeholder="格式: ap-guangzhou" />
          </div>
          <div className="flex space-x-2">
            <Button onClick={onSave} className="flex-1"><Save className="w-4 h-4 mr-2" />保存设置</Button>
            <Button onClick={onTestConnection} variant="outline" className="flex-1 bg-transparent"><TestTube className="w-4 h-4 mr-2" />测试连接</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}