import React from 'react';
import './VideoLoadError.css';

interface VideoLoadErrorProps {
  fileName: string;
  error: string;
  onRetry: () => void;
  onRemove: () => void;
}

/**
 * 视频加载失败错误组件
 */
export const VideoLoadError: React.FC<VideoLoadErrorProps> = ({
  fileName,
  error,
  onRetry,
  onRemove
}) => {
  return (
    <div className="video-load-error">
      <div className="video-load-error-icon">⚠️</div>
      <div className="video-load-error-content">
        <h4>视频加载失败</h4>
        <p className="video-load-error-filename">{fileName}</p>
        <p className="video-load-error-message">{error}</p>
      </div>
      <div className="video-load-error-actions">
        <button onClick={onRetry} className="btn-retry">
          重试
        </button>
        <button onClick={onRemove} className="btn-remove">
          移除
        </button>
      </div>
    </div>
  );
};

interface VideoLoadErrorListProps {
  errors: Array<{
    id: string;
    fileName: string;
    error: string;
  }>;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

/**
 * 视频加载错误列表
 */
export const VideoLoadErrorList: React.FC<VideoLoadErrorListProps> = ({
  errors,
  onRetry,
  onRemove
}) => {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="video-load-error-list">
      <div className="video-load-error-list-header">
        <h3>视频加载错误 ({errors.length})</h3>
      </div>
      <div className="video-load-error-list-content">
        {errors.map(error => (
          <VideoLoadError
            key={error.id}
            fileName={error.fileName}
            error={error.error}
            onRetry={() => onRetry(error.id)}
            onRemove={() => onRemove(error.id)}
          />
        ))}
      </div>
    </div>
  );
};
