"use client"

import { useFileManager } from "./hooks/use-file-manager"
import { Header } from "./Header"
import { FileBrowser } from "./FileBrowser"
import { UploadDialog } from "./dialogs/UploadDialog"
import { SettingsDialog } from "./dialogs/SettingsDialog"
import { FileDetailDialog } from "./dialogs/FileDetailDialog"
import { ShareDialog } from "./dialogs/ShareDialog"
import { LoadingOverlay } from "./ui/LoadingOverlay"
import { UninitializedState } from "./ui/UninitializedState"

export function FileManager() {
  const hook = useFileManager()

  return (
    <div className="min-h-screen bg-gray-50">
      <LoadingOverlay isLoading={hook.isLoading} />

      <Header
        isInitialized={hook.isInitialized}
        onUploadClick={() => hook.setShowUpload(true)}
        onSettingsClick={() => hook.setShowSettings(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hook.isInitialized ? (
          <UninitializedState onSettingsClick={() => hook.setShowSettings(true)} />
        ) : (
          <FileBrowser
            // State
            sortedFiles={hook.sortedFiles}
            breadcrumbs={hook.breadcrumbs}
            viewMode={hook.viewMode}
            sortBy={hook.sortBy}
            isDragging={hook.isDragging}
            // Callbacks
            onNavigate={hook.navigateToPath}
            onSortChange={hook.setSortBy}
            onViewModeChange={hook.setViewMode}
            onItemClick={hook.handleItemClick}
            onShare={hook.handleShare}
            onDownload={hook.handleDownload}
            onDelete={hook.handleDelete}
            onUploadClick={() => hook.setShowUpload(true)}
            onDragOver={(e) => {
              e.preventDefault()
              hook.setIsDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              hook.setIsDragging(false)
            }}
            onDrop={async (e) => {
              e.preventDefault()
              hook.setIsDragging(false)
              if (!hook.cosService) return
              const droppedFiles = e.dataTransfer.files
              hook.setIsLoading(true)
              try {
                const uploadPromises = Array.from(droppedFiles).map(async (file) => {
                  const key = hook.currentPath ? `${hook.currentPath}/${file.name}` : file.name
                  await hook.cosService!.uploadFile(key, file)
                })
                await Promise.all(uploadPromises)
                hook.refreshFiles()
              } catch (error) {
                console.error("Drop upload failed:", error)
              } finally {
                hook.setIsLoading(false)
              }
            }}
          />
        )}
      </main>

      <UploadDialog
        isOpen={hook.showUpload}
        onOpenChange={hook.setShowUpload}
        currentPath={hook.currentPath}
        cosService={hook.cosService}
        onUploadComplete={hook.refreshFiles}
      />

      <SettingsDialog
        isOpen={hook.showSettings}
        onOpenChange={hook.setShowSettings}
        settings={hook.settings}
        onSettingsChange={hook.setSettings}
        onSave={hook.saveSettings}
        onTestConnection={hook.testConnection}
        onFillPassword={hook.handleFillPassword}
      />

      <FileDetailDialog
        isOpen={hook.showFileDetail}
        onOpenChange={hook.setShowFileDetail}
        selectedFile={hook.selectedFile}
        editedContent={hook.editedContent}
        onContentChange={hook.setEditedContent}
        onSave={hook.handleSaveFile}
        onDownload={hook.handleDownload}
        onShare={hook.handleShare}
      />

      <ShareDialog
        isOpen={hook.showShare}
        onOpenChange={hook.setShowShare}
        shareUrl={hook.shareUrl}
        fileKey={hook.selectedFile?.key}
      />
    </div>
  )
}
