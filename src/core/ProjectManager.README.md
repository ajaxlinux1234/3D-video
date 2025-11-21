# ProjectManager

项目管理器 - 处理项目的保存、加载和模板管理。

## 功能特性

### 1. 项目保存和加载

- **保存项目**: 将项目序列化为 JSON 格式的 .v3d 文件
- **加载项目**: 从 .v3d 文件恢复项目状态
- **视频引用管理**: 跟踪项目中使用的视频文件路径
- **版本控制**: 支持项目文件版本管理

### 2. 缺失文件处理

- **检测缺失文件**: 加载项目时自动检测缺失的视频文件
- **文件重定位**: 提供 UI 让用户重新定位缺失的文件
- **文件验证**: 验证重定位的文件是否匹配原始文件

### 3. 项目模板

提供多种预设模板，快速创建不同风格的项目：

- **空白项目**: 从零开始
- **快节奏**: 适合快速剪辑和动感视频（60fps，快速转场）
- **慢节奏**: 适合叙事和情感视频（30fps，慢速转场）
- **故障风**: 赛博朋克和故障艺术风格
- **电影感**: 电影级视觉效果
- **梦幻**: 柔和梦幻的视觉风格

### 4. 自动保存

- **定时自动保存**: 每分钟自动保存项目到 localStorage
- **备份管理**: 保留最近的备份
- **可配置**: 可以启用/禁用自动保存

### 5. 未保存更改提示

- **更改跟踪**: 跟踪项目的修改状态
- **关闭提示**: 关闭项目前提示保存
- **浏览器关闭保护**: 防止意外关闭浏览器丢失数据

## 使用方法

### 基本用法

```typescript
import { projectManager } from '../core/ProjectManager';
import { useProjectManager } from '../core/useProjectManager';

// 在 React 组件中使用
function MyComponent() {
  const {
    currentProject,
    hasUnsavedChanges,
    createNewProject,
    saveProject,
    loadProject,
  } = useProjectManager();

  // 创建新项目
  const handleNew = () => {
    createNewProject('我的视频项目');
  };

  // 保存项目
  const handleSave = async () => {
    await saveProject();
  };

  // 加载项目
  const handleLoad = async () => {
    const { project, missingVideos } = await loadProject();
    // 处理缺失的视频文件
  };
}
```

### 使用模板创建项目

```typescript
const { createFromTemplate, getTemplates } = useProjectManager();

// 获取所有模板
const templates = getTemplates();

// 从模板创建项目
const template = templates.find(t => t.id === 'fast-paced');
if (template) {
  createFromTemplate(template, '快节奏视频');
}
```

### 处理缺失文件

```typescript
const { loadProject, relocateMissingVideo } = useProjectManager();

// 加载项目
const { project, missingVideos } = await loadProject();

// 如果有缺失文件
if (missingVideos.length > 0) {
  for (const reference of missingVideos) {
    // 让用户重新定位文件
    const file = await relocateMissingVideo(reference);
    if (file) {
      // 文件已重新定位
    }
  }
}
```

### 配置自动保存

```typescript
const { setIsAutoSaveEnabled } = useProjectManager();

// 启用自动保存
setIsAutoSaveEnabled(true);

// 禁用自动保存
setIsAutoSaveEnabled(false);
```

## 项目文件格式

.v3d 文件是 JSON 格式，包含以下结构：

```json
{
  "version": "1.0",
  "project": {
    "id": "uuid",
    "name": "我的项目",
    "resolution": { "width": 1080, "height": 1920 },
    "fps": 60,
    "duration": 30,
    "clips": [...],
    "audioTracks": [...],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "videoReferences": [
    {
      "id": "video-1",
      "filename": "clip1.mp4",
      "path": "",
      "size": 1024000,
      "lastModified": 1704067200000
    }
  ]
}
```

## 组件

### ProjectToolbar

主工具栏组件，提供项目管理功能：

