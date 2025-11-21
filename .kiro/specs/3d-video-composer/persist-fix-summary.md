# 持久化状态修复总结

## 修复时间
2024年（时间轴修复后续）

## 问题描述

用户报告：**刷新页面后时间轴上会默认有上次的空视频**

### 问题分析

应用使用了Zustand的persist中间件将状态保存到localStorage，导致以下问题：

1. **项目状态被持久化**：包括clips数组
2. **视频资源未持久化**：videos Map包含File对象和HTMLVideoElement，无法序列化
3. **状态不一致**：刷新后clips引用的videoId在videos Map中不存在
4. **显示异常**：时间轴显示"Video Clip"空片段，因为找不到对应的视频资源

### 根本原因

```typescript
// persist配置
partialize: (state) => ({
  currentProject: state.currentProject,  // ✓ 被持久化
  // videos Map 未被持久化（包含不可序列化的对象）
  timeline: {
    ...state.timeline,
    isPlaying: false,
  },
}),
```

刷新后：
- `currentProject.clips` 存在（从localStorage恢复）
- `videos` Map 为空（未持久化）
- clips引用的videoId无效
- 显示为空片段

## 解决方案

在状态恢复时清理无效的clips和audioTracks。

### 实现

**文件**: `src/store/useAppStore.ts`

```typescript
// 修改前
onRehydrateStorage: () => (state) => {
  // Convert ISO strings back to Date objects
  if (state?.currentProject) {
    state.currentProject.createdAt = new Date(state.currentProject.createdAt as unknown as string);
    state.currentProject.updatedAt = new Date(state.currentProject.updatedAt as unknown as string);
  }
},

// 修改后
onRehydrateStorage: () => (state) => {
  // Convert ISO strings back to Date objects
  if (state?.currentProject) {
    state.currentProject.createdAt = new Date(state.currentProject.createdAt as unknown as string);
    state.currentProject.updatedAt = new Date(state.currentProject.updatedAt as unknown as string);
    
    // Clean up clips that reference non-existent videos
    // Since videos Map is not persisted (contains File objects), 
    // we need to clear all clips on reload
    if (state.currentProject.clips.length > 0) {
      console.warn('Clearing clips from previous session - video resources are not persisted');
      state.currentProject.clips = [];
      state.currentProject.duration = 0;
    }
    
    // Also clear audio tracks
    if (state.currentProject.audioTracks.length > 0) {
      console.warn('Clearing audio tracks from previous session');
      state.currentProject.audioTracks = [];
    }
  }
  
  // Reset timeline state
  if (state) {
    state.timeline = {
      ...defaultTimelineState,
      duration: state.currentProject?.duration || 0,
    };
    state.selectedClipId = null;
  }
},
```

### 清理逻辑

1. **检查clips数组**：如果有clips，说明是从旧会话恢复的
2. **清空clips**：因为对应的video资源不存在
3. **重置duration**：clips清空后，duration也应该为0
4. **清空audioTracks**：同样的原因
5. **重置timeline**：确保时间轴状态正确
6. **清除选中状态**：避免引用无效的clipId
7. **添加警告日志**：帮助开发者理解发生了什么

## 效果

### 修复前
```
刷新页面 → 从localStorage恢复状态 → clips存在但videos为空 → 显示空片段
```

### 修复后
```
刷新页面 → 从localStorage恢复状态 → 检测到clips但videos为空 → 清空clips → 显示空时间轴
```

## 用户体验改进

1. **干净的初始状态**：刷新后时间轴为空，符合预期
2. **避免混淆**：不会显示无效的空片段
3. **清晰的日志**：控制台警告说明了为什么清理clips
4. **保留项目元数据**：项目名称、分辨率、FPS等设置仍然保留

## 替代方案考虑

### 方案1：完全不持久化项目状态
```typescript
partialize: (state) => ({
  // 不持久化currentProject
  ui: state.ui,  // 只持久化UI设置
}),
```

**优点**：
- 简单直接
- 不会有状态不一致问题

