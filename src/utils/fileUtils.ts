/**
 * File utility functions for video import
 */

/**
 * Open file picker for video selection
 */
export function openVideoPicker(multiple: boolean = true): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm';
    input.multiple = multiple;

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        resolve(Array.from(target.files));
      } else {
        reject(new Error('No files selected'));
      }
    };

    input.oncancel = () => {
      reject(new Error('File selection cancelled'));
    };

    input.click();
  });
}

/**
 * Extract files from drag event
 */
export function extractFilesFromDragEvent(event: React.DragEvent | DragEvent): File[] {
  const files: File[] = [];

  if (event.dataTransfer?.items) {
    // Use DataTransferItemList interface
    for (let i = 0; i < event.dataTransfer.items.length; i++) {
      const item = event.dataTransfer.items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
  } else if (event.dataTransfer?.files) {
    // Use DataTransferList interface
    files.push(...Array.from(event.dataTransfer.files));
  }

  return files;
}

/**
 * Filter video files from file list
 */
export function filterVideoFiles(files: File[]): File[] {
  const videoExtensions = ['.mp4', '.mov', '.webm'];
  const videoMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

  return files.filter(file => {
    const hasValidMimeType = videoMimeTypes.includes(file.type);
    const hasValidExtension = videoExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );
    return hasValidMimeType || hasValidExtension;
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format resolution for display
 */
export function formatResolution(width: number, height: number): string {
  return `${width}x${height}`;
}

/**
 * Detect if video is landscape or portrait
 */
export function getVideoOrientation(width: number, height: number): 'landscape' | 'portrait' | 'square' {
  if (width > height) return 'landscape';
  if (height > width) return 'portrait';
  return 'square';
}

