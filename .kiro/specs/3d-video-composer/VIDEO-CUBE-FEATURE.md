# 📦 视频立方体功能说明

## 🎯 功能概述

视频立方体是一个炫酷的3D效果，将视频映射到一个3D立方体的6个面上，每5秒自动旋转切换到下一个面，形成连续的视频播放体验。

## ✨ 特性

### 1. 3D立方体结构
- **6个面**: 前、后、左、右、上、下
- **视频纹理**: 每个面都显示相同的视频内容
- **边框线**: 青色边框增强立体感
- **实时渲染**: 使用WebGL GPU加速

### 2. 自动旋转切换
- **切换周期**: 每5秒切换一次
- **平滑过渡**: 使用缓动函数实现平滑旋转
- **切换顺序**: 前 → 右 → 后 → 左 → 上 → 下 → 循环

### 3. 视觉效果
- **浮动动画**: 立方体轻微上下浮动
- **自转效果**: 沿Z轴轻微旋转
- **实时信息**: 显示当前面和倒计时

## 🎮 使用方法

### 快速开始
1. 打开 `test-video.html`
2. 上传一个视频文件
3. 从效果下拉菜单选择 "📦 视频立方体"
4. 观看立方体自动旋转切换面

### 控制选项
- **效果强度**: 不影响立方体效果（固定5秒切换）
- **播放/暂停**: 控制视频播放状态
- **实时信息**: 查看当前显示的面和倒计时

## 🔧 技术实现

### 立方体创建
```javascript
function createVideoCube() {
  // 创建2x2x2的立方体几何体
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  
  // 为6个面创建材质（共享同一视频纹理）
  const materials = [];
  for (let i = 0; i < 6; i++) {
    materials.push(new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.FrontSide
    }));
  }
  
  // 创建立方体网格
  const cube = new THREE.Mesh(geometry, materials);
  
  // 添加边框线
  const edges = new THREE.EdgesGeometry(geometry);
  const wireframe = new THREE.LineSegments(edges, lineMaterial);
  cube.add(wireframe);
  
  return cube;
}
```

### 旋转逻辑
```javascript
// 每5秒切换一次面
const cycleTime = 5;
const currentCycle = Math.floor(time / cycleTime);
const targetFace = currentCycle % 6; // 0-5

// 根据目标面设置旋转角度
switch(targetFace) {
  case 0: // 前面
    targetRotationX = 0;
    targetRotationY = 0;
    break;
  case 1: // 右面
    targetRotationX = 0;
    targetRotationY = Math.PI / 2;
    break;
  // ... 其他面
}

// 平滑插值到目标旋转
videoCube.rotation.x = lerp(prevRotationX, targetRotationX, easeProgress);
videoCube.rotation.y = lerp(prevRotationY, targetRotationY, easeProgress);
```

### 面映射关系

| 面编号 | 名称 | 旋转角度 (X, Y) |
|--------|------|-----------------|
| 0 | 前面 | (0, 0) |
| 1 | 右面 | (0, π/2) |
| 2 | 后面 | (0, π) |
| 3 | 左面 | (0, -π/2) |
| 4 | 上面 | (-π/2, 0) |
| 5 | 下面 | (π/2, 0) |

## 🎨 视觉设计

