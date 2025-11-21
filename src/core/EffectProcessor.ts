/**
 * EffectProcessor - Manages post-processing effects and filters
 * Integrates with Three.js EffectComposer for advanced visual effects
 */

import * as THREE from 'three';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
  GlitchEffect,
  PixelationEffect,
  ToneMappingEffect,
  NoiseEffect,
} from 'postprocessing';
import type { Effect } from '../types';

/**
 * Custom RGB Split Effect using shader material
 */
class RGBSplitEffect extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        tDiffuse: { value: null },
        amount: { value: 0.005 },
        angle: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float amount;
        uniform float angle;
        varying vec2 vUv;
        
        void main() {
          vec2 offset = amount * vec2(cos(angle), sin(angle));
          vec4 cr = texture2D(tDiffuse, vUv + offset);
          vec4 cga = texture2D(tDiffuse, vUv);
          vec4 cb = texture2D(tDiffuse, vUv - offset);
          gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
        }
      `,
    });
  }
}

/**
 * Custom Distortion Effect using displacement mapping
 */
class DistortionEffect extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        tDiffuse: { value: null },
        tDisplacement: { value: null },
        amount: { value: 0.1 },
        time: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDisplacement;
        uniform float amount;
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          vec2 distortedUv = vUv;
          vec4 disp = texture2D(tDisplacement, vUv + time * 0.1);
          distortedUv += (disp.rg - 0.5) * amount;
          gl_FragColor = texture2D(tDiffuse, distortedUv);
        }
      `,
    });
  }
}

/**
 * GPU Particle System for particle effects
 */
export class ParticleSystem {
  private particles: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private particleCount: number;
  private velocities: Float32Array;
  private lifetimes: Float32Array;
  private time: number = 0;

  constructor(count: number = 1000) {
    this.particleCount = count;
    
    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    this.velocities = new Float32Array(count * 3);
    this.lifetimes = new Float32Array(count);
    
    // Initialize particles
    for (let i = 0; i < count; i++) {
      this.resetParticle(i, positions, colors, sizes);
    }
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material
    this.material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    this.particles = new THREE.Points(this.geometry, this.material);
  }

  private resetParticle(
    index: number,
    positions: Float32Array,
    colors: Float32Array,
    sizes: Float32Array
  ): void {
    const i3 = index * 3;
    
    // Random position in sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = Math.random() * 0.5;
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
    
    // Random velocity
    this.velocities[i3] = (Math.random() - 0.5) * 0.02;
    this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
    this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    
    // Random color
    colors[i3] = Math.random();
    colors[i3 + 1] = Math.random();
    colors[i3 + 2] = Math.random();
    
    // Random size
    sizes[index] = Math.random() * 0.1 + 0.05;
    
    // Random lifetime
    this.lifetimes[index] = Math.random() * 2 + 1;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    
    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;
    const sizes = this.geometry.attributes.size.array as Float32Array;
    
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      // Update position
      positions[i3] += this.velocities[i3];
      positions[i3 + 1] += this.velocities[i3 + 1];
      positions[i3 + 2] += this.velocities[i3 + 2];
      
      // Update lifetime
      this.lifetimes[i] -= deltaTime;
      
      // Reset if dead
      if (this.lifetimes[i] <= 0) {
        this.resetParticle(i, positions, colors, sizes);
      }
    }
    
