# 错误处理和用户反馈系统

本文档描述了3D视频合成系统的错误处理和用户反馈机制。

## 概述

错误处理系统提供了全面的错误捕获、日志记录和用户反馈功能，确保用户在遇到问题时能够获得清晰的提示和恢复选项。

## 核心组件

### 1. 错误类型定义 (`utils/errors.ts`)

#### AppError 类
自定义错误类，扩展了标准Error，添加了类型、详情和可恢复性信息。

```typescript
const error = new AppError(
  ErrorType.VIDEO_LOAD_FAILED,
  '视频加载失败',
  { fileName: 'video.mp4' }
);
```

#### ErrorLogger
全局错误日志记录器，自动记录所有AppError实例。

```typescript
import { errorLogger } from '../utils/errors';

errorLogger.log(error);
const logs = errorLogger.getLogs();
const json = errorLogger.exportLogs();
```

### 2. 错误边界 (`ErrorBoundary.tsx`)

React错误边界组件，捕获组件树中的所有错误。

**特性:**
- 捕获React组件渲染错误
- 显示友好的错误界面
- 提供重新加载和刷新页面选项
- 自动记录错误到日志系统

**使用方法:**
```tsx
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

### 3. WebGL支持检测 (`WebGLCheck.tsx`)

检测浏览器是否支持WebGL，并在不支持时显示升级建议。

**特性:**
- 自动检测WebGL 1.0和2.0支持
- 显示浏览器升级建议
- 提供推荐浏览器链接
- 提供重新检测功能

**使用方法:**
```tsx
<WebGLCheck>
  <YourApp />
</WebGLCheck>
```

### 4. Toast通知系统 (`Toast.tsx`)

轻量级通知系统，用于显示操作反馈。

**特性:**
- 4种通知类型：success, error, warning, info
- 自动消失（可配置时长）
- 支持手动关闭
- 优雅的动画效果

**使用方法:**
```typescript
import { toastManager } from './components/Toast';

// 显示通知
toastManager.success('操作成功！');
toastManager.error('操作失败！', 5000); // 5秒后消失
toastManager.warning('请注意！');
toastManager.info('提示信息');

// 在组件中使用
const { messages, removeToast } = useToast();
<ToastContainer messages={messages} onClose={removeToast} />
```

### 5. 内存警告 (`MemoryWarning.tsx`)

监控内存使用并在超过阈值时显示警告。

**特性:**
- 自动监控JavaScript堆内存使用
- 80%使用率显示警告
- 90%使用率显示严重警告
- 提供优化建议和操作按钮

**阈值:**
- 警告: 80% - 90%
- 严重: 90%+

**使用方法:**
```tsx
<MemoryWarning onOptimize={handleOptimizeMemory} />
```

### 6. 视频加载错误 (`VideoLoadError.tsx`)

显示视频加载失败的错误列表。

**特性:**
- 显示失败的视频文件名和错误信息
- 提供重试和移除选项
- 支持批量错误显示

**使用方法:**
```tsx
<VideoLoadErrorList
  errors={videoErrors}
  onRetry={handleRetry}
  onRemove={handleRemove}
/>
```

### 7. 导出恢复 (`ExportRecovery.tsx`)

在导出中断后提供恢复选项。

**特性:**
- 保存导出进度到localStorage
- 显示已渲染帧数和进度
- 提供继续、重新开始、取消选项
- 显示错误详情

**使用方法:**
```typescript
import { ExportRecoveryManager } from './components/ExportRecovery';

// 保存恢复数据
ExportRecoveryManager.save({
  projectId: 'project-123',
  totalFrames: 1800,
  renderedFrames: 1234,
  exportSettings: { ... },
  timestamp: new Date(),
  error: '错误信息'
});

// 检查是否有恢复数据
if (ExportRecoveryManager.hasRecoveryData()) {
  const data = ExportRecoveryManager.load();
  // 显示恢复对话框
}

// 清除恢复数据
ExportRecoveryManager.clear();
```

## 集成到应用

### 主应用包装

```tsx
import { ErrorBoundary } from './components/ErrorBoundary';
import { WebGLCheck } from './components/WebGLCheck';
import { ToastContainer, useToast } from './components/Toast';
import { MemoryWarning } from './components/MemoryWarning';

function App() {
  const { messages, removeToast } = useToast();

  return (
    <ErrorBoundary>
      <WebGLCheck>
        <div className="app">
          {/* 应用内容 */}
          
          <ToastContainer messages={messages} onClose={removeToast} />
          <MemoryWarning onOptimize={handleOptimizeMemory} />
        </div>
      </WebGLCheck>
    </ErrorBoundary>
  );
}
```

### 视频管理器集成

```typescript
import { AppError, ErrorType, errorLogger } from '../utils/errors';
import { toastManager } from '../components/Toast';

