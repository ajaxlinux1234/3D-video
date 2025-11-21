# Effect Processor System

The Effect Processor system provides advanced post-processing effects and filters for video clips using Three.js and the `postprocessing` library.

## Features

### Available Effects

1. **Particles** ✨
   - GPU-accelerated particle system
   - Customizable emitter configuration
   - Additive blending for glow effects

2. **Bloom/Glow** 💫
   - Bloom effect with luminance threshold
   - God rays and lens flare support
   - Adjustable intensity and smoothing

3. **Distortion** 🌀
   - Displacement-based image warping
   - Animated distortion patterns
   - Customizable displacement maps

4. **Glitch** 📺
   - RGB channel separation
   - Digital noise and scanlines
   - Random glitch intervals

5. **Chromatic Aberration** 🌈
   - Lens chromatic aberration simulation
   - Adjustable color channel offset
   - Realistic optical effects

6. **Vignette** ⚫
   - Edge darkening effect
   - Adjustable darkness and offset
   - Cinematic look

7. **Color Grading** 🎨
   - LUT-based color grading
   - Tone mapping (ACES Filmic)
   - Professional color correction

8. **Blur** 🌫️
   - Gaussian blur
   - Radial blur support
   - Adjustable kernel size

9. **Pixelate** 🟦
   - Retro pixelation effect
   - Adjustable granularity
   - 8-bit aesthetic

10. **RGB Split** 🔴🟢🔵
    - Color channel separation
    - Adjustable split angle
    - Glitch-style effect

## Usage

### Basic Setup

```typescript
import { EffectProcessor } from './core/EffectProcessor';
import type { Effect } from './types';

// Initialize processor
const processor = new EffectProcessor(scene, camera, renderer);

// Add an effect
const bloomEffect: Effect = {
  id: 'bloom-1',
  type: 'glow',
  intensity: 75,
  params: {},
  enabled: true,
};

processor.addEffect('clip-id', bloomEffect);

// Render with effects
function animate() {
  const deltaTime = clock.getDelta();
  processor.render(deltaTime);
  requestAnimationFrame(animate);
}
```

### Using the React Hook

```typescript
import { useEffectProcessor } from './core/useEffectProcessor';

function MyComponent() {
  const { processor, addEffect, removeEffect, updateEffect, render } = 
    useEffectProcessor({
      scene,
      camera,
      renderer,
      enabled: true,
    });

  // Add effect
  const handleAddEffect = () => {
    addEffect('clip-1', {
      id: 'effect-1',
      type: 'glitch',
      intensity: 50,
      params: {},
      enabled: true,
    });
  };

  // Update effect intensity
  const handleUpdateIntensity = (intensity: number) => {
    updateEffect('clip-1', 'effect-1', { intensity });
  };

  // Render loop
  useEffect(() => {
    const animate = () => {
      render(0.016);
      requestAnimationFrame(animate);
    };
    animate();
  }, [render]);
}
```

### Effect Parameters

Each effect supports the following base properties:

- `id`: Unique identifier
- `type`: Effect type (see EffectType enum)
- `intensity`: 0-100 (converted to 0-1 internally)
- `params`: Effect-specific parameters
- `enabled`: Toggle effect on/off

### Custom Parameters

Some effects support additional parameters:

```typescript
// RGB Split with custom angle
const rgbSplit: Effect = {
  id: 'rgb-1',
  type: 'rgb-split',
  intensity: 60,
  params: {
    angle: Math.PI / 4, // 45 degrees
  },
  enabled: true,
};
```

## Architecture

### EffectProcessor Class

The main class that manages all effects:

- **composer**: Three.js EffectComposer for post-processing
- **effectPasses**: Map of active effect passes
- **customEffects**: Map of custom shader materials
- **particleSystems**: Map of GPU particle systems

### ParticleSystem Class

GPU-accelerated particle system:

- Efficient buffer geometry
- Automatic particle lifecycle management
- Additive blending for glow effects
- Customizable particle count

### Custom Shaders

Custom effects are implemented as GLSL shaders:

- **RGBSplitEffect**: Color channel separation
- **DistortionEffect**: Displacement-based warping

## Performance Considerations

1. **Effect Stacking**: Multiple effects are rendered in sequence. Limit to 3-5 active effects for optimal performance.

2. **Particle Count**: Default is 1000 particles. Adjust based on target device:
   - Low-end: 500 particles
   - Mid-range: 1000 particles
   - High-end: 2000+ particles

3. **Blur Quality**: Blur effects are expensive. Use lower kernel sizes for real-time preview.

4. **Resolution Scaling**: The composer respects renderer resolution. Lower preview resolution for better performance.

## Integration with Timeline

Effects can be applied to specific video clips on the timeline:

```typescript
// Add effect to clip at specific time
const clip: VideoClip = {
  id: 'clip-1',
  videoId: 'video-1',
  startTime: 0,
  duration: 5,
  effects: [
    {
      id: 'effect-1',
      type: 'glitch',
      intensity: 80,
      params: {},
      enabled: true,
    },
  ],
  // ... other properties
};
```

## Troubleshooting

### Effects Not Visible

1. Ensure `enabled: true` on the effect
2. Check intensity is > 0
3. Verify composer is rendering (not regular renderer)
4. Check browser console for WebGL errors

### Performance Issues

1. Reduce number of active effects
2. Lower particle count
3. Decrease blur kernel size
4. Use lower preview resolution

### Memory Leaks

Always dispose of the processor when done:

```typescript
processor.dispose();
```

## Future Enhancements

- [ ] LUT texture loading for color grading
- [ ] Custom shader effect support
- [ ] Effect presets and templates
- [ ] Keyframe animation for effect parameters
- [ ] Effect groups and layers
- [ ] Real-time effect preview thumbnails