    this.geometry.attributes.position.needsUpdate = true;
  }

  getObject(): THREE.Points {
    return this.particles;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

/**
 * Main EffectProcessor class
 */
export class EffectProcessor {
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private effectPasses: Map<string, EffectPass> = new Map();
  private customEffects: Map<string, THREE.ShaderMaterial> = new Map();
  private particleSystems: Map<string, ParticleSystem> = new Map();
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private activeEffects: Map<string, Effect> = new Map();

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene;
    this.camera = camera;
    
    // Initialize composer
    this.composer = new EffectComposer(renderer);
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);
  }

  /**
   * Add an effect to a video clip
   */
  addEffect(clipId: string, effect: Effect): void {
    const effectKey = `${clipId}-${effect.id}`;
    this.activeEffects.set(effectKey, effect);
    
    if (!effect.enabled) return;
    
    const intensity = effect.intensity / 100; // Convert 0-100 to 0-1
    
    switch (effect.type) {
      case 'particles':
        this.addParticleEffect(effectKey, effect, intensity);
        break;
      case 'glow':
        this.addGlowEffect(effectKey, effect, intensity);
        break;
      case 'distortion':
        this.addDistortionEffect(effectKey, effect, intensity);
        break;
      case 'glitch':
        this.addGlitchEffect(effectKey, effect, intensity);
        break;
      case 'chromatic':
        this.addChromaticEffect(effectKey, effect, intensity);
        break;
      case 'vignette':
        this.addVignetteEffect(effectKey, effect, intensity);
        break;
      case 'color-grade':
        this.addColorGradeEffect(effectKey, effect, intensity);
        break;
      case 'blur':
        this.addBlurEffect(effectKey, effect, intensity);
        break;
      case 'pixelate':
        this.addPixelateEffect(effectKey, effect, intensity);
        break;
      case 'rgb-split':
        this.addRGBSplitEffect(effectKey, effect, intensity);
        break;
    }
  }

  /**
   * Remove an effect from a video clip
   */
  removeEffect(clipId: string, effectId: string): void {
    const effectKey = `${clipId}-${effectId}`;
    
    // Remove from active effects
    this.activeEffects.delete(effectKey);
    
    // Remove effect pass
    const pass = this.effectPasses.get(effectKey);
    if (pass) {
      this.composer.removePass(pass);
      this.effectPasses.delete(effectKey);
    }
    
    // Remove custom effect
    const customEffect = this.customEffects.get(effectKey);
    if (customEffect) {
      customEffect.dispose();
      this.customEffects.delete(effectKey);
    }
    
    // Remove particle system
    const particleSystem = this.particleSystems.get(effectKey);
    if (particleSystem) {
      this.scene.remove(particleSystem.getObject());
      particleSystem.dispose();
      this.particleSystems.delete(effectKey);
    }
  }

  /**
   * Update effect parameters
   */
  updateEffect(clipId: string, effectId: string, updates: Partial<Effect>): void {
    const effectKey = `${clipId}-${effectId}`;
    const effect = this.activeEffects.get(effectKey);
    
    if (!effect) return;
    
    // Update effect data
    Object.assign(effect, updates);
    
    // If enabled state changed, add or remove effect
    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.addEffect(clipId, effect);
      } else {
        this.removeEffect(clipId, effectId);
      }
      return;
    }
    
    // Update intensity or params
    if (updates.intensity !== undefined || updates.params) {
      this.removeEffect(clipId, effectId);
      this.addEffect(clipId, effect);
    }
  }

  /**
   * Render with all active effects
   */
  render(deltaTime?: number): void {
    // Update particle systems
    this.particleSystems.forEach(system => {
      system.update(deltaTime || 0.016);
    });
    
    // Update custom effects with time
    this.customEffects.forEach(material => {
      if (material.uniforms.time) {
        material.uniforms.time.value += deltaTime || 0.016;
      }
    });
    
    // Render with composer
    this.composer.render(deltaTime);
  }

  /**
   * Resize composer
   */
  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.composer.dispose();
    this.customEffects.forEach(material => material.dispose());
    this.particleSystems.forEach(system => system.dispose());
    this.effectPasses.clear();
    this.customEffects.clear();
    this.particleSystems.clear();
    this.activeEffects.clear();
  }

  // Effect implementation methods
  private addParticleEffect(key: string, _effect: Effect, intensity: number): void {
    const count = Math.floor(1000 * intensity);
    const particleSystem = new ParticleSystem(count);
    this.particleSystems.set(key, particleSystem);
    this.scene.add(particleSystem.getObject());
  }

  private addGlowEffect(key: string, _effect: Effect, intensity: number): void {
    const bloomEffect = new BloomEffect({
      intensity: intensity * 2,
      luminanceThreshold: 0.3,
      luminanceSmoothing: 0.9,
    });
    
    const pass = new EffectPass(this.camera, bloomEffect);
    this.composer.addPass(pass);
    this.effectPasses.set(key, pass);
  }

  private addDistortionEffect(key: string, effect: Effect, intensity: number): void {
    // Create displacement texture
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      const i4 = i * 4;
      data[i4] = Math.random() * 255;
      data[i4 + 1] = Math.random() * 255;
      data[i4 + 2] = 128;
      data[i4 + 3] = 255;
    }
    const displacementTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    displacementTexture.needsUpdate = true;
    
    const material = new DistortionEffect();
    material.uniforms.tDisplacement.value = displacementTexture;
    material.uniforms.amount.value = intensity * 0.2;
    this.customEffects.set(key, material);
    
    // Store texture for cleanup
    (effect.params as { texture?: THREE.DataTexture }).texture = displacementTexture;
  }

  private addGlitchEffect(key: string, _effect: Effect, intensity: number): void {
    const glitchEffect = new GlitchEffect({
      delay: new THREE.Vector2(1.5, 3.5),
      duration: new THREE.Vector2(0.1, 0.3),
      strength: new THREE.Vector2(intensity * 0.3, intensity),
    });
    
    const noiseEffect = new NoiseEffect({
      premultiply: true,
    });
    noiseEffect.blendMode.opacity.value = intensity * 0.3;
    
    const pass = new EffectPass(this.camera, glitchEffect, noiseEffect);
    this.composer.addPass(pass);
    this.effectPasses.set(key, pass);
  }

  private addChromaticEffect(key: string, _effect: Effect, intensity: number): void {
    const chromaticEffect = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(intensity * 0.01, intensity * 0.01),
      radialModulation: false,
      modulationOffset: 0,
    });
    
    const pass = new EffectPass(this.camera, chromaticEffect);
    this.composer.addPass(pass);
    this.effectPasses.set(key, pass);
  }

  private addVignetteEffect(key: string, _effect: Effect, intensity: number): void {
    const vignetteEffect = new VignetteEffect({
      darkness: intensity * 0.8,
      offset: 0.3,
    });
    
    const pass = new EffectPass(this.camera, vignetteEffect);
    this.composer.addPass(pass);
    this.effectPasses.set(key, pass);
  }

  private addColorGradeEffect(key: string, _effect: Effect, intensity: number): void {
    const toneMappingEffect = new ToneMappingEffect({
      mode: 2, // ACES Filmic
      resolution: 256,
      whitePoint: 4.0,
      middleGrey: 0.6,
      minLuminance: 0.01,
      averageLuminance: 1.0,
      adaptationRate: 1.0,
    });
    
    toneMappingEffect.blendMode.opacity.value = intensity;
    
    const pass = new EffectPass(this.camera, toneMappingEffect);
    this.composer.addPass(pass);
    this.effectPasses.set(key, pass);
  }

  private addBlurEffect(key: string, _effect: Effect, intensity: number): void {
    // Simple blur using bloom with low threshold
    const blurEffect = new BloomEffect({
      intensity: intensity * 0.5,
      luminanceThreshold: 0,
      luminanceSmoothing: 1.0,
    });
    
    const pass = new EffectPass(this.camera, blurEffect);
    this.composer.addPass(pass);
    this.effectPasses.set(key, pass);
  }

  private addPixelateEffect(key: string, _effect: Effect, intensity: number): void {
    const granularity = Math.max(1, Math.floor(30 * (1 - intensity)));
    const pixelationEffect = new PixelationEffect(granularity);
    
    const pass = new EffectPass(this.camera, pixelationEffect);
    this.composer.addPass(pass);
    this.effectPasses.set(key, pass);
  }

  private addRGBSplitEffect(key: string, effect: Effect, intensity: number): void {
    const material = new RGBSplitEffect();
    material.uniforms.amount.value = intensity * 0.02;
    material.uniforms.angle.value = (effect.params.angle as number) || 0;
    this.customEffects.set(key, material);
  }
}
