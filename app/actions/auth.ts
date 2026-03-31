'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ActionResponse {
  success: boolean
  error?: string
  data?: unknown
}

/**
 * User signup server action
 * @param formData - FormData containing email and password
 */
export async function signup(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate input
  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required',
    }
  }

  if (password.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters',
    }
  }

  // 客户端密码匹配验证
  const confirmPassword = formData.get('confirmPassword') as string;
  if (password !== confirmPassword) {
    return {
      success: false,
      error: 'Passwords do not match',
    }
  }

  try {
    // 1. 注册 Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      console.error('Signup auth error:', authError)
      return {
        success: false,
        error: getAuthErrorMessage(authError),
      }
    }

    if (!authData.user) {
      console.error('Signup failed: No user created')
      return {
        success: false,
        error: '注册失败：无法创建用户',
      }
    }

    console.log('Auth user created:', authData.user.id)

    // 2. 手动创建 profile（使用 upsert 避免重复插入）
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      plan: 'free',
      username: email.split('@')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error('Failed to create profile:', profileError)
      console.error('Error details:', profileError.message, 'Code:', profileError.code)
      // Profile 创建失败不影响注册流程
    } else {
      console.log('Profile created successfully')
    }

    revalidatePath('/', 'layout')

    // 返回成功，让客户端跳转
    return {
      success: true,
      data: { user: authData.user },
    }
  } catch (error) {
    console.error('Unexpected error during signup:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    return {
      success: false,
      error: `注册失败：${errorMessage}`,
    }
  }
}

/**
 * User login server action
 * @param formData - FormData containing email and password
 */
export async function login(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate input
  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required',
    }
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return {
        success: false,
        error: getAuthErrorMessage(authError),
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Login failed: Unable to authenticate',
      }
    }

    revalidatePath('/', 'layout')
    
    // 返回成功，让客户端跳转
    return {
      success: true,
      data: { user: authData.user },
    }
  } catch (error) {
    console.error('Unexpected error during login:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed: Unknown error',
    }
  }
}

/**
 * User logout server action
 */
export async function logout(): Promise<ActionResponse> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath('/', 'layout')
    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error during logout:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed: Unknown error',
    }
  }
}

/**
 * Get current user server action
 */
export async function getCurrentUser(): Promise<
  | {
      success: true
      user: {
        id: string
        email: string | null
      }
      profile?: {
        plan: 'free' | 'pro' | 'super'
        username: string | null
      }
    }
  | { success: false; error: string; user?: never; profile?: never }
> {
  const supabase = await createClient()

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return {
        success: false,
        error: getAuthErrorMessage(authError),
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('plan, username')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Failed to fetch profile:', profileError)
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email || null,
      },
      profile: profileData
        ? {
            plan: profileData.plan,
            username: profileData.username,
          }
        : undefined,
    }
  } catch (error) {
    console.error('Unexpected error while getting current user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user: Unknown error',
    }
  }
}

/**
 * Convert Supabase Auth errors to friendly error messages
 */
function getAuthErrorMessage(error: Error & { status?: number; message: string }): string {
  const message = error.message.toLowerCase()

  // Registration related errors
  if (message.includes('already registered') || message.includes('already exists')) {
    return '该邮箱已被注册'
  }

  if (message.includes('weak password')) {
    return '密码太弱，请使用更复杂的密码'
  }

  // Login related errors
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return '邮箱或密码错误'
  }

  if (message.includes('email not confirmed') || message.includes('not confirmed')) {
    return '邮箱未验证，请检查您的邮箱'
  }

  // Generic errors
  if (message.includes('invalid email')) {
    return '邮箱格式不正确'
  }

  if (error.status === 400) {
    return '请求参数无效'
  }

  if (error.status === 422) {
    return '邮箱或密码格式无效'
  }

  if (error.status && error.status >= 500) {
    return '服务器错误，请稍后重试'
  }

  return `认证失败：${error.message}`
}
