/**
 * 登录组件测试文件
 *
 * 运行方式：
 * 1. 在 .env 中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
 * 2. npx vite --port 3000 启动开发服务器
 * 3. 打开 http://localhost:3000/auth-test.html
 */

import { createAuth } from './index';
import { getSupabaseConfig } from './config';

// 获取配置
const config = getSupabaseConfig();

if (!config.url || !config.anonKey) {
  console.error('❌ 请先在 .env 中配置 Supabase 的 URL 和 ANON_KEY');
  console.log('创建 .env 文件，添加：');
  console.log('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key');
}

// 创建认证实例
const auth = createAuth(config);

// 初始化
async function init() {
  console.log('🔄 初始化中...');
  const user = await auth.initialize();

  if (user) {
    console.log('✅ 已登录:', user);
  } else {
    console.log('❌ 未登录');
  }

  // 订阅状态变化
  auth.subscribe((event) => {
    console.log('📢 认证事件:', event);
  });
}

// 测试函数
async function testGoogleLogin() {
  console.log('🔐 测试 Google 登录...');
  const result = await auth.loginWithGoogle();
  console.log('结果:', result);
  return result;
}

async function testAlipayLogin() {
  console.log('🔐 测试 支付宝 登录...');
  const result = await auth.loginWithAlipay();
  console.log('结果:', result);
  return result;
}

async function testWechatLogin() {
  console.log('🔐 测试 微信 登录...');
  const result = await auth.loginWithWechat();
  console.log('结果:', result);
  return result;
}

async function testEmailLogin(email: string, password: string) {
  console.log('🔐 测试 邮箱登录...', email);
  const result = await auth.loginWithEmail(email, password);
  console.log('结果:', result);
  return result;
}

async function testMagicLink(email: string) {
  console.log('🔐 测试 Magic Link...', email);
  const result = await auth.loginWithMagicLink(email);
  console.log('结果:', result);
  return result;
}

async function testPhoneOtp(phone: string) {
  console.log('🔐 测试 手机号验证码...', phone);
  const result = await auth.loginWithPhone(phone);
  console.log('结果:', result);
  return result;
}

async function testGetCurrentUser() {
  console.log('🔍 获取当前用户...');
  const user = await auth.getCurrentUser();
  console.log('用户:', user);
  return user;
}

async function testLogout() {
  console.log('🚪 登出...');
  await auth.logout();
  console.log('已登出');
}

// 导出测试函数供控制台调用
(window as any).auth = auth;
(window as any).authTest = {
  init: init,
  loginGoogle: testGoogleLogin,
  loginAlipay: testAlipayLogin,
  loginWechat: testWechatLogin,
  loginEmail: testEmailLogin,
  loginMagicLink: testMagicLink,
  loginPhone: testPhoneOtp,
  getUser: testGetCurrentUser,
  logout: testLogout,
};

console.log('🎯 测试模块已加载');
console.log('使用 authTest.init() 初始化');
console.log('示例: authTest.loginAlipay()');
