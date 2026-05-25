import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import type { User, AuthProvider, AuthResult, TokenInfo, AuthEvent, AuthEventHandler, TokenStorageAdapter } from '../types';
import type { SupabaseConfig } from '../config';
import { LocalStorageAdapter } from '../storage';

export class SupabaseProvider {
  private client: SupabaseClient;
  private storage: TokenStorageAdapter;
  private listeners: Set<AuthEventHandler> = new Set();
  private currentUser: User | null = null;

  constructor(config: SupabaseConfig, storage?: TokenStorageAdapter) {
    this.client = createClient(config.url, config.anonKey);
    this.storage = storage || new LocalStorageAdapter();

    this.client.auth.onAuthStateChange((event, session) => {
      this.handleAuthChange(event, session);
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async initialize(): Promise<User | null> {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hasOAuthCallback = hash.includes('access_token');

    if (hasOAuthCallback) {
      const user = await new Promise<User | null>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 5000);
        const unsub = this.client.auth.onAuthStateChange((event, session) => {
          if (event === 'INITIAL_SESSION' && session) {
            clearTimeout(timeout);
            unsub.data.subscription.unsubscribe();
            const mapped = this.mapUser(session.user);
            this.currentUser = mapped;
            this.saveToken(session);
            resolve(mapped);
          }
        });
      });
      if (user) return user;
    }

    const { data: { session } } = await this.client.auth.getSession();

    if (session) {
      this.currentUser = this.mapUser(session.user);
      await this.saveToken(session);
      return this.currentUser;
    }

    return null;
  }

  async loginWithGoogle(): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      });

      if (error) throw error;

      return { success: true, provider: 'google' };
    } catch (error: any) {
      return { success: false, error: error.message, provider: 'google' };
    }
  }

  async loginWithGithub(): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      });

      if (error) throw error;

      return { success: true, provider: 'github' };
    } catch (error: any) {
      return { success: false, error: error.message, provider: 'github' };
    }
  }

  async loginWithAlipay(): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'alipay' as any,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      return { success: true, provider: 'alipay' };
    } catch (error: any) {
      return { success: false, error: error.message, provider: 'alipay' };
    }
  }

  async loginWithWechat(): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'wechat' as any,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      return { success: true, provider: 'wechat' };
    } catch (error: any) {
      return { success: false, error: error.message, provider: 'wechat' };
    }
  }

  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user ? this.mapUser(data.user) : undefined,
        provider: 'email',
      };
    } catch (error: any) {
      return { success: false, error: error.message, provider: 'email' };
    }
  }

  async loginWithMagicLink(email: string): Promise<AuthResult> {
    try {
      const { error } = await this.client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      return { success: true, provider: 'email' };
    } catch (error: any) {
      return { success: false, error: error.message, provider: 'email' };
    }
  }

  async loginWithPhone(phone: string): Promise<AuthResult> {
    try {
      const { error } = await this.client.auth.signInWithOtp({
        phone,
      });

      if (error) throw error;

      return { success: true, provider: 'phone' };
    } catch (error: any) {
      return { success: false, error: error.message, provider: 'phone' };
    }
  }

  async verifyPhoneOtp(phone: string, token: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user ? this.mapUser(data.user) : undefined,
        provider: 'phone',
      };
    } catch (error: any) {
      return { success: false, error: error.message, provider: 'phone' };
    }
  }

  async sendEmailOtp(email: string): Promise<AuthResult> {
    return this.loginWithMagicLink(email);
  }

  async verifyEmailOtp(email: string, token: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user ? this.mapUser(data.user) : undefined,
        provider: 'email',
      };
    } catch (error: any) {
      return { success: false, error: error.message, provider: 'email' };
    }
  }

  async login(provider: AuthProvider, options?: { email?: string; phone?: string }): Promise<AuthResult> {
    switch (provider) {
      case 'google':
        return this.loginWithGoogle();
      case 'github':
        return this.loginWithGithub();
      case 'alipay':
        return this.loginWithAlipay();
      case 'wechat':
        return this.loginWithWechat();
      case 'email':
        if (options?.email) {
          return this.loginWithEmail(options.email, '');
        }
        return { success: false, error: 'Email required' };
      case 'phone':
        if (options?.phone) {
          return this.loginWithPhone(options.phone);
        }
        return { success: false, error: 'Phone required' };
      default:
        return { success: false, error: `Unsupported provider: ${provider}` };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.client.auth.getUser();

    if (user) {
      this.currentUser = this.mapUser(user);
      return this.currentUser;
    }

    return null;
  }

  async getSession(): Promise<{ accessToken?: string; refreshToken?: string } | null> {
    const { data: { session } } = await this.client.auth.getSession();

    if (session) {
      return {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      };
    }

    return null;
  }

  async logout(): Promise<void> {
    await this.client.auth.signOut();
    await this.storage.clear();
    this.currentUser = null;

    this.emit({ type: 'logout', timestamp: new Date() });
  }

  async refreshToken(): Promise<boolean> {
    try {
      const { data: { session }, error } = await this.client.auth.refreshSession();

      if (error || !session) {
        return false;
      }

      await this.saveToken(session);
      this.emit({ type: 'token_refresh', user: this.currentUser || undefined, timestamp: new Date() });

      return true;
    } catch {
      return false;
    }
  }

  subscribe(handler: AuthEventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  async getRawUser(): Promise<SupabaseUser | null> {
    const { data: { user } } = await this.client.auth.getUser();
    return user;
  }

  private async handleAuthChange(
    event: string,
    session: any
  ) {
    if (event === 'SIGNED_IN' && session?.user) {
      this.currentUser = this.mapUser(session.user);
      await this.saveToken(session);
      this.emit({ type: 'login', user: this.currentUser, timestamp: new Date() });
    } else if (event === 'SIGNED_OUT') {
      this.currentUser = null;
      await this.storage.clear();
      this.emit({ type: 'logout', timestamp: new Date() });
    } else if (event === 'TOKEN_REFRESHED' && session) {
      await this.saveToken(session);
      this.emit({ type: 'token_refresh', user: this.currentUser || undefined, timestamp: new Date() });
    } else if (event === 'USER_UPDATED' && session?.user) {
      this.currentUser = this.mapUser(session.user);
      this.emit({ type: 'login', user: this.currentUser, timestamp: new Date() });
    }
  }

  private async saveToken(session: any): Promise<void> {
    const tokenInfo: TokenInfo = {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: new Date(session.expires_at * 1000),
      expiresIn: session.expires_in,
    };
    await this.storage.set(tokenInfo);
  }

  private emit(event: AuthEvent): void {
    this.listeners.forEach((handler) => handler(event));
  }

  private mapUser(user: SupabaseUser): User {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone || undefined,
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      provider: user.app_metadata?.provider as AuthProvider,
      createdAt: new Date(user.created_at),
    };
  }
}
