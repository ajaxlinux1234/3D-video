/**
 * Video debugging utilities
 */

export function logVideoElementState(video: HTMLVideoElement, label: string = 'Video') {
  console.group(`🎬 ${label} State`);
  console.log('Source:', video.src.substring(0, 50) + '...');
  console.log('Ready State:', getReadyStateText(video.readyState));
  console.log('Paused:', video.paused);
  console.log('Current Time:', video.currentTime);
  console.log('Duration:', video.duration);
  console.log('Video Width:', video.videoWidth);
  console.log('Video Height:', video.videoHeight);
  console.log('Muted:', video.muted);
  console.log('Loop:', video.loop);
  console.log('PlaysinLine:', video.playsInline);
  console.log('Playback Rate:', video.playbackRate);
  console.groupEnd();
}

function getReadyStateText(state: number): string {
  const states = [
    'HAVE_NOTHING (0)',
    'HAVE_METADATA (1)',
    'HAVE_CURRENT_DATA (2)',
    'HAVE_FUTURE_DATA (3)',
    'HAVE_ENOUGH_DATA (4)'
  ];
  return states[state] || `Unknown (${state})`;
}

export function testVideoPlayback(video: HTMLVideoElement): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('🧪 Testing video playback...');
    
    const timeout = setTimeout(() => {
      console.error('❌ Video playback test timed out');
      resolve(false);
    }, 5000);

    video.play()
      .then(() => {
        clearTimeout(timeout);
        console.log('✅ Video playback successful');
        logVideoElementState(video, 'After Play');
        resolve(true);
      })
      .catch((error) => {
        clearTimeout(timeout);
        console.error('❌ Video playback failed:', error);
        resolve(false);
      });
  });
}

export function monitorVideoTexture(
  video: HTMLVideoElement,
  interval: number = 1000
): () => void {
  console.log('📊 Starting video texture monitoring...');
  
  let frameCount = 0;
  let lastTime = video.currentTime;
  
  const intervalId = setInterval(() => {
    const currentTime = video.currentTime;
    const timeChanged = currentTime !== lastTime;
    
    console.log('📊 Video Monitor:', {
      frame: ++frameCount,
      currentTime: currentTime.toFixed(2),
      timeChanged,
      paused: video.paused,
      readyState: getReadyStateText(video.readyState)
    });
    
    lastTime = currentTime;
  }, interval);
  
  return () => {
    clearInterval(intervalId);
    console.log('📊 Stopped video texture monitoring');
  };
}

export async function diagnoseVideoIssue(video: HTMLVideoElement): Promise<string[]> {
  const issues: string[] = [];
  
  console.group('🔍 Diagnosing Video Issues');
  
  // Check if video element exists
  if (!video) {
    issues.push('Video element is null or undefined');
    console.groupEnd();
    return issues;
  }
  
  // Check source
  if (!video.src) {
    issues.push('Video source (src) is not set');
  }
  
  // Check ready state
  if (video.readyState < 2) {
    issues.push(`Video not ready (readyState: ${getReadyStateText(video.readyState)})`);
  }
  
  // Check dimensions
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    issues.push('Video dimensions are 0 (metadata not loaded)');
  }
  
  // Check if paused
  if (video.paused) {
    issues.push('Video is paused (needs to play for texture updates)');
  }
  
  // Check muted (required for autoplay)
  if (!video.muted) {
    issues.push('Video is not muted (may prevent autoplay)');
  }
  
  // Try to play
  try {
    await video.play();
    console.log('✅ Video can play');
  } catch (error) {
    issues.push(`Cannot play video: ${error}`);
  }
  
  // Log all findings
  if (issues.length === 0) {
    console.log('✅ No issues 