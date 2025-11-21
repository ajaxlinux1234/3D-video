import React, { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ToastContainer } from './Toast';
import { toastManager, useToast } from '../utils/toastManager';
import { MemoryWarning } from './MemoryWarning';
import { VideoLoadErrorList } from './VideoLoadError';
import { ExportRecovery, ExportRecoveryManager } from './ExportRecovery';
import { AppError, ErrorType, errorLogger } from '../utils/errors';
import './ErrorHandlingDemo.css';

/**
 * 错误处理演示组件
 */
const ErrorHandlingDemo: React.FC = () => {
  const { messages, removeToast } = useToast();
  const [videoErrors, setVideoErrors] = useState<Array<{
    id: string;
    fileName: string;
    error: string;
  }>>([]);
  const [showRecovery, setShowRecovery] = useState(false);
  const [throwError, setThrowError] = useState(false);

  // 模拟视频加载错误
  const simulateVideoError = () => {
    const newError = {
      id: `error-${Date.now()}`,
      fileName: `video-${Math.floor(Math.random() * 100)}.mp4`,
      error: '文件格式不支持或文件已损坏'
    };
    setVideoErrors([...videoErrors, newError]);
    
    const appError = new AppError(
      ErrorType.VIDEO_LOAD_FAILED,
      `Failed to load video: ${newError.fileName}`,
      { fileName: newError.fileName }
    );
    errorLogger.log(appError);
    
    toastManager.error(`视频加载失败: ${newError.fileName}`);
  };

  // 重试加载视频
  const handleRetryVideo = (id: string) => {
    const error = videoErrors.find(e => e.id === id);
    if (error) {
      toastManager.info(`正在重试加载: ${error.fileName}`);
      // 模拟成功
      setTimeout(() => {
        setVideoErrors(videoErrors.filter(e => e.id !== id));
        toastManager.success(`视频加载成功: ${error.fileName}`);
      }, 1000);
    }
  };

  // 移除错误
  const handleRemoveVideo = (id: string) => {
    setVideoErrors(videoErrors.filter(e => e.id !== id));
    toastManager.info('已移除失败的视频');
  };

  // 模拟导出恢复
  const simulateExportRecovery = () => {
    const recoveryData = {
      projectId: 'project-123',
      totalFrames: 1800,
      renderedFrames: 1234,
      exportSettings: {
        resolution: '1080p',
        fps: 60,
        bitrate: 8000
      },
      timestamp: new Date(),
      error: '导出过程中内存不足'
    };
    ExportRecoveryManager.save(recoveryData);
    setShowRecovery(true);
  };

  // 继续导出
  const handleContinueExport = () => {
    toastManager.info('正在继续导出...');
    setShowRecovery(false);
    ExportRecoveryManager.clear();
    setTimeout(() => {
      toastManager.success('导出完成！');
    }, 2000);
  };

  // 重新开始导出
  const handleRestartExport = () => {
    toastManager.warning('正在重新开始导出...');
    setShowRecovery(false);
    ExportRecoveryManager.clear();
  };

  // 取消导出
  const handleCancelExport = () => {
    setShowRecovery(false);
    ExportRecoveryManager.clear();
    toastManager.info('已取消导出恢复');
  };

  // 优化内存
  const handleOptimizeMemory = () => {
    toastManager.success('已优化内存使用');
  };

  // 触发React错误
  const triggerReactError = () => {
    setThrowError(true);
  };

  // 导出错误日志
  const exportErrorLogs = () => {
    const logs = errorLogger.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastManager.success('错误日志已导出');
  };

  if (throwError) {
    throw new Error('这是一个模拟的React错误！');
  }

  return (
    <div className="error-handling-demo">
      <h1>错误处理和用户反馈演示</h1>
      
      <div className="demo-section">
        <h2>Toast 通知</h2>
        <div className="demo-buttons">
          <button onClick={() => toastManager.success('操作成功！')}>
            成功通知
          </button>
          <button onClick={() => toastManager.error('操作失败！')}>
            错误通知
          </button>
          <button onClick={() => toastManager.warning('请注意！')}>
            警告通知
          </button>
          <button onClick={() => toastManager.info('提示信息')}>
            信息通知
          </button>
        </div>
      </div>

      <div className="demo-section">
        <h2>视频加载错误</h2>
        <div className="demo-buttons">
          <button onClick={simulateVideoError}>
            模拟视频加载失败
          </button>
          <button 
            onClick={() => setVideoErrors([])}
            disabled={videoErrors.length === 0}
          >
            清除所有错误
          </button>
        </div>
        <p className="demo-info">
          当前错误数量: {videoErrors.length}
        </p>
      </div>

      <div className="demo-section">
        <h2>导出恢复</h2>
        <div className="demo-buttons">
          <button onClick={simulateExportRecovery}>
            模拟导出中断
          </button>
          <button onClick={() => ExportRecoveryManager.clear()}>
            清除恢复数据
          </button>
        </div>
        <p className="demo-info">
          恢复数据存在: {ExportRecoveryManager.hasRecoveryData() ? '是' : '否'}
        </p>
      </div>

      <div className="demo-section">
        <h2>错误边界</h2>
        <div className="demo-buttons">
          <button onClick={triggerReactError} className="danger-button">
            触发React错误
          </button>
        </div>
        <p className="demo-info">
          点击后会触发一个React错误，错误边界会捕获并显示友好的错误界面
        </p>
      </div>

      <div className="demo-section">
        <h2>错误日志</h2>
        <div className="demo-buttons">
          <button onClick={exportErrorLogs}>
            导出错误日志
          </button>
          <button onClick={() => {
            errorLogger.clearLogs();
            toastManager.info('错误日志已清除');
          }}>
            清除日志
          </button>
        </div>
        <p className="demo-info">
          当前日志数量: {errorLogger.getLogs().length}
        </p>
      </div>

      <div className="demo-section">
        <h2>内存警告</h2>
        <p className="demo-info">
          内存警告组件会自动监控内存使用情况。
          当内存使用超过80%时会显示警告，超过90%时会显示严重警告。
        </p>
      </div>

      {/* Toast容器 */}
      <ToastContainer messages={messages} onClose={removeToast} />

      {/* 视频加载错误列表 */}
      <VideoLoadErrorList
        errors={videoErrors}
        onRetry={handleRetryVideo}
        onRemove={handleRemoveVideo}
      />

      {/* 内存警告 */}
      <MemoryWarning onOptimize={handleOptimizeMemory} />

      {/* 导出恢复对话框 */}
      {showRecovery && ExportRecoveryManager.load() && (
        <ExportRecovery
          recoveryData={ExportRecoveryManager.load()!}
          onContinue={handleContinueExport}
          onRestart={handleRestartExport}
          onCancel={handleCancelExport}
        />
      )}
    </div>
  );
};

// 包装在错误边界中
export const ErrorHandlingDemoWithBoundary: React.FC = () => {
  return (
    <ErrorBoundary>
      <ErrorHandlingDemo />
    </ErrorBoundary>
  );
};

export default ErrorHandlingDemoWithBoundary;
