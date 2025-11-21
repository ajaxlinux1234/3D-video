/**
 * EffectsPanelWrapper - Wrapper for EffectsPanel with store integration
 */

import { EffectsPanel } from './EffectsPanel';
import { useAppStore } from '../store/useAppStore';
import type { Effect } from '../types';

export function EffectsPanelWrapper() {
  const selectedClipId = useAppStore(state => state.selectedClipId);
  const clips = useAppStore(state => state.currentProject?.clips || []);
  const updateClip = useAppStore(state => state.updateClip);

  const selectedClip = clips.find(clip => clip.id === selectedClipId);
  const activeEffects = selectedClip?.effects || [];

  const handleAddEffect = (effect: Effect) => {
    if (!selectedClipId || !selectedClip) return;
    
    const updatedEffects = [...activeEffects, effect];
    updateClip(selectedClipId, { effects: updatedEffects });
  };

  const handleRemoveEffect = (effectId: string) => {
    if (!selectedClipId || !selectedClip) return;
    
    const updatedEffects = activeEffects.filter(e => e.id !== effectId);
    updateClip(selectedClipId, { effects: updatedEffects });
  };

  const handleUpdateEffect = (effectId: string, updates: Partial<Effect>) => {
    if (!selectedClipId || !selectedClip) return;
    
    const updatedEffects = activeEffects.map(e =>
      e.id === effectId ? { ...e, ...updates } : e
    );
    updateClip(selectedClipId, { effects: updatedEffects });
  };

  return (
    <EffectsPanel
      clipId={selectedClipId}
      activeEffects={activeEffects}
      onAddEffect={handleAddEffect}
      onRemoveEffect={handleRemoveEffect}
      onUpdateEffect={handleUpdateEffect}
    />
  );
}
