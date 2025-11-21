/**
 * VideoLibrary Component
 * Displays imported videos with thumbnails and metadata
 */

import { useAppStore, useClipActions } from '../store/useAppStore';
import { useVideoManager } from '../core/useVideoManager';
import { formatDuration, formatFileSize, formatResolution, getVideoOrientation } from '../utils/fileUtils';
import type { VideoClip } from '../types';

export function VideoLibrary() {
  const videos = useAppStore(state => state.videos);
  const project = useAppStore(state => state.currentProject);
  const { removeVideo } = useVideoManager();
  const { addClip } = useClipActions();

  const videoList = Array.from(videos.values());

  const handleAddToTimeline = (videoId: string) => {
    const video = videos.get(videoId);
    if (!video) return;

    // Calculate start time (place at the end of existing clips)
    const lastClipEndTime = project?.clips.reduce(
      (max, clip) => Math.max(max, clip.startTime + clip.duration),
      0
    ) || 0;

    // Create new clip
    const newClip: VideoClip = {
      id: crypto.randomUUID(),
      videoId: videoId,
      startTime: lastClipEndTime,
      duration: video.metadata.duration,
      trimStart: 0,
      trimEnd: video.metadata.duration,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      effects: [],
    };

    addClip(newClip);
    console.log('Added clip to timeline:', newClip);
  };

  if (videoList.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        <p>暂无视频</p>
        <p style={{ fontSize: '14px' }}>请导入视频以开始编辑</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>视频素材库</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        marginTop: '20px',
      }}>
        {videoList.map(video => {
          const orientation = getVideoOrientation(
            video.metadata.width,
            video.metadata.height
          );

          return (
            <div
              key={video.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: '100%',
                height: '160px',
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <img
                  src={video.thumbnail}
                  alt={video.file.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>

              {/* Info */}
              <div style={{ padding: '12px' }}>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }} title={video.file.name}>
                  {video.file.name}
                </h3>

                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>时长:</strong> {formatDuration(video.metadata.duration)}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>分辨率:</strong> {formatResolution(video.metadata.width, video.metadata.height)}
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: orientation === 'portrait' ? '#4CAF50' : '#FF9800',
                      color: 'white',
                      borderRadius: '3px',
                      fontSize: '10px',
                    }}>
                      {orientation === 'portrait' ? '竖屏' : orientation === 'landscape' ? '横屏' : '方形'}
                    </span>
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>帧率:</strong> {video.metadata.fps} fps
                  </div>
                  <div>
                    <strong>大小:</strong> {formatFileSize(video.file.size)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleAddToTimeline(video.id)}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    添加到时间轴
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定要删除 "${video.file.name}" 吗？`)) {
                        removeVideo(video.id);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

