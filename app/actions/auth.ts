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
    const { data: authData, error: authError } = await supabase.auth.signUp({
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
        error: 'Signup failed: Unable to create user',
      }
    }

    // Create profile in user_profiles table
    const { error: profileError } = await supabase.from('user_profiles').insert({
      user_id: authData.user.id,
      plan: 'free',
    })

    if (profileError) {
      console.error('Failed to create profile:', profileError)
    }

    revalidatePath('/', 'layout')
    
    // 返回成功，让客户端跳转
    return {
      success: true,
      data: { user: authData.user },
    }
  } catch (error) {
    console.error('Unexpected error during signup:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signup failed: Unknown error',
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
      .from('user_profiles')
      .select('plan')
      .eq('user_id', authData.user.id)
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
    return 'This email is already registered'
  }

  if (message.includes('weak password')) {
    return 'Password is too weak. Please use a stronger password'
  }

  // Login related errors
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Invalid email or password'
  }

  if (message.includes('email not confirmed') || message.includes('not confirmed')) {
    return 'Email not verified. Please check your inbox'
  }

  // Generic errors
  if (message.includes('invalid email')) {
    return 'Invalid email format'
  }

  if (error.status === 400) {
    return 'Invalid request parameters'
  }

  if (error.status === 422) {
    return 'Invalid email or password format'
  }

  if (error.status && error.status >= 500) {
    return 'Server error. Please try again later'
  }

  return `Authentication failed: ${error.message}`
}
