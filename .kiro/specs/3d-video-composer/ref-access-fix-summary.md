# Ref访问修复总结

## 问题描述

React报错：**Cannot access refs during render**

```
Error: Cannot access ref value during render
/Users/wangchengkun/Documents/3D-video/src/core/useSceneManager.ts:58:5
> 58 |     sceneManager: sceneManagerRef.current,
```

## 问题原因

在React中，不允许在渲染期间访问ref的`current`属性。原代码在return语句中直接返回`sceneManagerRef.current`，这违反了React的规则。

### 错误代码

```typescript
export function useSceneManager(options: UseSceneManagerOptions = {}) {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  
  useEffect(() => {
    // 在effect中设置ref
    sceneManagerRef.current = sceneManager;
  }, []);

  return {
    sceneManager: sceneManagerRef.current,  // ❌ 在渲染期间访问ref
    canvasRef,
    // ...
  };
}
```

### 为什么这是问题？

1. **React的渲染规则**：ref是用于存储不影响渲染的值
2. **访问时机**：ref应该只在事件处理器或effect中访问
3. **更新检测**：访问ref.current不会触发重新渲染
4. **一致性**：在渲染期间访问ref可能导致组件不按预期更新

## 解决方案

使用callback ref模式，将ref的初始化逻辑移到callback中，并使用state存储sceneManager。

### 修复后的代码

```typescript
export function useSceneManager(options: UseSceneManagerOptions = {}) {
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [quality, setQuality] = useState<QualityLevel>('high');
  const [fps, setFps] = useState(60);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize scene manager when canvas is available
  const handleCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    
    if (!canvas) {
      // Cleanup if canvas is removed
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      setSceneManager(null);
      setIsInitialized(false);
      return;
    }

    // Initialize scene manager
    const manager = new SceneManager();
    manager.initialize(canvas, {
      width: options.width || 1080,
      height: options.height || 1920,
      autoAdjustQuality: options.autoAdjustQuality !== false,
    });

    setSceneManager(manager);  // ✓ 使用state存储
    setIsInitialized(true);

    // Start render loop if autoStart is enabled
    if (options.autoStart !== false) {
      manager.startRenderLoop();
    }

    // Setup performance monitoring
    const monitorInterval = setInterval(() => {
      const metrics = manager.getPerformanceMetrics();
      setFps(metrics.fps);
      setQuality(manager.getQuality());
    }, 1000);

    // Store cleanup function
    cleanupRef.current = () => {
      clearInterval(monitorInterval);
      manager.dispose();
    };
  }, [options.autoStart, options.autoAdjustQuality, options.width, options.height]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  return {
    sceneManager,  // ✓ 返回state，不是ref
    canvasRef: handleCanvasRef,  // ✓ 返回callback ref
    isInitialized,
    quality,
    fps,
  };
}
```

## 关键改进

### 1. 使用State而不是Ref

```typescript
// 之前
const sceneManagerRef = useRef<SceneManager | null>(null);
return { sceneManager: sceneManagerRef.current };  // ❌

// 之后
const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
return { sceneManager };  // ✓
```

**优点**：
- 符合React规则
- 状态变化会触发重新渲染
- 组件会正确更新

### 2. 使用Callback Ref

```typescript
// 之前
const canvasRef = useRef<HTMLCanvasElement | null>(null);
useEffect(() => {
  if (!canvasRef.current) return;
  // 初始化
}, []);

// 之后
const handleCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
  if (!canvas) return;
  // 初始化
}, [dependencies]);
```

**优点**：
- 在canvas挂载时立即初始化
- 不需要额外的useEffect
- 更简洁的代码

### 3. 使用Cleanup Ref

```typescript
const cleanupRef = useRef<(() => void) | null>(null);

// 存储cleanup函数
cleanupRef.current = () => {
  clearInterval(monitorInterval);
  manager.dispose();
};

// 在unmount时调用
useEffect(() => {
  return () => {
    if (cleanupRef.current) {
      cleanupRef.current();
    }
  };
}, []);
```

**优点**：
- 确保资源正确清理
- 避免内存泄漏
- 处理canvas移除的情况

## 使用方式变化

### 组件中的使用

```typescript
// 之前
const { sceneManager, canvasRef, isInitialized } = useSceneManager({
  autoStart: true,
});

<canvas ref={canvasRef} />  // ✓ 正常的ref

// 之后
const { sceneManager, canvasRef, isInitialized } = useSceneManager({
  autoStart: true,
});

<canvas ref={canvasRef} />  // ✓ callback ref（使用方式相同）
```

**注意**：从使用者角度看，API没有变化！

## 技术细节

### Callback Ref vs useRef

**useRef**：
```typescript
const ref = useRef<HTMLElement | null>(null);
<div ref={ref} />
// ref.current在渲染后才可用
```

**Callback Ref**：
```typescript
const handleRef = useCallback((element: HTMLElement | null) => {
  // element在挂载时立即可用
}, []);
<div ref={handleRef} />
```

### 为什么不在Effect中setState？

React建议避免在effect中同步调用setState：

```typescript
// 不推荐
useEffect(() => {
  const manager = new SceneManager();
  setSceneManager(manager);  // ⚠️ 可能导致级联渲染
}, []);

// 推荐
const handleRef = useCallback((canvas) => {
  const manager = new SceneManager();
  setSceneManager(manager);  // ✓ 在callback中设置
}, []);
```

### State vs Ref的选择

**使用State当**：
- 值的变化需要触发重新渲染
- 值需要在渲染中使用
- 值是组件的"状态"

**使用Ref当**：
- 值的变化不需要触发重新渲染
- 只在事件处理器或effect中使用
- 存储DOM引用或定时器ID

## 验证

### 构建测试
✅ TypeScript编译通过
✅ Vite构建成功
✅ 无React规则违反
✅ 无类型错误

### 功能测试
1. ✅ SceneManager正确初始化
2. ✅ Canvas正确挂载
3. ✅ 渲染循环正常运行
4. ✅ 性能监控正常工作
5. ✅ 清理函数正确执行

## 修改文件清单

1. `src/core/useSceneManager.ts` - 完全重构：
   - 添加useCallback导入
   - 使用state存储sceneManager
   - 使用callback ref模式
   - 改进cleanup逻辑

## 相关最佳实践

### 1. 避免在渲染中访问Ref

```typescript
// ❌ 错误
function Component() {
  const ref = useRef(0);
  return <div>{ref.current}</div>;  // 不会更新！
}

// ✓ 正确
function Component() {
  const [value, setValue] = useState(0);
  return <div>{value}</div>;  // 会更新
}
```

### 2. 使用Callback Ref处理动态元素

```typescript
// ✓ 处理条件渲染的元素
const handleRef = useCallback((element) => {
  if (element) {
    // 元素挂载
  } else {
    // 元素卸载
  }
}, []);
```

### 3. 存储Cleanup函数

```typescript
// ✓ 使用ref存储cleanup函数
const cleanupRef = useRef<(() => void) | null>(null);

cleanupRef.current = () => {
  // cleanup逻辑
};

useEffect(() => {
  return () => cleanupRef.current?.();
}, []);
```

## 总结

成功修复了ref访问错误：

- ✅ 使用state代替ref存储sceneManager
- ✅ 使用callback ref模式初始化
- ✅ 改进cleanup逻辑
- ✅ 符合React最佳实践
- ✅ 构建成功，无错误

这个修复不仅解决了错误，还改进了代码质量和可维护性。
