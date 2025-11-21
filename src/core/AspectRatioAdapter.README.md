# AspectRatioAdapter - 9:16 竖屏适配系统

## 概述

AspectRatioAdapter 是一个专门用于处理视频9:16竖屏适配的工具类。它提供了多种适配模式，帮助将横屏或其他比例的视频转换为适合抖音/TikTok的竖屏格式。

## 核心功能

### 1. 画布比例锁定

系统默认锁定为9:16（1080x1920）竖屏格式，确保所有输出都符合抖音标准。

```typescript
// 目标比例
TARGET_ASPECT_RATIO = 9 / 16
TARGET_WIDTH = 1080
TARGET_HEIGHT = 1920
```

### 2. 视频检测

自动分析视频的宽高比，判断是否需要适配：

```typescript
const info = AspectRatioAdapter.analyzeVideo(videoElement);
// {
//   width: 1920,
//   height: 1080,
//   aspectRatio: 1.78,
//   isLandscape: true,
//   isPortrait: false,
//   needsAdaptation: true
// }
```

### 3. 三种适配模式

#### 自动裁剪模式 (Auto Crop)

智能裁剪横屏视频的中心区域，适合人物居中的场景。

**特点：**
- 保持视频清晰度
- 可调整裁剪位置（水平/垂直）
- 适合人物特写、访谈等内容

**实现原理：**
通过修改Three.js平面几何的UV坐标来实现纹理裁剪：

```typescript
AspectRatioAdapter.applyAutoCrop(mesh, videoElement, {
  x: 0.5, // 水平居中
  y: 0.5  // 垂直居中
});
```

**UV坐标计算：**
```typescript
// 计算裁剪宽度
const cropWidth = videoHeight * (9/16);
const cropRatio = cropWidth / videoWidth;

// 根据位置调整UV偏移
const uOffset = (1 - cropRatio) * cropPosition.x;
const uScale = cropRatio;

// 更新UV坐标
for (let i = 0; i < uvAttribute.count; i++) {
  const u = uvAttribute.getX(i);
  uvAttribute.setX(i, u * uScale + uOffset);
}
```

#### 缩放适配模式 (Scale Fit)

等比缩放视频并添加上下黑边（letterbox），保留完整画面。

**特点：**
- 保留完整视频内容
- 添加黑边填充
- 适合风景、全景等内容

**实现原理：**
计算缩放比例，调整mesh的scale属性：

```typescript
AspectRatioAdapter.applyScaleFit(mesh, videoElement);
```

**缩放计算：**
```typescript
const targetAspectRatio = 9 / 16;
const sourceAspectRatio = videoWidth / videoHeight;

if (sourceAspectRatio > targetAspectRatio) {
  // 视频更宽 - 适配宽度
  scaleY = targetAspectRatio / sourceAspectRatio;
} else {
  // 视频更高 - 适配高度
  scaleX = sourceAspectRatio / targetAspectRatio;
}
```

#### 背景模糊模式 (Blur Background)

将视频作为模糊背景，原视频居中显示，创造更好的视觉效果。

**特点：**
- 视觉效果最佳
- 无黑边，画面饱满
- 适合精美内容、产品展示

**实现原理：**
创建两层mesh：背景层（模糊）+ 前景层（原视频）

```typescript
const group = AspectRatioAdapter.applyBlurBackground(
  scene,
  mesh,
  videoElement,
  50 // 模糊强度
);
```

### 4. 安全区域系统

提供可视化的安全区域参考线，确保重要内容不被裁切。

**安全区域边距：**
- 默认5%边距（可配置）
- 绿色参考线显示安全区域
- 红色边界线显示画布边界

**创建参考线：**
```typescript
const safeAreaLines = AspectRatioAdapter.createSafeAreaLines();
const boundaryLines = AspectRatioAdapter.createCanvasBoundaryLines();
scene.add(safeAreaLines);
scene.add(boundaryLines);
```

### 5. 边界检测与警告

实时检测视频片段是否超出安全区域，并提供警告。

```typescript
// 检测单个片段
const isOutside = AspectRatioAdapter.isOutsideSafeArea(mesh);

// 获取所有超出边界的片段
const clipsOutside = sceneManager.getClipsOutsideSafeArea();
```

**检测逻辑：**
```typescript
// 计算片段边界
const left = position.x - width / 2;
const right = position.x + width / 2;
const top = position.y + height / 2;
const bottom = position.y - height / 2;

// 与安全区域比较
const safeLeft = -canvasWidth / 2 + margin;
const safeRight = canvasWidth / 2 - margin;
// ...

return left < safeLeft || right > safeRight || 
       top > safeTop || bottom < safeBottom;
```

## 使用方法

### 在SceneManager中使用

```typescript
// 添加视频片段时自动应用适配
const videoPlane = sceneManager.addVideoClip(clip, videoElement);

// 手动更新适配设置
sceneManager.updateAspectRatioAdaptation(
  clipId,
  videoElement,
  {
    mode: 'auto-crop',
    enabled: true,
    cropPosition: { x: 0.5, y: 0.5 }
  }
);

// 检测是否需要适配
const adaptation = sceneManager.detectAspectRatioAdaptation(videoElement);
```

