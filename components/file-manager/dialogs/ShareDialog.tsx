import { useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as QRCodeLib from "qrcode"
import type { QRCodeRenderersOptions } from "qrcode"
import Link from "next/link"

interface ShareDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  shareUrl: string
  fileKey?: string
}

export function ShareDialog({ isOpen, onOpenChange, shareUrl, fileKey }: ShareDialogProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // 生成分享页面URL
  const sharePageUrl = fileKey ? `${window.location.origin}/share/${encodeURIComponent(fileKey)}` : ''

  useEffect(() => {
    setTimeout(() => {
      if (isOpen && qrCodeRef.current && shareUrl) {
      qrCodeRef.current.innerHTML = ""
      
      QRCodeLib.toCanvas(sharePageUrl, { width: 128, height: 128 } as QRCodeRenderersOptions)
        .then((canvas) => qrCodeRef.current?.appendChild(canvas))
        .catch((err) => console.error("QR code generation failed:", err))
      }
    });
  }, [isOpen, shareUrl])

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "复制成功", description })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>分享文件</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="shareUrl">直接下载链接</Label>
            <div className="flex mt-1">
              <Input id="shareUrl" value={shareUrl} readOnly className="flex-1 rounded-r-none bg-gray-50" />
              <Button onClick={() => copyToClipboard(shareUrl, "下载链接已复制到剪贴板")} className="rounded-l-none"><Copy className="w-4 h-4" /></Button>
            </div>
          </div>
          
          {fileKey && (
            <div>
              <Label htmlFor="sharePageUrl">查看/编辑</Label>
              <div className="flex mt-1">
                <Input id="sharePageUrl" value={sharePageUrl} readOnly className="flex-1 rounded-r-none bg-gray-50" />
                <Button onClick={() => copyToClipboard(sharePageUrl, "在线查看链接已复制到剪贴板")} className="rounded-l-none px-2 mr-2"><Copy className="w-4 h-4" /></Button>
                <Link href={sharePageUrl} target="_blank" passHref>
                  <Button className="rounded-l px-2" variant="outline"><ExternalLink className="w-4 h-4" /></Button>
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-1">此链接可用于在线查看和编辑HTML文件</p>
            </div>
          )}
          
          <div>
            <Label>二维码</Label>
            <div ref={qrCodeRef} className="border border-gray-300 rounded-lg p-4 flex justify-center items-center h-40 mt-1" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