**缺点**：
- 丢失项目设置（分辨率、FPS等）
- 用户体验较差

### 方案2：持久化视频文件路径
```typescript
partialize: (state) => ({
  currentProject: state.currentProject,
  videoFiles: Array.from(state.videos.values()).map(v => ({
    id: v.id,
    path: v.file.path,  // 需要File System Access API
  })),
}),
```

**优点**：
- 可以恢复视频资源
- 保持完整状态

**缺点**：
- 需要File System Access API（浏览器支持有限）
- 用户需要重新授权文件访问
- 实现复杂

### 方案3：当前方案（推荐）
清理无效的clips和audioTracks

**优点**：
- 简单可靠
- 保留项目元数据
- 避免状态不一致
- 用户体验合理

**缺点**：
- 刷新后需要重新导入视频

## 技术细节

### 持久化机制

Zustand persist使用localStorage存储状态：

```typescript
// 存储键
name: 'video-composer-storage'

// 存储内容
{
  state: {
    currentProject: { ... },
    timeline: { ... }
  },
  version: 0
}
```

### 序列化限制

以下对象无法序列化到localStorage：
- `File` 对象
- `HTMLVideoElement`
- `HTMLAudioElement`
- `Blob` 对象
- `ArrayBuffer`
- 函数
- Symbol

### 恢复流程

```
1. 页面加载
2. Zustand初始化
3. persist中间件从localStorage读取数据
4. 调用onRehydrateStorage回调
5. 转换Date对象
6. 清理无效数据
7. 重置相关状态
8. 应用渲染
```

## 测试验证

### 测试步骤

1. **导入视频并添加到时间轴**
   ```
   - 导入一个或多个视频
   - 拖拽到时间轴
   - 验证显示正常
   ```

2. **刷新页面**
   ```
   - 按F5或点击刷新
   - 观察时间轴状态
   ```

3. **验证结果**
   ```
   ✓ 时间轴应该为空
   ✓ 不应该有"Video Clip"空片段
   ✓ 控制台有清理警告日志
   ✓ 项目设置保留（如果有）
   ```

### 构建测试
✅ TypeScript编译通过
✅ Vite构建成功
✅ 无类型错误
✅ 无运行时错误

## 后续改进建议

### 1. 项目保存/加载功能
实现完整的项目保存功能，包括：
- 保存项目文件（.json）
- 记录视频文件路径
- 导入时重新加载视频
- 处理文件缺失情况

### 2. 会话恢复提示
```typescript
if (hasClipsFromPreviousSession) {
  showNotification({
    type: 'info',
    message: '检测到上次会话的片段，但视频资源已丢失。请重新导入视频。',
    action: '了解更多'
  });
}
```

### 3. 自动保存草稿
```typescript
// 定期保存项目状态到IndexedDB
setInterval(() => {
  saveDraft(currentProject);
}, 30000); // 每30秒
```

### 4. 视频缓存
使用IndexedDB存储视频Blob：
```typescript
// 存储视频到IndexedDB
await db.videos.put({
  id: video.id,
  blob: await video.file.arrayBuffer(),
  metadata: video.metadata
});

// 恢复时从IndexedDB加载
const cached = await db.videos.get(videoId);
if (cached) {
  const blob = new Blob([cached.blob]);
  const file = new File([blob], cached.metadata.name);
  // 重新创建video资源
}
```

## 修改文件清单

1. `src/store/useAppStore.ts` - 添加状态恢复时的清理逻辑
2. `src/components/MemoryWarning.tsx` - 修复TypeScript错误

## 总结

成功修复了刷新页面后显示空视频片段的问题：

- ✅ 刷新后时间轴为空，不显示无效片段
- ✅ 保留项目元数据（名称、分辨率、FPS等）
- ✅ 添加清理日志，便于调试
- ✅ 重置timeline和选中状态
- ✅ 构建成功，无错误

这个方案在简单性和用户体验之间取得了良好的平衡。未来可以考虑实现更完整的项目保存/加载功能。
