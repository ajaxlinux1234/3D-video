/**
 * TransitionSystem - Manages 3D transition effects between video clips
 */
import * as THREE from 'three';
import { VideoPlane } from './VideoPlane';
import { TransitionType, type Transition } from '../types';

// Easing functions
export const EasingFunctions = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

export type EasingFunction = keyof typeof EasingFunctions;

/**
 * TransitionSystem class
 */
export class TransitionSystem {
  private scene: THREE.Scene;
  private transitionMaterials: Map<string, THREE.ShaderMaterial>;
  private particleSystems: Map<string, THREE.Points>;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.transitionMaterials = new Map();
    this.particleSystems = new Map();
  }

  /**
   * Apply transition between two video clips
   */
  applyTransition(
    fromClip: VideoPlane,
    toClip: VideoPlane,
    transition: Transition,
    progress: number
  ): void {
    // Apply easing function
    const easingFn = EasingFunctions[transition.easing as EasingFunction] || EasingFunctions.linear;
    const easedProgress = easingFn(progress);

    // Apply specific transition based on type
    switch (transition.type) {
      case TransitionType.CUBE_FLIP:
        this.cubeFlip(fromClip, toClip, easedProgress);
        break;
      case TransitionType.SPHERE_WARP:
        this.sphereWarp(fromClip, toClip, easedProgress);
        break;
      case TransitionType.PARTICLE_BURST:
        this.particleBurst(fromClip, toClip, easedProgress, transition.params);
        break;
      case TransitionType.PAGE_TURN:
        this.pageTurn(fromClip, toClip, easedProgress);
        break;
      case TransitionType.DISSOLVE:
        this.dissolve(fromClip, toClip, easedProgress);
        break;
      case TransitionType.GLITCH:
        this.glitch(fromClip, toClip, easedProgress);
        break;
      case TransitionType.ZOOM_BLUR:
        this.zoomBlur(fromClip, toClip, easedProgress);
        break;
      case TransitionType.RIPPLE:
        this.ripple(fromClip, toClip, easedProgress);
        break;
    }
  }

  /**
   * Cube flip transition - 3D cube rotation effect
   */
  private cubeFlip(fromClip: VideoPlane, toClip: VideoPlane, progress: number): void {
    const angle = progress * Math.PI;
    
    // Rotate from clip
    fromClip.mesh.rotation.y = angle;
    fromClip.mesh.visible = progress < 0.5;
    
    // Rotate to clip (starts from back)
    toClip.mesh.rotation.y = angle - Math.PI;
    toClip.mesh.visible = progress >= 0.5;
    
    // Adjust opacity for smooth transition
    if (progress < 0.5) {
      fromClip.setOpacity(1 - progress * 2);
    } else {
      toClip.setOpacity((progress - 0.5) * 2);
    }
  }

  /**
   * Sphere warp transition - spherical distortion effect
   */
  private sphereWarp(fromClip: VideoPlane, toClip: VideoPlane, progress: number): void {
    // Create or get shader material
    const key = `${fromClip.mesh.uuid}-${toClip.mesh.uuid}`;
    let material = this.transitionMaterials.get(key);
    
    if (!material) {
      material = new THREE.ShaderMaterial({
        uniforms: {
          textureA: { value: fromClip.getTexture() },
          textureB: { value: toClip.getTexture() },
          progress: { value: 0 },
        },
        vertexShader: this.getSphereWarpVertexShader(),
        fragmentShader: this.getSphereWarpFragmentShader(),
        transparent: true,
      });
      this.transitionMaterials.set(key, material);
    }
    
    // Update progress
    material.uniforms.progress.value = progress;
    material.uniforms.textureA.value = fromClip.getTexture();
    material.uniforms.textureB.value = toClip.getTexture();
    
    // Apply material to from clip
    fromClip.mesh.material = material;
    toClip.mesh.visible = false;
  }

  /**
   * Particle burst transition - particles explosion effect
   */
  private particleBurst(
    fromClip: VideoPlane,
    toClip: VideoPlane,
    progress: number,
    params: Record<string, unknown>
  ): void {
    const particleCount = (params.particleCount as number) || 1000;
    const key = `${fromClip.mesh.uuid}-${toClip.mesh.uuid}`;
    
    // Create particle system if not exists
    if (!this.particleSystems.has(key) && progress > 0) {
      const particles = this.createParticleSystem(particleCount);
      this.scene.add(particles);
      this.particleSystems.set(key, particles);
    }
    
    const particles = this.particleSystems.get(key);
    
    if (particles) {
      // Animate particles
      const positions = particles.geometry.attributes.position.array as Float32Array;
      const velocities = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        velocities[i3] = (Math.random() - 0.5) * 2;
        velocities[i3 + 1] = (Math.random() - 0.5) * 2;
        velocities[i3 + 2] = (Math.random() - 0.5) * 2;
        
        positions[i3] += velocities[i3] * progress * 0.1;
        positions[i3 + 1] += velocities[i3 + 1] * progress * 0.1;
        positions[i3 + 2] += velocities[i3 + 2] * progress * 0.1;
      }
      
      particles.geometry.attributes.position.needsUpdate = true;
      
      // Fade out from clip, fade in to clip
      fromClip.setOpacity(1 - progress);
      toClip.setOpacity(progress);
      
      // Clean up particles when done
      if (progress >= 1) {
        this.scene.remove(particles);
        particles.geometry.dispose();
        (particles.material as THREE.Material).dispose();
        this.particleSystems.delete(key);
      }
    }
  }

  /**
   * Page turn transition - book page flip effect
   */
  private pageTurn(fromClip: VideoPlane, toClip: VideoPlane, progress: number): void {
    // Create curved page effect using rotation and position
    const angle = progress * Math.PI;
    
    // From clip curls away
    fromClip.mesh.rotation.y = angle;
    fromClip.mesh.position.x = -progress * 2;
    fromClip.setOpacity(1 - progress);
    
    // To clip appears from behind
    toClip.mesh.position.x = (1 - progress) * 2;
    toClip.setOpacity(progress);
  }

  /**
   * Dissolve transition - noise-based pixel dissolve
   */
  private dissolve(fromClip: VideoPlane, toClip: VideoPlane, progress: number): void {
    const key = `${fromClip.mesh.uuid}-${toClip.mesh.uuid}`;
    let material = this.transitionMaterials.get(key);
    
    if (!material) {
      material = new THREE.ShaderMaterial({
        uniforms: {
          textureA: { value: fromClip.getTexture() },
          textureB: { value: toClip.getTexture() },
          progress: { value: 0 },
        },
        vertexShader: this.getDissolveVertexShader(),
        fragmentShader: this.getDissolveFragmentShader(),
        transparent: true,
      });
      this.transitionMaterials.set(key, material);
    }
    
    material.uniforms.progress.value = progress;
    material.uniforms.textureA.value = fromClip.getTexture();
    material.uniforms.textureB.value = toClip.getTexture();
    
    fromClip.mesh.material = material;
    toClip.mesh.visible = false;
  }

  /**
   * Glitch transition - RGB separation and scanlines
   */
  private glitch(fromClip: VideoPlane, toClip: VideoPlane, progress: number): void {
    const key = `${fromClip.mesh.uuid}-${toClip.mesh.uuid}`;
    let material = this.transitionMaterials.get(key);
    
    if (!material) {
      material = new THREE.ShaderMaterial({
        uniforms: {
          textureA: { value: fromClip.getTexture() },
          textureB: { value: toClip.getTexture() },
          progress: { value: 0 },
          time: { value: 0 },
        },
        vertexShader: this.getGlitchVertexShader(),
        fragmentShader: this.getGlitchFragmentShader(),
        transparent: true,
      });
      this.transitionMaterials.set(key, material);
    }
    
    material.uniforms.progress.value = progress;
    material.uniforms.time.value = Date.now() * 0.001;
    material.uniforms.textureA.value = fromClip.getTexture();
    material.uniforms.textureB.value = toClip.getTexture();
    
    fromClip.mesh.material = material;
    toClip.mesh.visible = false;
  }

  /**
   * Zoom blur transition - radial blur effect
   */
  private zoomBlur(fromClip: VideoPlane, toClip: VideoPlane, progress: number): void {
    const key = `${fromClip.mesh.uuid}-${toClip.mesh.uuid}`;
    let material = this.transitionMaterials.get(key);
    
    if (!material) {
      material = new THREE.ShaderMaterial({
        uniforms: {
          textureA: { value: fromClip.getTexture() },
          textureB: { value: toClip.getTexture() },
          progress: { value: 0 },
        },
        vertexShader: this.getZoomBlurVertexShader(),
        fragmentShader: this.getZoomBlurFragmentShader(),
        transparent: true,
      });
      this.transitionMaterials.set(key, material);
    }
    
    material.uniforms.progress.value = progress;
    material.uniforms.textureA.value = fromClip.getTexture();
    material.uniforms.textureB.value = toClip.getTexture();
    
    fromClip.mesh.material = material;
    toClip.mesh.visible = false;
  }

  /**
   * Ripple transition - water ripple effect
   */
  private ripple(fromClip: VideoPlane, toClip: VideoPlane, progress: number): void {
    const key = `${fromClip.mesh.uuid}-${toClip.mesh.uuid}`;
    let material = this.transitionMaterials.get(key);
    
    if (!material) {
      material = new THREE.ShaderMaterial({
        uniforms: {
          textureA: { value: fromClip.getTexture() },
          textureB: { value: toClip.getTexture() },
          progress: { value: 0 },
        },
        vertexShader: this.getRippleVertexShader(),
        fragmentShader: this.getRippleFragmentShader(),
        transparent: true,
      });
      this.transitionMaterials.set(key, material);
    }
    
    material.uniforms.progress.value = progress;
    material.uniforms.textureA.value = fromClip.getTexture();
    material.uniforms.textureB.value = toClip.getTexture();
    
    fromClip.mesh.material = material;
    toClip.mesh.visible = false;
  }

  /**
   * Create particle system for particle burst transition
   */
  private createParticleSystem(count: number): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    return new THREE.Points(geometry, material);
  }

  /**
   * Reset transition (restore original materials)
   */
  resetTransition(fromClip: VideoPlane, toClip: VideoPlane): void {
    // Reset transforms
    fromClip.mesh.rotation.set(0, 0, 0);
    fromClip.mesh.position.set(0, 0, 0);
    fromClip.setOpacity(1);
    fromClip.mesh.visible = true;
    
    toClip.mesh.rotation.set(0, 0, 0);
    toClip.mesh.position.set(0, 0, 0);
    toClip.setOpacity(1);
    toClip.mesh.visible = true;
    
    // Restore original materials
    fromClip.restoreOriginalMaterial();
    toClip.restoreOriginalMaterial();
  }

  /**
   * Dispose all transition resources
   */
  dispose(): void {
    // Dispose materials
    this.transitionMaterials.forEach(material => {
      material.dispose();
    });
    this.transitionMaterials.clear();
    
    // Dispose particle systems
    this.particleSystems.forEach(particles => {
      this.scene.remove(particles);
      particles.geometry.dispose();
      (particles.material as THREE.Material).dispose();
    });
    this.particleSystems.clear();
  }

  // Shader getters
  private getSphereWarpVertexShader(): string {
    return `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  private getSphereWarpFragmentShader(): string {
    return `
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform float progress;
      varying vec2 vUv;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 toCenter = vUv - center;
        float dist = length(toCenter);
        
        // Spherical warp
        float warp = progress * 2.0;
        vec2 warpedUv = vUv + toCenter * warp * (1.0 - dist);
        
        vec4 colorA = texture2D(textureA, warpedUv);
        vec4 colorB = texture2D(textureB, vUv);
        
        gl_FragColor = mix(colorA, colorB, progress);
      }
    `;
  }

  private getDissolveVertexShader(): string {
    return `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  private getDissolveFragmentShader(): string {
    return `
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform float progress;
      varying vec2 vUv;
      
      // Simple noise function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      void main() {
        vec4 colorA = texture2D(textureA, vUv);
        vec4 colorB = texture2D(textureB, vUv);
        
        float noise = random(vUv);
        float threshold = progress;
        
        if (noise < threshold) {
          gl_FragColor = colorB;
        } else {
          gl_FragColor = colorA;
        }
      }
    `;
  }

  private getGlitchVertexShader(): string {
    return `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  private getGlitchFragmentShader(): string {
    return `
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform float progress;
      uniform float time;
      varying vec2 vUv;
      
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      void main() {
        vec2 uv = vUv;
        
        // RGB separation
        float offset = progress * 0.1 * sin(time * 10.0);
        vec4 colorA_R = texture2D(textureA, uv + vec2(offset, 0.0));
        vec4 colorA_G = texture2D(textureA, uv);
        vec4 colorA_B = texture2D(textureA, uv - vec2(offset, 0.0));
        vec4 colorA = vec4(colorA_R.r, colorA_G.g, colorA_B.b, 1.0);
        
        vec4 colorB = texture2D(textureB, uv);
        
        // Scanlines
        float scanline = sin(uv.y * 800.0 + time * 10.0) * 0.1;
        
        vec4 finalColor = mix(colorA, colorB, progress);
        finalColor.rgb += scanline;
        
        gl_FragColor = finalColor;
      }
    `;
  }

  private getZoomBlurVertexShader(): string {
    return `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  private getZoomBlurFragmentShader(): string {
    return `
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform float progress;
      varying vec2 vUv;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 toCenter = vUv - center;
        
        // Radial blur
        vec4 colorA = vec4(0.0);
        int samples = 10;
        for (int i = 0; i < 10; i++) {
          float scale = 1.0 + (float(i) / float(samples)) * progress * 0.5;
          vec2 sampleUv = center + toCenter * scale;
          colorA += texture2D(textureA, sampleUv);
        }
        colorA /= float(samples);
        
        vec4 colorB = texture2D(textureB, vUv);
        
        gl_FragColor = mix(colorA, colorB, progress);
      }
    `;
  }

  private getRippleVertexShader(): string {
    return `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  private getRippleFragmentShader(): string {
    return `
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform float progress;
      varying vec2 vUv;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);
        
        // Ripple effect
        float ripple = sin((dist - progress) * 30.0) * 0.02 * (1.0 - progress);
        vec2 rippleUv = vUv + normalize(vUv - center) * ripple;
        
        vec4 colorA = texture2D(textureA, rippleUv);
        vec4 colorB = texture2D(textureB, vUv);
        
        // Fade based on distance from center
        float fade = smoothstep(progress - 0.1, progress + 0.1, dist);
        
        gl_FragColor = mix(colorA, colorB, fade);
      }
    `;
  }
}
