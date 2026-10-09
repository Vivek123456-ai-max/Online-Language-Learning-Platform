// Ultra-fast in-memory client-side cache for instant zero-latency responses
class ClientMemoryCache {
  private store = new Map<string, { data: any; timestamp: number }>();
  private defaultTTL = 1000 * 60 * 5; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    return entry.data as T;
  }

  isStale(key: string, ttl: number = this.defaultTTL): boolean {
    const entry = this.store.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > ttl;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  invalidate(keyOrPrefix?: string): void {
    if (!keyOrPrefix) {
      this.store.clear();
      return;
    }
    for (const k of this.store.keys()) {
      if (k.startsWith(keyOrPrefix)) {
        this.store.delete(k);
      }
    }
  }
}

export const cache = new ClientMemoryCache();
