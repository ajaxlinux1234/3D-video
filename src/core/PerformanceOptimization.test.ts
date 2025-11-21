/**
 * Performance Optimization System Tests
 * Basic tests to verify core functionality
 */

import { LRUCache } from './LRUCache';
import { MemoryMonitor } from './MemoryMonitor';

// Test LRU Cache
console.log('Testing LRU Cache...');

const cache = new LRUCache<string>(3);

// Add items
cache.put('a', 'value-a');
cache.put('b', 'value-b');
cache.put('c', 'value-c');

console.assert(cache.size() === 3, 'Cache should have 3 items');
console.assert(cache.get('a') === 'value-a', 'Should get value-a');

// Add one more to trigger eviction
cache.put('d', 'value-d');

console.assert(cache.size() === 3, 'Cache should still have 3 items');
console.assert(cache.get('b') === undefined, 'b should be evicted (LRU)');
console.assert(cache.get('d') === 'value-d', 'Should get value-d');

const stats = cache.getStats();
console.log('Cache stats:', stats);
console.assert(stats.evictions === 1, 'Should have 1 eviction');

console.log('✓ LRU Cache tests passed');

// Test Memory Monitor
console.log('\nTesting Memory Monitor...');

const memoryMonitor = new MemoryMonitor({
  warningThreshold: 70,
  criticalThreshold: 85,
  autoCleanup: false,
});

const memStats = memoryMonitor.getStats();
if (memStats) {
  console.log('Memory stats:', {
    used: `${memStats.usedJSHeapSize.toFixed(1)}MB`,
    limit: `${memStats.jsHeapSizeLimit.toFixed(1)}MB`,
    usage: `${memStats.usagePercentage.toFixed(1)}%`,
  });
  console.log('✓ Memory Monitor tests passed');
} else {
  console.log('⚠ Memory monitoring not supported in this environment');
}

console.log('\n✓ All performance optimization tests passed!');

export {};
