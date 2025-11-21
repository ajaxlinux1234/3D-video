/**
 * VideoImporter Component
 * Provides UI for importing videos via file picker or drag-and-drop
 */

import { useCallback, useState } from 'react';
import { useVideoManager } from '../core/useVideoManager';
import { openVideoPicker, extractFilesFromDragEvent, filterVideoFiles } from '../utils/fileUtils';

export function VideoImporter() {
  const { importing, error, importVideos, clearError, remainingSlots, videoCount } = useVideoManager();
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Handle file picker
   */
  const handleFilePicker = useCallback(async () => {
    try {
      const files = await openVideoPicker(true);
      await importVideos(files);
    } catch (err) {
      if (err instanceof Error && err.message !== 'File selection cancelled') {
        console.error('Import error:', err);
      }
    }
  }, [importVideos]);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const allFiles = extractFilesFromDragEvent(e);
    const videoFiles = filterVideoFiles(allFiles);

    if (videoFiles.length === 0) {
      console.warn('No video files found in drop');
      return;
    }

    try {
      await importVideos(videoFiles);
    } catch (err) {
      console.error('Import error:', err);
    }
  }, [importVideos]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>视频导入</h2>
      
      {/* Status info */}
      <div style={{ marginBottom: '20px' }}>
        <p>已导入视频: {videoCount} / 20</p>
        <p>剩余可用位置: {remainingSlots}</p>
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c00',
        }}>
          <strong>错误:</strong> {error}
          <button
            onClick={clearError}
            style={{ marginLeft: '10px', cursor: 'pointer' }}
          >
            关闭
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? '#4CAF50' : '#ccc'}`,
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          backgroundColor: isDragging ? '#f0f8f0' : '#fafafa',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onClick={handleFilePicker}
      >
        {importing ? (
          <div>
            <p style={{ fontSize: '18px', margin: '10px 0' }}>导入中...</p>
            <p style={{ color: '#666' }}>请稍候</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '18px', margin: '10px 0' }}>
              {isDragging ? '释放以导入视频' : '点击选择或拖拽视频文件'}
            </p>
            <p style={{ color: '#666', fontSize: '14px' }}>
              支持格式: MP4, MOV, WebM
            </p>
            <p style={{ color: '#666', fontSize: '14px' }}>
              最大文件大小: 500MB
            </p>
          </div>
        )}
      </div>

      {/* Import button */}
      <button
        onClick={handleFilePicker}
        disabled={importing || remainingSlots === 0}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: importing || remainingSlots === 0 ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: importing || remainingSlots === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {importing ? '导入中...' : '选择视频文件'}
      </button>
    </div>
  );
}

