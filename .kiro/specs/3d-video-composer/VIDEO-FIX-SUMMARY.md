# 视频显示问题 - 根本性修复方案

## 问题诊断

视频无法显示的根本原因：
1. **视频元素未播放** - VideoTexture只同步时间，但视频元素本身需要调用`play()`
2. **纹理未持续更新** - 视频纹理需要在每一帧标记为`needsUpdate = true`
3. **浏览器自动播放限制** - 需要设置`muted`和`playsInline`属性

## 实施的修复

### 1. VideoTexture.ts - 核心修复
```typescript
// ✅ 添加自动播放逻辑
constructor(video: HTMLVideoElement) {
  // 设置视频属性以支持自动播放
  video.loop = true;
  video.muted = true;  // 必须静音才能自动播放
  video.playsInline = true;  // iOS支持
  
  // 视频准备好后立即播放
  this.ensureVideoPlaying();
}

// ✅ 确保视频播放
private async ensureVideoPlaying(): Promise<void> {
  if (video.paused) {
    await video.play();
  }
}

// ✅ 每帧强制更新纹理
update(): void {
  this.needsUpdate = true;
}
```

### 2. SceneManager.ts - 自动启动和持续更新
```typescript
// ✅ 添加视频时立即播放
addVideoClip(clip, videoElement): VideoPlane {
  const videoPlane = new VideoPlane(clip.id, videoElement, aspectRatio);
  // ... 其他设置 ...
  
  // 立即启动视频播放
  videoPlane.play().catch(err => {
    console.error('Failed to auto-play video:', err);
  });
  
  return videoPlane;
}

// ✅ 渲染时更新所有视频纹理
render(): void {
  // 每帧更新所有视频纹理
  this.videoPlanes.forEach(videoPlane => {
    videoPlane.videoTexture.update();
  });
  
  this.renderer.render(this.scene, this.camera);
}
```

### 3. VideoPlane.ts - 播放控制
```typescript
// ✅ 添加播放/暂停方法
async play(): Promise<void> {
  await this.videoTexture.play();
}

pause(): void {
  this.videoTexture.pause();
}
```

## 修复原理

### 为什么之前不工作？
1. **视频元素处于暂停状态** - 即使设置了`currentTime`，暂停的视频不会更新帧
2. **纹理更新不及时** - Three.js需要明确告知纹理已更新（`needsUpdate = true`）
3. **浏览器限制** - 现代浏览器阻止自动播放有声视频

### 现在如何工作？
1. **视频导入时** → 创建video元素，设置muted/playsInline
2. **添加到场景时** → 立即调用`play()`启动视频
3. **每一帧渲染时** → 强制标记纹理需要更新
4. **结果** → 视频帧持续更新到3D纹理上

## 测试步骤

1. **导入视频**
   ```
   - 点击"导入视频"按钮
   - 选择一个MP4文件
   - 视频应该出现在素材库中
   ```

2. **添加到时间轴**
   ```
   - 将视频拖拽到时间轴
   - 视频应该立即在3D预览窗口中显示
   - 应该能看到视频在播放（即使时间轴暂停）
   ```

3. **播放控制**
   ```
   - 点击播放按钮
   - 视频应该正常播放
   - 时间轴应该同步移动
   ```

## 备用方案（如果仍有问题）

如果上述修复仍然无法解决问题，可以尝试：

### 方案A：使用Canvas 2D代替WebGL
```typescript
// 在VideoPlane中使用canvas作为中间层
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
// 每帧绘制视频到canvas
ctx.drawImage(video, 0, 0);
// 使用canvas作为纹理源
const texture = new THREE.CanvasTexture(canvas);
```

### 方案B：使用MediaStream
```typescript
// 使用captureStream API
const stream = video.captureStream();
const videoTrack = stream.getVideoTracks()[0];
// 创建VideoTexture from stream
```

### 方案C：预渲染帧序列
```typescript
// 将视频预先渲染为图片序列
// 使用TextureLoader加载序列
// 适合短视频，但占用更多内存
```

## 性能优化建议

1. **限制同时播放的视频数量** - 只播放当前可见的视频
2. **降低预览质量** - 使用较低分辨率的视频纹理
3. **使用视频池** - 复用video元素
4. **延迟加载** - 只在需要时加载视频

## 已知限制

1. **浏览器兼容性** - 某些旧浏览器可能不支持自动播放
2. **性能** - 多个高分辨率视频同时播放可能导致性能下降
3. **内存** - 视频纹理占用大量GPU内存

## 下一步

如果视频仍然不显示，请检查：
1. 浏览器控制台是否有错误
2. 视频文件是否损坏
3. WebGL是否正常工作
4. 视频编码格式是否被浏览器支持
