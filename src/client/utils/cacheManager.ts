// Service Worker Registration and Cache Management
// Provides aggressive caching for game assets

export class CacheManager {
  private static instance: CacheManager;
  private isServiceWorkerSupported: boolean;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {
    this.isServiceWorkerSupported = 'serviceWorker' in navigator;
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public async registerServiceWorker(): Promise<boolean> {
    if (!this.isServiceWorkerSupported) {
      console.warn('Service Worker not supported in this browser');
      return false;
    }

    // Skip service worker on iOS due to webview limitations
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  public async preloadCriticalAssets(): Promise<void> {
    if (!this.isServiceWorkerSupported) return;

    const criticalAssets = [
      '/backgrounds/main-bg.png',
      '/ui/game-logo.gif',
      '/game-elements/trophy.png',
      '/backgrounds/sub-bg-orange.png',
      '/backgrounds/sub-bg-blue.png'
    ];

    try {
      const cache = await caches.open('chase-n-phrase-static-v1');
      await cache.addAll(criticalAssets);
    } catch (error) {
      console.warn('Failed to preload critical assets:', error);
    }
  }

  public async clearCache(): Promise<void> {
    if (!this.isServiceWorkerSupported) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  public async getCacheSize(): Promise<number> {
    if (!this.isServiceWorkerSupported) return 0;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }

  public async isAssetCached(assetPath: string): Promise<boolean> {
    if (!this.isServiceWorkerSupported) return false;

    try {
      const response = await caches.match(assetPath);
      return !!response;
    } catch (error) {
      console.warn('Failed to check if asset is cached:', error);
      return false;
    }
  }

  public async cacheAsset(assetPath: string): Promise<boolean> {
    if (!this.isServiceWorkerSupported) return false;

    try {
      const response = await fetch(assetPath);
      if (response.ok) {
        const cache = await caches.open('chase-n-phrase-dynamic-v1');
        await cache.put(assetPath, response);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to cache asset:', assetPath, error);
      return false;
    }
  }

  public async warmupCache(assetPaths: string[]): Promise<void> {
    if (!this.isServiceWorkerSupported) return;

    const cache = await caches.open('chase-n-phrase-dynamic-v1');
    
    // Load assets in parallel batches
    const batchSize = 5;
    for (let i = 0; i < assetPaths.length; i += batchSize) {
      const batch = assetPaths.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (assetPath) => {
          try {
            const response = await fetch(assetPath);
            if (response.ok) {
              await cache.put(assetPath, response);
            }
          } catch (error) {
            console.warn(`Failed to warmup cache for ${assetPath}:`, error);
          }
        })
      );
      
      // Small delay between batches
      if (i + batchSize < assetPaths.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
}

// Initialize cache manager on app start
export const initializeCacheManager = async (): Promise<void> => {
  const cacheManager = CacheManager.getInstance();
  
  // Register service worker
  await cacheManager.registerServiceWorker();
  
  // Preload critical assets
  await cacheManager.preloadCriticalAssets();
};

