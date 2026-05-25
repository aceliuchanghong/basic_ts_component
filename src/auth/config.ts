// Supabase 配置
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  // 可选：自定义OAuth重定向
  redirectTo?: string;
}

// 默认配置（从环境变量读取）
export function getSupabaseConfig(): SupabaseConfig {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_TO,
  };
}

// OAuth providers 配置
export interface OAuthProviderConfig {
  clientId: string;
  secret?: string;
  redirectUri?: string;
}
