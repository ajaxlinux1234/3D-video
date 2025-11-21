/**
 * MaterialLibrary Component
 * Enhanced material library with video import and management
 */

import { useState } from 'react';
import { VideoImporter } from './VideoImporter';
import { VideoLibrary } from './VideoLibrary';
import './MaterialLibrary.css';

export function MaterialLibrary() {
  const [activeTab, setActiveTab] = useState<'import' | 'library'>('library');

  return (
    <div className="material-library">
      <div className="material-tabs">
        <button
          className={`material-tab ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <span className="material-tab-icon">📚</span>
          <span className="material-tab-text">视频库</span>
        </button>
        <button
          className={`material-tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          <span className="material-tab-icon">➕</span>
          <span className="material-tab-text">导入</span>
        </button>
      </div>

      <div className="material-content">
        {activeTab === 'library' ? <VideoLibrary /> : <VideoImporter />}
      </div>
    </div>
  );
}