### 在React组件中使用

```typescript
import { useAspectRatioAdapter } from '@core/useAspectRatioAdapter';

function MyComponent() {
  const { 
    clipsOutsideSafeArea,
    detectAdaptation,
    isClipOutsideSafeArea,
    showSafeArea 
  } = useAspectRatioAdapter(sceneManager);

  // 检测视频
  const adaptation = detectAdaptation(videoElement);
  
  // 检查特定片段
  const isOutside = isClipOutsideSafeArea(clipId);
  
  return (
    <div>
      {clipsOutsideSafeArea.length > 0 && (
        <Warning clips={clipsOutsideSafeArea} />
      )}
    </div>
  );
}
```

### UI组件

#### AspectRatioPanel

提供完整的适配设置界面：

```typescript
import { AspectRatioPanel } from '@components/AspectRatioPanel';

<AspectRatioPanel />
```

功能：
- 启用/禁用适配
- 选择适配模式
- 调整裁剪位置
- 调整模糊强度
- 切换安全区域显示

#### AspectRatioWarnings

显示边界警告：

```typescript
import { AspectRatioWarnings } from '@components/AspectRatioWarnings';

<AspectRatioWarnings />
```

功能：
- 列出超出边界的片段
- 点击跳转到对应片段
- 自动隐藏（无警告时）

## 数据结构

### AspectRatioAdaptation

```typescript
interface AspectRatioAdaptation {
  mode: 'auto-crop' | 'scale-fit' | 'blur-background';
  enabled: boolean;
  cropPosition?: { x: number; y: number }; // 0-1范围
  blurIntensity?: number; // 0-100
}
```

### VideoAspectInfo

```typescript
interface VideoAspectInfo {
  width: number;
  height: number;
  aspectRatio: number;
  isLandscape: boolean;
  isPortrait: boolean;
  needsAdaptation: boolean;
}
```

## 技术细节

### UV坐标系统

Three.js使用UV坐标（0-1范围）来映射纹理到几何体：
- U轴：水平方向（0=左，1=右）
- V轴：垂直方向（0=底，1=顶）

通过修改UV坐标，可以实现纹理的裁剪和缩放。

### 几何变换

使用Three.js的变换系统：
- `position`: 位置（x, y, z）
- `rotation`: 旋转（欧拉角）
- `scale`: 缩放（x, y, z）

### 性能优化

1. **UV坐标缓存**：只在需要时更新UV坐标
2. **几何体复用**：尽可能复用几何体对象
3. **条件渲染**：只在启用时应用适配
4. **批量检测**：一次性检测所有片段的边界

## 最佳实践

### 1. 选择合适的适配模式

- **人物特写/访谈**：使用自动裁剪，调整位置确保人物居中
- **风景/全景**：使用缩放适配，保留完整画面
- **产品展示/精美内容**：使用背景模糊，提升视觉效果

### 2. 使用安全区域

始终开启安全区域参考线，确保：
- 人物面部在安全区域内
- 重要文字不被裁切
- 关键元素不超出边界

### 3. 测试不同设备

在不同设备上测试：
- 手机竖屏显示
- 平板显示
- 桌面浏览器

### 4. 性能考虑

- 避免频繁切换适配模式
- 大量片段时考虑分批处理
- 使用性能监控工具

## 故障排除

### 问题：裁剪位置不正确

**解决方案：**
1. 检查cropPosition值是否在0-1范围内
2. 确认视频元素已加载完成
3. 验证videoWidth和videoHeight是否正确

### 问题：安全区域不显示

**解决方案：**
1. 检查showSafeArea状态
2. 确认SceneManager已初始化
3. 验证参考线是否被其他对象遮挡

### 问题：性能下降

**解决方案：**
1. 减少同时显示的片段数量
2. 降低渲染质量
3. 禁用不必要的特效

## 未来改进

1. **AI智能裁剪**：使用AI识别画面重点，自动调整裁剪位置
2. **动态适配**：根据视频内容动态调整适配参数
3. **批量处理**：支持批量应用适配设置
4. **预设模板**：提供常用场景的预设配置
5. **实时预览**：在调整参数时实时预览效果

## 相关文件

- `src/core/AspectRatioAdapter.ts` - 核心适配逻辑
- `src/core/useAspectRatioAdapter.ts` - React Hook
- `src/components/AspectRatioPanel.tsx` - 设置面板UI
- `src/components/AspectRatioWarnings.tsx` - 警告组件
- `src/components/AspectRatioDemo.tsx` - 演示组件
- `src/types/index.ts` - 类型定义

## 参考资料

- [Three.js UV Mapping](https://threejs.org/docs/#api/en/core/BufferGeometry)
- [抖音视频规范](https://www.douyin.com/creator/guide)
- [WebGL纹理坐标](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL)
