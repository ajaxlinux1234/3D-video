# Shaders

GLSL shaders for 3D transitions and effects.

## Structure

- `transitions/` - Transition effect shaders (implemented in index.ts)
  - Sphere Warp - Spherical distortion effect
  - Dissolve - Noise-based pixel dissolve
  - Glitch - RGB separation and scanlines
  - Zoom Blur - Radial blur effect
  - Ripple - Water ripple effect
  - Page Turn - Book page flip with curl
  
- `effects/` - Visual effect shaders (to be implemented in task 8)
  - Glow effects
  - Distortion effects
  - Color grading
  - etc.

## Transition Shaders

All transition shaders are defined in `transitions/index.ts` and exported as a single object. Each shader includes:
- Vertex shader for geometry transformation
- Fragment shader for pixel-level effects
- Uniforms for texture inputs and progress control

### Usage

```typescript
import { transitionShaders } from './shaders/transitions';

// Create shader material
const material = new THREE.ShaderMaterial({
  uniforms: {
    textureA: { value: texture1 },
    textureB: { value: texture2 },
    progress: { value: 0.5 },
  },
  vertexShader: transitionShaders.dissolve.vertex,
  fragmentShader: transitionShaders.dissolve.fragment,
});
```

## Transition Types

### 1. Cube Flip
3D cube rotation effect - implemented using mesh rotation (no custom shader needed)

### 2. Sphere Warp
Spherical distortion that warps the video into a sphere shape during transition

### 3. Particle Burst
Particle explosion effect using Three.js Points system

### 4. Page Turn
Book page flip effect with 3D curl simulation

### 5. Dissolve
Noise-based pixel dissolve with smooth edges

### 6. Glitch
Digital glitch effect with RGB channel separation and scanlines

### 7. Zoom Blur
Radial blur effect that zooms into the center

### 8. Ripple
Water ripple effect expanding from center
