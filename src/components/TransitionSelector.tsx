/**
 * TransitionSelector - UI component for selecting and configuring transitions
 */
import React, { useState } from 'react';
import { TransitionType, type Transition } from '../types';
import { type EasingFunction } from '../core/TransitionSystem';
import './TransitionSelector.css';

interface TransitionSelectorProps {
  onSelectTransition: (transition: Transition) => void;
  currentTransition?: Transition;
}

// Transition metadata for display
const transitionMetadata: Record<string, { name: string; description: string; icon: string }> = {
  [TransitionType.CUBE_FLIP]: {
    name: '立方体翻转',
    description: '3D立方体旋转效果',
    icon: '🎲',
  },
  [TransitionType.SPHERE_WARP]: {
    name: '球形扭曲',
    description: '球面映射扭曲画面',
    icon: '🌐',
  },
  [TransitionType.PARTICLE_BURST]: {
    name: '粒子爆炸',
    description: '粒子爆炸扩散效果',
    icon: '💥',
  },
  [TransitionType.PAGE_TURN]: {
    name: '页面翻转',
    description: '书页翻页效果',
    icon: '📖',
  },
  [TransitionType.DISSOLVE]: {
    name: '溶解',
    description: '基于噪声的像素溶解',
    icon: '✨',
  },
  [TransitionType.GLITCH]: {
    name: '故障',
    description: 'RGB分离和扫描线',
    icon: '📺',
  },
  [TransitionType.ZOOM_BLUR]: {
    name: '缩放模糊',
    description: '径向模糊效果',
    icon: '🌀',
  },
  [TransitionType.RIPPLE]: {
    name: '波纹',
    description: '水波纹扩散效果',
    icon: '🌊',
  },
};

const easingOptions: { value: EasingFunction; label: string }[] = [
  { value: 'linear', label: '线性' },
  { value: 'easeInOut', label: '缓入缓出' },
  { value: 'easeIn', label: '缓入' },
  { value: 'easeOut', label: '缓出' },
  { value: 'easeInCubic', label: '三次缓入' },
  { value: 'easeOutCubic', label: '三次缓出' },
  { value: 'easeInOutCubic', label: '三次缓入缓出' },
];

export const TransitionSelector: React.FC<TransitionSelectorProps> = ({
  onSelectTransition,
  currentTransition,
}) => {
  const [selectedType, setSelectedType] = useState<string>(
    currentTransition?.type || TransitionType.CUBE_FLIP
  );
  const [duration, setDuration] = useState<number>(currentTransition?.duration || 1.0);
  const [easing, setEasing] = useState<EasingFunction>(
    (currentTransition?.easing as EasingFunction) || 'easeInOut'
  );
  const [particleCount, setParticleCount] = useState<number>(1000);

  const handleApply = () => {
    const transition: Transition = {
      type: selectedType as TransitionType,
      duration,
      easing,
      params: {
        particleCount: selectedType === TransitionType.PARTICLE_BURST ? particleCount : undefined,
      },
    };
    onSelectTransition(transition);
  };

  return (
    <div className="transition-selector">
      <div className="transition-selector-header">
        <h3>转场效果</h3>
      </div>

      <div className="transition-grid">
        {Object.entries(transitionMetadata).map(([type, meta]) => (
          <div
            key={type}
            className={`transition-card ${selectedType === type ? 'selected' : ''}`}
            onClick={() => setSelectedType(type)}
          >
            <div className="transition-icon">{meta.icon}</div>
            <div className="transition-name">{meta.name}</div>
            <div className="transition-description">{meta.description}</div>
          </div>
        ))}
      </div>

      <div className="transition-controls">
        <div className="control-group">
          <label htmlFor="duration">时长 (秒)</label>
          <input
            id="duration"
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
          />
          <span className="control-value">{duration.toFixed(1)}s</span>
        </div>

        <div className="control-group">
          <label htmlFor="easing">缓动函数</label>
          <select
            id="easing"
            value={easing}
            onChange={(e) => setEasing(e.target.value as EasingFunction)}
          >
            {easingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {selectedType === TransitionType.PARTICLE_BURST && (
          <div className="control-group">
            <label htmlFor="particleCount">粒子数量</label>
            <input
              id="particleCount"
              type="range"
              min="500"
              max="5000"
              step="100"
              value={particleCount}
              onChange={(e) => setParticleCount(parseInt(e.target.value))}
            />
            <span className="control-value">{particleCount}</span>
          </div>
        )}
      </div>

      <div className="transition-actions">
        <button className="btn-apply" onClick={handleApply}>
          应用转场
        </button>
      </div>
    </div>
  );
};
