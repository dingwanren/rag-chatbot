'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface UpdateProfileResult {
  success: boolean
  error?: string
  data?: {
    username: string
  }
}

/**
 * 更新用户资料（用户名）
 * @param username - 新用户名
 */
export async function updateProfile(username: string): Promise<UpdateProfileResult> {
  const supabase = await createClient()

  // 1. 获取当前登录用户
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return {
      success: false,
      error: '未登录或登录已过期',
    }
  }

  // 2. 校验用户名
  if (!username || !username.trim()) {
    return {
      success: false,
      error: '用户名不能为空',
    }
  }

  const trimmedUsername = username.trim()

  if (trimmedUsername.length < 3) {
    return {
      success: false,
      error: '用户名长度至少为 3 个字符',
    }
  }

  if (trimmedUsername.length > 20) {
    return {
      success: false,
      error: '用户名长度不能超过 20 个字符',
    }
  }

  // 3. 更新 profiles 表的 username 字段
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      username: trimmedUsername,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    return {
      success: false,
      error: `更新失败：${updateError.message}`,
    }
  }

  // 4. 刷新缓存
  revalidatePath('/profile')
  revalidatePath('/')

  return {
    success: true,
    data: {
      username: trimmedUsername,
    },
  }
}
