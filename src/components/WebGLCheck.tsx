import React, { useState } from 'react';
import { checkWebGLSupport } from '../utils/webgl';
import './WebGLCheck.css';

interface WebGLCheckProps {
  children: React.ReactNode;
}

/**
 * WebGL支持检测组件
 * 如果不支持WebGL，显示升级建议
 */
export const WebGLCheck: React.FC<WebGLCheckProps> = ({ children }) => {
  // Use lazy initializer to check WebGL support only once on mount
  const [webglInfo] = useState(() => checkWebGLSupport());

  if (webglInfo === null) {
    return (
      <div className="webgl-loading">
        <div className="spinner"></div>
        <p>正在检测浏览器兼容性...</p>
      </div>
    );
  }

  if (!webglInfo.supported) {
    return (
      <div className="webgl-not-supported">
        <div className="webgl-content">
          <div className="webgl-icon">🚫</div>
          <h1>浏览器不支持WebGL</h1>
          <p className="webgl-description">
            此应用需要WebGL支持才能运行3D渲染功能。
            您的浏览器似乎不支持或已禁用WebGL。
          </p>
          
          <div className="webgl-solutions">
            <h2>解决方案：</h2>
            <ul>
              <li>
                <strong>更新浏览器：</strong>
                <span>请升级到最新版本的Chrome、Firefox、Safari或Edge浏览器</span>
              </li>
              <li>
                <strong>启用WebGL：</strong>
                <span>检查浏览器设置中是否禁用了硬件加速或WebGL</span>
              </li>
              <li>
                <strong>更新显卡驱动：</strong>
                <span>确保您的显卡驱动程序是最新版本</span>
              </li>
            </ul>
          </div>

          <div className="webgl-browsers">
            <h3>推荐浏览器：</h3>
            <div className="browser-list">
              <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer" className="browser-link">
                <span className="browser-icon">🌐</span>
                <span>Chrome</span>
              </a>
              <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener noreferrer" className="browser-link">
                <span className="browser-icon">🦊</span>
                <span>Firefox</span>
              </a>
              <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener noreferrer" className="browser-link">
                <span className="browser-icon">🌊</span>
                <span>Edge</span>
              </a>
              <a href="https://www.apple.com/safari/" target="_blank" rel="noopener noreferrer" className="browser-link">
                <span className="browser-icon">🧭</span>
                <span>Safari</span>
              </a>
            </div>
          </div>

          <button onClick={() => window.location.reload()} className="retry-button">
            重新检测
          </button>
        </div>
      </div>
    );
  }

  if (webglInfo.version === 1) {
    // WebGL 1.0 支持，但建议升级
    console.warn('WebGL 1.0 detected. WebGL 2.0 is recommended for better performance.');
  }

  return <>{children}</>;
};
