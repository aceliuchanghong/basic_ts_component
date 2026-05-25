// Types
export type {
  User,
  AuthProvider,
  ProviderConfig,
  AuthResult,
  TokenInfo,
  AuthStatus,
  AuthEvent,
  AuthEventHandler,
  TokenStorageAdapter,
} from './types';

// Config
export type { SupabaseConfig, OAuthProviderConfig } from './config';

// Storage
export { LocalStorageAdapter, ChromeStorageAdapter } from './storage';

// Provider
export { SupabaseProvider } from './providers/SupabaseProvider';

// 便捷函数
import { SupabaseProvider } from './providers/SupabaseProvider';
import type { SupabaseConfig } from './config';
import { ChromeStorageAdapter, LocalStorageAdapter } from './storage';

// 创建默认实例
export function createAuth(config: SupabaseConfig): SupabaseProvider {
  // 浏览器扩展使用 chrome.storage
  if (typeof window !== 'undefined' && window.chrome?.storage) {
    return new SupabaseProvider(config, new ChromeStorageAdapter());
  }
  // 普通浏览器环境使用 localStorage
  return new SupabaseProvider(config, new LocalStorageAdapter());
}
