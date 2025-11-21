import React, { useState } from 'react';
import './ExportRecovery.css';

interface ExportRecoveryData {
  projectId: string;
  totalFrames: number;
  renderedFrames: number;
  exportSettings: any;
  timestamp: Date;
  error?: string;
}

interface ExportRecoveryProps {
  recoveryData: ExportRecoveryData;
  onContinue: () => void;
  onRestart: () => void;
  onCancel: () => void;
}

/**
 * 导出失败恢复组件
 */
export const ExportRecovery: React.FC<ExportRecoveryProps> = ({
  recoveryData,
  onContinue,
  onRestart,
  onCancel
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const progress = (recoveryData.renderedFrames / recoveryData.totalFrames) * 100;

  return (
    <div className="export-recovery-overlay">
      <div className="export-recovery-dialog">
        <div className="export-recovery-icon">💾</div>
        
        <h2>导出中断</h2>
        
        <p className="export-recovery-message">
          检测到未完成的导出任务。您可以从上次中断的位置继续，或重新开始。
        </p>

        <div className="export-recovery-progress">
          <div className="progress-info">
            <span>已渲染帧数：</span>
            <strong>{recoveryData.renderedFrames} / {recoveryData.totalFrames}</strong>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-percent">{progress.toFixed(1)}%</div>
        </div>

        {recoveryData.error && (
          <div className="export-recovery-error">
            <strong>错误信息：</strong>
            <p>{recoveryData.error}</p>
          </div>
        )}

        <div className="export-recovery-details">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="details-toggle"
          >
            {showDetails ? '隐藏详情 ▲' : '显示详情 ▼'}
          </button>
          
          {showDetails && (
            <div className="details-content">
              <div className="detail-item">
                <span>项目ID：</span>
                <code>{recoveryData.projectId}</code>
              </div>
              <div className="detail-item">
                <span>中断时间：</span>
                <span>{new Date(recoveryData.timestamp).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span>导出设置：</span>
                <pre>{JSON.stringify(recoveryData.exportSettings, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="export-recovery-actions">
          <button onClick={onContinue} className="btn-continue">
            继续导出
          </button>
          <button onClick={onRestart} className="btn-restart">
            重新开始
          </button>
          <button onClick={onCancel} className="btn-cancel">
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 导出恢复数据管理
 */
export class ExportRecoveryManager {
  private static STORAGE_KEY = 'export_recovery_data';

  static save(data: ExportRecoveryData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save export recovery data:', e);
    }
  }

  static load(): ExportRecoveryData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      // 转换时间戳
      parsed.timestamp = new Date(parsed.timestamp);
      return parsed;
    } catch (e) {
      console.error('Failed to load export recovery data:', e);
      return null;
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear export recovery data:', e);
    }
  }

  static hasRecoveryData(): boolean {
    return this.load() !== null;
  }
}
