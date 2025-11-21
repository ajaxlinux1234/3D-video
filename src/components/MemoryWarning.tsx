import React, { useEffect, useState } from 'react';
import './MemoryWarning.css';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * 获取内存使用信息
 */
const getMemoryInfo = (): MemoryInfo | null => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
  }
  return null;
};

/**
 * 格式化字节数
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

interface MemoryWarningProps {
  onOptimize?: () => void;
}

/**
 * 内存警告组件
 * 监控内存使用并在超过阈值时显示警告
 */
export const MemoryWarning: React.FC<MemoryWarningProps> = ({ onOptimize }) => {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showCritical, setShowCritical] = useState(false);

  useEffect(() => {
    const checkMemory = () => {
      const info = getMemoryInfo();
      if (!info) return;

      setMemoryInfo(info);

      const usagePercent = (info.usedJSHeapSize / info.jsHeapSizeLimit) * 100;

      // 80%以上显示警告
      if (usagePercent >= 80 && usagePercent < 90) {
        setShowWarning(true);
        setShowCritical(false);
      }
      // 90%以上显示严重警告
      else if (usagePercent >= 90) {
        setShowWarning(false);
        setShowCritical(true);
      }
      // 低于80%隐藏警告
      else if (usagePercent < 75) {
        setShowWarning(false);
        setShowCritical(false);
      }
    };

    // 每5秒检查一次
    const interval = setInterval(checkMemory, 5000);
    checkMemory(); // 立即检查一次

    return () => clearInterval(interval);
  }, []);

  const handleOptimize = () => {
    if (onOptimize) {
      onOptimize();
    }
    // 触发垃圾回收（如果可能）
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  };

  const handleDismiss = () => {
    setShowWarning(false);
    setShowCritical(false);
  };

  if (!memoryInfo) {
    return null;
  }

  const usagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;

  if (showCritical) {
    return (
      <div className="memory-warning memory-critical">
        <div className="memory-warning-content">
          <div className="memory-icon">🔴</div>
          <div className="memory-info">
            <h3>内存严重不足</h3>
            <p>
              内存使用率：{usagePercent.toFixed(1)}% 
              ({formatBytes(memoryInfo.usedJSHeapSize)} / {formatBytes(memoryInfo.jsHeapSizeLimit)})
            </p>
            <p className="memory-suggestion">
              应用可能会变慢或崩溃。建议立即优化或减少视频数量。
            </p>
          </div>
          <div className="memory-actions">
            <button onClick={handleOptimize} className="btn-optimize">
              立即优化
            </button>
            <button onClick={handleDismiss} className="btn-dismiss">
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showWarning) {
    return (
      <div className="memory-warning memory-high">
        <div className="memory-warning-content">
          <div className="memory-icon">⚠️</div>
          <div className="memory-info">
            <h3>内存使用较高</h3>
            <p>
              内存使用率：{usagePercent.toFixed(1)}% 
              ({formatBytes(memoryInfo.usedJSHeapSize)} / {formatBytes(memoryInfo.jsHeapSizeLimit)})
            </p>
            <p className="memory-suggestion">
              建议降低预览质量或减少同时加载的视频数量。
            </p>
          </div>
          <div className="memory-actions">
            <button onClick={handleOptimize} className="btn-optimize">
              优化
            </button>
            <button onClick={handleDismiss} className="btn-dismiss">
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
