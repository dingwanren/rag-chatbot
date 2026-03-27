import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js Middleware for Supabase Auth
 *
 * 功能：
 * 1. 未登录用户访问受保护页面 → 重定向到 /login
 * 2. 已登录用户访问 /login 或 /register → 重定向到 /
 * 3. 保留原始 URL，登录后跳回原页面
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const { pathname } = request.nextUrl

  // 🛡️ 生产环境禁止访问测试页面
  const isTestPath = pathname.startsWith('/test-') || pathname.includes('/debug')
  if (isTestPath && process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('/404', request.url))
  }

  // API 和静态资源（跳过鉴权）
  const skipPaths = ['/api', '/_next', '/static', '/favicon.ico']
  
  // 检查是否应该跳过鉴权
  const shouldSkipAuth = skipPaths.some(path => pathname.startsWith(path))
  
  if (shouldSkipAuth) {
    return supabaseResponse
  }

  // 创建 Supabase Server Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser()

  // 公开路径（不需要鉴权）
  const publicPaths = ['/login', '/register']
  
  // 检查是否是公开路径
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))

  // 未登录用户
  if (!user) {
    if (!isPublicPath) {
      // 访问受保护页面 → 重定向到 /login
      // 保留原始 URL 用于登录后跳回
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      
      return NextResponse.redirect(redirectUrl)
    }
    
    // 公开页面，允许访问
    return supabaseResponse
  }

  // 已登录用户
  if (isPublicPath) {
    // 访问 /login 或 /register → 重定向到首页
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 已登录且访问受保护页面 → 允许访问
  return supabaseResponse
}

/**
 * Matcher 配置
 * 
 * 匹配所有路由，除了：
 * - _next/static: Next.js 静态资源
 * - _next/image: Next.js 图片优化
 * - favicon.ico: 网站图标
 * - 其他静态资源
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - public 目录下的静态资源
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
