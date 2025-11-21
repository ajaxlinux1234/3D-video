/**
 * WebGL检测工具函数
 */

/**
 * 检测WebGL支持
 */
export const checkWebGLSupport = (): { supported: boolean; version: number } => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      return { supported: false, version: 0 };
    }

    const isWebGL2 = gl instanceof WebGL2RenderingContext;
    return { supported: true, version: isWebGL2 ? 2 : 1 };
  } catch (e) {
    return { supported: false, version: 0 };
  }
};
