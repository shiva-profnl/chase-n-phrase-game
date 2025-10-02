// Optimized Image Loader with Compression
// Provides modern image loading with fallbacks and optimization

export interface ImageLoadOptions {
  timeout?: number;
  retries?: number;
  useWebP?: boolean; // Kept for compatibility but ignored
  quality?: number;
}

export interface ImageLoadResult {
  success: boolean;
  image?: HTMLImageElement;
  error?: string;
  loadTime: number;
}

export class OptimizedImageLoader {
  private static instance: OptimizedImageLoader;
  private webPSupported: boolean = false; // WebP support disabled
  private imageCache: Map<string, HTMLImageElement> = new Map();

  private constructor() {
    this.checkWebPSupport();
  }

  public static getInstance(): OptimizedImageLoader {
    if (!OptimizedImageLoader.instance) {
      OptimizedImageLoader.instance = new OptimizedImageLoader();
    }
    return OptimizedImageLoader.instance;
  }

  private async checkWebPSupport(): Promise<boolean> {
    // WebP support disabled
    return false;
  }

  private getOptimizedImagePath(originalPath: string, useWebP?: boolean): string {
    // WebP support disabled - always return original path
    return originalPath;
  }

  public async loadImage(
    imagePath: string, 
    options: ImageLoadOptions = {}
  ): Promise<ImageLoadResult> {
    const {
      timeout = 10000,
      retries = 2,
      useWebP = true,
      quality = 0.8
    } = options;

    const startTime = Date.now();
    
    // Check cache first
    if (this.imageCache.has(imagePath)) {
      return {
        success: true,
        image: this.imageCache.get(imagePath),
        loadTime: Date.now() - startTime
      };
    }

    // WebP support disabled - only try original path
    let pathsToTry = [imagePath];

    for (let attempt = 0; attempt <= retries; attempt++) {
      for (const path of pathsToTry) {
        try {
          const result = await this.loadImageWithTimeout(path, timeout);
          if (result.success && result.image) {
            this.imageCache.set(imagePath, result.image);
            return {
              ...result,
              loadTime: Date.now() - startTime
            };
          }
        } catch (error) {
          console.warn(`Failed to load image ${path} (attempt ${attempt + 1}):`, error);
        }
      }
      
      // Wait before retry
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }

    return {
      success: false,
      error: `Failed to load image after ${retries + 1} attempts`,
      loadTime: Date.now() - startTime
    };
  }

  private loadImageWithTimeout(path: string, timeout: number): Promise<ImageLoadResult> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({
          success: false,
          error: 'Timeout',
          loadTime: 0
        });
      }, timeout);

      const img = new Image();
      
      img.onload = () => {
        clearTimeout(timer);
        resolve({
          success: true,
          image: img,
          loadTime: 0
        });
      };
      
      img.onerror = () => {
        clearTimeout(timer);
        resolve({
          success: false,
          error: 'Load error',
          loadTime: 0
        });
      };
      
      // Add cache-busting for retries
      const separator = path.includes('?') ? '&' : '?';
      img.src = `${path}${separator}_t=${Date.now()}`;
    });
  }

  public async preloadImages(imagePaths: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    // Load images in parallel batches
    const batchSize = 5;
    for (let i = 0; i < imagePaths.length; i += batchSize) {
      const batch = imagePaths.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (path) => {
          const result = await this.loadImage(path, { timeout: 5000 });
          return { path, success: result.success };
        })
      );
      
      batchResults.forEach(({ path, success }) => {
        results.set(path, success);
      });
      
      // Small delay between batches
      if (i + batchSize < imagePaths.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  public clearCache(): void {
    this.imageCache.clear();
  }

  public getCacheSize(): number {
    return this.imageCache.size;
  }

  public isWebPSupported(): boolean {
    return false; // WebP support disabled
  }
}

// Utility function for easy image loading
export const loadOptimizedImage = async (
  imagePath: string, 
  options?: ImageLoadOptions
): Promise<ImageLoadResult> => {
  const loader = OptimizedImageLoader.getInstance();
  return loader.loadImage(imagePath, options);
};

// Utility function for batch image loading
export const preloadOptimizedImages = async (
  imagePaths: string[]
): Promise<Map<string, boolean>> => {
  const loader = OptimizedImageLoader.getInstance();
  return loader.preloadImages(imagePaths);
};

