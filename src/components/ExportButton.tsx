/**
 * ExportButton - Button to trigger export dialog
 */
import { useState } from 'react';
import { ExportDialog } from './ExportDialog';
import { ExportManager } from '../core/ExportManager';
import { AudioManager } from '../core/AudioManager';
import './ExportButton.css';

interface ExportButtonProps {
  exportManager: ExportManager | null;
  audioManager: AudioManager | null;
  disabled?: boolean;
}

export function ExportButton({
  exportManager,
  audioManager,
  disabled = false,
}: ExportButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button
        className="export-button"
        onClick={() => setShowDialog(true)}
        disabled={disabled}
        title="导出视频"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>导出视频</span>
      </button>

      {showDialog && (
        <ExportDialog
          exportManager={exportManager}
          audioManager={audioManager}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
