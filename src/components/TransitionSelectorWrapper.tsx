/**
 * TransitionSelectorWrapper - Wrapper for TransitionSelector with store integration
 */

import { TransitionSelector } from './TransitionSelector';
import { useAppStore } from '../store/useAppStore';
import type { Transition } from '../types';

export function TransitionSelectorWrapper() {
  const selectedClipId = useAppStore(state => state.selectedClipId);
  const clips = useAppStore(state => state.currentProject?.clips || []);
  const updateClip = useAppStore(state => state.updateClip);

  const selectedClip = clips.find(clip => clip.id === selectedClipId);

  const handleSelectTransition = (transition: Transition) => {
    if (!selectedClipId || !selectedClip) {
      alert('请先选择一个视频片段');
      return;
    }
    
    updateClip(selectedClipId, { transition });
    console.log('Applied transition:', transition);
  };

  return (
    <TransitionSelector
      onSelectTransition={handleSelectTransition}
      currentTransition={selectedClip?.transition}
    />
  );
}
