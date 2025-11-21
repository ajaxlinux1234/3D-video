/**
 * MissingFilesDialog - Handle missing video files when loading projects
 */

import { useState } from 'react';
import type { VideoReference } from '../core/ProjectManager';
import './MissingFilesDialog.css';

interface MissingFilesDialogProps {
  missingFiles: VideoReference[];
  onRelocate: (reference: VideoReference) => Promise<File | null>;
  onSkip: () => void;
  onCancel: () => void;
}

export function MissingFilesDialog({
  missingFiles,
  onRelocate,
  onSkip,
  onCancel,
}: MissingFilesDialogProps) {
  const [relocating, setRelocating] = useState<string | null>(null);
  const [relocated, setRelocated] = useState<Set<string>>(new Set());

  const handleRelocate = async (reference: VideoReference) => {
    setRelocating(reference.id);
    try {
      const file = await onRelocate(reference);
      if (file) {
        setRelocated(prev => new Set([...prev, reference.id]));
      }
    } finally {
      setRelocating(null);
    }
  };

  const allRelocated = missingFiles.every(ref => relocated.has(ref.id));
  const remainingCount = missingFiles.length - relocated.size;

  return (
    <div className="missing-files-overlay">
      <div className="missing-files-dialog">
        <div className="missing-files-header">
          <h2>⚠️ 缺失的视频文件</h2>
          <p>项目引用了 {missingFiles.length} 个找不到的视频文件</p>
        </div>

        <div className="missing-files-content">
          <div className="missing-files-list">
            {missingFiles.map((reference) => {
              const isRelocated = relocated.has(reference.id);
              const isRelocating = relocating === reference.id;

              return (
                <div
                  key={reference.id}
                  className={`missing-file-item ${isRelocated ? 'relocated' : ''}`}
                >
                  <div className="file-icon">
                    {isRelocated ? '✓' : '📹'}
                  </div>
                  <div className="file-info">
                    <div className="file-name">{reference.filename}</div>
                    <div className="file-meta">
                      {formatFileSize(reference.size)} • 
                      上次修改: {new Date(reference.lastModified).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    className="relocate-button"
                    onClick={() => handleRelocate(reference)}
                    disabled={isRelocating || isRelocated}
                  >
                    {isRelocating ? '定位中...' : isRelocated ? '已定位' : '重新定位'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="missing-files-hint">
            <p>
              💡 提示: 点击"重新定位"按钮为每个缺失的文件选择新的位置。
              如果文件已被删除或移动，请找到原文件或使用替代文件。
            </p>
          </div>
        </div>

        <div className="missing-files-footer">
          <button className="dialog-button secondary" onClick={onCancel}>
            取消加载
          </button>
          <button
            className="dialog-button secondary"
            onClick={onSkip}
            disabled={remainingCount === missingFiles.length}
          >
            跳过缺失文件 ({remainingCount})
          </button>
          <button
            className="dialog-button primary"
            onClick={onSkip}
            disabled={!allRelocated}
          >
            继续 {allRelocated ? '✓' : `(${relocated.size}/${missingFiles.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
