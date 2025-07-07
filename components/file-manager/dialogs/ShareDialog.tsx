import { useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as QRCodeLib from "qrcode"
import type { QRCodeRenderersOptions } from "qrcode"

interface ShareDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  shareUrl: string
}

export function ShareDialog({ isOpen, onOpenChange, shareUrl }: ShareDialogProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setTimeout(() => {
      if (isOpen && qrCodeRef.current && shareUrl) {
      qrCodeRef.current.innerHTML = ""
      QRCodeLib.toCanvas(shareUrl, { width: 128, height: 128 } as QRCodeRenderersOptions)
        .then((canvas) => qrCodeRef.current?.appendChild(canvas))
        .catch((err) => console.error("QR code generation failed:", err))
      }
    });
  }, [isOpen, shareUrl])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({ title: "复制成功", description: "分享链接已复制到剪贴板" })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>分享文件</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="shareUrl">分享链接</Label>
            <div className="flex mt-1">
              <Input id="shareUrl" value={shareUrl} readOnly className="flex-1 rounded-r-none bg-gray-50" />
              <Button onClick={copyToClipboard} className="rounded-l-none"><Copy className="w-4 h-4" /></Button>
            </div>
          </div>
          <div>
            <Label>二维码</Label>
            <div ref={qrCodeRef} className="border border-gray-300 rounded-lg p-4 flex justify-center items-center h-40 mt-1" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