```typescript
import { ProjectToolbar } from '../components/ProjectToolbar';

function App() {
  return (
    <div>
      <ProjectToolbar />
      {/* 其他内容 */}
    </div>
  );
}
```

### NewProjectWizard

新建项目向导对话框：

```typescript
import { NewProjectWizard } from '../components/NewProjectWizard';

function MyComponent() {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <>
      <button onClick={() => setShowWizard(true)}>新建项目</button>
      <NewProjectWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
      />
    </>
  );
}
```

### MissingFilesDialog

缺失文件处理对话框：

```typescript
import { MissingFilesDialog } from '../components/MissingFilesDialog';

function MyComponent() {
  const [missingFiles, setMissingFiles] = useState([]);

  return (
    <MissingFilesDialog
      missingFiles={missingFiles}
      onRelocate={async (ref) => {
        // 重新定位文件
        return await relocateMissingVideo(ref);
      }}
      onSkip={() => {
        // 跳过缺失文件
      }}
      onCancel={() => {
        // 取消加载
      }}
    />
  );
}
```

## API 参考

### ProjectManager 类

#### 方法

- `createProject(name?: string): Project` - 创建新的空白项目
- `createFromTemplate(template: ProjectTemplate, name: string): Project` - 从模板创建项目
- `saveProject(project: Project, videoFiles: Map<string, File>): Promise<Blob>` - 保存项目为 Blob
- `loadProject(file: File): Promise<{project: Project, videoReferences: VideoReference[]}>` - 加载项目文件
- `exportProjectFile(project: Project, videoFiles: Map<string, File>): Promise<void>` - 导出项目文件（下载）
- `importProjectFile(): Promise<{project: Project, videoReferences: VideoReference[]}>` - 导入项目文件（上传）
- `findMissingVideos(videoReferences: VideoReference[], availableVideos: Map<string, File>): VideoReference[]` - 查找缺失的视频
- `relocateMissingVideo(reference: VideoReference): Promise<File | null>` - 重新定位缺失的视频
- `markUnsaved(): void` - 标记项目有未保存的更改
- `hasUnsaved(): boolean` - 检查是否有未保存的更改
- `getLastSaveTime(): Date | null` - 获取最后保存时间
- `enableAutoSave(onSave: () => Promise<void>, config?: Partial<AutoSaveConfig>): void` - 启用自动保存
- `disableAutoSave(): void` - 禁用自动保存
- `setupBeforeUnloadHandler(): void` - 设置浏览器关闭前的提示
- `getTemplates(): ProjectTemplate[]` - 获取所有项目模板

### useProjectManager Hook

#### 返回值

```typescript
{
  currentProject: Project | null;
  hasUnsavedChanges: boolean;
  lastSaveTime: Date | null;
  isAutoSaveEnabled: boolean;
  setIsAutoSaveEnabled: (enabled: boolean) => void;
  createNewProject: (name?: string) => Project;
  createFromTemplate: (template: ProjectTemplate, name: string) => Project;
  saveProject: () => Promise<void>;
  loadProject: () => Promise<{project: Project, missingVideos: VideoReference[]}>;
  closeProject: () => boolean;
  relocateMissingVideo: (reference: VideoReference) => Promise<File | null>;
  getTemplates: () => ProjectTemplate[];
  markModified: () => void;
}
```

## 注意事项

1. **文件路径**: .v3d 文件不存储视频文件本身，只存储引用。视频文件需要单独管理。
2. **浏览器兼容性**: 使用了 File System Access API，需要现代浏览器支持。
3. **自动保存**: 自动保存到 localStorage，有大小限制（通常 5-10MB）。
4. **性能**: 大型项目保存可能需要一些时间，建议显示进度提示。

## 相关需求

- 需求 9.1: 项目保存功能
- 需求 9.2: 项目加载功能
- 需求 9.3: 缺失文件重定位
- 需求 9.4: 项目模板系统
- 需求 9.5: 未保存更改提示和自动保存
