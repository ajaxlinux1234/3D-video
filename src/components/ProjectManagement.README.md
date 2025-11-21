# Project Management Integration Guide

## Quick Start

### 1. Add ProjectToolbar to Your App

The simplest way to add project management to your app:

```typescript
import { ProjectToolbar } from './components/ProjectToolbar';

function App() {
  return (
    <div className="app">
      <ProjectToolbar />
      {/* Your existing content */}
    </div>
  );
}
```

### 2. Use the Hook in Your Components

Access project management functionality anywhere:

```typescript
import { useProjectManager } from '../core/useProjectManager';

function MyComponent() {
  const {
    currentProject,
    hasUnsavedChanges,
    saveProject,
    markModified,
  } = useProjectManager();

  // Use project data
  if (currentProject) {
    console.log('Current project:', currentProject.name);
  }

  // Mark as modified when user makes changes
  const handleEdit = () => {
    // ... make changes ...
    markModified();
  };

  // Save manually
  const handleSave = async () => {
    await saveProject();
  };
}
```

### 3. View the Demo

To see all features in action:

```typescript
import { ProjectDemo } from './components/ProjectDemo';

function DemoPage() {
  return <ProjectDemo />;
}
```

## Components

### ProjectToolbar
Main toolbar with all project management buttons.

**Features:**
- New project (with wizard)
- Open project
- Save project
- Close project
- Project info display
- Unsaved changes indicator
- Auto-save toggle

### NewProjectWizard
Dialog for creating new projects from templates.

**Usage:**
```typescript
const [showWizard, setShowWizard] = useState(false);

<NewProjectWizard
  isOpen={showWizard}
  onClose={() => setShowWizard(false)}
/>
```

### MissingFilesDialog
Handle missing video files when loading projects.

**Usage:**
```typescript
<MissingFilesDialog
  missingFiles={missingFiles}
  onRelocate={relocateMissingVideo}
  onSkip={() => {/* continue without files */}}
  onCancel={() => {/* cancel loading */}}
/>
```

### ProjectDemo
Complete demonstration of all features.

## Hook API

### useProjectManager()

Returns:
```typescript
{
  // State
  currentProject: Project | null;
  hasUnsavedChanges: boolean;
  lastSaveTime: Date | null;
  isAutoSaveEnabled: boolean;
  
  // Actions
  createNewProject: (name?: string) => Project;
  createFromTemplate: (template: ProjectTemplate, name: string) => Project;
  saveProject: () => Promise<void>;
  loadProject: () => Promise<{project: Project, missingVideos: VideoReference[]}>;
  closeProject: () => boolean;
  relocateMissingVideo: (reference: VideoReference) => Promise<File | null>;
  getTemplates: () => ProjectTemplate[];
  markModified: () => void;
  setIsAutoSaveEnabled: (enabled: boolean) => void;
}
```

## Templates

Available templates:
- **blank**: Empty project (60fps)
- **fast-paced**: Quick cuts, fast transitions (60fps)
- **slow-paced**: Slow transitions, narrative style (30fps)
- **glitch-style**: Cyberpunk, glitch effects (60fps)
- **cinematic**: Film-like, vignette, color grading (30fps)
- **dreamy**: Soft, glow, blur effects (30fps)

## File Format

Projects are saved as `.v3d` files (JSON format):

```json
{
  "version": "1.0",
  "project": {
    "id": "uuid",
    "name": "My Project",
    "resolution": { "width": 1080, "height": 1920 },
    "fps": 60,
    "clips": [...],
    "audioTracks": [...]
  },
  "videoReferences": [...]
}
```

## Auto-Save

Auto-save is enabled by default and saves to localStorage every 60 seconds.

**Configure:**
```typescript
const { setIsAutoSaveEnabled } = useProjectManager();

// Disable
setIsAutoSaveEnabled(false);

// Enable
setIsAutoSaveEnabled(true);
```

## Best Practices

1. **Mark Changes**: Call `markModified()` whenever user makes changes
2. **Save Often**: Encourage users to save frequently
3. **Handle Missing Files**: Always handle the missing files case when loading
4. **Confirm Close**: The hook automatically prompts before closing with unsaved changes
5. **Auto-Save**: Keep auto-save enabled for better UX

## Integration Checklist

- [ ] Add `<ProjectToolbar />` to your app header
- [ ] Call `markModified()` when user edits project
- [ ] Handle missing files when loading projects
- [ ] Test save/load workflow
- [ ] Test all templates
- [ ] Verify auto-save works
- [ ] Test unsaved changes protection

## Troubleshooting

**Q: Auto-save not working?**
A: Check that `isAutoSaveEnabled` is true and the project has unsaved changes.

**Q: Missing files dialog not showing?**
A: Make sure to check the `missingVideos` array returned from `loadProject()`.

**Q: Project not saving?**
A: Check browser console for errors. Ensure the project has a valid structure.

**Q: Templates not applying?**
A: Template defaults are applied when creating the project. Effects/transitions are added when user adds clips.
