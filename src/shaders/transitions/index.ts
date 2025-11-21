/**
 * Transition Shaders - GLSL shaders for various transition effects
 */

export const transitionShaders = {
  // Sphere Warp Transition
  sphereWarp: {
    vertex: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
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
    `,
  },

  // Dissolve Transition
  dissolve: {
    vertex: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
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
        
        // Smooth transition edge
        float edge = 0.1;
        float alpha = smoothstep(threshold - edge, threshold + edge, noise);
        
        gl_FragColor = mix(colorA, colorB, alpha);
      }
    `,
  },

  // Glitch Transition
  glitch: {
    vertex: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
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
        
        // Random glitch blocks
        float blockNoise = random(vec2(floor(uv.y * 20.0), time));
        if (blockNoise > 0.9 && progress > 0.3 && progress < 0.7) {
          uv.x += (random(vec2(time, uv.y)) - 0.5) * 0.1;
        }
        
        vec4 finalColor = mix(colorA, colorB, progress);
        finalColor.rgb += scanline * (1.0 - progress);
        
        gl_FragColor = finalColor;
      }
    `,
  },

  // Zoom Blur Transition
  zoomBlur: {
    vertex: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
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
        float blurStrength = progress * (1.0 - progress) * 4.0; // Peak at 0.5
        
        for (int i = 0; i < 10; i++) {
          float scale = 1.0 + (float(i) / float(samples)) * blurStrength * 0.5;
          vec2 sampleUv = center + toCenter * scale;
          colorA += texture2D(textureA, sampleUv);
        }
        colorA /= float(samples);
        
        vec4 colorB = texture2D(textureB, vUv);
        
        gl_FragColor = mix(colorA, colorB, progress);
      }
    `,
  },

  // Ripple Transition
  ripple: {
    vertex: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
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
    `,
  },

  // Page Turn Transition (enhanced with shader)
  pageTurn: {
    vertex: `
      varying vec2 vUv;
      varying vec3 vPosition;
      uniform float progress;
      
      void main() {
        vUv = uv;
        vPosition = position;
        
        // Curl the page
        vec3 pos = position;
        float curlAmount = progress * 3.14159;
        float curlRadius = 2.0;
        
        if (pos.x > -1.0 + progress * 2.0) {
          float angle = (pos.x + 1.0 - progress * 2.0) * curlAmount;
          pos.x = -1.0 + progress * 2.0 + sin(angle) * curlRadius;
          pos.z = (1.0 - cos(angle)) * curlRadius;
        }
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragment: `
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform float progress;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vec4 colorA = texture2D(textureA, vUv);
        vec4 colorB = texture2D(textureB, vUv);
        
        // Show back of page (darker)
        float backSide = step(0.0, vPosition.z);
        vec4 color = mix(colorA * 0.7, colorA, backSide);
        
        // Fade to next texture
        color = mix(color, colorB, smoothstep(0.7, 1.0, progress));
        
        gl_FragColor = color;
      }
    `,
  },
};
