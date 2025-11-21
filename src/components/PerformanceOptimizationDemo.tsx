/**
 * PerformanceOptimizationDemo - Demonstrates performance optimization features
 */

import { useEffect, useState } from 'react';
import { useSceneManager } from '../core/useSceneManager';
import { usePerformanceOptimizer } from '../core/usePerformanceOptimizer';
import './PerformanceOptimizationDemo.css';

export function PerformanceOptimizationDemo() {
  const { sceneManager } = useSceneManager();
  const optimizer = sceneManager?.getPerformanceOptimizer() || null;
  const {
    stats,
    config,
    updateConfig,
    getMemoryInfo,
    clearCaches,
    prewarmTexturePool,
  } = usePerformanceOptimizer(optimizer);

  const [memoryInfo, setMemoryInfo] = useState<string>('');

  // Update memory info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (optimizer) {
        setMemoryInfo(getMemoryInfo());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [optimizer, getMemoryInfo]);

  if (!optimizer || !stats || !config) {
    return (
      <div className="performance-optimization-demo">
        <h2>性能优化</h2>
        <p>性能优化器未初始化</p>
      </div>
    );
  }

  return (
    <div className="performance-optimization-demo">
      <h2>性能优化系统</h2>

      {/* Configuration */}
      <section className="optimization-config">
        <h3>优化配置</h3>
        <div className="config-options">
          <label>
            <input
              type="checkbox"
              checked={config.enableLOD}
              onChange={(e) => updateConfig({ enableLOD: e.target.checked })}
            />
            启用 LOD 系统
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.enableFrustumCulling}
              onChange={(e) => updateConfig({ enableFrustumCulling: e.target.checked })}
            />
            启用视锥剔除
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.enableCaching}
              onChange={(e) => updateConfig({ enableCaching: e.target.checked })}
            />
            启用视频缓存
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.enableTexturePooling}
              onChange={(e) => updateConfig({ enableTexturePooling: e.target.checked })}
            />
            启用纹理池
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.enableMemoryMonitoring}
              onChange={(e) => updateConfig({ enableMemoryMonitoring: e.target.checked })}
            />
            启用内存监控
          </label>
        </div>

        <div className="config-sliders">
          <label>
            最大缓存视频数: {config.maxCachedVideos}
            <input
              type="range"
              min="3"
              max="20"
              value={config.maxCachedVideos}
              onChange={(e) => updateConfig({ maxCachedVideos: parseInt(e.target.value) })}
            />
          </label>
          <label>
            纹理池大小: {config.maxTexturePoolSize}
            <input
              type="range"
              min="5"
              max="30"
              value={config.maxTexturePoolSize}
              onChange={(e) => updateConfig({ maxTexturePoolSize: parseInt(e.target.value) })}
            />
          </label>
        </div>
      </section>

      {/* LOD Statistics */}
      <section className="optimization-stats">
        <h3>LOD 系统</h3>
        <div className="stat-grid">
          <div className="stat-item">
            <span className="stat-label">高质量:</span>
            <span className="stat-value">{stats.lod.high}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">中质量:</span>
            <span className="stat-value">{stats.lod.medium}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">低质量:</span>
            <span className="stat-value">{stats.lod.low}</span>
          </div>
        </div>
      </section>

      {/* Frustum Culling Statistics */}
      <section className="optimization-stats">
        <h3>视锥剔除</h3>
        <div className="stat-grid">
          <div className="stat-item">
            <span className="stat-label">总数:</span>
            <span className="stat-value">{stats.culling.total}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">可见:</span>
            <span className="stat-value">{stats.culling.visible}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">剔除:</span>
            <span className="stat-value">{stats.culling.culled}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">剔除率:</span>
            <span className="stat-value">{stats.culling.cullingRate.toFixed(1)}%</span>
          </div>
        </div>
      </section>

      {/* Cache Statistics */}
      <section className="optimization-stats">
        <h3>视频缓存 (LRU)</h3>
        <div className="stat-grid">
          <div className="stat-item">
            <span className="stat-label">大小:</span>
            <span className="stat-value">{stats.cache.size} / {stats.cache.capacity}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">命中:</span>
            <span className="stat-value">{stats.cache.hits}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">未命中:</span>
            <span className="stat-value">{stats.cache.misses}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">命中率:</span>
            <span className="stat-value">{stats.cache.hitRate.toFixed(1)}%</span>
          </div>
        </div>
      </section>

      {/* Texture Pool Statistics */}
      <section className="optimization-stats">
        <h3>纹理池</h3>
        <div className="stat-grid">
          <div className="stat-item">
            <span className="stat-label">总纹理:</span>
            <span className="stat-value">{stats.texturePool.totalTextures}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">可用:</span>
            <span className="stat-value">{stats.texturePool.availableTextures}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">使用中:</span>
            <span className="stat-value">{stats.texturePool.inUseTextures}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">复用率:</span>
            <span className="stat-value">{stats.texturePool.reuseRate.toFixed(1)}%</span>
          </div>
        </div>
      </section>

      {/* Memory Statistics */}
      {stats.memory && (
        <section className="optimization-stats">
          <h3>内存监控</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">已使用:</span>
              <span className="stat-value">{stats.memory.usedMB.toFixed(1)} MB</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">限制:</span>
              <span className="stat-value">{stats.memory.limitMB.toFixed(1)} MB</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">使用率:</span>
              <span className="stat-value">{stats.memory.usagePercentage.toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">警告级别:</span>
              <span className={`stat-value warning-${stats.memory.warningLevel}`}>
                {stats.memory.warningLevel === 'normal' ? '正常' : 
                 stats.memory.warningLevel === 'warning' ? '警告' : '严重'}
              </span>
            </div>
          </div>
          <div className="memory-info">{memoryInfo}</div>
        </section>
      )}

      {/* Actions */}
      <section className="optimization-actions">
        <h3>操作</h3>
        <div className="action-buttons">
          <button onClick={clearCaches}>清除缓存</button>
          <button onClick={() => prewarmTexturePool(10)}>预热纹理池 (10)</button>
        </div>
      </section>

      {/* Info */}
      <section className="optimization-info">
        <h3>优化说明</h3>
        <ul>
          <li><strong>LOD 系统:</strong> 根据相机距离自动调整视频纹理质量</li>
          <li><strong>视锥剔除:</strong> 只渲染相机视野内的视频片段</li>
          <li><strong>LRU 缓存:</strong> 限制同时加载的视频数量，自动释放最少使用的视频</li>
          <li><strong>纹理池:</strong> 复用纹理对象，减少内存分配开销</li>
          <li><strong>内存监控:</strong> 实时监控内存使用，自动触发清理</li>
        </ul>
      </section>
    </div>
  );
}
