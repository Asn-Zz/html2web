'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw, Save, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { COSService } from '@/lib/cos-service'
import Link from 'next/link'

export default function SharePage() {
  const params = useParams<{ key: string }>()
  const key = decodeURIComponent(params.key as string)
  const { toast } = useToast()

  const [content, setContent] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [cosService, setCosService] = useState<COSService | null>(null)

  // 刷新预览
  const refreshPreview = useCallback(() => {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement
    if (iframe) {
      // 根据文件扩展名设置正确的MIME类型
      const fileExtension = key.split('.').pop()?.toLowerCase()
      let mimeType = 'text/plain'
      if (fileExtension === 'html' || fileExtension === 'htm') {
        mimeType = 'text/html'
      } else if (fileExtension === 'css') {
        mimeType = 'text/css'
      } else if (fileExtension === 'js') {
        mimeType = 'application/javascript'
      } else if (fileExtension === 'json') {
        mimeType = 'application/json'
      }
      
      const contentToPreview = isEditing ? editedContent : content
      const blob = new Blob([contentToPreview], { type: mimeType })
      const url = URL.createObjectURL(blob)
      iframe.src = url
      return () => URL.revokeObjectURL(url)
    }
    return undefined
  }, [content, editedContent, isEditing, key])

  // 初始化COS服务
  useEffect(() => {
    const savedSettings = localStorage.getItem('cosSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        if (parsed.secretId && parsed.secretKey && parsed.bucket && parsed.region) {
          const service = new COSService(parsed)
          setCosService(service)
        } else {
          setError('COS配置不完整')
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
        setError('COS设置加载失败')
        setIsLoading(false)
      }
    } else {
      setError('未找到COS配置')
      setIsLoading(false)
    }
  }, [])

  // 加载文件内容
  useEffect(() => {
    if (!cosService || !key) return

    const fetchContent = async () => {
      setIsLoading(true)
      try {
        const fileContent = await cosService.getFileContent(key)
        setContent(fileContent)
        setEditedContent(fileContent)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load file content:', error)
        setError(error instanceof Error ? error.message : '获取文件内容失败')
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [cosService, key])

  // 保存文件
  const handleSave = async () => {
    if (!cosService) return
    setIsLoading(true)
    try {
      // 根据文件扩展名设置正确的MIME类型
      const fileExtension = key.split('.').pop()?.toLowerCase()
      let mimeType = 'text/plain'
      if (fileExtension === 'html' || fileExtension === 'htm') {
        mimeType = 'text/html'
      } else if (fileExtension === 'css') {
        mimeType = 'text/css'
      } else if (fileExtension === 'js') {
        mimeType = 'application/javascript'
      } else if (fileExtension === 'json') {
        mimeType = 'application/json'
      }
      
      const blob = new Blob([editedContent], { type: mimeType })
      await cosService.uploadFile(key, blob)
      setContent(editedContent)
      toast({ title: '保存成功', description: `文件已保存` })
      setIsEditing(false)
      // 不需要手动调用刷新预览，因为状态变化会自动触发refreshPreview
    } catch (error) {
      console.error('Save failed:', error)
      toast({ title: '保存失败', description: error instanceof Error ? error.message : '未知错误', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  // 切换编辑模式
  const toggleEditMode = () => {
    if (isEditing) {      
      // 如果当前是编辑模式，询问是否保存
      if (content !== editedContent) {
        const confirmSave = confirm('是否保存更改？')
        if (confirmSave) {
          handleSave()
          return // 保存函数会自动切换模式，所以这里直接返回
        } else {
          setEditedContent(content) // 放弃更改，恢复原内容
        }
      }
    }
    setIsEditing(!isEditing)
  }

  // 初始化预览
  useEffect(() => {
    if (!isLoading) {
      const cleanup = refreshPreview()
      return () => {
        if (cleanup) cleanup()
      }
    }
  }, [isLoading, refreshPreview])
  
  // 处理窗口大小变化，调整iframe高度
  useEffect(() => {
    const handleResize = () => {
      const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement
      if (iframe) {
        const viewportHeight = window.innerHeight
        const headerHeight = 100 // 估计的头部高度
        const marginHeight = 40 // 上下边距
        iframe.style.height = `${viewportHeight - headerHeight - marginHeight}px`
      }
    }
    
    handleResize() // 初始调整
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isEditing])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">加载失败</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="inline-flex items-center text-gray-700 hover:text-gray-900 mr-4">
              <ArrowLeft className="w-4 h-4 mr-1" /> 返回首页
            </Link>
            <h1 className="text-lg font-medium truncate max-w-md" title={key}>{key.split('/').pop()}</h1>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant={isEditing ? "default" : "outline"} onClick={toggleEditMode}>
              {isEditing ? '完成编辑' : '编辑文件'}
            </Button>
            {isEditing && (
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" /> 保存
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isEditing ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <h2 className="font-medium mb-2">编辑器</h2>
              <Textarea 
                className="flex-1 font-mono text-sm resize-none min-h-[70vh]" 
                value={editedContent} 
                onChange={(e) => setEditedContent(e.target.value)} 
              />
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-medium">预览</h2>
                <Button size="sm" variant="outline" onClick={refreshPreview}>
                  <RefreshCw className="w-4 h-4 mr-1" /> 刷新
                </Button>
              </div>
              <iframe 
                id="preview-iframe"
                className="flex-1 border border-gray-300 rounded-lg min-h-[70vh]" 
                title="预览" 
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <iframe 
              id="preview-iframe"
              className="w-full border-0 min-h-[80vh]" 
              title="预览" 
            />
          </div>
        )}
      </main>
    </div>
  )
}