class VideoManager {
  async importVideo(file: File) {
    try {
      // 验证视频
      if (!this.validateVideo(file)) {
        throw new AppError(
          ErrorType.UNSUPPORTED_FORMAT,
          '不支持的视频格式',
          { fileName: file.name, format: file.type }
        );
      }
      
      // 加载视频
      const video = await this.loadVideo(file);
      toastManager.success(`视频加载成功: ${file.name}`);
      return video;
      
    } catch (error) {
      const appError = error instanceof AppError 
        ? error 
        : new AppError(
            ErrorType.VIDEO_LOAD_FAILED,
            '视频加载失败',
            { fileName: file.name, originalError: error }
          );
      
      errorLogger.log(appError);
      toastManager.error(`视频加载失败: ${file.name}`);
      throw appError;
    }
  }
}
```

### 导出管理器集成

```typescript
import { ExportRecoveryManager } from '../components/ExportRecovery';
import { toastManager } from '../components/Toast';

class ExportManager {
  async exportVideo(project, settings, onProgress) {
    try {
      // 保存初始恢复数据
      ExportRecoveryManager.save({
        projectId: project.id,
        totalFrames: this.calculateTotalFrames(project, settings),
        renderedFrames: 0,
        exportSettings: settings,
        timestamp: new Date()
      });

      // 渲染帧
      for (let i = 0; i < totalFrames; i++) {
        const frame = await this.renderFrame(i);
        
        // 更新恢复数据
        ExportRecoveryManager.save({
          ...recoveryData,
          renderedFrames: i + 1
        });
        
        onProgress((i + 1) / totalFrames);
      }

      // 编码视频
      const blob = await this.encodeVideo(frames, audio);
      
      // 清除恢复数据
      ExportRecoveryManager.clear();
      toastManager.success('视频导出成功！');
      
      return blob;
      
    } catch (error) {
      // 保存错误信息到恢复数据
      const recoveryData = ExportRecoveryManager.load();
      if (recoveryData) {
        ExportRecoveryManager.save({
          ...recoveryData,
          error: error.message
        });
      }
      
      toastManager.error('视频导出失败');
      throw error;
    }
  }
}
```

## 错误处理最佳实践

### 1. 使用AppError包装所有错误

```typescript
try {
  // 操作
} catch (error) {
  const appError = error instanceof AppError 
    ? error 
    : new AppError(ErrorType.UNKNOWN_ERROR, error.message, { originalError: error });
  
  errorLogger.log(appError);
  throw appError;
}
```

### 2. 提供用户友好的错误消息

```typescript
// 不好
throw new Error('Failed to load video');

// 好
throw new AppError(
  ErrorType.VIDEO_LOAD_FAILED,
  '视频文件可能已损坏或格式不支持',
  { fileName: file.name, fileSize: file.size }
);
```

### 3. 使用Toast通知用户操作结果

```typescript
// 成功操作
toastManager.success('视频添加成功');

// 失败操作
toastManager.error('视频加载失败，请重试');

// 警告
toastManager.warning('视频分辨率较低，可能影响导出质量');

// 信息
toastManager.info('正在处理视频...');
```

### 4. 记录详细的错误信息

```typescript
errorLogger.log(new AppError(
  ErrorType.EXPORT_FAILED,
  '导出失败',
  {
    projectId: project.id,
    settings: exportSettings,
    renderedFrames: currentFrame,
    totalFrames: totalFrames,
    memoryUsage: performance.memory?.usedJSHeapSize,
    timestamp: new Date()
  }
));
```

### 5. 提供恢复选项

```typescript
// 对于可恢复的错误，提供重试选项
if (error.recoverable) {
  showRetryDialog({
    message: error.message,
    onRetry: () => retryOperation(),
    onCancel: () => cancelOperation()
  });
}
```

## 测试

### 测试错误边界

```tsx
// 触发错误
const ThrowError = () => {
  throw new Error('Test error');
};

// 测试
<ErrorBoundary>
  <ThrowError />
</ErrorBoundary>
```

### 测试Toast通知

```typescript
toastManager.success('测试成功通知');
toastManager.error('测试错误通知');
toastManager.warning('测试警告通知');
toastManager.info('测试信息通知');
```

### 测试内存警告

内存警告会自动监控，可以通过创建大量对象来触发：

```typescript
// 创建大量对象以增加内存使用
const largeArray = new Array(10000000).fill({});
```

### 测试导出恢复

```typescript
// 模拟导出中断
ExportRecoveryManager.save({
  projectId: 'test-project',
  totalFrames: 1800,
  renderedFrames: 900,
  exportSettings: { resolution: '1080p', fps: 60 },
  timestamp: new Date(),
  error: '测试错误'
});

// 检查恢复数据
const hasRecovery = ExportRecoveryManager.hasRecoveryData();
const data = ExportRecoveryManager.load();
```

## 性能考虑

1. **错误日志限制**: 错误日志最多保存100条，自动清理旧日志
2. **内存监控频率**: 每5秒检查一次内存使用，避免频繁检查影响性能
3. **Toast自动清理**: Toast通知自动消失，避免堆积
4. **恢复数据大小**: 导出恢复数据存储在localStorage，注意数据大小限制

## 需求映射

- **需求 1.2**: 视频加载失败处理 ✓
- **需求 5.5**: 预览错误处理 ✓
- **需求 6.5**: 导出失败恢复 ✓
- **需求 10.2**: 内存不足警告 ✓

## 演示

运行 `ErrorHandlingDemo` 组件查看所有错误处理功能的演示：

```tsx
import ErrorHandlingDemo from './components/ErrorHandlingDemo';

<ErrorHandlingDemo />
```
