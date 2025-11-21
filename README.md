# 3D Video Composer

A web-based 3D video composition tool for creating stunning vertical videos (9:16 format) perfect for TikTok/Douyin.

## Features

- 🎬 Import and manage multiple AI-generated video clips
- 🎨 3D scene editing with position, rotation, and scale controls
- ✨ 8+ stunning 3D transition effects (cube flip, sphere warp, particle burst, etc.)
- 🎭 10+ visual effects and filters (particles, glow, glitch, etc.)
- 🎵 Audio processing with multi-track mixing
- 📱 Optimized for 9:16 vertical format (1080x1920)
- ⚡ Real-time preview with adaptive quality
- 💾 Project save/load functionality
- 📤 High-quality video export (720p/1080p/2K)

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **3D Rendering**: Three.js + @react-three/fiber + @react-three/drei
- **Video Processing**: FFmpeg.wasm
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development

```bash
# Run development server
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/      # React UI components
│   ├── Timeline/   # Timeline editor
│   ├── Preview/    # 3D preview window
│   ├── EffectsPanel/
│   └── ExportDialog/
├── core/           # Core business logic
│   ├── ProjectManager.ts
│   ├── VideoManager.ts
│   ├── SceneManager.ts
│   ├── TransitionSystem.ts
│   ├── EffectProcessor.ts
│   ├── AudioManager.ts
│   └── ExportManager.ts
├── store/          # Zustand state management
├── shaders/        # GLSL shaders
│   ├── transitions/
│   └── effects/
├── utils/          # Utility functions
└── types/          # TypeScript type definitions
```

## Canvas Configuration

The application is configured for 9:16 vertical format:
- Default resolution: 1080 × 1920 pixels
- Aspect ratio: 9:16 (0.5625)
- Target FPS: 60fps
- Export options: 720p, 1080p, 2K

## Requirements

See [requirements.md](.kiro/specs/3d-video-composer/requirements.md) for detailed feature requirements.

## Design

See [design.md](.kiro/specs/3d-video-composer/design.md) for architecture and technical design.

## License

MIT
