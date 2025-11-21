/**
 * PreviewErrorLog - Display and manage preview errors
 * 
 * Shows error messages with timestamps and types
 * Allows clearing error log
 */

import { useState } from 'react';
import type { PreviewError } from '../core/PreviewController';
import './PreviewErrorLog.css';

export interface PreviewErrorLogProps {
  errors: PreviewError[];
  onClear?: () => void;
  maxVisible?: number;
}

export function PreviewErrorLog({
  errors,
  onClear,
  maxVisible = 10,
}: PreviewErrorLogProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedError, setSelectedError] = useState<PreviewError | null>(null);

  if (errors.length === 0) {
    return null;
  }

  const visibleErrors = expanded ? errors : errors.slice(-maxVisible);
  const hasMore = errors.length > maxVisible && !expanded;

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getErrorIcon = (type: PreviewError['type']): string => {
    switch (type) {
      case 'video_sync': return '🎬';
      case 'playback': return '▶️';
      case 'render': return '🎨';
      default: return '⚠️';
    }
  };

  const getErrorColor = (type: PreviewError['type']): string => {
    switch (type) {
      case 'video_sync': return '#FF9800';
      case 'playback': return '#F44336';
      case 'render': return '#E91E63';
      default: return '#9E9E9E';
    }
  };

  return (
    <div className="preview-error-log">
      <div className="error-log-header">
        <div className="header-left">
          <span className="error-icon">⚠️</span>
          <span className="error-title">
            Errors ({errors.length})
          </span>
        </div>
        <div className="header-right">
          {hasMore && (
            <button
              className="expand-button"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show Less' : `Show All (${errors.length})`}
            </button>
          )}
          <button
            className="clear-button"
            onClick={onClear}
            title="Clear error log"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="error-log-content">
        {visibleErrors.map((error, index) => (
          <div
            key={`${error.timestamp}-${index}`}
            className={`error-item ${selectedError === error ? 'selected' : ''}`}
            onClick={() => setSelectedError(selectedError === error ? null : error)}
            style={{ borderLeftColor: getErrorColor(error.type) }}
          >
            <div className="error-item-header">
              <span className="error-type-icon">
                {getErrorIcon(error.type)}
              </span>
              <span className="error-type">
                {error.type.replace('_', ' ')}
              </span>
              <span className="error-timestamp">
                {formatTimestamp(error.timestamp)}
              </span>
            </div>
            <div className="error-message">
              {error.message}
            </div>
            {selectedError === error && error.details ? (
              <div className="error-details">
                <div className="details-label">Details:</div>
                <pre className="details-content">
                  {typeof error.details === 'string'
                    ? error.details
                    : JSON.stringify(error.details, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
