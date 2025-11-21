/**
 * LRUCache - Least Recently Used cache for video resources
 * Limits simultaneous loaded videos for memory management
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  size?: number; // Optional size in bytes
}

export interface CacheStats {
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

export class LRUCache<T> {
  private capacity: number;
  private cache: Map<string, CacheEntry<T>>;
  private accessOrder: string[]; // Track access order (most recent last)
  
  // Statistics
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;

  // Callbacks
  private onEvict?: (key: string, value: T) => void;

  constructor(capacity: number, onEvict?: (key: string, value: T) => void) {
    this.capacity = capacity;
    this.cache = new Map();
    this.accessOrder = [];
    this.onEvict = onEvict;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (entry) {
      // Cache hit - update access order
      this.updateAccessOrder(key);
      this.hits++;
      return entry.value;
    }

    // Cache miss
    this.misses++;
    return undefined;
  }

  /**
   * Put value into cache
   */
  put(key: string, value: T, size?: number): void {
    // Check if key already exists
    if (this.cache.has(key)) {
      // Update existing entry
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.timestamp = Date.now();
      entry.size = size;
      this.updateAccessOrder(key);
      return;
    }

    // Check capacity
    if (this.cache.size >= this.capacity) {
      this.evictLRU();
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      size,
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove entry from cache
   */
  remove(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (entry) {
      // Call eviction callback
      if (this.onEvict) {
        this.onEvict(key, entry.value);
      }

      // Remove from cache and access order
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      return true;
    }

    return false;
  }

  /**
   * Update access order for a key (move to end)
   */
  private updateAccessOrder(key: string): void {
    // Remove from current position
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    // Get least recently used key (first in order)
    const lruKey = this.accessOrder[0];
    const entry = this.cache.get(lruKey);

    if (entry) {
      // Call eviction callback
      if (this.onEvict) {
        this.onEvict(lruKey, entry.value);
      }

      // Remove from cache
      this.cache.delete(lruKey);
      this.accessOrder.shift();
      this.evictions++;
    }
  }

  /**
   * Clear all entries
   */
  clear(): void {
    // Call eviction callback for all entries
    if (this.onEvict) {
      this.cache.forEach((entry, key) => {
        this.onEvict!(key, entry.value);
      });
    }

    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache capacity
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Set cache capacity (may trigger evictions)
   */
  setCapacity(newCapacity: number): void {
    this.capacity = newCapacity;

    // Evict entries if over capacity
    while (this.cache.size > this.capacity) {
      this.evictLRU();
    }
  }

  /**
   * Get all keys in access order (LRU first)
   */
  keys(): string[] {
    return [...this.accessOrder];
  }

  /**
   * Get all values in access order (LRU first)
   */
  values(): T[] {
    return this.accessOrder.map(key => this.cache.get(key)!.value);
  }

  /**
   * Get all entries
   */
  entries(): CacheEntry<T>[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalAccesses = this.hits + this.misses;
    const hitRate = totalAccesses > 0 ? (this.hits / totalAccesses) * 100 : 0;

    return {
      size: this.cache.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Get total size of cached items (if size tracking enabled)
   */
  getTotalSize(): number {
    let total = 0;
    this.cache.forEach(entry => {
      if (entry.size) {
        total += entry.size;
      }
    });
    return total;
  }

  /**
   * Peek at value without updating access order
   */
  peek(key: string): T | undefined {
    const entry = this.cache.get(key);
    return entry?.value;
  }

  /**
   * Get least recently used key
   */
  getLRUKey(): string | undefined {
    return this.accessOrder[0];
  }

  /**
   * Get most recently used key
   */
  getMRUKey(): string | undefined {
    return this.accessOrder[this.accessOrder.length - 1];
  }
}
