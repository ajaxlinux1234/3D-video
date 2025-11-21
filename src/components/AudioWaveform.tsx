/**
 * AudioWaveform - Component for visualizing audio waveforms
 */

import { useEffect, useRef } from 'react';
import type { WaveformData } from '../core/AudioManager';
import './AudioWaveform.css';

interface AudioWaveformProps {
  waveformData: WaveformData;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  currentTime?: number;
}

export function AudioWaveform({
  waveformData,
  width = 800,
  height = 60,
  color = '#667eea',
  backgroundColor = 'transparent',
  currentTime = 0,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    const { peaks } = waveformData;
    const barWidth = width / peaks.length;
    const halfHeight = height / 2;

    ctx.fillStyle = color;

    for (let i = 0; i < peaks.length; i++) {
      const x = i * barWidth;
      const barHeight = peaks[i] * halfHeight;

      // Draw bar from center
      ctx.fillRect(x, halfHeight - barHeight, barWidth - 1, barHeight * 2);
    }

    // Draw playhead if currentTime is provided
    if (currentTime > 0 && waveformData.duration > 0) {
      const progress = currentTime / waveformData.duration;
      const playheadX = progress * width;

      ctx.strokeStyle = '#f56565';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  }, [waveformData, width, height, color, backgroundColor, currentTime]);

  return (
    <canvas
      ref={canvasRef}
      className="audio-waveform"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
