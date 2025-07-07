import type React from "react"
import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CloudUpload, Code, FolderPlus, Save, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { COSService } from "@/lib/cos-service"

interface UploadDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  currentPath: string
  cosService: COSService | null
  onUploadComplete: () => void
}

export function UploadDialog({ isOpen, onOpenChange, currentPath, cosService, onUploadComplete }: UploadDialogProps) {
  const [uploadMode, setUploadMode] = useState<"file" | "code" | "folder">("file")
  const [newFileName, setNewFileName] = useState("")
  const [newFileContent, setNewFileContent] = useState("")
  const [newFolderName, setNewFolderName] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !cosService) return
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const key = currentPath ? `${currentPath}/${file.name}` : file.name
        await cosService.uploadFile(key, file)
      })
      await Promise.all(uploadPromises)
      toast({ title: "上传成功", description: `已上传 ${files.length} 个文件` })
      onOpenChange(false)
      onUploadComplete()
    } catch (error) {
      toast({ title: "上传失败", description: error instanceof Error ? error.message : "未知错误", variant: "destructive" })
    }
  }

  const handleCreateFile = async () => {
    if (!newFileName.trim() || !cosService) return
    try {
      const key = currentPath ? `${currentPath}/${newFileName}` : newFileName
      const blob = new Blob([newFileContent], { type: "text/plain" })
      await cosService.uploadFile(key, blob)
      toast({ title: "创建成功", description: `文件 ${newFileName} 已创建` })
      setNewFileName("")
      setNewFileContent("")
      onOpenChange(false)
      onUploadComplete()
    } catch (error) {
      toast({ title: "创建失败", description: error instanceof Error ? error.message : "未知错误", variant: "destructive" })
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !cosService) return
    try {
      const key = currentPath ? `${currentPath}/${newFolderName}/` : `${newFolderName}/`
      await cosService.createFolder(key)
      toast({ title: "创建成功", description: `文件夹 ${newFolderName} 已创建` })
      setNewFolderName("")
      onOpenChange(false)
      onUploadComplete()
    } catch (error) {
      toast({ title: "创建失败", description: error instanceof Error ? error.message : "未知错误", variant: "destructive" })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>上传或创建文件</DialogTitle>
        </DialogHeader>
        <Tabs value={uploadMode} onValueChange={(value) => setUploadMode(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file"><Upload className="w-4 h-4 mr-2" />上传文件</TabsTrigger>
            <TabsTrigger value="code"><Code className="w-4 h-4 mr-2" />创建代码</TabsTrigger>
            <TabsTrigger value="folder"><FolderPlus className="w-4 h-4 mr-2" />创建文件夹</TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="space-y-4">
            <div className="text-sm text-gray-500">将上传到: <Badge variant="secondary">{currentPath || "根目录"}</Badge></div>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
            >
              <CloudUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">拖拽文件到此处，或点击选择文件</p>
              <Button onClick={() => fileInputRef.current?.click()}>选择文件</Button>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
            </div>
          </TabsContent>
          <TabsContent value="code" className="space-y-4">
            <div className="text-sm text-gray-500">将在 <Badge variant="secondary">{currentPath || "根目录"}</Badge> 中创建文件</div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fileName">文件名</Label>
                <Input id="fileName" placeholder="文件名 (例: index.html)" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="fileContent">文件内容</Label>
                <Textarea id="fileContent" className="h-96 font-mono text-sm" placeholder="输入代码内容..." value={newFileContent} onChange={(e) => setNewFileContent(e.target.value)} />
              </div>
              <Button onClick={handleCreateFile} className="w-full"><Save className="w-4 h-4 mr-2" />创建文件</Button>
            </div>
          </TabsContent>
          <TabsContent value="folder" className="space-y-4">
            <div className="text-sm text-gray-500">将在 <Badge variant="secondary">{currentPath || "根目录"}</Badge> 中创建文件夹</div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folderName">文件夹名称</Label>
                <Input id="folderName" placeholder="文件夹名称" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
              </div>
              <Button onClick={handleCreateFolder} className="w-full"><FolderPlus className="w-4 h-4 mr-2" />创建文件夹</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
