import type { TokenInfo, TokenStorageAdapter } from './types';

// Chrome Extension 类型声明（浏览器扩展环境）
interface ChromeStorageArea {
  get(keys: string | string[] | object, callback: (result: Record<string, any>) => void): void;
  set(items: Record<string, any>, callback?: () => void): void;
  remove(keys: string | string[], callback?: () => void): void;
}

interface ChromeStorage {
  local: ChromeStorageArea;
  session: ChromeStorageArea;
  managed: ChromeStorageArea;
}

declare global {
  interface Window {
    chrome?: { storage?: ChromeStorage };
  }
}

// localStorage 适配器（通用）
export class LocalStorageAdapter implements TokenStorageAdapter {
  private key: string;

  constructor(key = 'auth_token') {
    this.key = key;
  }

  async get(): Promise<TokenInfo | null> {
    if (typeof localStorage === 'undefined') return null;

    const data = localStorage.getItem(this.key);
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
        await this.clear();
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  async set(token: TokenInfo): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.key, JSON.stringify(token));
  }

  async clear(): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.key);
  }
}

// Chrome Extension Storage 适配器
export class ChromeStorageAdapter implements TokenStorageAdapter {
  private key: string;
  private area: 'local' | 'session' | 'managed';

  constructor(key = 'auth_token', area: 'local' | 'session' | 'managed' = 'local') {
    this.key = key;
    this.area = area;
  }

  private getStorage(): ChromeStorageArea | null {
    if (typeof window === 'undefined' || !window.chrome?.storage) {
      return null;
    }
    return window.chrome.storage[this.area] || null;
  }

  async get(): Promise<TokenInfo | null> {
    const storage = this.getStorage();
    if (!storage) return null;

    return new Promise((resolve) => {
      storage.get(this.key, (result: Record<string, any>) => {
        if (!result[this.key]) {
          resolve(null);
          return;
        }

        const data = result[this.key];
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          this.clear().then(() => resolve(null));
          return;
        }
        resolve(data);
      });
    });
  }

  async set(token: TokenInfo): Promise<void> {
    const storage = this.getStorage();
    if (!storage) return;

    return new Promise((resolve) => {
      storage.set({ [this.key]: token }, resolve);
    });
  }

  async clear(): Promise<void> {
    const storage = this.getStorage();
    if (!storage) return;

    return new Promise((resolve) => {
      storage.remove(this.key, resolve);
    });
  }
}
