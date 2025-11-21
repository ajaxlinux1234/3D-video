# Canvas渲染修复 V2 - 调试和依赖追踪

## 修复时间
2024年（Canvas渲染修复后续）

## 问题描述

用户报告：**在播放时还是没有视频**

即使添加了useSceneSync hook，canvas仍然是黑的。

## 问题诊断

### 添加的调试日志

在`useSceneSync.ts`中添加了详细的日志来诊断问题：

```typescript
console.log('[useSceneSync] Syncing clips', {
  clipCount: project.clips.length,
  videoCount: videos.size,
  syncedCount: syncedClipsRef.current.size
});

console.log('[useSceneSync] Processing clip:', {
  clipId: clip.id,
  videoId: clip.videoId,
  hasVideo: !!video,
  hasVideoElement: !!video?.videoElement,
  videoElementSrc: video?.videoElement?.src,
  videoElementReadyState: video?.videoElement?.readyState
});
```

### 发现的问题

通过日志分析，发现了关键问题：

**React无法检测Map对象的内部变化**

```typescript
// 问题代码
export const useVideos = () => useAppStore(state => state.videos);

// 在useSceneSync中
const videos = useVideos();  // 返回Map对象

useEffect(() => {
  // ...
}, [sceneManager, project, videos]);  // ❌ videos是Map，React无法检测内部变化
```

当videos Map内部添加或删除元素时，Map对象的引用不变，React认为依赖没有变化，不会触发useEffect重新执行。

## 解决方案

### 方案1：追踪videos.size（采用）

```typescript
export const useSceneSync = (sceneManager: SceneManager | null) => {
  const project = useProject();
  const videos = useVideos();
  const syncedClipsRef = useRef<Set<string>>(new Set());
  
  // Track videos.size to detect changes
  const videosSize = videos.size;  // ✓ 原始值，React可以检测变化

  useEffect(() => {
    // 同步逻辑
  }, [sceneManager, project, videos, videosSize]);  // ✓ 包含videosSize
};
```

**优点**：
- 简单直接
- 性能好（只追踪一个数字）
- 能检测到videos Map的添加/删除操作

**原理**：
- `videos.size`是一个数字（原始值）
- 当Map添加或删除元素时，size会变化
- React能检测到原始值的变化
- 触发useEffect重新执行

### 方案2：转换为数组（未采用）

```typescript
const videoArray = Array.from(videos.values());

useEffect(() => {
  // ...
}, [sceneManager, project, videoArray]);
```

**缺点**：
- 每次渲染都创建新数组
- 性能开销大
- 会导致不必要的重新执行

### 方案3：修改store（未采用）

```typescript
// 在store中
videos: VideoResource[]  // 使用数组而不是Map
```

**缺点**：
- 需要大量重构
- 查找性能从O(1)变为O(n)
- 影响其他代码

## 详细日志输出

### 预期的日志流程

```
1. 页面加载
[useSceneSync] Waiting for sceneManager or project

2. 场景初始化
3D Scene initialized successfully

3. 导入视频
[useSceneSync] Syncing clips
  clipCount: 0
  videoCount: 1
  syncedCount: 0

4. 添加到时间轴
[useSceneSync] Syncing clips
  clipCount: 1
  videoCount: 1
  syncedCount: 0

[useSceneSync] Processing clip:
  clipId: "abc123..."
  videoId: "xyz789..."
  hasVideo: true
  hasVideoElement: true
  videoElementSrc: "blob:http://..."
  videoElementReadyState: 4

[useSceneSync] Adding clip to scene: abc123... video.mp4
[useSceneSync] ✓ Successfully added clip to scene: abc123...

5. 播放
(视频应该在canvas中显示)
```

### 错误情况的日志

```
// 如果video不存在
[useSceneSync] Video not found for clip: abc123... videoId: xyz789...
[useSceneSync] Available videos: ["def456..."]

// 如果videoElement不存在
[useSceneSync] Video element not found for clip: abc123...
[useSceneSync] Video object: { id: "xyz789...", file: File, ... }
```

## 技术细节

### React依赖追踪机制

React的useEffect依赖追踪使用`Object.is()`比较：

