/**
 * ExportDialog - UI for video export settings and progress
 */
import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ExportManager, type ExportProgress } from '../core/ExportManager';
import { AudioManager } from '../core/AudioManager';
import type { ExportSettings } from '../types';
import './ExportDialog.css';

interface ExportDialogProps {
  exportManager: ExportManager | null;
  audioManager: AudioManager | null;
  onClose: () => void;
}

export function ExportDialog({
  exportManager,
  audioManager,
  onClose,
}: ExportDialogProps) {
  const currentProject = useAppStore(state => state.currentProject);
  const setUIState = useAppStore(state => state.setUIState);

  // Export settings
  const [settings, setSettings] = useState<ExportSettings>({
    resolution: '1080p',
    fps: 60,
    bitrate: 8,
    format: 'mp4',
    codec: 'h264',
  });

  // Export progress
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Update UI state when exporting
  useEffect(() => {
    setUIState({ isExporting, exportProgress: progress?.progress || 0 });
  }, [isExporting, progress, setUIState]);

  /**
   * Start export
   */
  const handleExport = async () => {
    if (!exportManager || !audioManager || !currentProject) {
      alert('Export manager not initialized or no project loaded');
      return;
    }

    setIsExporting(true);
    setProgress({
      phase: 'preparing',
      progress: 0,
      message: 'Starting export...',
    });
    setExportResult(null);

    try {
      const result = await exportManager.exportVideo(
        currentProject,
        settings,
        audioManager,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      if (result.success && result.blob) {
        // Download the video
        downloadVideo(result.blob, currentProject.name);
        setExportResult({ success: true });
      } else {
        setExportResult({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('Export failed:', error);
      setExportResult({
        success: false,
        error: (error as Error).message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Download video file
   */
  const downloadVideo = (blob: Blob, projectName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Cancel export
   */
  const handleCancel = () => {
    if (exportManager && isExporting) {
      exportManager.cancel();
    }
    onClose();
  };

  /**
   * Format time remaining
   */
  const formatTimeRemaining = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '--:--';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get resolution label
   */
  const getResolutionLabel = (res: string): string => {
    switch (res) {
      case '720p':
        return '720p (720x1280)';
      case '1080p':
        return '1080p (1080x1920)';
      case '2k':
        return '2K (1440x2560)';
      default:
        return res;
    }
  };

  return (
    <div className="export-dialog-overlay">
      <div className="export-dialog">
        <div className="export-dialog-header">
          <h2>导出视频</h2>
          <button
            className="close-button"
            onClick={handleCancel}
            disabled={isExporting}
          >
            ✕
          </button>
        </div>

        <div className="export-dialog-content">
          {!isExporting && !exportResult && (
            <>
              {/* Export Settings */}
              <div className="export-settings">
                <div className="setting-group">
                  <label>分辨率</label>
                  <select
                    value={settings.resolution}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        resolution: e.target.value as '720p' | '1080p' | '2k',
                      })
                    }
                  >
                    <option value="720p">{getResolutionLabel('720p')}</option>
                    <option value="1080p">{getResolutionLabel('1080p')}</option>
                    <option value="2k">{getResolutionLabel('2k')}</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>帧率</label>
                  <select
                    value={settings.fps}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        fps: parseInt(e.target.value) as 30 | 60,
                      })
                    }
                  >
                    <option value="30">30 fps</option>
                    <option value="60">60 fps</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>码率</label>
                  <select
                    value={settings.bitrate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bitrate: parseInt(e.target.value),
                      })
                    }
                  >
                    <option value="4">4 Mbps (低)</option>
                    <option value="8">8 Mbps (中)</option>
                    <option value="12">12 Mbps (高)</option>
                    <option value="16">16 Mbps (极高)</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>编码器</label>
                  <select
                    value={settings.codec}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        codec: e.target.value as 'h264' | 'h265',
                      })
                    }
                  >
                    <option value="h264">H.264 (推荐)</option>
                    <option value="h265">H.265 (更小文件)</option>
                  </select>
                </div>
              </div>

              {/* Project Info */}
              {currentProject && (
                <div className="project-info">
                  <div className="info-row">
                    <span>项目名称:</span>
                    <span>{currentProject.name}</span>
                  </div>
                  <div className="info-row">
                    <span>时长:</span>
                    <span>{currentProject.duration.toFixed(2)}秒</span>
                  </div>
                  <div className="info-row">
                    <span>视频片段:</span>
                    <span>{currentProject.clips.length}个</span>
                  </div>
                  <div className="info-row">
                    <span>音频轨道:</span>
                    <span>{currentProject.audioTracks.length}个</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Export Progress */}
          {isExporting && progress && (
            <div className="export-progress">
              <div className="progress-phase">
                {progress.phase === 'preparing' && '准备导出...'}
                {progress.phase === 'rendering' && '渲染帧...'}
                {progress.phase === 'encoding' && '编码视频...'}
              </div>

              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>

              <div className="progress-stats">
                <span>{progress.progress.toFixed(1)}%</span>
                {progress.currentFrame && progress.totalFrames && (
                  <span>
                    帧 {progress.currentFrame} / {progress.totalFrames}
                  </span>
                )}
                {progress.estimatedTimeRemaining && (
                  <span>
                    剩余时间: {formatTimeRemaining(progress.estimatedTimeRemaining)}
                  </span>
                )}
              </div>

              {progress.message && (
                <div className="progress-message">{progress.message}</div>
              )}
            </div>
          )}

          {/* Export Result */}
          {exportResult && (
            <div className={`export-result ${exportResult.success ? 'success' : 'error'}`}>
              {exportResult.success ? (
                <>
                  <div className="result-icon">✓</div>
                  <div className="result-message">导出成功！</div>
                  <div className="result-description">
                    视频已保存到下载文件夹
                  </div>
                </>
              ) : (
                <>
                  <div className="result-icon">✗</div>
                  <div className="result-message">导出失败</div>
                  <div className="result-description">
                    {exportResult.error || '未知错误'}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="export-dialog-footer">
          {!isExporting && !exportResult && (
            <>
              <button className="button-secondary" onClick={onClose}>
                取消
              </button>
              <button className="button-primary" onClick={handleExport}>
                开始导出
              </button>
            </>
          )}

          {isExporting && (
            <button className="button-secondary" onClick={handleCancel}>
              取消导出
            </button>
          )}

          {exportResult && (
            <button className="button-primary" onClick={onClose}>
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
