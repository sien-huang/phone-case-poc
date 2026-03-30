import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 安全头部配置
const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 1. 保护 admin 路由（除登录页和 API 外）
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/admin') && 
      !pathname.startsWith('/admin/login') && 
      !pathname.startsWith('/admin/api') &&
      !pathname.startsWith('/admin/check')) {
    const adminAuth = request.cookies.get('admin-auth')
    if (!adminAuth || adminAuth.value !== 'true') {
      // 重定向到登录页，保留原始 URL 作为 redirect 参数
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 2. 应用安全头部
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    // 对所有路径应用（除了静态资源和 API 可以排除）
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}