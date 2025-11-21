/**
 * EffectsPanel - UI for selecting and configuring effects
 */

import React, { useState } from 'react';
import { EffectType, type Effect } from '../types';
import './EffectsPanel.css';

interface EffectsPanelProps {
  clipId: string | null;
  activeEffects: Effect[];
  onAddEffect: (effect: Effect) => void;
  onRemoveEffect: (effectId: string) => void;
  onUpdateEffect: (effectId: string, updates: Partial<Effect>) => void;
}

interface EffectTemplate {
  type: EffectType;
  name: string;
  description: string;
  icon: string;
  defaultParams: Record<string, unknown>;
}

const EFFECT_TEMPLATES: EffectTemplate[] = [
  {
    type: 'particles',
    name: 'Particles',
    description: 'GPU particle system with customizable emitters',
    icon: '✨',
    defaultParams: {},
  },
  {
    type: 'glow',
    name: 'Bloom/Glow',
    description: 'Bloom effect with god rays and lens flare',
    icon: '💫',
    defaultParams: {},
  },
  {
    type: 'distortion',
    name: 'Distortion',
    description: 'Displacement-based image distortion',
    icon: '🌀',
    defaultParams: {},
  },
  {
    type: 'glitch',
    name: 'Glitch',
    description: 'RGB separation, scanlines, and digital noise',
    icon: '📺',
    defaultParams: {},
  },
  {
    type: 'chromatic',
    name: 'Chromatic Aberration',
    description: 'Lens chromatic aberration effect',
    icon: '🌈',
    defaultParams: {},
  },
  {
    type: 'vignette',
    name: 'Vignette',
    description: 'Edge darkening effect',
    icon: '⚫',
    defaultParams: {},
  },
  {
    type: 'color-grade',
    name: 'Color Grading',
    description: 'LUT-based color grading and tone mapping',
    icon: '🎨',
    defaultParams: {},
  },
  {
    type: 'blur',
    name: 'Blur',
    description: 'Gaussian and radial blur effects',
    icon: '🌫️',
    defaultParams: {},
  },
  {
    type: 'pixelate',
    name: 'Pixelate',
    description: 'Retro pixelation effect',
    icon: '🟦',
    defaultParams: {},
  },
  {
    type: 'rgb-split',
    name: 'RGB Split',
    description: 'Color channel separation',
    icon: '🔴🟢🔵',
    defaultParams: { angle: 0 },
  },
];

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  clipId,
  activeEffects,
  onAddEffect,
  onRemoveEffect,
  onUpdateEffect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'light' | 'distort' | 'color'>('all');

  const handleAddEffect = (template: EffectTemplate) => {
    if (!clipId) return;

    const newEffect: Effect = {
      id: `effect-${crypto.randomUUID()}`,
      type: template.type,
      intensity: 50,
      params: template.defaultParams,
      enabled: true,
    };

    onAddEffect(newEffect);
  };

  const handleIntensityChange = (effectId: string, intensity: number) => {
    onUpdateEffect(effectId, { intensity });
  };

  const handleToggleEffect = (effectId: string, enabled: boolean) => {
    onUpdateEffect(effectId, { enabled });
  };

  const filterEffects = (template: EffectTemplate): boolean => {
    if (selectedCategory === 'all') return true;
    
    const categories = {
      light: ['glow', 'particles'],
      distort: ['distortion', 'glitch', 'rgb-split'],
      color: ['chromatic', 'vignette', 'color-grade', 'blur', 'pixelate'],
    };
    
    return categories[selectedCategory]?.includes(template.type) || false;
  };

  if (!clipId) {
    return (
      <div className="effects-panel">
        <div className="effects-panel-empty">
          <p>Select a video clip to add effects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="effects-panel">
      <div className="effects-panel-header">
        <h3>Effects & Filters</h3>
        <div className="effects-category-tabs">
          <button
            className={selectedCategory === 'all' ? 'active' : ''}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          <button
            className={selectedCategory === 'light' ? 'active' : ''}
            onClick={() => setSelectedCategory('light')}
          >
            Light
          </button>
          <button
            className={selectedCategory === 'distort' ? 'active' : ''}
            onClick={() => setSelectedCategory('distort')}
          >
            Distort
          </button>
          <button
            className={selectedCategory === 'color' ? 'active' : ''}
            onClick={() => setSelectedCategory('color')}
          >
            Color
          </button>
        </div>
      </div>

      <div className="effects-panel-content">
        {/* Available Effects */}
        <div className="effects-library">
          <h4>Available Effects</h4>
          <div className="effects-grid">
            {EFFECT_TEMPLATES.filter(filterEffects).map((template) => (
              <div
                key={template.type}
                className="effect-card"
                onClick={() => handleAddEffect(template)}
              >
                <div className="effect-icon">{template.icon}</div>
                <div className="effect-info">
                  <div className="effect-name">{template.name}</div>
                  <div className="effect-description">{template.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Effects */}
        {activeEffects.length > 0 && (
          <div className="active-effects">
            <h4>Active Effects ({activeEffects.length})</h4>
            <div className="effects-list">
              {activeEffects.map((effect) => {
                const template = EFFECT_TEMPLATES.find(t => t.type === effect.type);
                return (
                  <div key={effect.id} className="active-effect-item">
                    <div className="active-effect-header">
                      <span className="effect-icon">{template?.icon}</span>
                      <span className="effect-name">{template?.name}</span>
                      <div className="active-effect-controls">
                        <button
                          className={`toggle-btn ${effect.enabled ? 'enabled' : 'disabled'}`}
                          onClick={() => handleToggleEffect(effect.id, !effect.enabled)}
                          title={effect.enabled ? 'Disable' : 'Enable'}
                        >
                          {effect.enabled ? '👁️' : '👁️‍🗨️'}
                        </button>
                        <button
                          className="remove-btn"
                          onClick={() => onRemoveEffect(effect.id)}
                          title="Remove effect"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="active-effect-controls-panel">
                      <label>
                        Intensity: {effect.intensity}%
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={effect.intensity}
                          onChange={(e) => handleIntensityChange(effect.id, Number(e.target.value))}
                          disabled={!effect.enabled}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
