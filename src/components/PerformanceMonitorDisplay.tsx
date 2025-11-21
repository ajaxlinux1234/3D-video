/**
 * PerformanceMonitorDisplay - Real-time performance metrics display
 * 
 * Shows:
 * - FPS (frames per second)
 * - Frame time
 * - Render time
 * - Memory usage (if available)
 * - Current quality level
 * - Quality controls
 */

import { useState, useEffect } from 'react';
import type { SceneManager } from '../core/SceneManager';
import type { QualityLevel, PerformanceMetrics } from '../core/PerformanceMonitor';
import './PerformanceMonitorDisplay.css';

export interface PerformanceMonitorDisplayProps {
  sceneManager: SceneManager | null;
  updateInterval?: number;
  showDetailed?: boolean;
}

export function PerformanceMonitorDisplay({
  sceneManager,
  updateInterval = 500,
  showDetailed = false,
}: PerformanceMonitorDisplayProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    renderTime: 0,
  });
  const [quality, setQuality] = useState<QualityLevel>('high');
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Update metrics periodically
  useEffect(() => {
    if (!sceneManager) return;

    const interval = setInterval(() => {
      const newMetrics = sceneManager.getPerformanceMetrics();
      const newQuality = sceneManager.getQuality();
      
      setMetrics(newMetrics);
      setQuality(newQuality);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [sceneManager, updateInterval]);

  // Handle quality change
  const handleQualityChange = (newQuality: QualityLevel) => {
    if (sceneManager) {
      sceneManager.setQuality(newQuality);
      setQuality(newQuality);
    }
  };

  // Handle auto-adjust toggle
  const handleAutoAdjustToggle = () => {
    if (sceneManager) {
      const newAutoAdjust = !autoAdjust;
      sceneManager.setAutoAdjustQuality(newAutoAdjust);
      setAutoAdjust(newAutoAdjust);
    }
  };

  // Get FPS color based on performance
  const getFpsColor = (fps: number): string => {
    if (fps >= 55) return '#4CAF50'; // Green
    if (fps >= 30) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  // Get quality badge color
  const getQualityColor = (q: QualityLevel): string => {
    switch (q) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'low': return '#FF9800';
    }
  };

  if (!sceneManager) {
    return (
      <div className="performance-monitor disabled">
        <div className="monitor-header">
          <span className="monitor-title">Performance</span>
          <span className="monitor-status">Not initialized</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`performance-monitor ${expanded ? 'expanded' : ''}`}>
      <div className="monitor-header" onClick={() => setExpanded(!expanded)}>
        <span className="monitor-title">⚡ Performance</span>
        <span className="monitor-toggle">{expanded ? '▼' : '▶'}</span>
      </div>

      <div className="monitor-content">
        {/* Main metrics */}
        <div className="metrics-main">
          <div className="metric-item">
            <span className="metric-label">FPS</span>
            <span 
              className="metric-value large"
              style={{ color: getFpsColor(metrics.fps) }}
            >
              {metrics.fps}
            </span>
          </div>

          <div className="metric-item">
            <span className="metric-label">Quality</span>
            <span 
              className="metric-value badge"
              style={{ 
                backgroundColor: getQualityColor(quality),
                color: '#fff'
              }}
            >
              {quality.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Detailed metrics */}
        {(expanded || showDetailed) && (
          <>
            <div className="metrics-detailed">
              <div className="metric-row">
                <span className="metric-label">Frame Time:</span>
                <span className="metric-value">
                  {metrics.frameTime.toFixed(2)} ms
                </span>
              </div>

              <div className="metric-row">
                <span className="metric-label">Render Time:</span>
                <span className="metric-value">
                  {metrics.renderTime.toFixed(2)} ms
                </span>
              </div>

              {metrics.memoryUsage !== undefined && (
                <div className="metric-row">
                  <span className="metric-label">Memory:</span>
                  <span className="metric-value">
                    {metrics.memoryUsage.toFixed(1)} MB
                  </span>
                </div>
              )}
            </div>

            {/* Quality controls */}
            <div className="quality-controls">
              <div className="control-group">
                <label className="control-label">
                  <input
                    type="checkbox"
                    checked={autoAdjust}
                    onChange={handleAutoAdjustToggle}
                  />
                  <span>Auto-adjust quality</span>
                </label>
              </div>

              {!autoAdjust && (
                <div className="control-group">
                  <span className="control-label">Manual Quality:</span>
                  <div className="quality-buttons">
                    <button
                      className={`quality-button ${quality === 'low' ? 'active' : ''}`}
                      onClick={() => handleQualityChange('low')}
                    >
                      Low
                    </button>
                    <button
                      className={`quality-button ${quality === 'medium' ? 'active' : ''}`}
                      onClick={() => handleQualityChange('medium')}
                    >
                      Medium
                    </button>
                    <button
                      className={`quality-button ${quality === 'high' ? 'active' : ''}`}
                      onClick={() => handleQualityChange('high')}
                    >
                      High
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Performance tips */}
            {metrics.fps < 30 && (
              <div className="performance-warning">
                <span className="warning-icon">⚠️</span>
                <span className="warning-text">
                  Low FPS detected. Consider reducing quality or closing other applications.
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
