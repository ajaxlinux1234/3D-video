/**
 * TransitionDemo - Example component demonstrating transition usage
 */
import React, { useState, useEffect } from 'react';
import { TransitionSelector } from './TransitionSelector';
import { useTransitionSystem } from '../core/useTransitionSystem';
import { useSceneManager } from '../core/useSceneManager';
import { TransitionType, type Transition } from '../types';

/**
 * Example component showing how to integrate transitions
 */
export const TransitionDemo: React.FC = () => {
  const { sceneManager } = useSceneManager();
  const { addTransition: _addTransition, updateTransitions } = useTransitionSystem(sceneManager);
  const [selectedTransition, setSelectedTransition] = useState<Transition>({
    type: TransitionType.CUBE_FLIP,
    duration: 1.0,
    easing: 'easeInOut',
    params: {},
  });

  // Example: Update transitions on every frame
  useEffect(() => {
    if (!sceneManager) return;

    let animationFrameId: number;
    
    const animate = () => {
      const currentTime = sceneManager.getCurrentTime();
      updateTransitions(currentTime);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [sceneManager, updateTransitions]);

  const handleSelectTransition = (transition: Transition) => {
    setSelectedTransition(transition);
    console.log('Selected transition:', transition);
    
    // Example: Apply to clips when you have them
    // const fromClip = ...; // Get from store
    // const toClip = ...;   // Get from store
    // addTransition(fromClip, toClip, transition);
  };

  return (
    <div className="transition-demo">
      <TransitionSelector
        onSelectTransition={handleSelectTransition}
        currentTransition={selectedTransition}
      />
      
      <div className="demo-info">
        <h4>使用说明</h4>
        <p>1. 选择一个转场效果</p>
        <p>2. 调整时长和缓动函数</p>
        <p>3. 在时间轴上选择两个相邻的视频片段</p>
        <p>4. 点击"应用转场"按钮</p>
      </div>
    </div>
  );
};
