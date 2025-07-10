'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw, Save, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { COSService } from '@/lib/cos-service'
import Link from 'next/link'

// --- Syntax Highlighting Additions ---
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-tomorrow.css'; // Editor theme
// --- End of Additions ---

const Spinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
);

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
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isVisitor, setIsVisitor] = useState(false);

  // 刷新预览
  const refreshPreview = useCallback(() => {
    setIsIframeLoading(true);
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement
    if (iframe) {
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
    setIsIframeLoading(false);
    return undefined
  }, [content, editedContent, isEditing, key])

  const initServer = () => {
    const savedSettings = localStorage.getItem('cosSettings')

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        if (parsed.secretId && parsed.secretKey && parsed.bucket && parsed.region) {
          const service = new COSService(parsed)
          setCosService(service)
          setIsVisitor(false)
        } else {
          setError('COS配置不完整，以游客模式预览。')
          fetchContentAsGuest();
        }
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
        setError('COS设置加载失败，以游客模式预览。')
        fetchContentAsGuest();
      }
    } else {
      fetchContentAsGuest();
    }
  }

  // 初始化COS服务
  useEffect(initServer, [])

  const fetchContentAsGuest = () => {
    fetch(`/api/cos-proxy?key=${encodeURIComponent(key)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`服务器错误: ${response.statusText}`);
        }
        return response.text()
      })
      .then(data => {
        setContent(data)
        setEditedContent(data)
        setIsVisitor(true)
      })
      .catch(error => {
        console.error('Failed to load file content as guest:', error)
        setError(error instanceof Error ? error.message : '获取文件内容失败')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const toggleVisitor = () => {
    setContent('')
    setEditedContent('')

    if (isVisitor) {
      initServer()
    } else {
      fetchContentAsGuest()
    }
  }

  useEffect(() => {
    if (!cosService || !key) return

    const fetchContent = async () => {
      setIsLoading(true)
      try {
        const fileContent = await cosService.getFileContent(key)
        setContent(fileContent)
        setEditedContent(fileContent)
      } catch (error) {
        console.error('Failed to load file content:', error)
        setError(error instanceof Error ? error.message : '获取文件内容失败')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [cosService, key])

  const handleSave = async () => {
    if (!cosService) return
    setIsLoading(true)
    try {
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
    } catch (error) {
      console.error('Save failed:', error)
      toast({ title: '保存失败', description: error instanceof Error ? error.message : '未知错误', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleEditMode = () => {
    if (isEditing) {
      if (content !== editedContent) {
        const confirmSave = confirm('是否保存更改？')
        if (confirmSave) {
          handleSave()
          return
        } else {
          setEditedContent(content)
        }
      }
    }
    setIsEditing(!isEditing)
  }

  useEffect(() => {
    if (!isLoading && content) {
      const cleanup = refreshPreview()
      return () => {
        if (cleanup) cleanup()
      }
    }
  }, [isLoading, content, refreshPreview])

  useEffect(() => {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (!iframe) return;

    const handleLoad = () => {
      setIsIframeLoading(false);
    };

    iframe.addEventListener('load', handleLoad);
    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [isEditing, content]);

  useEffect(() => {
    const handleResize = () => {
      const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement
      if (iframe) {
        const viewportHeight = window.innerHeight
        const headerHeight = isEditing ? 100 : 0
        const marginHeight = isEditing ? 40 : 0
        iframe.style.height = `${viewportHeight - headerHeight - marginHeight}px`
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isEditing])

  const getPrismLanguage = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html':
        return { lang: 'markup', prismLang: languages.markup };
      case 'js':
        return { lang: 'javascript', prismLang: languages.javascript };
      case 'css':
        return { lang: 'css', prismLang: languages.css };
      default:
        return null;
    }
  };

  const prismLangInfo = getPrismLanguage(key);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (isVisitor) {
    return (
      <div className="relative bg-white">
        {isIframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <Spinner />
          </div>
        )}
        {cosService && isVisitor && (
          <div className="absolute bottom-2 right-2 z-10">
            <Button size="sm" variant="outline" onClick={toggleVisitor} disabled={isLoading}>
              <Save className="w-4 h-4 mr-1" /> 编辑
            </Button>
          </div>
        )}
        <iframe
          id="preview-iframe"
          className="w-full min-h-[100vh] border-0"
          title="预览"
          style={{ visibility: isIframeLoading ? 'hidden' : 'visible' }}
        />
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
          {cosService && (
            <div className="flex space-x-2">
              <Button size="sm" variant={isEditing ? "default" : "outline"} onClick={toggleEditMode}>
                {isEditing ? '完成编辑' : '编辑文件'}
              </Button>
              {isEditing && (
                <Button size="sm" variant="outline" onClick={handleSave} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-1" /> 保存
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={toggleVisitor}>
                游客模式
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && !content && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
              <h1 className="text-2xl font-bold text-red-600 mb-4">加载失败</h1>
              <p className="text-gray-700 mb-6">{error}</p>
              <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                <ArrowLeft className="w-4 h-4 mr-2" /> 返回首页
              </Link>
            </div>
          </div>
        )}

        {content && (
          <>
            {isEditing ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col min-h-0">
                  <h2 className="font-medium mb-2">编辑器</h2>
                  {prismLangInfo ? (
                    <div className="relative border rounded-md bg-gray-900 text-white" style={{height: '85vh'}}>
                      <Editor
                        value={editedContent}
                        onValueChange={setEditedContent}
                        highlight={code => highlight(code, prismLangInfo.prismLang, prismLangInfo.lang)}
                        padding={10}
                        className="w-full h-full"
                        style={{
                          fontFamily: '"Fira code", "Fira Mono", monospace',
                          fontSize: 14,
                          outline: 'none',
                          overflow: 'scroll'
                        }}
                      />
                    </div>
                  ) : (
                    <Textarea
                      className="flex-1 font-mono text-sm resize-none min-h-[70vh]"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-medium">预览</h2>
                    <Button size="sm" variant="outline" onClick={refreshPreview}>
                      <RefreshCw className="w-4 h-4 mr-1" /> 刷新
                    </Button>
                  </div>
                  <div className="relative flex-1 border border-gray-300 rounded-lg min-h-[70vh]">
                    {isIframeLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-lg">
                        <Spinner />
                      </div>
                    )}
                    <iframe
                      id="preview-iframe"
                      className="w-full h-full border-0 rounded-lg"
                      title="预览"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative bg-white rounded-lg shadow-sm overflow-hidden min-h-[80vh]">
                {isIframeLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                    <Spinner />
                  </div>
                )}
                <iframe
                  id="preview-iframe"
                  className="w-full border-0 min-h-[80vh]"
                  title="预览"
                  style={{ visibility: isIframeLoading ? 'hidden' : 'visible' }}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}