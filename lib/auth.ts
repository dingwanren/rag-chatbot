import { createClient } from './supabase/server'

export interface RegisterInput {
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterResult {
  success: boolean
  user?: {
    id: string
    email: string
  }
  error?: string
}

export interface LoginResult {
  success: boolean
  user?: {
    id: string
    email: string
  }
  error?: string
}

export interface CurrentUserResult {
  success: boolean
  user?: {
    id: string
    email: string
  }
  profile?: {
    username: string
  }
  error?: string
}

export interface SignOutResult {
  success: boolean
  error?: string
}

/**
 * User registration function (server-side)
 * @param input - Contains email and password
 * @returns Registration result with success status, user info, or error
 */
export async function register(input: RegisterInput): Promise<RegisterResult> {
  const supabase = await createClient()
  const { email, password } = input

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
        error: 'Registration failed: Unable to create user',
      }
    }

    // Insert user data into profiles table
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      username: email.split('@')[0], // Use email prefix as username
    })

    if (profileError) {
      console.error('Failed to create profile:', profileError)
      return {
        success: false,
        error: `Registration succeeded but profile creation failed: ${profileError.message}`,
      }
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: email,
      },
    }
  } catch (error) {
    console.error('Unexpected error during registration:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed: Unknown error',
    }
  }
}

/**
 * User login function (server-side)
 * @param input - Contains email and password
 * @returns Login result with success status, user info, or error
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const supabase = await createClient()
  const { email, password } = input

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

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: email,
      },
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
 * Get current logged-in user info (server-side)
 * @returns Current user and profile info, or error
 */
export async function getCurrentUser(): Promise<CurrentUserResult> {
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

    // Query profiles table for username
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Failed to fetch profile:', profileError)
      return {
        success: false,
        error: `Failed to fetch user profile: ${profileError.message}`,
      }
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
      },
      profile: {
        username: profileData?.username || '',
      },
    }
  } catch (error) {
    console.error('Unexpected error while getting current user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user info: Unknown error',
    }
  }
}

/**
 * Logout
 * @returns Logout result
 */
export async function signOut(): Promise<SignOutResult> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error during sign out:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed: Unknown error',
    }
  }
}

/**
 * Convert Supabase Auth errors to friendly error messages
 */
function getAuthErrorMessage(error: Error & { status?: number }): string {
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

  if (error.status && error.status === 400) {
    return 'Invalid request parameters'
  }

  if (error.status && error.status === 422) {
    return 'Invalid email or password format'
  }

  if (error.status && error.status >= 500) {
    return 'Server error. Please try again later'
  }

  return `Authentication failed: ${error.message}`
}