### 颜色方案
- **立方体边框**: 青色 (#00FFFF)
- **背景**: 黑色 (#000000)
- **信息面板**: 深红色背景 (#3A1A1A)

### 动画参数
- **旋转时间**: 前20%周期（1秒）
- **静止时间**: 后80%周期（4秒）
- **浮动频率**: 0.5 Hz
- **浮动幅度**: ±0.1 单位
- **自转频率**: 0.3 Hz
- **自转幅度**: ±0.05 弧度

## 📊 性能优化

### 已实现的优化
1. **材质共享**: 6个面共享同一个视频纹理
2. **几何体复用**: 使用单一BoxGeometry
3. **条件渲染**: 只在选中时创建立方体
4. **资源清理**: 切换效果时自动释放资源

### 性能指标
- **目标FPS**: 60
- **顶点数**: 24 (立方体) + 边框线
- **纹理数**: 1 (共享视频纹理)
- **材质数**: 6 (每个面一个)

## 🚀 未来扩展

### 计划功能
1. **多视频支持**: 每个面播放不同的视频
2. **自定义切换时间**: 用户可调节切换周期
3. **切换效果**: 添加更多旋转动画（翻转、缩放等）
4. **交互控制**: 鼠标拖拽旋转立方体
5. **面选择**: 点击切换到指定面

### 多视频实现思路
```javascript
// 为每个面创建独立的视频纹理
const videoTextures = [
  new THREE.VideoTexture(video1),
  new THREE.VideoTexture(video2),
  new THREE.VideoTexture(video3),
  new THREE.VideoTexture(video4),
  new THREE.VideoTexture(video5),
  new THREE.VideoTexture(video6)
];

// 为每个面创建独立材质
const materials = videoTextures.map(texture => 
  new THREE.MeshBasicMaterial({ map: texture })
);
```

## 💡 创意应用

### 适用场景
1. **产品展示**: 从6个角度展示产品
2. **故事讲述**: 6个章节的连续故事
3. **教学演示**: 6个步骤的教程
4. **艺术创作**: 立方体空间艺术
5. **游戏界面**: 3D菜单导航

### 内容建议
- **统一主题**: 6个面内容相关联
- **视觉连贯**: 保持色调和风格一致
- **时长控制**: 每个面5秒，总共30秒循环
- **关键信息**: 在每个面的中心位置

## 🐛 已知限制

### 当前限制
1. **单一视频**: 所有面显示相同视频
2. **固定周期**: 5秒切换不可调
3. **固定顺序**: 按预设顺序切换
4. **无交互**: 不支持手动控制

### 解决方案
- 多视频支持需要修改文件上传逻辑
- 可调周期需要添加UI控件
- 自定义顺序需要配置界面
- 交互控制需要集成OrbitControls

## 📝 代码示例

### 完整效果代码
```javascript
case 'videocube':
  if (videoCube) {
    // 计算目标面
    const cycleTime = 5;
    const targetFace = Math.floor(time / cycleTime) % 6;
    
    // 更新UI
    const faceNames = ['前面', '右面', '后面', '左面', '上面', '下面'];
    cubeFace.textContent = faceNames[targetFace];
    
    // 计算旋转角度
    const rotations = [
      [0, 0],           // 前
      [0, Math.PI/2],   // 右
      [0, Math.PI],     // 后
      [0, -Math.PI/2],  // 左
      [-Math.PI/2, 0],  // 上
      [Math.PI/2, 0]    // 下
    ];
    
    // 平滑旋转
    const [targetX, targetY] = rotations[targetFace];
    videoCube.rotation.x = lerp(currentX, targetX, progress);
    videoCube.rotation.y = lerp(currentY, targetY, progress);
    
    // 附加动画
    videoCube.position.y = Math.sin(time * 0.5) * 0.1;
    videoCube.rotation.z = Math.sin(time * 0.3) * 0.05;
  }
  break;
```

## 🎓 学习资源

### Three.js相关
- [BoxGeometry文档](https://threejs.org/docs/#api/en/geometries/BoxGeometry)
- [MeshBasicMaterial文档](https://threejs.org/docs/#api/en/materials/MeshBasicMaterial)
- [VideoTexture文档](https://threejs.org/docs/#api/en/textures/VideoTexture)

### 数学知识
- [欧拉角](https://en.wikipedia.org/wiki/Euler_angles)
- [四元数旋转](https://en.wikipedia.org/wiki/Quaternion)
- [缓动函数](https://easings.net/)

---

**版本**: 1.0.0  
**更新日期**: 2025-01-13  
**作者**: Kiro AI Assistant  
**状态**: ✅ 已实现并测试
