
import React, { useState } from 'react';
import { FileItem } from '../types';
import { FileItemRow } from './FileItemRow';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface FileTreeProps {
  files: FileItem[];
  onItemClick: (item: FileItem) => void;
  onEdit: (item: FileItem) => void;
  onShare: (item: FileItem) => void;
  onDownload: (item: FileItem) => void;
  onDelete: (item: FileItem) => void;
  level?: number;
}

export function FileTree({
  files,
  onItemClick,
  onEdit,
  onShare,
  onDownload,
  onDelete,
  level = 0,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const handleToggle = (folderKey: string) => {
    const newExpandedFolders = new Set(expandedFolders);
    if (newExpandedFolders.has(folderKey)) {
      newExpandedFolders.delete(folderKey);
    } else {
      newExpandedFolders.add(folderKey);
    }
    setExpandedFolders(newExpandedFolders);
  };

  const renderFileTree = (items: FileItem[], currentLevel: number) => {
    return items.map((item) => {
      const isFolder = item.type === 'folder' && !!item.children?.length;
      const isExpanded = expandedFolders.has(item.key);      

      return (
        <div key={item.key}>
          <div style={{ paddingLeft: `${currentLevel * 20}px` }} className="flex items-center">
            {isFolder && (
              <button onClick={() => handleToggle(item.key)} className="mr-2">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            <div className="flex-grow">
              <FileItemRow
                file={item}
                onItemClick={onItemClick}
                onEdit={onEdit}
                onShare={onShare}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            </div>
          </div>
          {isFolder && isExpanded && item.children && (
            <div style={{ paddingLeft: `${(currentLevel + 1) * 20}px` }}>
              {renderFileTree(item.children, currentLevel + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return <>{renderFileTree(files, level)}</>;
}