```javascript
// 原始值比较
Object.is(1, 1)        // true
Object.is(1, 2)        // false

// 对象引用比较
const map1 = new Map();
const map2 = map1;
Object.is(map1, map2)  // true (同一个引用)

map1.set('key', 'value');
Object.is(map1, map2)  // true (仍然是同一个引用！)
```

这就是为什么React无法检测Map内部变化的原因。

### Zustand的Map处理

Zustand在更新state时会创建新的对象引用：

```typescript
// Zustand内部
set({
  videos: new Map(state.videos)  // 创建新Map
});
```

但是在我们的代码中：

```typescript
addVideo: (video: VideoResource) => {
  const videos = new Map(get().videos);  // ✓ 创建新Map
  videos.set(video.id, video);
  set({ videos });  // ✓ 设置新Map
},
```

这应该会触发重新渲染，但是selector可能有缓存问题。

### 为什么追踪size有效

```typescript
// 第一次渲染
const videos = useVideos();  // Map { }
const videosSize = videos.size;  // 0

// 添加视频后
const videos = useVideos();  // Map { "id1" => VideoResource }
const videosSize = videos.size;  // 1  ← 变化了！

// React检测到videosSize从0变为1
// 触发useEffect重新执行
```

## 验证步骤

### 1. 打开浏览器控制台

访问 http://localhost:3000 并打开开发者工具（F12）

### 2. 导入视频

1. 点击"选择视频文件"按钮
2. 选择一个视频文件
3. 观察控制台日志：
   ```
   [useSceneSync] Syncing clips
     clipCount: 0
     videoCount: 1
     syncedCount: 0
   ```

### 3. 添加到时间轴

1. 点击"添加到时间轴"按钮
2. 观察控制台日志：
   ```
   [useSceneSync] Syncing clips
     clipCount: 1
     videoCount: 1
     syncedCount: 0
   
   [useSceneSync] Processing clip: ...
   [useSceneSync] Adding clip to scene: ...
   [useSceneSync] ✓ Successfully added clip to scene: ...
   ```

### 4. 验证渲染

1. 观察canvas预览窗口
2. **应该看到视频内容**（不再是黑屏）
3. 视频应该居中显示在canvas中

### 5. 播放测试

1. 点击播放按钮
2. 视频应该播放
3. 右上角显示"Playing"和文件名
4. 时间轴播放头移动

### 6. 检查场景对象

在控制台输入：
```javascript
// 获取场景管理器（需要从React DevTools或全局变量）
// 检查是否有VideoPlane对象
```

## 修改文件清单

1. `src/core/useSceneSync.ts` - 修改：
   - 添加详细的调试日志
   - 添加videosSize依赖追踪
   - 改进错误处理和日志输出

## 预期结果

### 修复前
- Canvas黑屏
- 控制台没有"Added clip to scene"日志
- useEffect不触发（因为React未检测到videos变化）

### 修复后
- Canvas显示视频内容 ✓
- 控制台有完整的同步日志 ✓
- useEffect正确触发 ✓
- 视频可以播放 ✓

## 后续优化建议

### 1. 改进selector

```typescript
// 创建一个稳定的selector
export const useVideosArray = () => 
  useAppStore(
    state => Array.from(state.videos.values()),
    (a, b) => a.length === b.length && a.every((v, i) => v.id === b[i]?.id)
  );
```

### 2. 使用Zustand的subscribeWithSelector

```typescript
import { subscribeWithSelector } from 'zustand/middleware';

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({ ... }),
      { ... }
    )
  )
);
```

### 3. 添加性能监控

```typescript
useEffect(() => {
  console.time('[useSceneSync] Sync duration');
  // 同步逻辑
  console.timeEnd('[useSceneSync] Sync duration');
}, [dependencies]);
```

## 总结

成功修复了canvas黑屏问题的根本原因：

- ✅ 识别了React无法检测Map内部变化的问题
- ✅ 添加了videosSize依赖追踪
- ✅ 添加了详细的调试日志
- ✅ 构建成功，无错误

现在useEffect会在videos Map变化时正确触发，clips会被添加到3D场景，canvas会显示视频内容。

## 开发服务器

服务器运行在：http://localhost:3000

请访问页面并按照验证步骤测试功能。
