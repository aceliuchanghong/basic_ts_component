// 用户信息
export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: string;
  provider?: AuthProvider;
  createdAt?: Date;
}

// OAuth provider 类型
export type AuthProvider = 'google' | 'github' | 'alipay' | 'wechat' | 'email' | 'phone';

// OAuth provider 配置
export interface ProviderConfig {
  clientId: string;
  redirectUri?: string;
  scope?: string;
}

// 认证结果
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  provider?: AuthProvider;
}

// Token 信息
export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  expiresIn?: number;
}

// 认证状态
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

// 事件类型
export interface AuthEvent {
  type: 'login' | 'logout' | 'token_refresh' | 'error';
  user?: User;
  error?: string;
  timestamp: Date;
}

// 订阅器类型
export type AuthEventHandler = (event: AuthEvent) => void;

// 存储接口
export interface TokenStorageAdapter {
  get(): Promise<TokenInfo | null>;
  set(token: TokenInfo): Promise<void>;
  clear(): Promise<void>;
}
